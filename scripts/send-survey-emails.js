import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { emailTemplate } from './user-survey-email-templates.js';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import { parse } from 'csv-parse/sync';

// 加载环境变量
dotenv.config({ path: '.env.local' });

// 初始化 Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// 从CSV文件获取用户列表
async function getUsersFromCSV(csvPath) {
  try {
    const csvContent = await fs.readFile(csvPath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    // 过滤出有效的邮箱
    return records
      .filter(record => record.email && record.email.includes('@'))
      .map(record => ({
        email: record.email,
        nickname: record.nickname || '',
        created_at: record.created_at
      }));
  } catch (error) {
    console.error('Error reading CSV file:', error);
    throw error;
  }
}

// 发送单封邮件
async function sendEmail(to, template) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Veo3 Team <support@veo3ai.io>',
      to: [to],
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error(`Failed to send to ${to}:`, error);
      return { success: false, email: to, error };
    }

    console.log(`Email sent successfully to ${to}`);
    return { success: true, email: to, data };
  } catch (error) {
    console.error(`Error sending to ${to}:`, error);
    return { success: false, email: to, error };
  }
}

// 批量发送邮件（带延迟避免速率限制）
async function sendBatchEmails(users, testMode = false) {
  const results = {
    sent: [],
    failed: [],
    total: users.length
  };

  console.log(`Starting to send emails to ${users.length} users...`);

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const email = user.email;
    
    console.log(`[${i + 1}/${users.length}] Sending to ${email}...`);
    
    const result = await sendEmail(email, emailTemplate);
    
    if (result.success) {
      results.sent.push(result);
    } else {
      results.failed.push(result);
    }
    
    // 每10封邮件等待1秒，避免速率限制
    if ((i + 1) % 10 === 0 && i < users.length - 1) {
      console.log('Waiting 1 second to avoid rate limits...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const isTest = args.includes('--test');
  const testEmail = args.includes('--email') ? args[args.indexOf('--email') + 1] : 'hugeroger@gmail.com';
  const csvFile = args.includes('--csv') ? args[args.indexOf('--csv') + 1] : null;

  try {
    if (isTest) {
      // 测试模式：只发送给指定邮箱
      console.log(`\n=== TEST MODE ===`);
      console.log(`Sending test email to: ${testEmail}\n`);
      
      // 发送测试邮件
      console.log('Sending survey email...');
      const result = await sendEmail(testEmail, emailTemplate);
      
      console.log('\nTest emails sent! Please check your inbox.');
    } else {
      // 生产模式：发送给用户
      console.log(`\n=== PRODUCTION MODE ===`);
      
      let users;
      if (csvFile) {
        console.log(`Reading users from CSV file: ${csvFile}\n`);
        users = await getUsersFromCSV(csvFile);
        console.log(`Found ${users.length} users in CSV file.\n`);
      } 
      
      console.log(`Total users to email: ${users.length}`);
      
      // 确认发送
      console.log('⚠️  WARNING: This will send emails to ALL users!');
      console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // 保存发送记录（可选）
      const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
      const logFile = `email-send-log-${timestamp}.txt`;
      console.log(`Logging results to: ${logFile}\n`);
      
      // 批量发送
      const results = await sendBatchEmails(users);
      
      // 显示结果
      console.log('\n=== RESULTS ===');
      console.log(`Total users: ${results.total}`);
      console.log(`Successfully sent: ${results.sent.length}`);
      console.log(`Failed: ${results.failed.length}`);
      
      if (results.failed.length > 0) {
        console.log('\nFailed emails:');
        results.failed.forEach(f => {
          console.log(`- ${f.email}: ${f.error.message || 'Unknown error'}`);
        });
      }
      
      // 保存日志
      const logContent = `
Email Send Log - ${new Date().toISOString()}
=======================================
Total users: ${results.total}
Successfully sent: ${results.sent.length}
Failed: ${results.failed.length}

Failed emails:
${results.failed.map(f => `- ${f.email}: ${f.error.message || 'Unknown error'}`).join('\n')}

Successful emails:
${results.sent.map(s => `- ${s.email}`).join('\n')}
`;
      
      await fs.writeFile(logFile, logContent, 'utf-8');
      console.log(`\nLog saved to: ${logFile}`);
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// 运行脚本
main();