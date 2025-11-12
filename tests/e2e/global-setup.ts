/**
 * Playwright Global Setup
 *
 * 用途: 手动登录一次，保存 session 供后续测试使用
 *
 * 支持两种登录方式:
 * 1. 邮箱登录 (自动化): 461453258@qq.com / 12341234
 * 2. Google 登录 (手动): hugeroger@gmail.com
 */

import { chromium, FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

async function globalSetup(config: FullConfig) {
  const storageStatePath = 'tests/e2e/.auth/user.json';

  // 检查是否已存在有效 session
  if (fs.existsSync(storageStatePath)) {
    console.log('✅ Found existing auth state, skipping login');
    console.log('💡 Tip: Delete tests/e2e/.auth/user.json to re-login');
    return;
  }

  console.log('\n🔐 Starting authentication setup...');
  console.log('📝 Attempting automated email login...\n');

  // 启动浏览器
  const browser = await chromium.launch({
    headless: true, // 无头模式，自动化登录
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 访问登录页面
    console.log('📄 Navigating to sign-in page...');
    await page.goto('http://localhost:3000/auth/signin', { timeout: 60000 });

    // 等待页面加载
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // 尝试邮箱登录
    console.log('🔑 Attempting email login...');

    // 先点击 "Continue with Email" 按钮
    const continueWithEmailButton = page.locator('button:has-text("Continue with Email")');
    if (await continueWithEmailButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await continueWithEmailButton.click();
      console.log('📧 Clicked "Continue with Email" button');
      await page.waitForTimeout(1000); // 等待表单展开
    }

    // 查找邮箱输入框（可能有多种选择器）
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

    if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      // 邮箱登录表单可见
      await emailInput.fill('461453258@qq.com');
      await passwordInput.fill('12341234');

      // 查找提交按钮
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Log In")').first();
      await submitButton.click();

      console.log('⏳ Waiting for authentication...');

      // 等待登录成功（导航到非登录页面）
      await page.waitForURL(url => {
        return !url.pathname.includes('/auth/signin') &&
               !url.pathname.includes('/sign-up');
      }, { timeout: 30000 });

      console.log('✅ Email login successful!');
    } else {
      // 邮箱登录不可用，提示手动 Google 登录
      console.log('\n⚠️  Email login not available');
      console.log('📝 Please manually log in with Google (hugeroger@gmail.com)\n');

      // 切换到有界面模式
      await browser.close();
      const browserHeaded = await chromium.launch({ headless: false, slowMo: 1000 });
      const contextHeaded = await browserHeaded.newContext();
      const pageHeaded = await contextHeaded.newPage();

      await pageHeaded.goto('http://localhost:3000/auth/signin');
      console.log('👉 Click "Continue with Google" button');
      console.log('👉 Log in with hugeroger@gmail.com');
      console.log('👉 Wait for redirect to home page\n');

      await pageHeaded.waitForURL(url => {
        return !url.pathname.includes('/auth/signin') &&
               !url.pathname.includes('/sign-up');
      }, { timeout: 120000 });

      console.log('✅ Google login successful!');

      // 保存 session
      const authDir = path.dirname(storageStatePath);
      if (!fs.existsSync(authDir)) {
        fs.mkdirSync(authDir, { recursive: true });
      }
      await contextHeaded.storageState({ path: storageStatePath });
      await browserHeaded.close();
      return;
    }

    // 保存认证状态（邮箱登录）
    const authDir = path.dirname(storageStatePath);
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    await context.storageState({ path: storageStatePath });
    console.log(`✅ Auth state saved to: ${storageStatePath}`);
    console.log('\n🎉 Setup complete! You can now run tests without re-login.\n');

  } catch (error) {
    console.error('\n❌ Authentication failed:', error);
    console.log('\n💡 Tip: Make sure Next.js is running on http://localhost:3000');
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
