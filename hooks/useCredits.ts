import { useState } from "react";
import { User } from "@/types/user";
import { getUserLeftCredits } from "@/models/credit";

export const useCredits = () => {
  const [leftCredits, setLeftCredits] = useState<number | null>(null);

  const updateLeftCredits = async () => {
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
  };

  return {
    leftCredits,
    updateLeftCredits,
  };
};

export default useCredits;
