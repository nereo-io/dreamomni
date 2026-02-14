import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 测试配置
 * 文档: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',

  // 全局 setup: 登录一次，保存 session
  globalSetup: './tests/e2e/global-setup.ts',

  // 超时配置
  timeout: 30 * 1000, // 每个测试 30 秒
  expect: {
    timeout: 5000, // 断言超时 5 秒
  },

  // 失败重试
  retries: process.env.CI ? 2 : 0,

  // 并发测试数量
  workers: process.env.CI ? 1 : 3,

  // Reporter 配置
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],

  use: {
    // 基础 URL
    baseURL: 'http://localhost:3000',

    // 使用保存的认证状态
    storageState: 'tests/e2e/.auth/user.json',

    // 截图和视频（仅失败时）
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // 追踪（仅失败时）
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // 开发服务器配置（可选，自动启动服务）
  // webServer: {
  //   command: 'pnpm dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
