import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import {
  sanitizeForExternalAPI,
  sanitizeAIResponse,
  createExternalAPIAuditHash,
} from '@/lib/security/sanitizer';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a precise nutrition assistant that helps users estimate calories AND macronutrients (carbs, fat, protein) for their meals.

CRITICAL RULES:
1. NEVER underestimate. Users prefer accurate or slightly high estimates over low ones.
2. For chain restaurants (Panda Express, Chipotle, McDonald's, etc.), ALWAYS use their official published nutrition data - do NOT guess.
3. Use the web_search tool for ANY brand name, restaurant, or packaged food to get accurate data.

IMPORTANT - SERVING SIZE:
If the user does NOT specify a quantity or serving size, ASK THEM before giving nutrition info!
Example: "How many tablespoons of Coffee-mate did you use?" or "What size serving - 1 cup, 2 cups?"

When you DO have the quantity:
- Nutrition data from searches is PER SERVING (e.g., "per 1 tablespoon" or "per 100g")
- YOU MUST MULTIPLY the values by the user's requested quantity!

Examples:
- If data shows "35 calories per 1 tablespoon" and user says 2 tablespoons → 70 calories
- If data shows "150 calories per cup" and user says 1.5 cups → 225 calories
- If data shows "100 calories per serving (30g)" and user says 60g → 200 calories

ALWAYS:
1. Ask for quantity/serving size if not provided
2. Note what serving size the nutrition data is for
3. Multiply/adjust based on user's actual quantity

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
- Search for "[product name] nutrition facts calories" or "[brand] [product] nutrition"
- Provide the OFFICIAL nutritional values, not estimates
- REMEMBER to multiply by the user's quantity if different from the serving size!

CRITICAL: Always provide ALL four values in this exact format at the end of your response:
**Calories: [number]** | **Carbs: [number]g** | **Fat: [number]g** | **Protein: [number]g**

Examples:
- "Panda Express Large Orange Chicken (entree only): **Calories: 490** | **Carbs: 51g** | **Fat: 23g** | **Protein: 25g**"
- "Coffee-mate creamer (2 tablespoons): **Calories: 70** | **Carbs: 10g** | **Fat: 3g** | **Protein: 0g**"
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

// FatSecret API for comprehensive food nutrition data
// Documentation: https://platform.fatsecret.com/docs/guides/authentication/oauth2

// Cache the access token to avoid requesting a new one for every search
let fatSecretToken: { token: string; expiresAt: number } | null = null;

async function getFatSecretToken(): Promise<string | null> {
  const clientId = process.env.FATSECRET_CLIENT_ID;
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  // Return cached token if still valid (with 5 min buffer)
  if (fatSecretToken && fatSecretToken.expiresAt > Date.now() + 300000) {
    return fatSecretToken.token;
  }

  try {
    const response = await fetch('https://oauth.fatsecret.com/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
      },
      body: 'grant_type=client_credentials&scope=basic',
    });

    if (!response.ok) {
      console.error('FatSecret token error:', response.status);
      return null;
    }

    const data = await response.json();
    fatSecretToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in * 1000),
    };

    return fatSecretToken.token;
  } catch (error) {
    console.error('FatSecret token error:', error);
    return null;
  }
}

// Search FatSecret for food nutrition data
async function searchFatSecret(query: string): Promise<string | null> {
  const token = await getFatSecretToken();
  if (!token) {
    return null;
  }

  try {
    // Search for foods using v3 API
    const searchParams = new URLSearchParams({
      method: 'foods.search.v3',
      search_expression: query,
      format: 'json',
      max_results: '10',
      include_food_attributes: 'true',
    });

    const response = await fetch('https://platform.fatsecret.com/rest/server.api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${token}`,
      },
      body: searchParams.toString(),
    });

    if (!response.ok) {
      console.error('FatSecret search error:', response.status);
      return null;
    }

    const data = await response.json();

    if (data.foods_search?.results?.food) {
      const foods = Array.isArray(data.foods_search.results.food)
        ? data.foods_search.results.food
        : [data.foods_search.results.food];

      const results: string[] = ['NUTRITION DATA FROM FATSECRET DATABASE:'];

      for (const food of foods.slice(0, 5)) {
        const name = food.food_name || '';
        const brand = food.brand_name || '';
        const foodType = food.food_type || '';

        // Get servings data
        let servingInfo = '';
        let calories = 'N/A';
        let fat = 'N/A';
        let carbs = 'N/A';
        let protein = 'N/A';

        if (food.servings?.serving) {
          const servings = Array.isArray(food.servings.serving)
            ? food.servings.serving
            : [food.servings.serving];

          // Prefer standard serving or first available
          const serving = servings[0];
          if (serving) {
            servingInfo = serving.serving_description || serving.measurement_description || 'per serving';
            calories = serving.calories ? Math.round(parseFloat(serving.calories)).toString() : 'N/A';
            fat = serving.fat ? Math.round(parseFloat(serving.fat)).toString() : 'N/A';
            carbs = serving.carbohydrate ? Math.round(parseFloat(serving.carbohydrate)).toString() : 'N/A';
            protein = serving.protein ? Math.round(parseFloat(serving.protein)).toString() : 'N/A';
          }
        } else {
          // Fallback: Parse the food_description which contains nutrition info
          const description = food.food_description || '';
          // FatSecret format: "Per 100g - Calories: 250kcal | Fat: 10.00g | Carbs: 30.00g | Protein: 8.00g"
          const caloriesMatch = description.match(/Calories:\s*(\d+(?:\.\d+)?)/i);
          const fatMatch = description.match(/Fat:\s*(\d+(?:\.\d+)?)/i);
          const carbsMatch = description.match(/Carbs:\s*(\d+(?:\.\d+)?)/i);
          const proteinMatch = description.match(/Protein:\s*(\d+(?:\.\d+)?)/i);
          const servingMatch = description.match(/^Per\s+([^-]+)/i);

          servingInfo = servingMatch ? servingMatch[1].trim() : 'per serving';
          calories = caloriesMatch ? Math.round(parseFloat(caloriesMatch[1])).toString() : 'N/A';
          fat = fatMatch ? Math.round(parseFloat(fatMatch[1])).toString() : 'N/A';
          carbs = carbsMatch ? Math.round(parseFloat(carbsMatch[1])).toString() : 'N/A';
          protein = proteinMatch ? Math.round(parseFloat(proteinMatch[1])).toString() : 'N/A';
        }

        const typeLabel = foodType === 'Brand' ? ` (${brand || 'Brand'})` : brand ? ` (${brand})` : '';

        results.push(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Food: ${name}${typeLabel}
⚠️ SERVING SIZE: ${servingInfo} ← IMPORTANT: This is the serving size for the values below!
• Calories: ${calories} (per ${servingInfo})
• Fat: ${fat}g (per ${servingInfo})
• Carbs: ${carbs}g (per ${servingInfo})
• Protein: ${protein}g (per ${servingInfo})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      }

      results.push('\n⚠️ REMINDER: The values above are PER SERVING. If the user asked about a different quantity, you MUST multiply the values accordingly!');
      results.push('Example: If data shows 35 cal per 1 tbsp and user asks about 2 tbsp, return 70 calories.');

      return results.join('\n');
    }

    return null;
  } catch (error) {
    console.error('FatSecret search error:', error);
    return null;
  }
}

// Web search function - tries FatSecret first, then falls back to DuckDuckGo
async function performWebSearch(query: string): Promise<string> {
  // Try FatSecret API first (comprehensive food database)
  const fatSecretResult = await searchFatSecret(query);
  if (fatSecretResult) {
    return fatSecretResult;
  }

  // Fall back to DuckDuckGo for general searches
  try {
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

    const results: string[] = [];

    if (data.Abstract) {
      results.push(`Summary: ${data.Abstract}`);
    }

    if (data.Answer) {
      results.push(`Answer: ${data.Answer}`);
    }

    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics.slice(0, 3)) {
        if (topic.Text && (topic.Text.toLowerCase().includes('calorie') || topic.Text.toLowerCase().includes('nutrition'))) {
          results.push(`Related: ${topic.Text}`);
        }
      }
    }

    if (results.length === 0) {
      return `No direct nutritional data found for "${query}". Please provide your best estimate based on typical nutritional values for this type of food. For chain restaurants, check their official website for nutrition information.`;
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

    // HIPAA: Sanitize user input before sending to external AI service
    // This removes any potential PHI (emails, phone numbers, health conditions, etc.)
    const sanitizedMessage = sanitizeForExternalAPI(message);

    // Create audit hash for logging (logs that external API was called, not the content)
    const auditInfo = createExternalAPIAuditHash(message);
    if (auditInfo.containedPHI) {
      console.warn(
        '[HIPAA] Potential PHI detected and sanitized before AI API call. Hash:',
        auditInfo.hash
      );
    }

    // Build messages array from conversation history
    const messages: Anthropic.MessageParam[] = [];

    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        // Sanitize conversation history as well
        const sanitizedContent =
          msg.role === 'user'
            ? sanitizeForExternalAPI(msg.content)
            : msg.content;
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: sanitizedContent,
        });
      }
    }

    // Add the new sanitized user message
    messages.push({
      role: 'user',
      content: sanitizedMessage,
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
    // HIPAA: Sanitize AI response in case it echoed any PHI
    const assistantMessage = sanitizeAIResponse(textBlock?.text || '');

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
