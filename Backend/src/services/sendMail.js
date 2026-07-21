import nodemailer from "nodemailer";

// Lazy transporter initialization
let transporter = null;

// Function to get or create transporter
function getTransporter() {
  if (!transporter) {
    // Validate required environment variables
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS in .env file');
    }

    // Gmail App Passwords are displayed with spaces (e.g. "mbpm hixt tini qddf")
    // but must be sent WITHOUT spaces — strip them here to be safe.
    const smtpPass = process.env.SMTP_PASS.replace(/\s+/g, '');

    transporter = nodemailer.createTransport({
      service: 'gmail',
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Test connection
    transporter.verify(function (error, success) {
      if (error) {
        console.error('❌ SMTP connection error:', error.message);
        console.log('⚠️ Email notifications will not work. Please check your SMTP settings.');
        console.log('💡 Make sure you are using a Gmail App Password (16 chars, no spaces).');
        console.log('💡 Enable 2FA on your Google account first, then generate an App Password at:');
        console.log('   https://myaccount.google.com/apppasswords');
      } else {
        console.log('✅ SMTP server is ready to send emails');
      }
    });
  }

  return transporter;
}

async function sendMail(to, subject, htmlBody, textBody = null) {
  try {
    // Get transporter instance (creates it if needed)
    const emailTransporter = getTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM || `"Exam System" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: htmlBody,
    };

    // Add plain text version if provided
    if (textBody) {
      mailOptions.text = textBody;
    }

    const info = await emailTransporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully to:", to);
    console.log("   Message ID:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error sending email to:", to);
    console.error("   Error:", error.message);
    throw new Error("Error sending email: " + error.message);
  }
}

export default sendMail;