'use server';

import { z } from 'zod';
import { createCustomer } from '@/models/customer';
import { Gender } from '@/types/enums';
import { logInfo, logError } from '@/lib/utils/logger';
import { BusinessError, DatabaseError } from '@/lib/exceptions/AppError';

const FormSchema = z.object({
  gender: z.enum(['male', 'female', 'other'], {
    message: '请选择性别',
    invalid_type_error: '请选择有效的性别',
  }),
  birthYear: z.number({
    required_error: "请选择出生年份",
    invalid_type_error: "出生年份格式不正确",
  }).min(1900, "出生年份不能早于1900年").max(2100, "出生年份不能晚于2100年"),
  birthMonth: z.number({
    required_error: "请选择出生月份",
    invalid_type_error: "出生月份格式不正确",
  }).min(1, "请选择有效的月份").max(12, "请选择有效的月份"),
  birthDay: z.number({
    required_error: "请选择出生日期",
    invalid_type_error: "出生日期格式不正确",
  }).min(1, "请选择有效的日期").max(31, "请选择有效的日期"),
  birthHour: z.number({
    required_error: "请选择出生时辰",
    invalid_type_error: "出生时辰格式不正确",
  }).min(0, "请选择有效的时辰").max(23, "请选择有效的时辰"),
  careerQuestion: z.string({
    required_error: "请输入您的问题",
  }).min(1, "请输入您的问题"),
});

export type State = {
  errors?: {
    gender?: string[];
    birthYear?: string[];
    birthMonth?: string[];
    birthDay?: string[];
    birthHour?: string[];
    careerQuestion?: string[];
  };
  message?: string | null;
  values?: Record<string, any>;
};

export async function createCustomerInput(prevState: State, formData: FormData): Promise<State> {
  // 1. 收集表单数据
  const rawFormData = {
    gender: formData.get('gender'),
    birthYear: Number(formData.get('birthYear')),
    birthMonth: Number(formData.get('birthMonth')),
    birthDay: Number(formData.get('birthDay')),
    birthHour: Number(formData.get('birthHour')),
    careerQuestion: formData.get('question') || '帮我算一下2025年运势', // 使用默认问题
    userId: '785a4c2e-5ccc-4c50-9160-7bfc4e98bbfc', // 这里应该是动态获取的用户ID
  };

  try {
    const validatedFields = FormSchema.safeParse(rawFormData);
    if (!validatedFields.success) {
      logError('数据验证失败:', validatedFields.error);
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Please check if the input information is correct.',
        values: rawFormData
      };
    }

    const customer = await createCustomer({
      gender: validatedFields.data.gender as Gender,
      birthYear: validatedFields.data.birthYear,
      birthMonth: validatedFields.data.birthMonth,
      birthDay: validatedFields.data.birthDay,
      birthHour: validatedFields.data.birthHour,
      careerQuestion: validatedFields.data.careerQuestion,
      userUuid: rawFormData.userId,
    });
    
    logInfo('客户创建成功:', {
      customerId: customer.id,
      customerData: customer
    });

    return {
      errors: {},
      message: 'Success',
      values: {
        ...rawFormData,
        customerId: customer.id
      }
    };
  } catch (error) {
    logError('创建客户信息失败:', error);
    
    if (error instanceof BusinessError) {
      return {
        errors: {},
        message: error.message,
        values: rawFormData
      };
    }

    if (error instanceof DatabaseError) {
      return {
        errors: {},
        message: '系统错误，请稍后重试',
        values: rawFormData
      };
    }

    return {
      errors: {},
      message: '发生未知错误，请联系管理员',
      values: rawFormData
    };
  }
} 
