// Email templates for exam notifications

export const getExamAssignmentEmailTemplate = (studentName, examDetails) => {
    const { title, description, startDate, endDate, startTime, endTime, duration, totalMarks, passingMarks, questionsCount, examLink } = examDetails;

    // Format dates
    const formatDate = (date) => {
        if (!date) return 'Not specified';
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (time) => {
        if (!time) return '';
        // Convert 24-hour format to 12-hour format
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exam Assignment Notification</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                                📝 New Exam Assigned
                            </h1>
                            <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">
                                You have been assigned to a new examination
                            </p>
                        </td>
                    </tr>

                    <!-- Greeting -->
                    <tr>
                        <td style="padding: 30px 30px 20px 30px;">
                            <p style="margin: 0; color: #333333; font-size: 16px; line-height: 1.6;">
                                Dear <strong>${studentName}</strong>,
                            </p>
                            <p style="margin: 15px 0 0 0; color: #555555; font-size: 15px; line-height: 1.6;">
                                You have been assigned to take the following examination. Please review the details carefully and ensure you are available at the scheduled time.
                            </p>
                        </td>
                    </tr>

                    <!-- Exam Title -->
                    <tr>
                        <td style="padding: 20px 30px;">
                            <div style="background-color: #f8f9ff; border-left: 4px solid #667eea; padding: 20px; border-radius: 8px;">
                                <h2 style="margin: 0 0 10px 0; color: #667eea; font-size: 22px; font-weight: 600;">
                                    ${title}
                                </h2>
                                ${description ? `<p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.5;">${description}</p>` : ''}
                            </div>
                        </td>
                    </tr>

                    <!-- Exam Details -->
                    <tr>
                        <td style="padding: 0 30px 20px 30px;">
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                
                                <!-- Schedule -->
                                <tr>
                                    <td colspan="2" style="padding: 15px 0;">
                                        <div style="background-color: #fff5f5; border-radius: 8px; padding: 15px;">
                                            <h3 style="margin: 0 0 10px 0; color: #c53030; font-size: 16px;">
                                                📅 Schedule
                                            </h3>
                                            <table role="presentation" style="width: 100%;">
                                                <tr>
                                                    <td style="padding: 5px 0; color: #666666; font-size: 14px;">
                                                        <strong>Start:</strong>
                                                    </td>
                                                    <td style="padding: 5px 0; color: #333333; font-size: 14px; text-align: right;">
                                                        ${formatDate(startDate)} ${startTime ? `at ${formatTime(startTime)}` : ''}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 5px 0; color: #666666; font-size: 14px;">
                                                        <strong>End:</strong>
                                                    </td>
                                                    <td style="padding: 5px 0; color: #333333; font-size: 14px; text-align: right;">
                                                        ${formatDate(endDate)} ${endTime ? `at ${formatTime(endTime)}` : ''}
                                                    </td>
                                                </tr>
                                            </table>
                                        </div>
                                    </td>
                                </tr>

                                <!-- Exam Stats -->
                                <tr>
                                    <td style="padding: 10px 10px 10px 0; width: 50%;">
                                        <div style="background-color: #f0fdf4; border-radius: 8px; padding: 15px; text-align: center;">
                                            <div style="font-size: 28px; font-weight: bold; color: #166534;">
                                                ${duration}
                                            </div>
                                            <div style="color: #15803d; font-size: 13px; margin-top: 5px;">
                                                Minutes Duration
                                            </div>
                                        </div>
                                    </td>
                                    <td style="padding: 10px 0 10px 10px; width: 50%;">
                                        <div style="background-color: #eff6ff; border-radius: 8px; padding: 15px; text-align: center;">
                                            <div style="font-size: 28px; font-weight: bold; color: #1e40af;">
                                                ${questionsCount || 'TBD'}
                                            </div>
                                            <div style="color: #2563eb; font-size: 13px; margin-top: 5px;">
                                                Questions
                                            </div>
                                        </div>
                                    </td>
                                </tr>

                                <!-- Marks -->
                                <tr>
                                    <td style="padding: 10px 10px 10px 0;">
                                        <div style="background-color: #fef3c7; border-radius: 8px; padding: 15px; text-align: center;">
                                            <div style="font-size: 28px; font-weight: bold; color: #92400e;">
                                                ${totalMarks}
                                            </div>
                                            <div style="color: #b45309; font-size: 13px; margin-top: 5px;">
                                                Total Marks
                                            </div>
                                        </div>
                                    </td>
                                    <td style="padding: 10px 0 10px 10px;">
                                        <div style="background-color: #fce7f3; border-radius: 8px; padding: 15px; text-align: center;">
                                            <div style="font-size: 28px; font-weight: bold; color: #9f1239;">
                                                ${passingMarks}
                                            </div>
                                            <div style="color: #be123c; font-size: 13px; margin-top: 5px;">
                                                Passing Marks
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Important Notes -->
                    <tr>
                        <td style="padding: 0 30px 30px 30px;">
                            <div style="background-color: #fef9c3; border-left: 4px solid #eab308; padding: 15px; border-radius: 8px;">
                                <h3 style="margin: 0 0 10px 0; color: #854d0e; font-size: 15px;">
                                    ⚠️ Important Instructions
                                </h3>
                                <ul style="margin: 0; padding-left: 20px; color: #713f12; font-size: 14px; line-height: 1.6;">
                                    <li>Ensure you have a stable internet connection</li>
                                    <li>Login at least 5 minutes before the exam starts</li>
                                    <li>Once started, the exam cannot be paused</li>
                                    <li>Make sure your device is fully charged</li>
                                    <li>Only one active session is allowed per student</li>
                                </ul>
                            </div>
                        </td>
                    </tr>

                    <!-- CTA Button with unique exam link -->
                    <tr>
                        <td style="padding: 0 30px 30px 30px; text-align: center;">
                            ${examLink ? `
                            <div style="margin-bottom: 20px;">
                                <p style="color: #667eea; font-size: 15px; font-weight: 600; margin-bottom: 10px;">
                                    🔗 Your Unique Exam Link
                                </p>
                                <a href="${examLink}" 
                                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                                    🚀 Start Exam
                                </a>
                                <p style="margin-top: 15px; color: #666; font-size: 13px;">
                                    This link is unique to you and can only be used once.
                                </p>
                            </div>
                            ` : `
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" 
                               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                                🚀 Go to Dashboard
                            </a>
                            `}
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e9ecef;">
                            <p style="margin: 0 0 10px 0; color: #6c757d; font-size: 13px;">
                                This is an automated notification from SecureExam Platform
                            </p>
                            <p style="margin: 0; color: #adb5bd; font-size: 12px;">
                                If you have any questions, please contact your instructor.
                            </p>
                            <p style="margin: 15px 0 0 0; color: #adb5bd; font-size: 12px;">
                                © ${new Date().getFullYear()} SecureExam. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
};

// Plain text version for email clients that don't support HTML
export const getExamAssignmentPlainText = (studentName, examDetails) => {
    const { title, description, startDate, endDate, startTime, endTime, duration, totalMarks, passingMarks, questionsCount, examLink } = examDetails;

    const formatDate = (date) => {
        if (!date) return 'Not specified';
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return `
NEW EXAM ASSIGNED - SECUREEXAM PLATFORM
========================================

Dear ${studentName},

You have been assigned to take the following examination:

EXAM DETAILS
------------
Title: ${title}
${description ? `Description: ${description}` : ''}

SCHEDULE
--------
Start: ${formatDate(startDate)} ${startTime ? `at ${startTime}` : ''}
End: ${formatDate(endDate)} ${endTime ? `at ${endTime}` : ''}
Duration: ${duration} minutes

EXAM INFORMATION
----------------
Total Questions: ${questionsCount || 'TBD'}
Total Marks: ${totalMarks}
Passing Marks: ${passingMarks}

${examLink ? `
YOUR UNIQUE EXAM LINK
---------------------
${examLink}

⚠️ IMPORTANT: This link is unique to you and should not be shared.
It will direct you to a secure examination environment.
` : ''}

IMPORTANT INSTRUCTIONS
----------------------
• Ensure you have a stable internet connection
• Login at least 5 minutes before the exam starts
• Once started, the exam cannot be paused
• Make sure your device is fully charged
• Only one active session is allowed per student

${examLink ? 'Click the link above when you are ready to start the exam.' : 'Login to your dashboard to access the exam.'}

Good luck!

---
SecureExam Platform
This is an automated notification. Please do not reply to this email.
    `;
};
