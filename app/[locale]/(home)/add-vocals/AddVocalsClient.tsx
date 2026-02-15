"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useMusicGeneration from "@/hooks/useMusicGeneration";
import { MusicGeneratorForm } from "@/components/music/MusicGeneratorForm";
import { MusicHistoryList } from "@/components/music/MusicHistoryList";
import { Mic, Loader2 } from "lucide-react";
import useCredits from "@/hooks/useCredits";

export default function AddVocalsClient() {
  const t = useTranslations("music-generator");
  const { data: session, status } = useSession();
  const router = useRouter();
  const { leftCredits, updateLeftCredits } = useCredits();

  const {
    isLoading,
    history,
    isLoadingHistory,
    submitGeneration,
    pollStatus,
    fetchHistory,
  } = useMusicGeneration();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.uuid) {
      fetchHistory(1, 20);
      updateLeftCredits();
    }
  }, [session?.user?.uuid, updateLeftCredits]);

  const handleSubmit = async (params: any) => {
    const result = await submitGeneration({
      ...params,
      generationType: "add-vocals",
    });
    if (result?.id) {
      pollStatus(result.id);
      await updateLeftCredits();
      setTimeout(() => fetchHistory(1, 20), 1000);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-3xl blur-2xl group-hover:blur-3xl transition-all"></div>
            <div className="relative bg-card/40 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-border/50 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-pink-500/10 rounded-lg">
                  <Mic className="h-6 w-6 text-pink-400" />
                </div>
                <h2 className="text-xl md:text-2xl font-semibold text-white">
                  {t("generateMusic") || "Generate Music"}
                </h2>
              </div>
              <MusicGeneratorForm
                onSubmit={handleSubmit}
                isLoading={isLoading}
                userCredits={leftCredits || 0}
                fixedGenerationType="add-vocals"
              />
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-3xl blur-2xl group-hover:blur-3xl transition-all"></div>
            <div className="relative bg-card/40 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-border/50 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Mic className="h-6 w-6 text-purple-400" />
                </div>
                <h2 className="text-xl md:text-2xl font-semibold text-white">
                  {t("history") || "Generation History"}
                </h2>
              </div>
              <MusicHistoryList history={history} isLoading={isLoadingHistory} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

