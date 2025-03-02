import { Beehive } from '../models/beehive';

// In a real application, these would be API calls to email/SMS services
// For this mock application, we'll just simulate the sending

interface NotificationConfig {
  enableEmail: boolean;
  enableSMS: boolean;
  emailRecipients: string[];
  phoneNumbers: string[];
  alertThreshold: 'low' | 'medium' | 'high';
  // Added critical threshold monitoring
  criticalThresholds: {
    temperature: { min: number; max: number };
    humidity: { min: number; max: number };
    weight: { minChange: number };
    entranceActivity: { min: number };
    queenActivity: { min: number };
  };
}

// Default notification settings
const defaultConfig: NotificationConfig = {
  enableEmail: true,
  enableSMS: true,
  emailRecipients: ['jyoo45@binghamton.edu'],
  phoneNumbers: ['6077747313'],
  alertThreshold: 'medium',
  // Default critical thresholds that trigger immediate alerts
  criticalThresholds: {
    temperature: { min: 30, max: 38 },
    humidity: { min: 35, max: 75 },
    weight: { minChange: 2 }, // Sudden weight change of 2kg or more
    entranceActivity: { min: 15 },
    queenActivity: { min: 20 }
  }
};

// Define critical thresholds
const CRITICAL_THRESHOLDS = {
  temperature: {
    min: 31.5,
    max: 37.0,
    unit: '°C',
    criticalMin: 30.0,
    criticalMax: 38.0
  },
  humidity: {
    min: 50.0,
    max: 75.0,
    unit: '%',
    criticalMin: 50.0,
    criticalMax: 75.0
  },
  weight: {
    criticalDelta: -1.0, // kg, critical if suddenly drops by this amount
    unit: 'kg'
  },
  entranceActivity: {
    min: 20.0,
    unit: 'activity rate'
  },
  varroaMite: {
    warningLevel: 2.0,
    criticalLevel: 3.0,
    unit: '%'
  }
};

// Mailgun SMTP Configuration
const SMTP_CONFIG = {
  host: 'smtp.mailgun.org',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'postmaster@sandbox0071fad8c7ff4e2394fa60dd2d9b9a1a.mailgun.org',
    pass: '4c01cb6cc02ed141f3fb805df76a1eda-3af52e3b-8de7545f'
  }
};

// Check for critical metrics in a beehive
export const checkCriticalMetrics = (beehive: Beehive, previousBeehive: Beehive | null) => {
  const criticalMessages: string[] = [];
  let isCritical = false;
  
  // Temperature checks
  if (beehive.metrics.temperature < CRITICAL_THRESHOLDS.temperature.criticalMin) {
    criticalMessages.push(`Temperature critically low: ${beehive.metrics.temperature.toFixed(2)}${CRITICAL_THRESHOLDS.temperature.unit} (below ${CRITICAL_THRESHOLDS.temperature.criticalMin}${CRITICAL_THRESHOLDS.temperature.unit})`);
    isCritical = true;
  } else if (beehive.metrics.temperature > CRITICAL_THRESHOLDS.temperature.criticalMax) {
    criticalMessages.push(`Temperature critically high: ${beehive.metrics.temperature.toFixed(2)}${CRITICAL_THRESHOLDS.temperature.unit} (above ${CRITICAL_THRESHOLDS.temperature.criticalMax}${CRITICAL_THRESHOLDS.temperature.unit})`);
    isCritical = true;
  } else if (beehive.metrics.temperature < CRITICAL_THRESHOLDS.temperature.min) {
    criticalMessages.push(`Temperature warning: ${beehive.metrics.temperature.toFixed(2)}${CRITICAL_THRESHOLDS.temperature.unit} (below ideal minimum ${CRITICAL_THRESHOLDS.temperature.min}${CRITICAL_THRESHOLDS.temperature.unit})`);
  } else if (beehive.metrics.temperature > CRITICAL_THRESHOLDS.temperature.max) {
    criticalMessages.push(`Temperature warning: ${beehive.metrics.temperature.toFixed(2)}${CRITICAL_THRESHOLDS.temperature.unit} (above ideal maximum ${CRITICAL_THRESHOLDS.temperature.max}${CRITICAL_THRESHOLDS.temperature.unit})`);
  }
  
  // Humidity checks
  if (beehive.metrics.humidity < CRITICAL_THRESHOLDS.humidity.criticalMin) {
    criticalMessages.push(`Humidity critically low: ${beehive.metrics.humidity.toFixed(2)}${CRITICAL_THRESHOLDS.humidity.unit} (below ${CRITICAL_THRESHOLDS.humidity.criticalMin}${CRITICAL_THRESHOLDS.humidity.unit})`);
    isCritical = true;
  } else if (beehive.metrics.humidity > CRITICAL_THRESHOLDS.humidity.criticalMax) {
    criticalMessages.push(`Humidity critically high: ${beehive.metrics.humidity.toFixed(2)}${CRITICAL_THRESHOLDS.humidity.unit} (above ${CRITICAL_THRESHOLDS.humidity.criticalMax}${CRITICAL_THRESHOLDS.humidity.unit})`);
    isCritical = true;
  } else if (beehive.metrics.humidity < CRITICAL_THRESHOLDS.humidity.min) {
    criticalMessages.push(`Humidity warning: ${beehive.metrics.humidity.toFixed(2)}${CRITICAL_THRESHOLDS.humidity.unit} (below ideal minimum ${CRITICAL_THRESHOLDS.humidity.min}${CRITICAL_THRESHOLDS.humidity.unit})`);
  } else if (beehive.metrics.humidity > CRITICAL_THRESHOLDS.humidity.max) {
    criticalMessages.push(`Humidity warning: ${beehive.metrics.humidity.toFixed(2)}${CRITICAL_THRESHOLDS.humidity.unit} (above ideal maximum ${CRITICAL_THRESHOLDS.humidity.max}${CRITICAL_THRESHOLDS.humidity.unit})`);
  }
  
  // Varroa mite checks
  if (beehive.metrics.varroaMiteLevel > CRITICAL_THRESHOLDS.varroaMite.criticalLevel) {
    criticalMessages.push(`Varroa mite level critically high: ${beehive.metrics.varroaMiteLevel.toFixed(2)}${CRITICAL_THRESHOLDS.varroaMite.unit} (above critical threshold ${CRITICAL_THRESHOLDS.varroaMite.criticalLevel}${CRITICAL_THRESHOLDS.varroaMite.unit})`);
    isCritical = true;
  } else if (beehive.metrics.varroaMiteLevel > CRITICAL_THRESHOLDS.varroaMite.warningLevel) {
    criticalMessages.push(`Varroa mite level warning: ${beehive.metrics.varroaMiteLevel.toFixed(2)}${CRITICAL_THRESHOLDS.varroaMite.unit} (above warning threshold ${CRITICAL_THRESHOLDS.varroaMite.warningLevel}${CRITICAL_THRESHOLDS.varroaMite.unit})`);
  }
  
  // Weight changes (sudden drop)
  if (previousBeehive && (beehive.metrics.weight - previousBeehive.metrics.weight) < CRITICAL_THRESHOLDS.weight.criticalDelta) {
    criticalMessages.push(`Weight critically decreased: ${beehive.metrics.weight.toFixed(2)}${CRITICAL_THRESHOLDS.weight.unit} (dropped ${Math.abs(beehive.metrics.weight - previousBeehive.metrics.weight).toFixed(2)}${CRITICAL_THRESHOLDS.weight.unit} since last reading)`);
    isCritical = true;
  }
  
  // Comment out entrance activity checks to suppress these alerts
  /* 
  // Entrance activity (very low activity)
  if (beehive.metrics.entranceActivity < CRITICAL_THRESHOLDS.entranceActivity.min) {
    criticalMessages.push(`Entrance activity critically low: ${beehive.metrics.entranceActivity.toFixed(2)} (below ${CRITICAL_THRESHOLDS.entranceActivity.min})`);
    isCritical = true;
  }
  */
  
  return { isCritical, criticalMessages };
};

// Create HTML email template for alerts
const createAlertEmailHTML = (beehiveName: string, messages: string[], beehiveMetrics: any) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Beehive Alert: ${beehiveName}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #FFA500; color: white; padding: 15px; border-radius: 5px 5px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { border: 1px solid #ddd; border-top: none; padding: 20px; border-radius: 0 0 5px 5px; }
        .alert-message { background-color: #FFF4E6; border-left: 4px solid #FF3B30; margin-bottom: 15px; padding: 10px; }
        .metrics { background-color: #F5F5F5; padding: 15px; border-radius: 5px; margin-top: 20px; }
        .metrics-table { width: 100%; border-collapse: collapse; }
        .metrics-table td { padding: 8px; border-bottom: 1px solid #ddd; }
        .metrics-table tr:last-child td { border-bottom: none; }
        .footer { margin-top: 30px; font-size: 12px; color: #777; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>⚠️ Beehive Alert: ${beehiveName}</h1>
      </div>
      <div class="content">
        <p>The following critical conditions have been detected for <strong>${beehiveName}</strong>:</p>
        
        <div class="alerts">
          ${messages.map(message => `
            <div class="alert-message">
              <p>${message}</p>
            </div>
          `).join('')}
        </div>
        
        <div class="metrics">
          <h3>Current Metrics:</h3>
          <table class="metrics-table">
            <tr>
              <td><strong>Temperature:</strong></td>
              <td>${beehiveMetrics.temperature.toFixed(2)}°C</td>
            </tr>
            <tr>
              <td><strong>Humidity:</strong></td>
              <td>${beehiveMetrics.humidity.toFixed(2)}%</td>
            </tr>
            <tr>
              <td><strong>Weight:</strong></td>
              <td>${beehiveMetrics.weight.toFixed(2)} kg</td>
            </tr>
            <tr>
              <td><strong>Entrance Activity:</strong></td>
              <td>${beehiveMetrics.entranceActivity.toFixed(2)}/100</td>
            </tr>
          </table>
        </div>
        
        <p><strong>Please take immediate action if needed.</strong></p>
        
        <div class="footer">
          <p>This is an automated alert from the Buzzed Beehive Monitoring System.</p>
          <p>Time: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send email notification via API route
export const sendEmailNotification = async (recipients: string[], subject: string, messages: string[], beehive?: Beehive) => {
  console.log(`⏳ Preparing email alert notification to ${recipients.join(', ')}`);
  console.log(`📧 Subject: ${subject}`);
  
  // Generate email content
  let htmlContent = '';
  let textContent = '';
  
  if (beehive) {
    // Create HTML email for rich formatting
    htmlContent = createAlertEmailHTML(beehive.name, messages, beehive.metrics);
    textContent = `Alert: ${subject}\n\n${beehive.name} requires attention.\n${messages.join('\n')}`;
  } else {
    // Simple plain text for non-beehive alerts
    htmlContent = `<html><body><h2>${subject}</h2><p>${messages.join('<br/>')}</p></body></html>`;
    textContent = `Alert: ${subject}\n\n${messages.join('\n')}`;
  }

  try {
    // In development - log the email content
    if (process.env.NODE_ENV === 'development') {
      console.log('📩 Email would be sent in production environment');
      console.log('📋 Email preview:', textContent);
      return true;
    }
    
    // Send email via API route
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipients,
        subject,
        htmlContent,
        textContent,
        beehiveInfo: beehive ? {
          id: beehive.id,
          name: beehive.name,
          metrics: beehive.metrics
        } : null
      }),
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Email sent successfully:', data.messageId);
      return true;
    } else {
      console.error('❌ Failed to send email:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending email notification:', error);
    return false;
  }
};

// Send SMS notification
export const sendSMSNotification = async (
  phoneNumbers: string[],
  message: string
): Promise<boolean> => {
  console.log(`📱 Would send SMS to ${phoneNumbers.join(', ')}: ${message}`);
  
  // In a real implementation, this would call an SMS service
  // For this mock, we'll just return true to simulate success
  return true;
};

// Test email sending
export const testEmailSending = async () => {
  try {
    console.log('Starting test email sending...');
    const subject = '🐝 Buzzed Monitoring - Test Email';
    const timestamp = new Date().toLocaleString();
    
    // Create a test message with instructions
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Buzzed Monitoring Test Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #FFA500; color: white; padding: 15px; border-radius: 5px 5px 0 0; }
          .content { border: 1px solid #ddd; border-top: none; padding: 20px; border-radius: 0 0 5px 5px; }
          .success { background-color: #E8F5E9; border-left: 4px solid #4CAF50; padding: 10px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🐝 Buzzed Monitoring Test Email</h1>
        </div>
        <div class="content">
          <div class="success">
            <p>✅ Success! If you're reading this, your email configuration is working correctly.</p>
          </div>
          
          <p>This is a test email sent from the Buzzed Beehive Monitoring System.</p>
          <p>Time: ${timestamp}</p>
          
          <hr>
          <p style="font-size: 12px; color: #777;">
            This email was sent as part of testing the Mailgun SMTP integration. No action is required.
          </p>
        </div>
      </body>
      </html>
    `;
    
    const textContent = `Buzzed Monitoring Test Email\n\nSuccess! If you're receiving this, your email configuration is working correctly.\n\nThis is a test email sent at ${timestamp}.\n\nNo action is required.`;
    
    // Replace with your actual email address
    const recipients = ['jyoo45@binghamton.edu'];
    
    console.log(`Sending test email to: ${recipients.join(', ')}`);
    
    // Get the absolute URL for the API endpoint
    // This helps ensure we're using the correct URL in both development and production
    const apiUrl = new URL('/api/send-email', window.location.origin).toString();
    console.log('Using API URL:', apiUrl);
    
    // Directly call the API endpoint to bypass the development check
    try {
      // Send email directly via API route
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipients,
          subject,
          htmlContent,
          textContent
        }),
      });
      
      console.log('API response status:', response.status);
      
      // Parse response body regardless of status
      const data = await response.json();
      console.log('API response data:', data);
      
      // Check if the response is ok
      if (!response.ok) {
        // Handle specific error cases
        if (data.error === 'Mailgun account not activated' || 
            data.error === 'Mailgun account not activated or sandbox restrictions') {
          console.error('⚠️ Mailgun configuration issue:', data.details);
          alert(`Mailgun error: ${data.details}\n\nVisit your Mailgun dashboard to activate your account or add authorized recipients.`);
          return false;
        }
        
        // Generic error handling
        console.error(`API response error (${response.status}):`, data.error);
        alert(`Email sending failed: ${data.details || data.error || 'Unknown error'}`);
        return false;
      }

      if (data.success) {
        console.log('✅ Test email sent successfully:', data.messageId);
        return true;
      } else {
        console.error('❌ Failed to send test email:', data.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending test email notification:', error);
      alert(`Network error while sending email. Please check your connection and try again.\n\nError: ${(error as Error).message}`);
      return false;
    }
  } catch (error) {
    console.error('Failed to send test email:', error);
    return false;
  }
};

// Process alerts and send notifications
export const processAlerts = async (
  beehive: Beehive,
  previousBeehive: Beehive | null = null,
  config: NotificationConfig = defaultConfig
): Promise<void> => {
  // Check for critical metrics first
  const { isCritical, criticalMessages } = checkCriticalMetrics(beehive, previousBeehive);
  
  if (isCritical && config.enableEmail) {
    // Format email message with detailed information
    const emailSubject = `🚨 CRITICAL ALERT: ${beehive.name} requires immediate attention`;
    
    // Create a detailed message with current metrics
    const formattedMessages = [
      `Critical alerts detected for ${beehive.name} at ${beehive.location}:`,
      ...criticalMessages
    ];
    
    // Send the email alert
    await sendEmailNotification(
      config.emailRecipients,
      emailSubject,
      formattedMessages,
      beehive
    );
  }
  
  if (isCritical && config.enableSMS) {
    // Create a shorter message for SMS
    const smsMessage = `ALERT: ${beehive.name} has critical issues: ${criticalMessages[0]}${criticalMessages.length > 1 ? ` and ${criticalMessages.length - 1} more issues` : ''}`;
    
    // Send the SMS alert
    await sendSMSNotification(
      config.phoneNumbers,
      smsMessage
    );
  }
  
  // Process regular alerts (non-critical metrics alerts)
  const severityOrder: Record<string, number> = { 'high': 0, 'medium': 1, 'low': 2 };
  
  // Filter alerts based on configured threshold
  const alertsToProcess = beehive.alerts.filter(alert => 
    !alert.resolved && 
    severityOrder[alert.severity] <= severityOrder[config.alertThreshold]
  );
  
  for (const alert of alertsToProcess) {
    // Process each relevant alert
    if (config.enableEmail) {
      const emailSubject = `${alert.severity === 'high' ? '🚨' : '⚠️'} ${beehive.name}: ${alert.message}`;
      
      await sendEmailNotification(
        config.emailRecipients,
        emailSubject,
        [`Alert type: ${alert.type}`, alert.message],
        beehive
      );
    }
    
    if (config.enableSMS && alert.severity === 'high') {
      // Only send SMS for high severity alerts
      const smsMessage = `ALERT: ${beehive.name} - ${alert.message}`;
      
      await sendSMSNotification(
        config.phoneNumbers,
        smsMessage
      );
    }
  }
}; 