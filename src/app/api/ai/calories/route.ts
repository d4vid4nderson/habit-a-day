import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a precise nutrition assistant that helps users estimate calories for their meals.

IMPORTANT: Be accurate and realistic with calorie estimates. Do NOT underestimate or be overly conservative.

Guidelines:
1. Use realistic portion sizes that Americans actually eat (not small/diet portions)
2. Account for cooking oils, butter, sauces, and dressings that are commonly added
3. Restaurant portions are typically 1.5-2x larger than home-cooked meals
4. Fast food and chain restaurant items often have more calories than people expect
5. When in doubt, estimate on the higher side rather than the lower side

When a user mentions a brand name, restaurant, or specific product:
- Use the web_search tool to look up the actual nutritional information
- Search for "[brand/restaurant name] [item] nutrition calories"
- Provide the official calorie count when available

When estimating calories:
1. Provide a specific calorie estimate (not a range)
2. Be direct and confident in your estimate
3. If the description is vague, ask ONE clarifying question about the most important detail (usually portion size)
4. Always bold the calorie number for easy extraction

Format calorie estimates clearly, like:
- "A medium apple: **95 calories**"
- "Chipotle burrito bowl with chicken, rice, beans, cheese, sour cream, guac: **1,150 calories**"
- "Starbucks Grande Caramel Frappuccino: **380 calories**"

Common underestimated items (be accurate):
- Restaurant pasta dishes: typically 800-1500 cal
- Burgers with fries: typically 1000-1500 cal
- Large muffins/pastries: typically 400-600 cal
- Salads with dressing and toppings: typically 500-900 cal
- Smoothies and frappuccinos: typically 300-600 cal

Be encouraging but honest about calorie content.`;

// Web search tool definition
const webSearchTool: Anthropic.Tool = {
  name: 'web_search',
  description: 'Search the web for nutritional information about specific brands, restaurants, or food products. Use this when the user mentions a specific brand, restaurant chain, or packaged food product to get accurate calorie information.',
  input_schema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description: 'The search query for nutritional information (e.g., "McDonald\'s Big Mac calories nutrition" or "Cheerios cereal nutrition facts")',
      },
    },
    required: ['query'],
  },
};

// Simple web search function using a search API
async function performWebSearch(query: string): Promise<string> {
  try {
    // Use DuckDuckGo instant answer API for quick nutrition lookups
    const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query + ' nutrition calories')}&format=json&no_html=1`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'HabitADay/1.0 (Nutrition Lookup)',
      },
    });

    if (!response.ok) {
      return `Search failed with status ${response.status}`;
    }

    const data = await response.json();

    // Extract relevant information from DuckDuckGo response
    const results: string[] = [];

    if (data.Abstract) {
      results.push(`Summary: ${data.Abstract}`);
    }

    if (data.Answer) {
      results.push(`Answer: ${data.Answer}`);
    }

    // Check related topics for nutrition info
    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics.slice(0, 3)) {
        if (topic.Text && (topic.Text.toLowerCase().includes('calorie') || topic.Text.toLowerCase().includes('nutrition'))) {
          results.push(`Related: ${topic.Text}`);
        }
      }
    }

    // Also try to get infobox data if available
    if (data.Infobox && data.Infobox.content) {
      for (const item of data.Infobox.content) {
        if (item.label && item.value) {
          const label = item.label.toLowerCase();
          if (label.includes('calorie') || label.includes('energy') || label.includes('nutrition')) {
            results.push(`${item.label}: ${item.value}`);
          }
        }
      }
    }

    if (results.length === 0) {
      // If DuckDuckGo doesn't have direct info, provide guidance
      return `No direct nutritional data found. Based on typical values for this type of food, provide your best estimate. If this is a major chain restaurant or brand, their official website or MyFitnessPal typically has accurate information.`;
    }

    return results.join('\n');
  } catch (error) {
    console.error('Web search error:', error);
    return 'Search temporarily unavailable. Please provide your best estimate based on typical nutritional values for this type of food.';
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Build messages array from conversation history
    const messages: Anthropic.MessageParam[] = [];

    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      }
    }

    // Add the new user message
    messages.push({
      role: 'user',
      content: message,
    });

    // First API call - may trigger tool use
    let response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: [webSearchTool],
      messages,
    });

    // Handle tool use loop
    while (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const toolUse of toolUseBlocks) {
        if (toolUse.name === 'web_search') {
          const input = toolUse.input as { query: string };
          const searchResult = await performWebSearch(input.query);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: searchResult,
          });
        }
      }

      // Continue conversation with tool results
      messages.push({
        role: 'assistant',
        content: response.content,
      });

      messages.push({
        role: 'user',
        content: toolResults,
      });

      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: [webSearchTool],
        messages,
      });
    }

    // Extract the final text response
    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );
    const assistantMessage = textBlock?.text || '';

    // Extract calorie values from the response using regex
    const calorieMatches = assistantMessage.match(/\*\*(\d+(?:,\d+)?)\s*(?:calories?|cal)\*\*/gi);
    const extractedCalories: number[] = [];

    if (calorieMatches) {
      for (const match of calorieMatches) {
        const numStr = match.replace(/\*\*/g, '').replace(/,/g, '').match(/\d+/);
        if (numStr) {
          extractedCalories.push(parseInt(numStr[0], 10));
        }
      }
    }

    // Also try to find standalone calorie numbers
    const standaloneMatches = assistantMessage.match(/(?:approximately|about|around|roughly|~)?\s*(\d+(?:,\d+)?)\s*(?:calories?|cal)/gi);
    if (standaloneMatches) {
      for (const match of standaloneMatches) {
        const numStr = match.replace(/,/g, '').match(/\d+/);
        if (numStr) {
          const num = parseInt(numStr[0], 10);
          if (!extractedCalories.includes(num)) {
            extractedCalories.push(num);
          }
        }
      }
    }

    return NextResponse.json({
      message: assistantMessage,
      extractedCalories,
    });
  } catch (error) {
    console.error('AI API error:', error);
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    );
  }
}
