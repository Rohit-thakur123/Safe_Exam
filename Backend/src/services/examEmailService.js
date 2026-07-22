import sendMail from './sendMail.js';
import { getExamAssignmentEmailTemplate, getExamAssignmentPlainText } from '../utils/emailTemplates.js';
import { generateExamLink } from '../utils/examLinkUtils.js';

/**
 * Send exam assignment notification to a student with unique exam link
 * @param {Object} student - Student object with name, email, and _id
 * @param {Object} examDetails - Exam details object with _id, title, duration, etc.
 * @param {Object} teacher - Teacher object with name
 * @param {String} frontendBaseUrl - Base URL of the frontend application
 */
export const sendExamAssignmentEmail = async (student, examDetails, teacher, frontendBaseUrl) => {
    console.log(`\n📬 Preparing exam email for student:`);
    console.log(`   Name   : ${student.name || '⚠️ MISSING NAME'}`);
    console.log(`   Email  : ${student.email || '⚠️ MISSING EMAIL'}`);
    console.log(`   ID     : ${student._id}`);
    console.log(`   Exam   : ${examDetails.title} (ID: ${examDetails._id})`);
    console.log(`   Base URL: ${frontendBaseUrl}`);

    try {
        // Generate unique exam link for this student
        const examLink = generateExamLink(
            examDetails._id || examDetails.id,
            student._id,
            examDetails.duration,
            frontendBaseUrl
        );
        console.log(`   Link   : ${examLink}`);

        const subject = `📝 New Exam Assigned: ${examDetails.title}`;

        // Add exam link to exam details
        const examDetailsWithLink = {
            ...examDetails,
            examLink
        };

        // Generate HTML email
        const htmlBody = getExamAssignmentEmailTemplate(student.name, examDetailsWithLink);

        // Generate plain text version
        const textBody = getExamAssignmentPlainText(student.name, examDetailsWithLink);

        // Send email
        const info = await sendMail(student.email, subject, htmlBody, textBody);

        console.log(`✅ Exam assignment email sent to ${student.email} with unique link`);
        return {
            success: true,
            messageId: info.messageId,
            recipient: student.email,
            examLink
        };
    } catch (error) {
        console.error(`❌ Failed to send email to ${student.email}:`, error.message);
        return {
            success: false,
            error: error.message,
            recipient: student.email
        };
    }
};

/**
 * Send exam assignment emails to multiple students with unique links
 * @param {Array} students - Array of student objects
 * @param {Object} examDetails - Exam details object
 * @param {Object} teacher - Teacher object
 * @param {String} frontendBaseUrl - Base URL of the frontend (default from env)
 */
export const sendBulkExamAssignmentEmails = async (students, examDetails, teacher, frontendBaseUrl = null) => {
    // Use environment variable if not provided
    console.log("📨  sendBulkExamAssignmentEmails CALLED");
    const baseUrl = frontendBaseUrl || process.env.FRONTEND_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:5173';

    const results = {
        total: students.length,
        sent: 0,
        failed: 0,
        details: []
    };

    console.log(`📧 Sending exam assignment emails to ${students.length} student(s)...`);

    // Send emails sequentially to avoid rate limiting
    for (const student of students) {
        try {
            const result = await sendExamAssignmentEmail(student, examDetails, teacher, baseUrl);
            results.details.push(result);

            if (result.success) {
                results.sent++;
            } else {
                results.failed++;
            }

            // Add small delay between emails to avoid rate limiting
            if (students.length > 1) {
                await new Promise(resolve => setTimeout(resolve, 1000)); // Increased to 1 second
            }
        } catch (error) {
            console.error(`❌ Unexpected error sending to ${student.email}:`, error.message);
            results.failed++;
            results.details.push({
                success: false,
                error: error.message,
                recipient: student.email
            });
        }
    }

    console.log(`📊 Email sending complete: ${results.sent} sent, ${results.failed} failed`);

    // Log failed emails for debugging
    if (results.failed > 0) {
        console.log('⚠️ Failed email recipients:');
        results.details.filter(d => !d.success).forEach(d => {
            console.log(`   - ${d.recipient}: ${d.error}`);
        });
    }

    return results;
};

/**
 * Send exam reminder email (can be used for scheduled reminders)
 * @param {Object} student - Student object
 * @param {Object} examDetails - Exam details
 */
export const sendExamReminderEmail = async (student, examDetails) => {
    try {
        const subject = `⏰ Reminder: Exam "${examDetails.title}" starts soon`;

        const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0;">⏰ Exam Reminder</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
            <p>Dear <strong>${student.name}</strong>,</p>
            <p>This is a reminder that your exam <strong>"${examDetails.title}"</strong> is starting soon!</p>
            
            <div style="background: #f8f9ff; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p style="margin: 5px 0;"><strong>Start:</strong> ${new Date(examDetails.startDate).toLocaleString()}</p>
                <p style="margin: 5px 0;"><strong>Duration:</strong> ${examDetails.duration} minutes</p>
            </div>

            <p>Please ensure you are ready and logged in before the exam starts.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" 
                   style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Go to Dashboard
                </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
                Good luck!<br>
                SecureExam Team
            </p>
        </div>
    </div>
</body>
</html>
        `;

        await sendMail(student.email, subject, htmlBody);
        console.log(`✅ Reminder email sent to ${student.email}`);
        return { success: true };
    } catch (error) {
        console.error(`❌ Failed to send reminder to ${student.email}:`, error);
        return { success: false, error: error.message };
    }
};