import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// 加载环境变量
config({ path: '.env.local' });

// 检查环境变量
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!RESEND_API_KEY || !NEXT_PUBLIC_SUPABASE_URL || !NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);
const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY);

// 俄语邮件内容
const EMAIL_SUBJECT = 'Нужна помощь с заказом на Veo3 AI?';
const EMAIL_CONTENT = `Здравствуйте!

Мы заметили, что вы создали заказ на нашей платформе Veo3 AI, но оплата не была завершена.

Возможно, у вас возникли трудности с процессом оплаты или есть вопросы о нашем продукте? Мы здесь, чтобы помочь!

Если у вас есть какие-либо вопросы или вам нужна помощь, просто ответьте на это письмо, и мы свяжемся с вами как можно скорее.

С уважением,
Команда Veo3 AI

---
Если вы больше не заинтересованы в нашем сервисе, просто проигнорируйте это письмо.`;

// 6-12 到 6-13 期间的未付费用户数据
const UNPAID_USERS_6_12_13 = [
  {
    order_no: "704208109801541", 
    user_email: "lianjones10578@gmail.com",
    user_uuid: "920c4463-b500-4d27-a546-a3137e82c026",
    created_at: "2025-06-12 21:10:08.057+00",
    amount: 36000,
    credits: 12000,
    status: "created"
  },
  {
    order_no: "704046516416581",
    user_email: "serov191022@gmail.com",
    user_uuid: "cbfd33a0-c8ca-4642-8d2f-8a78c08fa393",
    created_at: "2025-06-12 10:12:36.547+00", 
    amount: 2999,
    credits: 400,
    status: "created"
  },
  {
    order_no: "703939626967109", 
    user_email: "weqfwfwf8@gmail.com",
    user_uuid: "1f5e1e52-b3b8-4903-9c87-f605772cfda8",
    created_at: "2025-06-12 02:57:40.49+00",
    amount: 21594,
    credits: 4800,
    status: "created"
  }
];

// 6-11 期间的未付费用户数据
const UNPAID_USERS_6_11 = [
  {
    order_no: "703859479470149",
    user_email: "dev.dmkrupin@gmail.com",
    user_uuid: "b1dbeb10-72d9-4d6c-a4f9-ebcbcb7903a6",
    created_at: "2025-06-11 21:31:33.23+00",
    amount: 2999,
    credits: 400,
    status: "created"
  },
  {
    order_no: "703826688192581",
    user_email: "1armageddonets@gmail.com",
    user_uuid: "30866646-6db8-44ae-b4e5-c7748b3352bc",
    created_at: "2025-06-11 19:18:07.547+00",
    amount: 21594,
    credits: 4800,
    status: "created"
  },
  {
    order_no: "703819072651333",
    user_email: "gchekanov1999@gmail.com",
    user_uuid: "c72f1b24-5d86-4a4e-80d6-04be0d1a69a5",
    created_at: "2025-06-11 18:47:08.284+00",
    amount: 2999,
    credits: 400,
    status: "created"
  },
  {
    order_no: "703766354055237",
    user_email: "ahimik737@gmail.com",
    user_uuid: "3550e61d-1b6f-4977-b9a0-b79e6d674f70",
    created_at: "2025-06-11 15:12:37.533+00",
    amount: 21594,
    credits: 4800,
    status: "created"
  },
  {
    order_no: "703762699993157",
    user_email: "vladfevral@gmail.com",
    user_uuid: "0e534f17-3d38-4c60-a0bd-c64bcc1821d2",
    created_at: "2025-06-11 14:57:45.428+00",
    amount: 2999,
    credits: 400,
    status: "created"
  },
  {
    order_no: "703716417957957",
    user_email: "k3rato@gmail.com",
    user_uuid: "ce7a057d-2dc0-48ab-9b5f-2dde44ccc961",
    created_at: "2025-06-11 11:49:26.103+00",
    amount: 21594,
    credits: 4800,
    status: "created"
  },
  {
    order_no: "703711508930629",
    user_email: "mavilehalilova566@gmail.com",
    user_uuid: "ec918698-0907-451d-b576-57503cd91b41",
    created_at: "2025-06-11 11:29:27.61+00",
    amount: 2999,
    credits: 400,
    status: "created"
  },
  {
    order_no: "703665187549253",
    user_email: "intrance52@gmail.com",
    user_uuid: "d6573d56-42a7-4d7d-9192-51ffe13664f9",
    created_at: "2025-06-11 08:20:58.679+00",
    amount: 21594,
    credits: 4800,
    status: "created"
  },
  {
    order_no: "703652929974341",
    user_email: "fredmerkury822@gmail.com",
    user_uuid: "24d842b9-cf69-45e3-8914-66aeb9969dcc",
    created_at: "2025-06-11 07:31:06.107+00",
    amount: 2999,
    credits: 400,
    status: "created"
  }
];

// 合并所有用户数据
const ALL_UNPAID_USERS = [...UNPAID_USERS_6_12_13, ...UNPAID_USERS_6_11];

// 已有支付订单的用户邮箱（排除）
const USERS_WITH_PAYMENTS = [
  'kseniadorofeeva80@gmail.com',
  'hugeroger@gmail.com', 
  'baziai012@gmail.com',
  'dk.limon.dk@gmail.com',
  'savilov.fedos1993@gmail.com'
];

// 已发送过邮件的用户邮箱（排除）
const USERS_ALREADY_EMAILED = [
  'baziai012@gmail.com',
  'mishacolins1997@gmail.com',
  'smesarikitv80@gmail.com'
];

// 过滤用户：排除已有支付订单的用户和已发送过邮件的用户
const USERS_TO_EMAIL = ALL_UNPAID_USERS.filter(user => 
  !USERS_WITH_PAYMENTS.includes(user.user_email) && 
  !USERS_ALREADY_EMAILED.includes(user.user_email)
);

// 去重同一邮箱的多个订单，只保留最新的订单
const uniqueUsers = USERS_TO_EMAIL.reduce((acc, user) => {
  const existingUser = acc.find(u => u.user_email === user.user_email);
  if (!existingUser) {
    acc.push(user);
  } else if (new Date(user.created_at) > new Date(existingUser.created_at)) {
    // 如果当前订单更新，替换之前的订单
    const index = acc.findIndex(u => u.user_email === user.user_email);
    acc[index] = user;
  }
  return acc;
}, []);

console.log(`准备发送邮件给 ${uniqueUsers.length} 个用户:`);
uniqueUsers.forEach(user => {
  console.log(`- ${user.user_email} (订单: ${user.order_no})`);
});

async function sendEmail(user) {
  try {
    const result = await resend.emails.send({
      from: 'Veo3 AI Support <support@veo3ai.io>',
      to: user.user_email,
      subject: EMAIL_SUBJECT,
      text: EMAIL_CONTENT
    });

    console.log(`✅ 邮件发送成功: ${user.user_email} (${result.id})`);

    // 记录发送成功到数据库
    await supabase
      .from('email_campaigns')
      .insert({
        user_uuid: user.user_uuid,
        user_email: user.user_email,
        order_no: user.order_no,
        campaign_type: 'unpaid_order_reminder',
        email_subject: EMAIL_SUBJECT,
        email_content: EMAIL_CONTENT,
        resend_message_id: result.id,
        status: 'sent'
      });

    return { success: true, messageId: result.id };
  } catch (error) {
    console.error(`❌ 邮件发送失败: ${user.user_email}`, error);
    
    // 记录发送失败到数据库
    await supabase
      .from('email_campaigns')
      .insert({
        user_uuid: user.user_uuid,
        user_email: user.user_email,
        order_no: user.order_no,
        campaign_type: 'unpaid_order_reminder',
        email_subject: EMAIL_SUBJECT,
        email_content: EMAIL_CONTENT,
        status: 'failed'
      });

    return { success: false, error: error.message };
  }
}

async function sendAllEmails() {
  if (uniqueUsers.length === 0) {
    console.log('没有需要发送邮件的用户');
    return;
  }

  console.log('开始发送邮件...\n');
  
  let successCount = 0;
  let failureCount = 0;
  
  for (const user of uniqueUsers) {
    const result = await sendEmail(user);
    if (result.success) {
      successCount++;
    } else {
      failureCount++;
    }
    
    // 添加延迟避免API限制
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n发送完成!');
  console.log(`成功: ${successCount}, 失败: ${failureCount}`);
}

// 如果直接运行脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  sendAllEmails().catch(console.error);
}

export { sendAllEmails, uniqueUsers };