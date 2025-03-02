# Buzzed Dashboard

A beehive monitoring dashboard application built with Next.js.

## Development

To run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment to Firebase

This project is configured for Firebase Hosting deployment. Follow these steps to deploy:

### Prerequisites

1. Make sure you have Firebase CLI installed:
   ```bash
   npm install -g firebase-tools
   ```

2. Log in to Firebase (if not already logged in):
   ```bash
   firebase login
   ```

### Deployment Steps

1. Build and deploy the application:
   ```bash
   npm run deploy
   # or to deploy only hosting
   npm run deploy:hosting
   ```

This will:
- Build the Next.js application with static export
- Deploy to Firebase Hosting

Your application will be available at: https://buzzed-4e9f2.web.app

### Configuration Files

- `firebase.json` - Firebase configuration file
- `.firebaserc` - Project settings for Firebase
- `next.config.js` - Next.js configuration (includes static export settings)

## Email Notification System

The application includes an email notification system for sending alerts about critical beehive conditions. The system uses a Next.js API route (`/api/send-email`) that implements Nodemailer with Mailgun SMTP integration on the server side.

### Configuration

The email configuration is located in:
- API route: `src/app/api/send-email/route.ts` 
- Client utilities: `src/utils/alertNotifications.ts`

By default, it uses these Mailgun SMTP settings:

```
SMTP hostname: smtp.mailgun.org
Port: 587
Username: postmaster@sandbox0071fad8c7ff4e2394fa60dd2d9b9a1a.mailgun.org
```

### Important: Mailgun Account Activation Required

Before you can send emails, you need to:

1. **Activate your Mailgun account** - Check your email for an activation link from Mailgun or log in to the Mailgun dashboard and follow the activation steps.

2. **Add authorized recipients** - For sandbox domains, Mailgun restricts sending emails to verified recipients only:
   - Log in to your Mailgun dashboard
   - Navigate to the "Sending" > "Domain Settings" section
   - Find "Authorized Recipients" and add the email addresses you want to send to
   - Recipients will need to click a verification link before they can receive emails

If you encounter an error like "Domain sandbox0071fad8c7ff4e2394fa60dd2d9b9a1a.mailgun.org is not allowed to send", it means one of these steps is incomplete.

For production use, you should upgrade to a custom domain in Mailgun to remove these restrictions.

### Using the Email Feature

To use the email feature in production:

1. Update the recipient email addresses in the `testEmailSending` function
2. Test the email system using the "Email Testing Options" panel in the Alerts section
3. The email notifications will be sent automatically for critical alerts

### Architecture Note

The email system uses a server-side API route because Node.js modules like `nodemailer` and related dependencies like `fs`, `path`, and `net` are not compatible with client-side JavaScript. This architecture ensures proper separation between client and server functionality.

### Testing Email Functionality

You can test the email functionality by:

1. Navigate to the Alerts section of the dashboard
2. Click on "Email Testing Options" at the bottom of the alerts list
3. Click "Send Test Email via Mailgun"

This will send a test email to verify your SMTP configuration is working correctly.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
