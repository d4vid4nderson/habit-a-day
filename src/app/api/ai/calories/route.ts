import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a helpful nutrition assistant that helps users estimate calories for their meals.

When a user describes a food or meal:
1. Provide a calorie estimate (or range if uncertain)
2. Keep responses concise and friendly
3. If the description is vague, ask clarifying questions about portion size or preparation method
4. Always include a specific number that can be used for logging

Format calorie estimates clearly, like:
- "A medium apple: approximately **95 calories**"
- "Grilled chicken breast (6 oz): approximately **280 calories**"

If the user asks about multiple items, provide individual estimates and a total.

Be encouraging and non-judgmental about food choices.`;

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
    const messages: { role: 'user' | 'assistant'; content: string }[] = [];

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

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    const assistantMessage = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

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
