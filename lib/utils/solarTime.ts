import { DateTime } from 'luxon';

export function calculateTrueSolarTime(
  localDateTime: string,  // ISO string
  timezone: string,
  longitude: number
): Date {
  // 1. 转换为用户时区的时间
  const userDateTime = DateTime.fromISO(localDateTime, { zone: timezone });
  
  // 2. 计算均时差（单位：分钟）
  const eot = calculateEOT(userDateTime.toJSDate());
  // console.log('均时差 (EOT):', eot.toFixed(2), '分钟');
  
  // 3. 计算经度修正
  // 获取时区小时数（去掉 Etc/GMT 前缀，保留符号）
  const timezoneHour = parseInt(timezone.replace('Etc/GMT', ''));
  // 计算标准子午线经度（每个时区以15度为基准）
  const standardMeridian = timezoneHour * -15; // 注意：Etc/GMT 的符号与经度相反
  // console.log('标准子午线经度:', standardMeridian, '度');
  // console.log('实际地点经度:', longitude, '度');
  
  // 经度修正（每经度1度相当于4分钟时差）
  // 如果当地经度在标准子午线以东（更大的数），太阳更早到达，时间应该减慢（负修正）
  // 如果当地经度在标准子午线以西（更小的数），太阳更晚到达，时间应该加快（正修正）
  const longitudeCorrection = 4 * (longitude - standardMeridian);
  // console.log('经度修正:', longitudeCorrection.toFixed(2), '分钟');
  
  // 4. 计算总修正值（分钟）
  const totalCorrection = eot + longitudeCorrection;
  // console.log('总修正值:', totalCorrection.toFixed(2), '分钟');
  
  // 5. 应用修正并返回 UTC 时间
  return userDateTime
    .plus({ minutes: totalCorrection })
    .toUTC()
    .toJSDate();
}

function calculateEOT(date: Date): number {
  // 1. 计算N（一年中的第几天）
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - startOfYear.getTime();
  const N = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1; // 加1是因为1月1日是第1天

  // 2. 计算B（地球在公转轨道上的位置，角度）
  const B = (360 / 365) * (N - 81);
  const Brad = B * Math.PI / 180; // 转换为弧度

  // 3. 计算时差方程 E（分钟）
  const E = 9.87 * Math.sin(2 * Brad) - 7.53 * Math.cos(Brad) - 1.5 * Math.sin(Brad);

  return E;
}