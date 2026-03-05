export interface Product {
  id: string;
  name: string;
  brand: string;
  image_url: string;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fiber: number;
    sugar: number;
    fat: number;
    saturated_fat: number;
    trans_fat: number;
    sodium: number;
  };
  ingredients: string;
}

export async function fetchProductByBarcode(barcode: string): Promise<Product | null> {
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await response.json();

    if (data.status === 0) return null;

    const p = data.product;
    return {
      id: barcode,
      name: p.product_name || "Unknown Product",
      brand: p.brands || "Unknown Brand",
      image_url: p.image_front_url || "https://picsum.photos/seed/food/400/400",
      nutrition: {
        calories: p.nutriments["energy-kcal_serving"] || p.nutriments["energy-kcal_100g"] || 0,
        protein: p.nutriments.proteins_serving || p.nutriments.proteins_100g || 0,
        carbs: p.nutriments.carbohydrates_serving || p.nutriments.carbohydrates_100g || 0,
        fiber: p.nutriments.fiber_serving || p.nutriments.fiber_100g || 0,
        sugar: p.nutriments.sugars_serving || p.nutriments.sugars_100g || 0,
        fat: p.nutriments.fat_serving || p.nutriments.fat_100g || 0,
        saturated_fat: p.nutriments["saturated-fat_serving"] || p.nutriments["saturated-fat_100g"] || 0,
        trans_fat: p.nutriments["trans-fat_serving"] || p.nutriments["trans-fat_100g"] || 0,
        sodium: p.nutriments.sodium_serving || p.nutriments.sodium_100g || 0,
      },
      ingredients: p.ingredients_text || "No ingredients listed.",
    };
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}
