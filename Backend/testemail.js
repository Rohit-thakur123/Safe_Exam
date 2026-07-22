/**
 * Run this script to test your email configuration:
 * node test-email.js
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

console.log('\n🔍 Checking SMTP Configuration...\n');
console.log('SMTP_USER :', process.env.SMTP_USER || '❌ NOT SET');
console.log('SMTP_PASS :', process.env.SMTP_PASS ? `✅ Set (${process.env.SMTP_PASS.length} chars, stripped: ${process.env.SMTP_PASS.replace(/\s+/g, '').length} chars)` : '❌ NOT SET');
console.log('SMTP_HOST :', process.env.SMTP_HOST || 'smtp.gmail.com (default)');
console.log('SMTP_PORT :', process.env.SMTP_PORT || '465 (default)');
console.log('SMTP_FROM :', process.env.SMTP_FROM || '❌ NOT SET');
console.log('');

// Strip spaces from app password
const smtpPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');

if (!process.env.SMTP_USER || !smtpPass) {
    console.error('❌ SMTP_USER or SMTP_PASS is missing in .env file');
    process.exit(1);
}

async function testEmail() {
    // Try port 465 first
    console.log('📡 Testing connection on port 465 (SSL)...');
    try {
        const t465 = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: { user: process.env.SMTP_USER, pass: smtpPass },
            tls: { rejectUnauthorized: false },
            connectionTimeout: 10000,
        });
        await t465.verify();
        console.log('✅ Port 465 connected!\n');
        await sendTestEmail(t465);
        return;
    } catch (e) {
        console.log(`❌ Port 465 failed: ${e.message}`);
    }

    // Try port 587
    console.log('📡 Testing connection on port 587 (STARTTLS)...');
    try {
        const t587 = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: { user: process.env.SMTP_USER, pass: smtpPass },
            tls: { rejectUnauthorized: false },
            connectionTimeout: 10000,
        });
        await t587.verify();
        console.log('✅ Port 587 connected!\n');
        await sendTestEmail(t587);
        return;
    } catch (e) {
        console.log(`❌ Port 587 failed: ${e.message}`);
    }

    console.log('\n❌ Both ports failed. Diagnosis:');
    console.log('   1. Your Gmail App Password may be wrong or expired.');
    console.log('      → Go to: https://myaccount.google.com/apppasswords');
    console.log('      → Delete the old password and generate a NEW one.');
    console.log('      → Paste it in .env as: SMTP_PASS=xxxx xxxx xxxx xxxx');
    console.log('');
    console.log('   2. 2-Step Verification must be ON for App Passwords to work.');
    console.log('      → Go to: https://myaccount.google.com/security');
    console.log('');
    console.log('   3. Your antivirus/firewall may be blocking outbound SMTP.');
    console.log('      → Temporarily disable it and try again.');
}

async function sendTestEmail(transporter) {
    const recipient = process.env.SMTP_USER; // Send to yourself as a test
    console.log(`📧 Sending test email to ${recipient}...`);
    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || `"SecureExam Test" <${process.env.SMTP_USER}>`,
            to: recipient,
            subject: '✅ SecureExam Email Test — It Works!',
            html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
          <h2 style="color:#667eea;">✅ Email is working!</h2>
          <p>Your SecureExam email configuration is correct.</p>
          <p>Students will now receive exam invitation emails when you assign them.</p>
          <hr/>
          <small style="color:#999;">Sent at: ${new Date().toISOString()}</small>
        </div>
      `,
            text: 'SecureExam email test successful! Your SMTP config is working correctly.',
        });
        console.log('\n✅ Email sent successfully!');
        console.log('   Message ID:', info.messageId);
        console.log(`   Check inbox of: ${recipient}`);
    } catch (e) {
        console.error('\n❌ Failed to send email:', e.message);
        if (e.message.includes('Invalid login') || e.message.includes('Username and Password')) {
            console.log('\n   → Your App Password is WRONG or EXPIRED.');
            console.log('   → Generate a new one at: https://myaccount.google.com/apppasswords');
        }
    }
}

testEmail();