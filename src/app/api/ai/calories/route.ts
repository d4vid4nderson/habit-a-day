import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a precise nutrition assistant that helps users estimate calories AND macronutrients (carbs, fat, protein) for their meals.

CRITICAL RULES:
1. NEVER underestimate. Users prefer accurate or slightly high estimates over low ones.
2. For chain restaurants (Panda Express, Chipotle, McDonald's, etc.), ALWAYS use their official published nutrition data - do NOT guess.
3. Use the web_search tool for ANY brand name, restaurant, or packaged food to get accurate data.

For chain restaurants - USE OFFICIAL DATA:
- Panda Express: Large Orange Chicken = 490 cal, 51g carbs, 23g fat, 25g protein (entree only)
- Panda Express: Large plate with 2 entrees + side = typically 800-1200+ calories
- Chipotle: Burrito with standard toppings = 1000-1200 cal
- McDonald's Big Mac = 550 cal, 45g carbs, 30g fat, 25g protein

Guidelines:
1. Use realistic portion sizes that Americans actually eat (not small/diet portions)
2. Account for cooking oils, butter, sauces, and dressings
3. Restaurant portions are typically 1.5-2x larger than home-cooked meals
4. When in doubt, estimate on the HIGHER side
5. If user says "large" or "entree size" - use the large/full portion values

When a user mentions a brand name, restaurant, or specific product:
- ALWAYS use the web_search tool to look up official nutritional information
- Search for "[restaurant] [item] nutrition facts calories"
- Provide the OFFICIAL nutritional values, not estimates

CRITICAL: Always provide ALL four values in this exact format at the end of your response:
**Calories: [number]** | **Carbs: [number]g** | **Fat: [number]g** | **Protein: [number]g**

Examples:
- "Panda Express Large Orange Chicken (entree only): **Calories: 490** | **Carbs: 51g** | **Fat: 23g** | **Protein: 25g**"
- "Panda Express Plate (orange chicken + beijing beef + fried rice): **Calories: 1190** | **Carbs: 125g** | **Fat: 48g** | **Protein: 42g**"
- "Chipotle burrito bowl with chicken, rice, beans, cheese, sour cream, guac: **Calories: 1150** | **Carbs: 105g** | **Fat: 50g** | **Protein: 55g**"

Common reference values (use these as MINIMUMS, not maximums):
- Chinese takeout entrees: 400-600 cal per entree, plates 800-1400 cal total
- Restaurant pasta dishes: 800-1500 cal
- Burgers with fries: 1000-1500 cal
- Fast food combos: 900-1400 cal

Be direct and confident. Do not hedge or give ranges - give specific numbers.`;

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

    // Extract nutritional values from the response using regex
    // Look for the formatted pattern: **Calories: X** | **Carbs: Xg** | **Fat: Xg** | **Protein: Xg**
    const caloriesMatch = assistantMessage.match(/\*\*Calories:\s*(\d+(?:,\d+)?)\*\*/i);
    const carbsMatch = assistantMessage.match(/\*\*Carbs:\s*(\d+(?:,\d+)?)g?\*\*/i);
    const fatMatch = assistantMessage.match(/\*\*Fat:\s*(\d+(?:,\d+)?)g?\*\*/i);
    const proteinMatch = assistantMessage.match(/\*\*Protein:\s*(\d+(?:,\d+)?)g?\*\*/i);

    let extractedCalories: number[] = [];
    let extractedCarbs: number | null = null;
    let extractedFat: number | null = null;
    let extractedProtein: number | null = null;

    // Extract structured format values
    if (caloriesMatch) {
      const num = parseInt(caloriesMatch[1].replace(/,/g, ''), 10);
      extractedCalories.push(num);
    }
    if (carbsMatch) {
      extractedCarbs = parseInt(carbsMatch[1].replace(/,/g, ''), 10);
    }
    if (fatMatch) {
      extractedFat = parseInt(fatMatch[1].replace(/,/g, ''), 10);
    }
    if (proteinMatch) {
      extractedProtein = parseInt(proteinMatch[1].replace(/,/g, ''), 10);
    }

    // Fallback: also try to find calorie numbers in old formats
    if (extractedCalories.length === 0) {
      const calorieMatches = assistantMessage.match(/\*\*(\d+(?:,\d+)?)\s*(?:calories?|cal)\*\*/gi);
      if (calorieMatches) {
        for (const match of calorieMatches) {
          const numStr = match.replace(/\*\*/g, '').replace(/,/g, '').match(/\d+/);
          if (numStr) {
            extractedCalories.push(parseInt(numStr[0], 10));
          }
        }
      }

      // Also try standalone calorie numbers
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
    }

    return NextResponse.json({
      message: assistantMessage,
      extractedCalories,
      extractedCarbs,
      extractedFat,
      extractedProtein,
    });
  } catch (error) {
    console.error('AI API error:', error);
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    );
  }
}
