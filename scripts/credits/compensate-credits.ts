import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// 定义与 credit.ts 中相同的常量对象
const CreditsTransType = {
  NewUser: "new_user",
  OrderPay: "order_pay",
  SystemAdd: "system_add",
  Ping: "ping",
  Chat: "chat",
  Invite: "invite",
  NonResponse: "non_response",
} as const;

// 定义用户会话数据接口
interface UnansweredSession {
  user_uuid: string;
  nickname: string;
  email: string;
  unanswered_sessions: string; // CSV 解析后是字符串，需要转换为数字
  is_member: string;
  session_ids: string;
  export_time: string;
}

// 测试模式标志
const TEST_MODE = true;

/**
 * 为未回复消息的用户增加积分
 * 1. 会员不发积分，非会员发积分
 * 2. 基于没有回答的次数发积分，1个没有回答问题等于1个积分
 * 3. 使用CreditsTransType.NonResponse类型
 */
async function compensateUnansweredCredits() {
  try {
    // 读取CSV文件
    const csvFilePath = path.resolve(process.cwd(), 'Supabase Unanswered User Sessions.csv');
    const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });
    
    // 解析CSV内容
    const records: UnansweredSession[] = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });
    
    console.log(`总共读取到 ${records.length} 条记录`);
    
    // 统计信息
    let totalUsers = 0;
    let totalCredits = 0;
    let membersSkipped = 0;
    
    // 生成SQL语句
    let sqlStatements: string[] = [];
    
    // 用于生成唯一trans_no的索引
    let recordIndex = 0;
    
    // 处理每个用户
    for (const record of records) {
      // 跳过会员用户
      if (record.is_member === '是') {
        console.log(`跳过会员用户: ${record.nickname} (${record.email})`);
        membersSkipped++;
        continue;
      }
      
      const creditsToAdd = parseInt(record.unanswered_sessions);
      if (isNaN(creditsToAdd) || creditsToAdd <= 0) {
        console.log(`跳过无效积分数: ${record.nickname}, 积分: ${record.unanswered_sessions}`);
        continue;
      }
      
      totalUsers++;
      totalCredits += creditsToAdd;
      
      // 生成SQL语句 - 确保唯一性
      const transNo = Date.now().toString() + Math.floor(Math.random() * 1000000).toString() + recordIndex.toString();
      const createdAt = new Date().toISOString();
      
      // 设置一个月的有效期
      const expiredDate = new Date();
      expiredDate.setMonth(expiredDate.getMonth() + 1);
      const expiredAt = expiredDate.toISOString();
      
      const sql = `
-- 为用户 ${record.nickname} (${record.email}) 增加 ${creditsToAdd} 积分
INSERT INTO credits (trans_no, created_at, user_uuid, trans_type, credits, order_no, expired_at)
VALUES ('${transNo}', '${createdAt}', '${record.user_uuid}', '${CreditsTransType.NonResponse}', ${creditsToAdd}, NULL, '${expiredAt}');
`;
      sqlStatements.push(sql);
      
      // 递增索引，确保trans_no唯一
      recordIndex++;
      
      console.log(`[测试] 将为用户 ${record.nickname} (${record.email}) 增加 ${creditsToAdd} 积分`);
    }
    
    // 将SQL语句写入文件
    const sqlFilePath = path.resolve(process.cwd(), 'scripts/compensate_credits.sql');
    fs.writeFileSync(sqlFilePath, sqlStatements.join('\n'), { encoding: 'utf-8' });
    
    // 打印统计信息
    console.log('\n--- 统计信息 ---');
    console.log(`总共处理用户数: ${records.length}`);
    console.log(`跳过的会员用户数: ${membersSkipped}`);
    console.log(`补偿的非会员用户数: ${totalUsers}`);
    console.log(`补偿的总积分数: ${totalCredits}`);
    console.log(`模式: ${TEST_MODE ? '测试模式 (未实际增加积分)' : '生产模式 (已实际增加积分)'}`);
    console.log(`SQL文件已生成: ${sqlFilePath}`);
    
    if (TEST_MODE) {
      console.log('\n要实际执行积分增加，请将生成的SQL文件导入到数据库中执行');
    }
    
  } catch (error) {
    console.error('处理未回复消息积分补偿时出错:', error);
  }
}

// 执行主函数
compensateUnansweredCredits()
  .then(() => {
    console.log('积分补偿处理完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('积分补偿处理失败:', error);
    process.exit(1);
  });
