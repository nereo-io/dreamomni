import { useState, useCallback } from "react";
import { User } from "@/types/user";
import { getUserLeftCredits } from "@/models/credit";

export const useCredits = () => {
  const [leftCredits, setLeftCredits] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasInitialized, setHasInitialized] = useState<boolean>(false);

  const updateLeftCredits = useCallback(async () => {
    setIsLoading(true);
    try {
      const resp = await fetch("/api/credits", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!resp.ok) {
        throw new Error("update credits failed with status " + resp.status);
      }

      const { code, message, data } = await resp.json();
      if (code !== 0) {
        throw new Error(message);
      }

      setLeftCredits(data.credits || 0);
      setHasInitialized(true);
    } catch (error) {
      console.error("Failed to update credits:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 直接设置积分值的方法
  const setCredits = useCallback((credits: number) => {
    setLeftCredits(credits);
    setHasInitialized(true);
  }, []);

  return {
    leftCredits,
    updateLeftCredits,
    setCredits,
    isLoading,
    hasInitialized,
  };
};

export default useCredits;
