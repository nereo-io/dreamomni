'use server';

import { z } from 'zod';
import { createCustomer } from '@/models/customer';
import { Gender } from '@/types/enums';
import { logInfo, logError } from '@/lib/utils/logger';
import { BusinessError, DatabaseError } from '@/lib/exceptions/AppError';
import { calculateTrueSolarTime } from '@/lib/utils/solarTime';
import { getTimezoneFromLocation, convertToUTC } from '@/lib/utils/timezone';

const FormSchema = z.object({
  name: z.string().min(1, '请输入姓名'),
  gender: z.enum(['male', 'female', 'other'], {
    message: '请选择性别',
    invalid_type_error: '请选择有效的性别',
  }),
  birthDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: '请输入有效的出生日期',
  }),
  birthTime: z.string().refine((time) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time), {
    message: '请输入有效的出生时间（格式：HH:MM）',
  }),
});

const CreateCustomerInput = FormSchema; 

export type State = {
  errors?: {
    name?: string[];
    gender?: string[];
    birthDate?: string[];
    birthTime?: string[];
  };
  message?: string | null;
  values?: Record<string, any>;
};

export async function createCustomerInput(prevState: State, formData: FormData): Promise<State> {

  // 1. 收集表单数据
  const rawFormData = {
    name: formData.get('name'),
    gender: formData.get('gender'),
    birthDate: formData.get('birthDate'),
    birthTime: formData.get('birthTime'),
    userId: '785a4c2e-5ccc-4c50-9160-7bfc4e98bbfc', // 这里应该是动态获取的用户ID
  };

  try {  
    // logInfo('用户输入信息', rawFormData);
    const now = new Date();

    const validatedFields = CreateCustomerInput.safeParse(rawFormData);
    if (!validatedFields.success) {
      logError('数据验证失败:', validatedFields.error);
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Please check if the input information is correct.',
        values: rawFormData
      };
    }

    // 3. 获取出生地时区
    const timezone = 'Asia/Shanghai';

    // 4. 组合本地日期时间
    const localDateTime = `${validatedFields.data.birthDate}T${validatedFields.data.birthTime}`;

    // 5. 转换为 UTC 时间
    const utcDateTime = convertToUTC(localDateTime, timezone);

    const customer = await createCustomer({
      name: validatedFields.data.name,
      gender: validatedFields.data.gender as Gender,
      birthDateTime: utcDateTime,
      userUuid: rawFormData.userId,
      timezone: timezone,
    });
    
    // 打印创建成功的客户信息
    logInfo('客户创建成功:', {
      customerId: customer.id,
      customerData: customer
    });

    // 7. 返回成功状态
    return {
      errors: {},
      message: 'Success',
      values: {
        ...rawFormData,
        customerId: customer.id
      }
    };
  }  catch (error) {
    // 8. 错误处理
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
