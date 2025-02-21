"use server";

import { z } from "zod";
import { createCustomerInfo } from "@/models/customer";
import { Gender } from "@/types/enums";
import { logInfo, logError } from "@/lib/utils/logger";

const FormSchema = z.object({
  gender: z.enum(["male", "female", "other"], {
    message: "Please select gender",
  }),
});

export type State = {
  errors?: {
    gender?: string[];
  };
  message?: string | null;
  values?: Record<string, any>;
};

export async function createCustomerInput(formData: FormData): Promise<State> {
  // 1. 收集表单数据
  const rawFormData = {
    gender: formData.get("gender"),
    birthYear: Number(formData.get("birthYear")),
    birthMonth: Number(formData.get("birthMonth")),
    birthDay: Number(formData.get("birthDay")),
    birthHour: Number(formData.get("birthHour")),
    userId: formData.get("userId") || "",
  };

  try {
    const validatedFields = FormSchema.safeParse(rawFormData);
    if (!validatedFields.success) {
      logError("数据验证失败:", validatedFields.error);
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Please check if the input information is correct.",
        values: rawFormData,
      };
    }

    // 1. 先创建或更新 customer_info
    const customerInfo = await createCustomerInfo({
      gender: validatedFields.data.gender as Gender,
      birthYear: rawFormData.birthYear,
      birthMonth: rawFormData.birthMonth,
      birthDay: rawFormData.birthDay,
      birthHour: rawFormData.birthHour,
      userUuid: rawFormData.userId as string,
    });

    logInfo("客户信息创建成功:", {
      customerInfo: customerInfo,
    });

    return {
      errors: {},
      message: "Success",
      values: {
        ...rawFormData,
        customerInfoId: customerInfo.id,
      },
    };
  } catch (error) {
    logError("创建客户信息失败:", error);
    return {
      errors: {},
      message: "发生未知错误，请联系管理员",
      values: rawFormData,
    };
  }
}
