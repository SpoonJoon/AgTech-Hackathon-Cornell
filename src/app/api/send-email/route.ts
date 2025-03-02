import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Create reusable transporter with Mailgun SMTP settings
const createTransporter = () => {
  console.log('Creating nodemailer transporter with Mailgun SMTP settings');
  return nodemailer.createTransport({
    host: 'smtp.mailgun.org',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: 'postmaster@sandbox0071fad8c7ff4e2394fa60dd2d9b9a1a.mailgun.org',
      pass: '4c01cb6cc02ed141f3fb805df76a1eda-3af52e3b-8de7545f',
    },
    // Add debug option to see detailed connection logs
    debug: true,
    logger: true
  });
};

export async function POST(request: Request) {
  console.log('📧 API route /api/send-email called');
  
  try {
    const body = await request.json();
    const { recipients, subject, htmlContent, textContent, beehiveInfo } = body;
    
    console.log(`Received request to send email to: ${recipients}`);
    console.log(`Subject: ${subject}`);

    // Validate required fields
    if (!recipients || !subject || !htmlContent) {
      console.error('Missing required fields in request');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Creating email transporter...');
    const transporter = createTransporter();
    
    // Test connection before sending
    try {
      console.log('Verifying SMTP connection...');
      await transporter.verify();
      console.log('SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('SMTP connection verification failed:', verifyError);
      const errorMessage = (verifyError as Error).message;
      
      // Check for Mailgun activation error
      if (errorMessage.includes('Please activate your Mailgun account')) {
        return NextResponse.json({
          error: 'Mailgun account not activated',
          details: 'The Mailgun account needs to be activated. Please check your email for an activation link or log in to the Mailgun control panel.',
          originalError: errorMessage
        }, { status: 500 });
      }
      
      return NextResponse.json(
        { error: 'Failed to connect to SMTP server', details: errorMessage },
        { status: 500 }
      );
    }

    // Prepare mail options
    const mailOptions = {
      from: '"Buzzed Monitoring" <alerts@buzzedmonitoring.com>',
      to: Array.isArray(recipients) ? recipients.join(', ') : recipients,
      subject,
      text: textContent || 'Please view this email with an HTML-compatible email client',
      html: htmlContent,
    };
    
    console.log('Sending email with the following options:', JSON.stringify({
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    }));

    // Send mail
    console.log('Attempting to send email...');
    try {
      const info = await transporter.sendMail(mailOptions);
      
      console.log('Email sent successfully:', info.messageId);
      console.log('Full response:', JSON.stringify(info));
  
      return NextResponse.json({ 
        success: true, 
        messageId: info.messageId 
      });
    } catch (sendError) {
      console.error('Error sending email:', sendError);
      const errorMessage = (sendError as Error).message;
      
      // Check for sandbox domain restrictions
      if (errorMessage.includes('not allowed to send') || errorMessage.includes('activate your Mailgun account')) {
        return NextResponse.json({
          error: 'Mailgun account not activated or sandbox restrictions',
          details: 'For sandbox domains in Mailgun, you need to activate your account and add authorized recipients. Please check the Mailgun documentation for more information.',
          originalError: errorMessage
        }, { status: 500 });
      }
      
      return NextResponse.json(
        { error: 'Failed to send email', details: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: (error as Error).message },
      { status: 500 }
    );
  }
} 