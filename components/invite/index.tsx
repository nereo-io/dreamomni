"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { CopyToClipboard } from "react-copy-to-clipboard";
import Icon from "@/components/icon";
import InviteModal from "./modal";
import { User } from "@/types/user";
import { toast } from "sonner";
import { useAppContext } from "@/contexts/app";
import { useTranslations } from "next-intl";

export default function Invite({ summary }: { summary: any }) {
  const t = useTranslations();

  const [open, setOpen] = useState(false);
  const { user, setUser } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [template1Value, setTemplate1Value] = useState("");
  const [template2Value, setTemplate2Value] = useState("");
  const [template3Value, setTemplate3Value] = useState("");

  const updateInviteCode = async function (invite_code: string) {
    try {
      invite_code = invite_code.trim();

      if (!invite_code) {
        toast.error("invite code is required");
        return;
      }

      setLoading(true);
      const req = {
        invite_code,
      };
      const resp = await fetch("/api/update-invite-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req),
      });
      if (!resp.ok) {
        throw new Error("update invite code faild with status " + resp.status);
      }

      const { code, message, data } = await resp.json();
      if (code !== 0) {
        toast.error(message);
        return;
      }

      setUser(data);
      toast.success("set invite code success");
      setOpen(false);
    } catch (e) {
      console.log("update invite code failed", e);
      toast.error("set invite code failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
    // 从国际化文件中加载初始模板内容
    setTemplate1Value(t("my_invites.template1"));
    setTemplate2Value(t("my_invites.template2"));
    setTemplate3Value(t("my_invites.template3"));
  }, [t]);

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex-1 p-6">
        <h2 className="text-sm text-gray-500 mb-4">
          {t("my_invites.invite_code")}
        </h2>
        {user && user.uuid && (
          <div className="flex items-center justify-between mb-4">
            <InviteModal
              open={open}
              setOpen={setOpen}
              username={user.nickname}
              initInviteCode={user.invite_code}
              updateInviteCode={updateInviteCode}
              loading={loading}
            />
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">
                {user.invite_code || "NOT SET"}
              </span>
              <Icon
                name="RiEditLine"
                className="text-primary text-xl cursor-pointer"
                onClick={() => setOpen(true)}
              />
            </div>
            {user.invite_code && (
              <CopyToClipboard
                text={`${process.env.NEXT_PUBLIC_WEB_URL}/i/${user?.invite_code}`}
                onCopy={() => toast.success("copied")}
              >
                <Button size="sm">{t("my_invites.copy_invite_link")}</Button>
              </CopyToClipboard>
            )}
          </div>
        )}
        <p className="text-base text-primary font-semibold">
          {t("my_invites.invite_tip")}
        </p>
      </Card>

      {/* 右侧奖励卡片 */}
      <Card className="flex-1 p-6">
        <h2 className="text-sm text-gray-500 mb-4">
          {t("my_invites.invite_templates")}
        </h2>
        <div className="space-y-4">
          {/* 模板1 */}
          <div className="bg-gray-50 dark:bg-background rounded-lg overflow-hidden">
            <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:bg-background">
              <h3 className="text-sm font-medium">
                {t("my_invites.template1_title")}
              </h3>
              <CopyToClipboard
                text={`${template1Value}\n${process.env.NEXT_PUBLIC_WEB_URL}/i/${user?.invite_code}`}
                onCopy={() => toast.success(t("my_invites.copied"))}
              >
                <div className="flex items-center gap-1 text-primary cursor-pointer">
                  <Icon name="RiFileCopy2Line" className="text-lg" />
                  <span className="text-xs">{t("my_invites.copy")}</span>
                </div>
              </CopyToClipboard>
            </div>
            <textarea
              className="w-full p-3 bg-gray-50 dark:bg-background text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              rows={6}
              value={`${template1Value}\n${process.env.NEXT_PUBLIC_WEB_URL}/i/${user?.invite_code}`}
              onChange={(e) => setTemplate1Value(e.target.value)}
            />
          </div>

          {/* 模板2 */}
          <div className="bg-gray-50 dark:bg-background rounded-lg overflow-hidden">
            <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:bg-background">
              <h3 className="text-sm font-medium">
                {t("my_invites.template2_title")}
              </h3>
              <CopyToClipboard
                text={`${template2Value}\n${process.env.NEXT_PUBLIC_WEB_URL}/i/${user?.invite_code}`}
                onCopy={() => toast.success(t("my_invites.copied"))}
              >
                <div className="flex items-center gap-1 text-primary cursor-pointer">
                  <Icon name="RiFileCopy2Line" className="text-lg" />
                  <span className="text-xs">{t("my_invites.copy")}</span>
                </div>
              </CopyToClipboard>
            </div>
            <textarea
              className="w-full p-3 bg-gray-50 dark:bg-background text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              rows={6}
              value={`${template3Value}\n${process.env.NEXT_PUBLIC_WEB_URL}/i/${user?.invite_code}`}
              onChange={(e) => setTemplate2Value(e.target.value)}
            />
          </div>

          {/* 模板3 */}
          <div className="bg-gray-50 dark:bg-background rounded-lg overflow-hidden">
            <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:bg-background">
              <h3 className="text-sm font-medium">
                {t("my_invites.template3_title")}
              </h3>
              <CopyToClipboard
                text={`${template3Value}\n${process.env.NEXT_PUBLIC_WEB_URL}/i/${user?.invite_code}`}
                onCopy={() => toast.success(t("my_invites.copied"))}
              >
                <div className="flex items-center gap-1 text-primary cursor-pointer">
                  <Icon name="RiFileCopy2Line" className="text-lg" />
                  <span className="text-xs">{t("my_invites.copy")}</span>
                </div>
              </CopyToClipboard>
            </div>
            <textarea
              className="w-full p-3 bg-gray-50 dark:bg-background text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              rows={6}
              value={`${template3Value}\n${process.env.NEXT_PUBLIC_WEB_URL}/i/${user?.invite_code}`}
              onChange={(e) => setTemplate3Value(e.target.value)}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
