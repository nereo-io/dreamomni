#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { Resend } from 'resend';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径（ES模块中没有 __dirname）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置文件路径 - 直接硬编码在这里
const RECIPIENTS_FILE_PATH = path.resolve(__dirname, './data/recipients-1.csv');
const EMAIL_CONTENT_FILE_PATH = path.resolve(__dirname, './data/email-content.json');

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.development') });

const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
  console.error('Error: RESEND_API_KEY is not set in .env.development file');
  process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);

/**
 * Parse CSV file containing recipient information
 * @param {string} filePath - Path to CSV file
 * @returns {Array} - Array of recipient objects
 */
function parseRecipients(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const recipients = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    return recipients;
  } catch (error) {
    console.error(`Error parsing recipients file: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Parse JSON file containing email content
 * @param {string} filePath - Path to JSON file
 * @returns {Object} - Email content object
 */
function parseEmailContent(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error parsing email content file: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Send an email to a single recipient
 * @param {Object} recipient - Recipient information
 * @param {Object} emailContent - Email content
 * @returns {Promise} - Promise resolving to send result
 */
async function sendEmail(recipient, emailContent) {
  try {
    // Replace template variables in subject and body
    let subject = emailContent.subject;
    let html = emailContent.html;
    
    // Replace template variables with recipient data
    Object.keys(recipient).forEach(key => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(placeholder, recipient[key]);
      html = html.replace(placeholder, recipient[key]);
    });

    const data = await resend.emails.send({
      from: emailContent.from || 'noreply@shipany.com',
      to: recipient.email,
      subject: subject,
      html: html,
      reply_to: emailContent.replyTo
    });

    return data;
  } catch (error) {
    console.error(`Error sending email to ${recipient.email}: ${error.message}`);
    return { error: true, message: error.message };
  }
}

/**
 * Main function to send emails to all recipients
 */
async function main() {
  // Validate file paths
  if (!fs.existsSync(RECIPIENTS_FILE_PATH)) {
    console.error(`Recipients file not found: ${RECIPIENTS_FILE_PATH}`);
    process.exit(1);
  }

  if (!fs.existsSync(EMAIL_CONTENT_FILE_PATH)) {
    console.error(`Email content file not found: ${EMAIL_CONTENT_FILE_PATH}`);
    process.exit(1);
  }

  // Parse input files
  const recipients = parseRecipients(RECIPIENTS_FILE_PATH);
  const emailContent = parseEmailContent(EMAIL_CONTENT_FILE_PATH);

  console.log(`Sending emails to ${recipients.length} recipients...`);

  // Send emails one by one
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i];
    console.log(`[${i + 1}/${recipients.length}] Sending to: ${recipient.email}`);
    
    const result = await sendEmail(recipient, emailContent);
    
    if (result.error) {
      failureCount++;
      console.error(`  ❌ Failed: ${result.message}`);
    } else {
      successCount++;
      console.log(`  ✅ Sent successfully (ID: ${result.id})`);
    }
    
    // Add a small delay between emails to avoid rate limiting
    if (i < recipients.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  console.log('\nSummary:');
  console.log(`✅ Successfully sent: ${successCount}`);
  console.log(`❌ Failed: ${failureCount}`);
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
