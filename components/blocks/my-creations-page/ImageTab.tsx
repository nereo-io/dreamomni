"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/contexts/app";
import ImageHistory from "@/components/blocks/image-history";
import Link from "next/link";

export default function ImageTab() {
  const t = useTranslations("imageHistory");
  const { user, setShowSignModal } = useAppContext();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  if (!user?.uuid) {
    return (
      <div className="flex flex-col lg:flex-row gap-2 h-full">
        <div className="bg-gray-900 min-h-[calc(100vh-180px)] rounded-xl shadow-lg flex flex-col w-full lg:overflow-hidden lg:h-full ">
          <div className="lg:flex-1 lg:overflow-y-auto lg:dark-scrollbar">
            <div className="p-4 md:p-6 text-center py-12">
              <AlertTriangle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-2xl font-semibold text-gray-200 mb-2">
                {t("pleaseSignIn")}
              </h3>
              <p className="text-gray-400 mb-6">{t("signInToViewImages")}</p>
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
      {/* Image History Component */}
      <ImageHistory
        refreshTrigger={refreshTrigger}
        className="bg-gray-900 min-h-[calc(100vh-180px)] rounded-xl shadow-lg flex flex-col flex-1 w-full lg:overflow-hidden lg:h-full"
        userId={user?.uuid}
        filterMode="all" // Show all images (both text-to-image and image-to-image)
        showEmptyState={true}
      />
    </div>
  );
}
