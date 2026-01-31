import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export interface FoodProduct {
  name: string;
  brand?: string;
  calories?: number;
  carbs?: number;
  fat?: number;
  protein?: number;
  servingSize?: string;
  imageUrl?: string;
  isCustomFood?: boolean;
  customFoodId?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barcode = searchParams.get('barcode');
    const userId = searchParams.get('userId');

    if (!barcode) {
      return NextResponse.json({ error: 'Barcode is required' }, { status: 400 });
    }

    // Clean the barcode - remove any non-numeric characters
    const cleanBarcode = barcode.replace(/\D/g, '');

    if (!cleanBarcode) {
      return NextResponse.json({ error: 'Invalid barcode format' }, { status: 400 });
    }

    // Check user's custom foods first if userId is provided
    if (userId && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        const { data: customFood } = await supabase
          .from('custom_foods')
          .select('*')
          .eq('user_id', userId)
          .eq('barcode', cleanBarcode)
          .single();

        if (customFood) {
          const foodProduct: FoodProduct = {
            name: customFood.name,
            brand: customFood.brand || undefined,
            calories: customFood.calories,
            carbs: customFood.carbs || undefined,
            fat: customFood.fat || undefined,
            protein: customFood.protein || undefined,
            servingSize: customFood.serving_size || undefined,
            isCustomFood: true,
            customFoodId: customFood.id,
          };

          return NextResponse.json({
            success: true,
            product: foodProduct,
            source: 'custom',
          });
        }
      } catch (err) {
        // Continue to Open Food Facts if custom food lookup fails
        console.error('Custom food lookup error:', err);
      }
    }

    // Fetch from Open Food Facts API
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${cleanBarcode}.json`,
      {
        headers: {
          'User-Agent': 'HabitADay/1.0 (https://github.com/habit-a-day)',
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch product data' },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.status !== 1 || !data.product) {
      return NextResponse.json(
        { error: 'Product not found', barcode: cleanBarcode },
        { status: 404 }
      );
    }

    const product = data.product;
    const nutriments = product.nutriments || {};

    // Extract nutritional info (per 100g or per serving)
    // Open Food Facts provides values per 100g by default
    // We'll use per-serving if available, otherwise per 100g
    const hasServingData = nutriments['energy-kcal_serving'] !== undefined;

    const foodProduct: FoodProduct = {
      name: product.product_name || product.product_name_en || 'Unknown Product',
      brand: product.brands,
      calories: hasServingData
        ? Math.round(nutriments['energy-kcal_serving'] || 0)
        : Math.round(nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0),
      carbs: hasServingData
        ? Math.round(nutriments.carbohydrates_serving || 0)
        : Math.round(nutriments.carbohydrates_100g || nutriments.carbohydrates || 0),
      fat: hasServingData
        ? Math.round(nutriments.fat_serving || 0)
        : Math.round(nutriments.fat_100g || nutriments.fat || 0),
      protein: hasServingData
        ? Math.round(nutriments.proteins_serving || 0)
        : Math.round(nutriments.proteins_100g || nutriments.proteins || 0),
      servingSize: hasServingData
        ? product.serving_size
        : '100g',
      imageUrl: product.image_front_small_url || product.image_url,
    };

    return NextResponse.json({
      success: true,
      product: foodProduct,
      isPerServing: hasServingData,
      rawNutriments: nutriments, // Include raw data for debugging
    });
  } catch (error) {
    console.error('Barcode lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to lookup barcode' },
      { status: 500 }
    );
  }
}
