/**
 * 测试邮箱认证的各种场景
 * 这个文件仅用于开发时测试，不应该在生产环境中使用
 */

export interface AuthTestScenario {
  name: string;
  description: string;
  action: "login" | "signup";
  email: string;
  password: string;
  expectedResult: "success" | "error";
  expectedErrorType?: string;
  expectedMessage?: string;
}

export const authTestScenarios: AuthTestScenario[] = [
  // 注册场景
  {
    name: "new_user_signup",
    description: "新用户首次注册",
    action: "signup",
    email: "newuser@example.com",
    password: "password123",
    expectedResult: "success",
    expectedMessage: "Account created successfully",
  },
  {
    name: "duplicate_confirmed_user_signup",
    description: "已确认邮箱的用户重复注册",
    action: "signup",
    email: "confirmed@example.com",
    password: "password123",
    expectedResult: "error",
    expectedErrorType: "already_registered",
    expectedMessage: "This email address is already registered",
  },
  {
    name: "duplicate_unconfirmed_user_signup",
    description: "未确认邮箱的用户重复注册",
    action: "signup",
    email: "unconfirmed@example.com",
    password: "password123",
    expectedResult: "error",
    expectedErrorType: "already_registered",
    expectedMessage: "This email address is already registered",
  },
  {
    name: "invalid_email_signup",
    description: "无效邮箱格式注册",
    action: "signup",
    email: "invalid-email",
    password: "password123",
    expectedResult: "error",
    expectedErrorType: "invalid_email",
    expectedMessage: "Invalid email address",
  },
  {
    name: "weak_password_signup",
    description: "弱密码注册",
    action: "signup",
    email: "weakpass@example.com",
    password: "123",
    expectedResult: "error",
    expectedErrorType: "weak_password",
    expectedMessage: "Password must be at least 6 characters",
  },

  // 登录场景
  {
    name: "valid_user_login",
    description: "已验证用户正常登录",
    action: "login",
    email: "confirmed@example.com",
    password: "correctpassword",
    expectedResult: "success",
  },
  {
    name: "unverified_user_login",
    description: "未验证用户尝试登录",
    action: "login",
    email: "unconfirmed@example.com",
    password: "correctpassword",
    expectedResult: "error",
    expectedErrorType: "email_not_confirmed",
    expectedMessage: "Please check your email and click the verification link",
  },
  {
    name: "wrong_password_login",
    description: "正确邮箱错误密码登录",
    action: "login",
    email: "confirmed@example.com",
    password: "wrongpassword",
    expectedResult: "error",
    expectedErrorType: "invalid_password",
    expectedMessage: "Invalid password",
  },
  {
    name: "nonexistent_user_login",
    description: "不存在的用户登录",
    action: "login",
    email: "nonexistent@example.com",
    password: "password123",
    expectedResult: "error",
    expectedErrorType: "user_not_found",
    expectedMessage: "No account found with this email address",
  },
];

/**
 * 验证认证结果是否符合预期
 */
export function validateAuthResult(
  scenario: AuthTestScenario,
  actualResult: { success: boolean; error?: string; message?: string }
): { passed: boolean; details: string } {
  const { expectedResult, expectedErrorType, expectedMessage } = scenario;

  if (expectedResult === "success") {
    if (actualResult.success) {
      return { passed: true, details: "✅ 成功场景通过" };
    } else {
      return {
        passed: false,
        details: `❌ 期望成功但失败了: ${actualResult.error}`,
      };
    }
  } else {
    if (!actualResult.success && actualResult.error) {
      if (expectedMessage && actualResult.error.includes(expectedMessage)) {
        return { passed: true, details: "✅ 错误信息匹配" };
      } else {
        return {
          passed: false,
          details: `❌ 错误信息不匹配\n期望包含: ${expectedMessage}\n实际: ${actualResult.error}`,
        };
      }
    } else {
      return {
        passed: false,
        details: `❌ 期望失败但成功了`,
      };
    }
  }
}

/**
 * 运行所有测试场景
 */
export async function runAuthTests(): Promise<void> {
  console.log("🧪 开始运行邮箱认证测试场景...\n");

  for (const scenario of authTestScenarios) {
    console.log(`\n📋 测试场景: ${scenario.name}`);
    console.log(`📝 描述: ${scenario.description}`);
    console.log(`🔧 操作: ${scenario.action === "login" ? "登录" : "注册"}`);
    console.log(`📧 邮箱: ${scenario.email}`);
    console.log(`🔒 密码: ${scenario.password}`);
    console.log(
      `🎯 期望结果: ${scenario.expectedResult === "success" ? "成功" : "失败"}`
    );

    if (scenario.expectedMessage) {
      console.log(`💬 期望信息包含: ${scenario.expectedMessage}`);
    }

    console.log("\n⚠️  请手动在浏览器中测试此场景，然后记录结果");
    console.log("---");
  }

  console.log("\n✅ 测试场景列表完成！请逐一在UI中测试并验证结果。");
}
