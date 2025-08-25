import { getTranslations } from "next-intl/server";
import { getSupabaseClient } from "@/models/db";
import { getAllEffectConfigs } from "@/models/effectConfig";
import VideoEffectsClient from "./client";

export default async function VideoEffectsPage() {
  const t = await getTranslations("pages.videoAffects");
  const supabase = getSupabaseClient();
  const effects = await getAllEffectConfigs(supabase);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-8">
        {t("effectsTitle")}
      </h1>
      <VideoEffectsClient effects={effects} />
    </div>
  );
}
