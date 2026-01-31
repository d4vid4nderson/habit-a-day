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

// Known restaurant nutrition data - hardcoded for accuracy and speed
// Sources: Official restaurant nutrition PDFs and websites
const RESTAURANT_NUTRITION: Record<string, Record<string, { calories: number; carbs: number; fat: number; protein: number; serving?: string }>> = {
  'panda express': {
    // Entrees (larger servings)
    'orange chicken': { calories: 490, carbs: 51, fat: 23, protein: 25, serving: 'large entree' },
    'beijing beef': { calories: 470, carbs: 46, fat: 26, protein: 14, serving: 'large entree' },
    'broccoli beef': { calories: 150, carbs: 13, fat: 7, protein: 9, serving: 'large entree' },
    'kung pao chicken': { calories: 290, carbs: 14, fat: 19, protein: 16, serving: 'large entree' },
    'grilled teriyaki chicken': { calories: 275, carbs: 14, fat: 13, protein: 36, serving: 'large entree' },
    'mushroom chicken': { calories: 220, carbs: 13, fat: 13, protein: 13, serving: 'large entree' },
    'sweetfire chicken breast': { calories: 380, carbs: 47, fat: 13, protein: 17, serving: 'large entree' },
    'string bean chicken breast': { calories: 210, carbs: 13, fat: 11, protein: 14, serving: 'large entree' },
    'black pepper chicken': { calories: 250, carbs: 15, fat: 14, protein: 15, serving: 'large entree' },
    'honey walnut shrimp': { calories: 510, carbs: 27, fat: 37, protein: 14, serving: 'large entree' },
    'black pepper angus steak': { calories: 180, carbs: 11, fat: 10, protein: 13, serving: 'large entree' },
    // Sides
    'fried rice': { calories: 530, carbs: 85, fat: 16, protein: 12, serving: 'large side' },
    'chow mein': { calories: 510, carbs: 80, fat: 22, protein: 13, serving: 'large side' },
    'white steamed rice': { calories: 380, carbs: 87, fat: 0, protein: 7, serving: 'large side' },
    'super greens': { calories: 90, carbs: 10, fat: 3, protein: 6, serving: 'large side' },
    // Appetizers
    'chicken egg roll': { calories: 200, carbs: 20, fat: 10, protein: 8, serving: '1 roll' },
    'veggie spring roll': { calories: 160, carbs: 22, fat: 7, protein: 4, serving: '2 rolls' },
    'cream cheese rangoon': { calories: 190, carbs: 24, fat: 8, protein: 5, serving: '3 pieces' },
  },
  'chipotle': {
    'chicken burrito': { calories: 1030, carbs: 102, fat: 37, protein: 54, serving: 'with rice, beans, salsa, cheese, sour cream' },
    'chicken bowl': { calories: 730, carbs: 72, fat: 23, protein: 48, serving: 'with rice, beans, salsa, cheese, sour cream' },
    'steak burrito': { calories: 1000, carbs: 101, fat: 36, protein: 50, serving: 'with rice, beans, salsa, cheese, sour cream' },
    'carnitas burrito': { calories: 1055, carbs: 101, fat: 42, protein: 48, serving: 'with rice, beans, salsa, cheese, sour cream' },
    'barbacoa burrito': { calories: 990, carbs: 102, fat: 34, protein: 49, serving: 'with rice, beans, salsa, cheese, sour cream' },
    'sofritas burrito': { calories: 930, carbs: 106, fat: 33, protein: 32, serving: 'with rice, beans, salsa, cheese, sour cream' },
    'chips and guacamole': { calories: 770, carbs: 57, fat: 56, protein: 9, serving: 'regular' },
    'guacamole': { calories: 230, carbs: 8, fat: 22, protein: 2, serving: 'side' },
    'queso blanco': { calories: 240, carbs: 8, fat: 18, protein: 10, serving: 'side' },
  },
  'mcdonalds': {
    'big mac': { calories: 550, carbs: 45, fat: 30, protein: 25, serving: '1 sandwich' },
    'quarter pounder with cheese': { calories: 520, carbs: 42, fat: 26, protein: 30, serving: '1 sandwich' },
    'mcchicken': { calories: 400, carbs: 39, fat: 21, protein: 14, serving: '1 sandwich' },
    'mcdouble': { calories: 400, carbs: 33, fat: 20, protein: 22, serving: '1 sandwich' },
    'large fries': { calories: 490, carbs: 66, fat: 23, protein: 7, serving: 'large' },
    'medium fries': { calories: 320, carbs: 43, fat: 15, protein: 5, serving: 'medium' },
    '10 piece mcnuggets': { calories: 410, carbs: 24, fat: 24, protein: 23, serving: '10 pieces' },
    'filet-o-fish': { calories: 390, carbs: 39, fat: 19, protein: 16, serving: '1 sandwich' },
    'egg mcmuffin': { calories: 310, carbs: 30, fat: 13, protein: 17, serving: '1 sandwich' },
  },
  'chick-fil-a': {
    'chicken sandwich': { calories: 440, carbs: 40, fat: 19, protein: 28, serving: '1 sandwich' },
    'spicy chicken sandwich': { calories: 450, carbs: 44, fat: 19, protein: 28, serving: '1 sandwich' },
    'deluxe chicken sandwich': { calories: 500, carbs: 41, fat: 22, protein: 29, serving: '1 sandwich' },
    'grilled chicken sandwich': { calories: 320, carbs: 41, fat: 6, protein: 28, serving: '1 sandwich' },
    '8 count nuggets': { calories: 250, carbs: 11, fat: 11, protein: 27, serving: '8 pieces' },
    '12 count nuggets': { calories: 380, carbs: 17, fat: 17, protein: 40, serving: '12 pieces' },
    'waffle fries medium': { calories: 420, carbs: 45, fat: 24, protein: 5, serving: 'medium' },
    'waffle fries large': { calories: 520, carbs: 56, fat: 30, protein: 6, serving: 'large' },
    'chicken biscuit': { calories: 460, carbs: 48, fat: 21, protein: 18, serving: '1 biscuit' },
  },
  'taco bell': {
    'crunchy taco': { calories: 170, carbs: 13, fat: 9, protein: 8, serving: '1 taco' },
    'soft taco': { calories: 180, carbs: 17, fat: 9, protein: 8, serving: '1 taco' },
    'burrito supreme': { calories: 390, carbs: 49, fat: 14, protein: 16, serving: '1 burrito' },
    'crunchwrap supreme': { calories: 540, carbs: 71, fat: 21, protein: 16, serving: '1 wrap' },
    'cheesy gordita crunch': { calories: 500, carbs: 41, fat: 28, protein: 20, serving: '1 gordita' },
    'mexican pizza': { calories: 550, carbs: 47, fat: 31, protein: 19, serving: '1 pizza' },
    'nachos bellgrande': { calories: 740, carbs: 82, fat: 38, protein: 16, serving: '1 serving' },
    'quesadilla chicken': { calories: 510, carbs: 37, fat: 27, protein: 27, serving: '1 quesadilla' },
  },
  'subway': {
    '6 inch turkey breast': { calories: 280, carbs: 46, fat: 4, protein: 18, serving: '6 inch on wheat' },
    '6 inch italian bmt': { calories: 400, carbs: 46, fat: 16, protein: 20, serving: '6 inch on wheat' },
    '6 inch meatball marinara': { calories: 480, carbs: 58, fat: 18, protein: 22, serving: '6 inch on wheat' },
    '6 inch chicken teriyaki': { calories: 330, carbs: 52, fat: 5, protein: 24, serving: '6 inch on wheat' },
    '6 inch tuna': { calories: 480, carbs: 45, fat: 25, protein: 20, serving: '6 inch on wheat' },
    'footlong turkey breast': { calories: 560, carbs: 92, fat: 8, protein: 36, serving: 'footlong on wheat' },
    'footlong italian bmt': { calories: 800, carbs: 92, fat: 32, protein: 40, serving: 'footlong on wheat' },
  },
  'starbucks': {
    'caramel frappuccino grande': { calories: 380, carbs: 54, fat: 16, protein: 5, serving: 'grande 16oz' },
    'mocha frappuccino grande': { calories: 370, carbs: 52, fat: 15, protein: 6, serving: 'grande 16oz' },
    'pumpkin spice latte grande': { calories: 380, carbs: 52, fat: 14, protein: 14, serving: 'grande 16oz' },
    'caffe latte grande': { calories: 190, carbs: 18, fat: 7, protein: 13, serving: 'grande 16oz' },
    'iced caramel macchiato grande': { calories: 250, carbs: 35, fat: 7, protein: 10, serving: 'grande 16oz' },
    'vanilla sweet cream cold brew grande': { calories: 200, carbs: 24, fat: 11, protein: 2, serving: 'grande 16oz' },
    'chocolate croissant': { calories: 340, carbs: 38, fat: 17, protein: 6, serving: '1 pastry' },
    'butter croissant': { calories: 260, carbs: 32, fat: 12, protein: 5, serving: '1 pastry' },
    'bacon gouda sandwich': { calories: 360, carbs: 35, fat: 14, protein: 19, serving: '1 sandwich' },
  },
};

// Function to look up nutrition from our database
function lookupRestaurantNutrition(query: string): string | null {
  const lowerQuery = query.toLowerCase();

  for (const [restaurant, items] of Object.entries(RESTAURANT_NUTRITION)) {
    if (lowerQuery.includes(restaurant)) {
      // Find the best matching item
      for (const [item, nutrition] of Object.entries(items)) {
        if (lowerQuery.includes(item) ||
            item.split(' ').every(word => lowerQuery.includes(word))) {
          return `OFFICIAL NUTRITION DATA for ${restaurant.toUpperCase()} ${item}:
Calories: ${nutrition.calories}
Carbs: ${nutrition.carbs}g
Fat: ${nutrition.fat}g
Protein: ${nutrition.protein}g
Serving: ${nutrition.serving || 'standard serving'}

This is verified data from the restaurant's official nutrition information.`;
        }
      }

      // If we found the restaurant but not the exact item, list available items
      const availableItems = Object.keys(items).join(', ');
      return `Found ${restaurant.toUpperCase()} but couldn't match the exact item. Available items with nutrition data: ${availableItems}. Please ask the user to clarify which item they had, or provide your best estimate based on similar items.`;
    }
  }

  return null;
}

// Simple web search function using a search API
async function performWebSearch(query: string): Promise<string> {
  // First check our local restaurant nutrition database
  const localResult = lookupRestaurantNutrition(query);
  if (localResult) {
    return localResult;
  }

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
