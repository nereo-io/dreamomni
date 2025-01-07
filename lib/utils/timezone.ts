import { DateTime } from 'luxon';

export function getTimezoneFromLocation(longitude: number, latitude: number): string {
  // 使用经度计算时区
  // 注意：Etc/GMT 的符号规则与直觉相反
  // 东经用 GMT-，西经用 GMT+
  // 参考：https://en.wikipedia.org/wiki/Tz_database#Area
  const timezoneHour = Math.round(longitude / 15);
//   return `Etc/GMT${timezoneHour >= 0 ? '-' : '+'}${Math.abs(timezoneHour)}`;
  return 'Etc/GMT-8';
}

export function convertToLocalTime(
  utcTime: Date,
  timezone: string
): DateTime {
  return DateTime.fromJSDate(utcTime).setZone(timezone);
}

export function convertToUTC(
  localTime: string,  // ISO string
  timezone: string
): Date {
  return DateTime.fromISO(localTime, { zone: timezone }).toUTC().toJSDate();
}
