#!/usr/bin/env node

/**
 * 解析 SQL 补偿脚本并生成收件人 CSV 文件
 * 
 * 此脚本从 compensate_credits.sql 文件中提取用户信息，
 * 并生成包含 user_uuid, nickname, email, credits, is_member 的 CSV 文件
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 文件路径
const sqlFilePath = path.join(__dirname, '../credits/compensate_credits.sql');
const outputCsvPath = path.join(__dirname, 'data/recipients.csv');

// 读取 SQL 文件
console.log(`正在读取 SQL 文件: ${sqlFilePath}`);
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// 使用更精确的方式提取用户信息
// 先按行分割 SQL 文件
const sqlLines = sqlContent.split('\n');
const users = [];

// 遍历每一行，查找注释行和对应的 VALUES 行
for (let i = 0; i < sqlLines.length - 2; i++) {
  const line = sqlLines[i];
  
  // 查找注释行，格式: -- 为用户 nickname (email) 增加 X 积分
  if (line.startsWith('-- 为用户')) {
    // 提取用户信息
    const commentMatch = line.match(/-- 为用户 (.*) 增加 (\d+) 积分/);
    if (!commentMatch) continue;
    
    // 提取用户全名和积分
    const fullNamePart = commentMatch[1]; // 包含昵称和邮箱的完整部分
    const credits = commentMatch[2];
    
    // 从全名部分提取邮箱（最后一对括号内的内容）
    const emailMatch = fullNamePart.match(/\(([^()]+)\)$/);
    if (!emailMatch) continue;
    
    const email = emailMatch[1];
    
    // 提取昵称（去掉最后的邮箱部分）
    let nickname = fullNamePart.substring(0, fullNamePart.lastIndexOf('(')).trim();
    
    // 查找对应的 VALUES 行，提取 user_uuid
    // 通常在注释行后的第二行
    const valuesLine = sqlLines[i + 2];
    const uuidMatch = valuesLine.match(/VALUES \('.*?', '.*?', '(.*?)'/);
    if (!uuidMatch) continue;
    
    const userUuid = uuidMatch[1];
    
    // 所有用户都是非会员，因为会员不需要补偿
    const isMember = '否';
    
    users.push({
      user_uuid: userUuid,
      nickname,
      email,
      credits,
      is_member: isMember
    });
  }
}

console.log(`共提取到 ${users.length} 个用户信息`);

// 生成 CSV 内容
const csvHeader = 'user_uuid,nickname,email,credits,is_member';
const csvRows = users.map(user => 
  `${user.user_uuid},${user.nickname},${user.email},${user.credits},${user.is_member}`
);
const csvContent = [csvHeader, ...csvRows].join('\n');

// 写入 CSV 文件
fs.writeFileSync(outputCsvPath, csvContent, 'utf8');
console.log(`已成功生成 CSV 文件: ${outputCsvPath}`);
