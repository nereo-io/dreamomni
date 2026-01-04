"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useMusicGeneration from "@/hooks/useMusicGeneration";
import { MusicGeneratorForm } from "@/components/music/MusicGeneratorForm";
import { MusicHistoryList } from "@/components/music/MusicHistoryList";
import { Music, Loader2 } from "lucide-react";
import useCredits from "@/hooks/useCredits";

export default function MusicGenerationPage() {
  const t = useTranslations("music-generator");
  const { data: session, status } = useSession();
  const router = useRouter();
  const { leftCredits, updateLeftCredits } = useCredits();

  const {
    isLoading,
    currentGeneration,
    history,
    isLoadingHistory,
    isPolling,
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
    const result = await submitGeneration(params);
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
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8 md:mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl backdrop-blur-sm border border-blue-500/20">
              <Music className="h-8 w-8 md:h-10 md:w-10 text-blue-400" />
            </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
            {t("title") || "Music Generation"}
          </h1>
          <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto">
            {t("subtitle") || "Create amazing music with AI"}
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Generator Card */}
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl blur-2xl group-hover:blur-3xl transition-all"></div>
            
            {/* Card */}
            <div className="relative bg-card/40 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-border/50 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Music className="h-6 w-6 text-blue-400" />
                </div>
                <h2 className="text-xl md:text-2xl font-semibold text-white">
                  {t("generateMusic") || "Generate Music"}
                </h2>
              </div>
              <MusicGeneratorForm
                onSubmit={handleSubmit}
                isLoading={isLoading || isPolling}
                userCredits={leftCredits || 0}
              />
            </div>
          </div>

          {/* History Card */}
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-3xl blur-2xl group-hover:blur-3xl transition-all"></div>
            
            {/* Card */}
            <div className="relative bg-card/40 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-border/50 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Music className="h-6 w-6 text-purple-400" />
                </div>
                <h2 className="text-xl md:text-2xl font-semibold text-white">
                  {t("history") || "Generation History"}
                </h2>
              </div>
              <MusicHistoryList
                history={history}
                isLoading={isLoadingHistory}
              />
            </div>
          </div>
        </div>

        {/* Floating Status Card */}
        {currentGeneration && isPolling && (
          <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-in slide-in-from-bottom-5 duration-300">
            <div className="relative group">
              {/* Glow */}
              <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-xl"></div>
              
              {/* Card */}
              <div className="relative bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl p-4 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md"></div>
                    <Loader2 className="relative h-6 w-6 text-blue-400 animate-spin" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">
                      {t("generating") || "Generating..."}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      Status: <span className="text-blue-400">{currentGeneration.status}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
