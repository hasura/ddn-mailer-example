# DDN Email Example

This example provides email sending capabilities through Hasura DDN using nodemailer. It supports both development (using Ethereal) and production environments.



https://github.com/user-attachments/assets/ad5335a8-187f-403b-85ba-19c2aa1d4b0d



## Setup

1. Install dependencies:

```bash
npm install nodemailer dotenv @types/nodemailer
```

2. Create a `.env` file with your SMTP configuration:

```env
# Development: Leave these empty to use Ethereal test account
# Production: Fill these with your SMTP server details
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASS=your-password

# Set to "production" to use real SMTP server
NODE_ENV=development
```

## Available Functions

### 1. Send Single Email

Send an email to a single recipient:

```graphql
mutation {
  sendEmail(
    to: "user@example.com"
    content: {
      subject: "Hello"
      text: "This is the plain text version"
      html: "<p>This is the HTML version</p>"
    }
  ) {
    success
    message
    messageId
    previewUrl # Only available in development
  }
}
```

### 2. Send Bulk Email

Send the same email to multiple recipients:

```graphql
mutation {
  sendBulkEmail(
    recipients: "user1@example.com, user2@example.com"
    content: {
      subject: "Hello Everyone"
      html: "<p>This message goes to multiple people</p>"
    }
  ) {
    success
    message
  }
}
```

### 3. Send Template Email

Send an email using a template with variables:

```graphql
mutation {
  sendTemplateEmail(
    to: "user@example.com"
    templateData: {
      templateName: "welcome"
      variables: "{\"name\":\"John\",\"company\":\"Acme\"}"
    }
  ) {
    success
    message
  }
}
```

## Development Mode

When `NODE_ENV` is not set to "production":

- The connector automatically creates a test account using [Ethereal Email](https://ethereal.email)
- No SMTP configuration is required
- Each email sent returns a `previewUrl` where you can view the email
- Perfect for development and testing without risk of sending real emails

## Production Mode

When `NODE_ENV` is set to "production":

- The connector uses the SMTP configuration from your `.env` file
- Emails are sent to real recipients
- Make sure all SMTP environment variables are properly configured

## Adding to Hasura

After setting up the connector, run:

```bash
# Introspect the connector
ddn connector introspect mailer

# Add the commands to your metadata
ddn command add mailer "*"
```

## Response Format

All email functions return:

```typescript
{
  success: boolean;      // Whether the operation succeeded
  message: string;       // Success/error message
  messageId?: string;    // Unique ID of the sent email
  previewUrl?: string;   // URL to preview the email (development only)
}
```

## Error Handling

The connector handles errors gracefully and always returns a response object. Check the `success` field to determine if the operation succeeded, and the `message` field for details about any errors.
