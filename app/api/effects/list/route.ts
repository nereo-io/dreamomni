import { NextRequest, NextResponse } from "next/server";
import { getAllEffectConfigs } from "@/models/effectConfig";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") || "en";
  
  try {
    const effects = await getAllEffectConfigs(locale);
    
    // 只返回必要字段，减少传输数据
    const optimizedEffects = effects.map((effect) => ({
      id: effect.id,
      slug: effect.slug,
      title: effect.title,
      description: effect.description,
      preview_image: effect.preview_image,
      preview_video: effect.preview_video,
      credits_required: effect.credits_required,
      is_hot: effect.is_hot,
      category: effect.category,
    }));
    
    return NextResponse.json({ 
      effects: optimizedEffects 
    });
  } catch (error) {
    console.error("Failed to fetch effects:", error);
    return NextResponse.json({ effects: [] }, { status: 500 });
  }
}