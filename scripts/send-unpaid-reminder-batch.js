#!/usr/bin/env node

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
  console.error('❌ Missing required environment variables');
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

/**
 * 自动发送未付费订单提醒邮件
 * @param {string} startDate - 开始日期 (YYYY-MM-DD)
 * @param {string} endDate - 结束日期 (YYYY-MM-DD)
 */
async function sendUnpaidOrderReminders(startDate, endDate) {
  console.log(`🔍 查询 ${startDate} 到 ${endDate} 期间的未付费订单...`);
  
  try {
    // 1. 查询未付费订单
    const { data: unpaidOrders, error: ordersError } = await supabase
      .from('orders')
      .select('order_no, user_email, user_uuid, created_at, amount, credits, status')
      .gte('created_at', `${startDate} 00:00:00+00`)
      .lte('created_at', `${endDate} 23:59:59+00`)
      .in('status', ['pending', 'expired', 'created'])
      .is('paid_at', null)
      .not('user_email', 'is', null)
      .neq('user_email', '')
      .order('created_at', { ascending: false });

    if (ordersError) throw ordersError;
    
    console.log(`📋 找到 ${unpaidOrders.length} 个未付费订单`);

    // 2. 查询已有支付订单的用户
    const userEmails = [...new Set(unpaidOrders.map(order => order.user_email))];
    const { data: paidUsers, error: paidError } = await supabase
      .from('orders')
      .select('user_email')
      .in('user_email', userEmails)
      .not('paid_at', 'is', null);

    if (paidError) throw paidError;
    
    const usersWithPayments = new Set(paidUsers.map(user => user.user_email));
    console.log(`💳 排除 ${usersWithPayments.size} 个已有支付记录的用户`);

    // 3. 查询已发送过邮件的用户
    const { data: emailedUsers, error: emailError } = await supabase
      .from('email_campaigns')
      .select('user_email')
      .eq('campaign_type', 'unpaid_order_reminder')
      .in('user_email', userEmails);

    if (emailError) throw emailError;
    
    const usersAlreadyEmailed = new Set(emailedUsers.map(user => user.user_email));
    console.log(`📧 排除 ${usersAlreadyEmailed.size} 个已发送过邮件的用户`);

    // 4. 过滤用户
    const filteredOrders = unpaidOrders.filter(order => 
      !usersWithPayments.has(order.user_email) && 
      !usersAlreadyEmailed.has(order.user_email)
    );

    // 5. 去重同一邮箱的多个订单，只保留最新的订单
    const uniqueUsers = filteredOrders.reduce((acc, order) => {
      const existingUser = acc.find(u => u.user_email === order.user_email);
      if (!existingUser) {
        acc.push(order);
      } else if (new Date(order.created_at) > new Date(existingUser.created_at)) {
        const index = acc.findIndex(u => u.user_email === order.user_email);
        acc[index] = order;
      }
      return acc;
    }, []);

    console.log(`\n📬 准备发送邮件给 ${uniqueUsers.length} 个用户:`);
    uniqueUsers.forEach(user => {
      console.log(`  - ${user.user_email} (订单: ${user.order_no})`);
    });

    if (uniqueUsers.length === 0) {
      console.log('✨ 没有需要发送邮件的用户');
      return;
    }

    console.log('\n🚀 开始发送邮件...');
    
    let successCount = 0;
    let failureCount = 0;
    
    for (const user of uniqueUsers) {
      try {
        const result = await resend.emails.send({
          from: 'Veo3 AI Support <support@veo3ai.io>',
          to: user.user_email,
          subject: EMAIL_SUBJECT,
          text: EMAIL_CONTENT
        });

        console.log(`  ✅ ${user.user_email} (${result.id || 'sent'})`);

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

        successCount++;
      } catch (error) {
        console.error(`  ❌ ${user.user_email}: ${error.message}`);
        
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

        failureCount++;
      }
      
      // 添加延迟避免API限制
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n🎉 发送完成!');
    console.log(`✅ 成功: ${successCount}, ❌ 失败: ${failureCount}`);
    
  } catch (error) {
    console.error('❌ 执行过程中出现错误:', error);
    process.exit(1);
  }
}

// 命令行参数处理
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log(`
📧 Veo3 AI 未付费订单提醒邮件发送工具

用法:
  node scripts/send-unpaid-reminder-batch.js <开始日期> <结束日期>

示例:
  node scripts/send-unpaid-reminder-batch.js 2025-06-11 2025-06-13
  node scripts/send-unpaid-reminder-batch.js 2025-06-12 2025-06-12

功能:
  - 自动查询指定时间段的未付费订单
  - 排除已有支付记录的用户
  - 排除已发送过邮件的用户
  - 发送俄语关怀邮件
  - 记录发送状态到数据库
`);
  process.exit(1);
}

const [startDate, endDate] = args;

// 验证日期格式
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
  console.error('❌ 日期格式错误，请使用 YYYY-MM-DD 格式');
  process.exit(1);
}

// 执行
sendUnpaidOrderReminders(startDate, endDate).catch(console.error);