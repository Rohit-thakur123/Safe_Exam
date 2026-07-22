import nodemailer from "nodemailer";

/**
 * Creates a fresh transporter each time — avoids stale cached connections
 * when .env is updated and server restarts.
 */
function createTransporter() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP_USER or SMTP_PASS not set in Backend/.env');
  }

  // Gmail App Passwords are displayed with spaces — strip them before use
  const smtpPass = process.env.SMTP_PASS.replace(/\s+/g, '');
  const port = parseInt(process.env.SMTP_PORT) || 465;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465,   // true for 465 (SSL), false for 587 (STARTTLS)
    auth: {
      user: process.env.SMTP_USER,
      pass: smtpPass,
    },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

// Verify SMTP on server startup — logs clearly to nodemon terminal
export async function verifySmtp() {
  try {
    const t = createTransporter();
    await t.verify();
    console.log(`✅ SMTP ready — sending from: ${process.env.SMTP_USER}`);
  } catch (err) {
    console.error('\n❌ ─── SMTP STARTUP CHECK FAILED ──────────────────────────');
    console.error(`   ${err.message}`);
    console.error('   ► Fix: regenerate App Password at');
    console.error('          https://myaccount.google.com/apppasswords');
    console.error('   ► Then update SMTP_PASS in Backend/.env and RESTART server');
    console.error('──────────────────────────────────────────────────────────\n');
  }
}

async function sendMail(to, subject, htmlBody, textBody = null) {
  const from = process.env.SMTP_FROM || `"SecureExam" <${process.env.SMTP_USER}>`;

  console.log(`\n📤 Sending email`);
  console.log(`   From   : ${from}`);
  console.log(`   To     : ${to}`);
  console.log(`   Subject: ${subject}`);

  const transporter = createTransporter();

  const mailOptions = { from, to, subject, html: htmlBody };
  if (textBody) mailOptions.text = textBody;

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Delivered to ${to} | ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Delivery FAILED to ${to}: ${error.message}`);

    if (error.message.includes('Invalid login') || error.message.includes('Username and Password')) {
      console.error('   ► Gmail App Password is wrong or expired.');
      console.error('   ► Generate a new one: https://myaccount.google.com/apppasswords');
      console.error('   ► Update SMTP_PASS in Backend/.env, then restart the server.\n');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      console.error('   ► Cannot reach Gmail SMTP. Check firewall / internet.\n');
    }

    throw new Error(`Email delivery failed to ${to}: ${error.message}`);
  }
}

export default sendMail;