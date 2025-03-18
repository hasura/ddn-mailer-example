import * as nodemailer from "nodemailer";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

interface EmailContent {
  subject: string;
  text?: string;
  html?: string;
}

interface EmailResult {
  success: boolean;
  message: string;
  messageId?: string;
  previewUrl?: string;
}

interface TemplateData {
  templateName: string;
  variables: string; // JSON string of variables
}

let transporter: nodemailer.Transporter;

/**
 * Creates an Ethereal test account for development
 */
async function createTestAccount() {
  const testAccount = await nodemailer.createTestAccount();

  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
}

/**
 * Creates a production transporter using environment variables
 */
function createProductionTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// Initialize transporter based on environment
async function initializeTransporter() {
  if (process.env.NODE_ENV === "production") {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error("Email configuration not found in environment variables");
    }
    transporter = createProductionTransporter();
  } else {
    // Development environment - use Ethereal
    transporter = await createTestAccount();
    console.log("Created test account for development");
  }
}

/**
 * Sends an email to a single recipient
 * @param to Email address of the recipient
 * @param content Email content including subject and body
 * @returns Promise with the send result
 */
export async function sendEmail(
  to: string,
  content: EmailContent
): Promise<EmailResult> {
  // Initialize transporter if not already done
  if (!transporter) {
    await initializeTransporter();
  }

  try {
    const info = await transporter.sendMail({
      from:
        process.env.NODE_ENV === "production"
          ? process.env.SMTP_USER
          : "test@ethereal.email",
      to,
      subject: content.subject,
      text: content.text,
      html: content.html,
    });

    const result: EmailResult = {
      success: true,
      messageId: info.messageId,
      message: "Email sent successfully",
    };

    // In development, add the preview URL
    if (process.env.NODE_ENV !== "production") {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        result.previewUrl = previewUrl;
        console.log("Preview URL: %s", previewUrl);
      }
    }

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      success: false,
      message: `Failed to send email: ${errorMessage}`,
    };
  }
}

/**
 * Sends an email to multiple recipients
 * @param recipients Comma-separated list of email addresses
 * @param content Email content including subject and body
 * @returns Promise with the send result
 */
export async function sendBulkEmail(
  recipients: string,
  content: EmailContent
): Promise<EmailResult> {
  return sendEmail(recipients, content);
}

/**
 * Sends a template-based email
 * @param to Email address of the recipient
 * @param templateData Template name and variables
 * @returns Promise with the send result
 */
export async function sendTemplateEmail(
  to: string,
  templateData: TemplateData
): Promise<EmailResult> {
  try {
    const variables = JSON.parse(templateData.variables);
    const subject = `Template: ${templateData.templateName}`;
    const html = `<p>Template: ${
      templateData.templateName
    }</p><p>Variables: ${JSON.stringify(variables)}</p>`;

    return sendEmail(to, { subject, html });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      success: false,
      message: `Failed to process template: ${errorMessage}`,
    };
  }
}
