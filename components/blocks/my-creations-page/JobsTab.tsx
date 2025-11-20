"use client";

import { AlertTriangle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { AgentJobsList } from "@/components/blocks/agent/AgentJobsList";
import { useAppContext } from "@/contexts/app";

export default function JobsTab() {
  const locale = useLocale();
  const t = useTranslations("agentJobs");
  const { user, setShowSignModal } = useAppContext();

  if (!user?.uuid) {
    return (
      <div className="flex flex-col lg:flex-row gap-2 h-full">
        <div className="bg-gray-900 rounded-xl shadow-lg flex flex-col w-full lg:overflow-hidden lg:h-full ">
          <div className="lg:flex-1 lg:overflow-y-auto lg:dark-scrollbar">
            <div className="p-4 md:p-6 text-center py-12">
              <AlertTriangle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-2xl font-semibold text-gray-200 mb-2">
                {t("pleaseSignIn")}
              </h3>
              <p className="text-gray-400 mb-6">{t("signInToViewJobs")}</p>
              <Button
                onClick={() => setShowSignModal(true)}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {t("signInButton")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-2 h-full">
      <AgentJobsList locale={locale} />
    </div>
  );
}
