import Empty from "@/components/blocks/empty";
import { getCreditsByUserUuid, getUserCreditPools } from "@/models/credit";
import { getTranslations } from "next-intl/server";
import { getUserCredits } from "@/services/credit";
import { getUserUuid } from "@/services/user";
import { Separator } from "@/components/ui/separator";
import Toolbar from "@/components/blocks/toolbar";
import { MyCreditsTabs } from "@/components/console/my-credits-tabs";

export default async function () {
  const t = await getTranslations();

  const user_uuid = await getUserUuid();

  if (!user_uuid) {
    return <Empty message="no auth" />;
  }

  const credits = (await getCreditsByUserUuid(user_uuid, 1, 100)) || [];
  const creditPools = await getUserCreditPools(user_uuid);
  const userCredits = await getUserCredits(user_uuid);

  const toolbar = {
    items: [
      {
        title: t("my_credits.recharge"),
        url: "/pricing",
        target: "_blank",
      },
      // {
      //   title: t("my_credits.invite"),
      //   url: "/my-invites",
      // },
    ],
  };

  const translations = {
    recordsTab: t("my_credits.tabs.records"),
    poolsTab: t("my_credits.tabs.pools"),
    noCredits: t("my_credits.no_credits"),
    table: {
      trans_no: t("my_credits.table.trans_no"),
      trans_type: t("my_credits.table.trans_type"),
      credits: t("my_credits.table.credits"),
      updated_at: t("my_credits.table.updated_at"),
    },
    poolsTable: {
      order_no: t("creditPools.table.order_no"),
      expired_at: t("creditPools.table.expired_at"),
      balance: t("creditPools.table.balance"),
      earned: t("creditPools.table.earned"),
      created_at: t("creditPools.table.created_at"),
    },
    bonus: t("creditPools.bonus"),
  };

  // Build trans_type translation map
  const transTypeKeys = [
    "new_user",
    "order_pay",
    "system_add",
    "ping",
    "chat",
    "refund_non_response",
    "video_generation_4s",
    "video_generation_5s",
    "video_generation_6s",
    "video_generation_8s",
    "video_generation_10s",
    "video_generation_12s",
    "video_generation_15s",
    "video_generation_25s",
    "refund_video_generation_failed",
    "image_generation",
    "refund_image_generation_failed",
    "agent_shot_analysis",
    "agent_plan_reserve",
    "agent_plan_refund",
    "agent_keyframe",
    "agent_keyframe_reserve",
    "agent_keyframe_refund",
    "agent_video_clip",
    "agent_video_reserve",
    "agent_video_refund",
    "agent_bgm_reserve",
    "agent_bgm_refund",
    "agent_video_splicing",
    "agent_splice",
    "agent_splice_refund",
    "agent_scene_ref_reserve",
    "agent_scene_ref_refund",
    "agent_character_ref_reserve",
    "agent_character_ref_refund",
  ];

  const transTypeMap: Record<string, string> = {};
  for (const key of transTypeKeys) {
    transTypeMap[key] = t(`trans_type.${key}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t("my_credits.title")}</h3>
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
          {t("my_credits.left_tip", {
            left_credits: userCredits?.left_credits || 0,
          })}
        </p>
      <Toolbar className="mb-0" items={toolbar.items} />
        </div>
      </div>
      <Separator />
      <MyCreditsTabs
        credits={credits}
        creditPools={creditPools}
        translations={translations}
        transTypeMap={transTypeMap}
      />
    </div>
  );
}
