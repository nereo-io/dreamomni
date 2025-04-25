# Email Sending Script

这个脚本使用 Resend API 向收件人列表发送个性化邮件。

## 前提条件

- 安装 Node.js
- 在 `.env.development` 文件中设置 Resend API 密钥

## 安装

确保安装所需的依赖项：

```bash
pnpm install -d resend csv-parse dotenv
```

## 配置

1. 在 `.env.development` 文件中添加 Resend API 密钥：

```
RESEND_API_KEY=re_your_api_key_here
```

2. 在 `data/recipients.csv` 文件中设置收件人列表
3. 在 `data/email-content.json` 文件中设置邮件内容

4. 也可以在 `send-emails.js` 文件中配置文件路径

```js
// 配置文件路径 - 直接硬编码在这里
const RECIPIENTS_FILE_PATH = path.resolve(__dirname, "./data/recipients-2.csv");
const EMAIL_CONTENT_FILE_PATH = path.resolve(
  __dirname,
  "./data/email-content.json"
);
```

## 使用方法

```bash
node scripts/mail/send-emails.js
```

## 文件格式

### 收件人 CSV 格式

CSV 文件应包含表头，并至少有一个 `email` 列。您可以包含其他列用于个性化邮件内容。

示例 (`data/recipients.csv`):

```csv
email,name,company,tracking_number
user1@example.com,张三,ABC物流,SHP12345678
user2@example.com,李四,XYZ快递,SHP87654321
```

### 邮件内容 JSON 格式

JSON 文件应包含邮件内容，可以使用模板变量。

示例 (`data/email-content.json`):

```json
{
  "from": "notifications@shipany.com",
  "subject": "{{name}}，您的包裹 #{{tracking_number}} 已发出",
  "html": "<h2>尊敬的 {{name}} 客户，</h2><p>您的包裹编号：{{tracking_number}}</p>",
  "replyTo": "support@shipany.com"
}
```

## 模板变量

您可以在邮件主题和正文中使用模板变量，方法是将变量名用双大括号括起来：`{{变量名}}`。这些变量将被 CSV 文件中相应的值替换。
