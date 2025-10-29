import { NextRequest } from "next/server";
import { respJson, respErr } from "@/lib/resp";
import { signUpWithEmail } from "@/services/supabase-auth";
import { yandexTracking } from "@/services/analytics/yandex-tracking";
import { getClientIp, checkIPRegistrationLimit, updateIPRegistrationCount } from "@/lib/ip";
import { z } from "zod";

// 验证Cloudflare Turnstile CAPTCHA
async function verifyCaptcha(token: string, clientIP: string): Promise<boolean> {
  if (!process.env.TURNSTILE_SECRET_KEY) {
    console.warn("TURNSTILE_SECRET_KEY not configured, skipping CAPTCHA verification");
    return true; // 如果没配置密钥，跳过验证
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: clientIP,
      }),
    });

    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('CAPTCHA verification error:', error);
    return false;
  }
}

// 攻击邮箱域名黑名单（屏蔽已知临时邮箱服务）
const BLOCKED_EMAIL_DOMAINS = [
  // 主要攻击域名
  'drmail.in',      // 主要攻击域名 (4407个账号)
  'mriscan.live',   // 攻击域名 (9个账号)
  'powerscrews.com', // 攻击域名 (2个账号)
  // 新发现的攻击域名
  'moakt.ws',       // 临时邮箱服务 (5个账号)
  'moakt.cc',       // 临时邮箱服务 (5个账号)
  'moakt.co',       // 临时邮箱服务 (3个账号)
  'bareed.ws',      // 临时邮箱服务 (7个账号)
  'tmails.net',     // 临时邮箱服务 (3个账号)
  'teml.net',       // 临时邮箱服务 (2个账号)
  'disbox.org',     // 临时邮箱服务 (3个账号)
  'tmpbox.net',     // 临时邮箱服务
  'tmpmail.net',    // 临时邮箱服务
  'tmpmail.org',    // 临时邮箱服务
  'mailshan.com',   // 临时邮箱服务 (11个账号)
  'aminating.com',  // 临时邮箱服务 (13个账号)
  'noidem.com',     // 临时邮箱服务 (15个账号)
  'skateru.com',    // 临时邮箱服务 (12个账号)
  'tmail.ws',       // 临时邮箱服务
  'tmpeml.com',     // 临时邮箱服务
  // 2025-09-27 紧急封锁 - 大规模攻击域名
  'qqveo.online',   // 针对veo3的钓鱼域名 (3个账号)
  'ablyd.com',      // 207个虚假账号，197个视频
  'pzejw.com',      // 194个虚假账号，183个视频
  'wbmta.com',      // 182个虚假账号，180个视频
  'atomicmail.io',  // 102个虚假账号，91个视频
  'atminmail.com',  // 113个虚假账号，106个视频
  'tiffincrane.com',// 99个虚假账号，98个视频
  'allfreemail.net',// 66个虚假账号，67个视频
  'usiver.com',     // 8个虚假账号
  'tlexes.com',     // 6个虚假账号
  'hiepth.com',     // 7个虚假账号
  'etenx.com',      // 7个虚假账号
  'bitmens.com',    // 4个虚假账号
  'rograc.com',     // 14个虚假账号
  '10minmail.pro',  // 临时邮箱服务 (8个账号)
  '10minutes.email',// 临时邮箱服务 (22个账号)
  'gddcorp.com',    // 8个虚假账号
  'concu.net',      // 临时邮箱服务
  'heheee.com',     // 临时邮箱服务
  'mailba.uk',      // 临时邮箱服务
  'onmailflare.com',// 临时邮箱服务
  'tiksofi.uk',     // 临时邮箱服务
  'priyo.ovh',      // 临时邮箱服务
  'forexnews.bg',   // 临时邮箱服务
  'forexzig.com',   // 临时邮箱服务
  'ro.ru',          // 临时邮箱服务
  // 2025-10-16 新增 - 最近7天批量注册攻击域名（安全审计发现）
  'webxios.pro',       // 136个账户，65个IP（大规模分布式攻击）
  'yopmail.com',       // 59个账户（知名临时邮箱，无需密码）
  'quiet-branch.com',  // 61个账户
  'radiant-flow.org',  // 47个账户
  'uiemail.com',       // 41个账户
  'wtwtt.com',         // 25个账户
  'lorkex.com',        // 28个账户
  'fanlvr.com',        // 30个账户
  'gamegta.com',       // 29个账户（游戏主题临时邮箱）
  'gta5hx.com',        // 21个账户（游戏主题临时邮箱）
  'djkux.com',         // 23个账户
  'no.vsmailpro.com',  // 25个账户（VSMailPro临时邮箱）
  'suvvs.com',         // 16个账户
  'bbcvt.com',         // 14个账户
  'koletter.com',      // 22个账户
  'jstmail.com',       // 11个账户
  'f1t.online',        // 11个账户
  'arqsis.com',        // 14个账户
  'fontfee.com',       // 20个账户
  'capiena.com',       // 17个账户
  'opemails.com',      // 17个账户
  'bdnets.com',        // 9个账户
  'trashlify.com',     // 14个账户（明确的"垃圾邮箱"服务）
  '0ut.online',        // 18个账户
  're146.dev',         // 12个账户（4个IP，集中式滥用）
  'necub.com',         // 11个账户
  'easymailer.live',   // 11个账户（2个IP，高度集中滥用）
  'audince.com',       // 12个账户
  'moonfee.com',       // 10个账户
  'sharklasers.com',   // 8个账户
  'dunefee.com',       // 5个账户
  'picoaxis.com',      // 8个账户
  'faraby.net',        // 8个账户
  'priyo-mail.com',    // 3个账户
  'priyomail.in',      // 1个账户
  'priyomail.net',     // 1个账户
  'nrehi.com',         // 4个账户
  'usm.ovh',           // 2个账户
  'mailp.org',         // 2个账户
  'omailo.top',        // 1个账户
  'xenta.cfd',         // 1个账户
  'scopevps.com',      // 2个账户
  'basefast.net',      // 1个账户
  'hivespark.net',     // 2个账户
  'tempzulu.com',      // 3个账户
  'orbitfast.net',     // 4个账户
  'vectorsonata.com',  // 2个账户（企业域名伪装）
  'chaossonata.com',   // 1个账户
  'spaceeclipse.com',  // 5个账户
  'hubbeta.org',       // 3个账户
  'orbitcomet.org',    // 2个账户
  'sourcesigma.net',   // 3个账户（企业域名伪装）
  'briefinnovation.com', // 2个账户
  'primepixel.org',    // 2个账户
  'scalarnova.org',    // 6个账户（企业域名伪装）
  'spaceblink.net',    // 2个账户
  'pidelta.net',       // 1个账户
  'vaultcortex.com',   // 5个账户
  'pispectrum.org',    // 2个账户
  'portalforge.org',   // 1个账户
  'asyncpioneer.com',  // 1个账户
  'autorambler.ru',    // 6个账户
  // 2025-10-25 反欺诈分析新增 - 最近7天批量注册攻击域名
  'byom.de',           // 41个账号，20个IP（2.05账号/IP）
  'inbox.eu',          // 35个账号，9个IP（3.89账号/IP，最高异常比率）
  'school.vin',        // 208个账号，可疑教育邮箱域名
  'dunkos.xyz',        // 94个账号，临时邮箱服务
  '10mail.xyz',        // 19个账号，知名临时邮箱
  'dropmail.me',       // 临时邮箱服务
  'emltmp.com',        // 临时邮箱服务
  'spymail.one',       // 临时邮箱服务
  'mailpwr.com',       // 临时邮箱服务
  'femailtor.com',     // 临时邮箱服务（出现在dot-trick案例中）
  // 2025-10-29 新增 - 数据分析确认的薅羊毛域名（安全审计发现）
  'inwagit.com',       // 62账号，0付费，98%积分耗尽，100%激活率
  'raligaan.com',      // 54账号，0付费，96%积分耗尽，98%激活率
  'cherobe.com',       // 51账号，0付费，100%积分耗尽，100%激活率
  'keevle.com',        // 44账号，0付费，91%积分耗尽，95%激活率
  'haotuwu.com',       // 41账号，0付费，71%积分耗尽，98%激活率
  'lovleo.com',        // 40账号，0付费，78%积分耗尽，98%激活率
];

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().optional(),
  captchaToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 验证请求数据
    const validation = signupSchema.safeParse(body);
    if (!validation.success) {
      return respErr(validation.error.errors[0].message);
    }

    const { email, password, name, captchaToken } = validation.data;

    // 检查1：屏蔽已知攻击邮箱域名
    const emailDomain = email.split('@')[1]?.toLowerCase();
    if (BLOCKED_EMAIL_DOMAINS.includes(emailDomain)) {
      console.warn(`Registration blocked for attack domain: ${emailDomain}`);
      return respErr("This email provider is not supported");
    }

    // 检查1.5：检测可疑邮箱模式（随机字符串用户名）
    const emailUsername = email.split('@')[0]?.toLowerCase();
    // 检测模式：名字+数字+随机字符（如 justin2sfsd, aarond2ffsfs）
    const suspiciousPattern = /^[a-z]+\d+[a-z]{4,}$/;
    // 检测纯随机字符串（如 wrmhd04491, nlhhd84138）
    const randomPattern = /^[a-z]{5}\d{5}$/;

    if (suspiciousPattern.test(emailUsername) || randomPattern.test(emailUsername)) {
      console.warn(`Suspicious email pattern detected: ${email}`);
      // 对可疑邮箱要求更严格的CAPTCHA验证
      if (!captchaToken) {
        return respErr("CAPTCHA verification is required for this email pattern.");
      }
    }

    // 检查2：IP注册限制
    const clientIP = await getClientIp();
    const ipCheck = await checkIPRegistrationLimit(clientIP);
    if (!ipCheck.allowed) {
      console.warn(`Registration blocked for IP: ${clientIP}, reason: ${ipCheck.reason}`);
      return respErr("Too many registrations from this network. Please try again later.");
    }

    // 检查3：CAPTCHA验证（仅在配置了Turnstile时）
    if (process.env.TURNSTILE_SECRET_KEY && captchaToken) {
      const captchaValid = await verifyCaptcha(captchaToken, clientIP);
      if (!captchaValid) {
        console.warn(`CAPTCHA verification failed for IP: ${clientIP}`);
        return respErr("CAPTCHA verification failed. Please try again.");
      }
    } else if (process.env.TURNSTILE_SECRET_KEY && !captchaToken) {
      return respErr("CAPTCHA verification is required.");
    }

    // 调用Supabase注册
    const result = await signUpWithEmail(email, password, name);

    if (!result.user) {
      return respErr("Registration failed");
    }

    // 注册成功后更新IP计数
    try {
      await updateIPRegistrationCount(clientIP);
    } catch (error) {
      console.error("Failed to update IP registration count:", error);
      // IP计数失败不影响注册流程
    }

    // 检查是否需要邮箱验证
    if (!result.user.email_confirmed_at) {
      return respJson(
        0,
        "Account created successfully! We've sent a verification email to your inbox. Please check your email and click the verification link to activate your account.",
        {
          requiresVerification: true,
          user: {
            id: result.user.id,
            email: result.user.email,
          },
        }
      );
    }

    return respJson(0, "Registration successful", {
      requiresVerification: false,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.user_metadata?.name,
      },
    });
  } catch (error: any) {
    // 错误已在Service层记录，API层只处理响应
    // 仅对未预期的错误记录日志
    
    // 根据官方错误代码进行处理
    if (error.code) {
      switch (error.code) {
        case "email_exists":
        case "user_already_exists":
          return respErr(
            "This email address is already registered. Please try signing in instead."
          );
        case "phone_exists":
          return respErr(
            "This phone number is already registered. Please try signing in instead."
          );
        case "email_address_invalid":
        case "validation_failed":
          return respErr("Please enter a valid email address.");
        case "weak_password":
          return respErr(
            "Password is too weak. Please choose a stronger password."
          );
        case "signup_disabled":
          return respErr("New account creation is currently disabled.");
        case "email_provider_disabled":
          return respErr("Email registration is currently disabled.");
        case "phone_provider_disabled":
          return respErr("Phone registration is currently disabled.");
        case "over_request_rate_limit":
        case "too_many_requests":
        case "over_email_send_rate_limit":
          return new Response(
            JSON.stringify({
              error: 1,
              msg: "Too many attempts. Please wait a moment and try again."
            }),
            { 
              status: 429,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        case "email_address_not_authorized":
          return respErr(
            "This email address is not authorized for registration. Please contact support."
          );
        case "captcha_failed":
          return respErr("Captcha verification failed. Please try again.");
        case "unexpected_failure":
        case "internal_error":
          return respErr(
            "An unexpected error occurred. Please try again later."
          );
        default:
          return respErr(
            error.message || "Unable to create account. Please try again."
          );
      }
    }

    // 如果没有error.code，则回退到消息检测（兼容旧版本）
    if (
      error.message?.includes("User already registered") ||
      error.message?.includes("already been registered") ||
      error.message?.includes("email address is already taken") ||
      error.message?.includes(
        "A user with this email address has already been registered"
      ) ||
      error.message?.includes("email address already exists") ||
      error.message?.includes("email_exists") ||
      error.message?.includes("user_already_exists") ||
      error.message?.includes("duplicate") ||
      error.status === 409 ||
      error.code === "23505"
    ) {
      // PostgreSQL unique constraint violation
      return respErr(
        "This email address is already registered. Please try signing in instead."
      );
    }

    if (
      error.message?.includes("invalid email") ||
      error.message?.includes("Invalid email")
    ) {
      return respErr("Please enter a valid email address.");
    }

    if (
      error.message?.includes("weak password") ||
      error.message?.includes("Password should")
    ) {
      return respErr(
        "Password is too weak. Please choose a stronger password."
      );
    }

    if (
      error.message?.includes("rate limit") ||
      error.message?.includes("too many")
    ) {
      return new Response(
        JSON.stringify({
          error: 1,
          msg: "Too many attempts. Please wait a moment and try again."
        }),
        { 
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 提供通用的友好错误消息
    return respErr(
      error.message || "Unable to create account. Please try again."
    );
  }
}
