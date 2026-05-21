# 📧 Email Notification System - Documentation

## ✅ Implementation Complete!

Your SecureExam backend now has a **beautiful email notification system** that automatically sends formatted emails to students when they are assigned to exams.

## 🎯 What's Implemented

### 1. **Exam Model Updates** ✅
- Added `startTime` field (Format: "HH:MM" in 24-hour format)
- Added `endTime` field (Format: "HH:MM" in 24-hour format)
- Example: `"startTime": "09:30"`, `"endTime": "11:00"`

### 2. **Beautiful Email Templates** ✅
- Professionally designed HTML email with gradient headers
- Responsive design that looks great on all devices
- Color-coded sections for schedule, duration, marks
- Plain text fallback for email clients that don't support HTML
- Includes exam details, schedule, and important instructions

### 3. **Automatic Email Sending** ✅
- Emails sent automatically when creating exam with assigned students
- Emails sent when assigning students to existing exam
- Bulk email sending with rate limiting (500ms delay between emails)
- Email sending results included in API response

### 4. **Email Service Functions** ✅
- `sendExamAssignmentEmail()` - Send to single student
- `sendBulkExamAssignmentEmails()` - Send to multiple students
- `sendExamReminderEmail()` - Send reminder (can be scheduled)

## 📝 API Usage

### Creating Exam with Email Notifications

**POST** `/api/exams/new`
```json
{
  "title": "Mathematics Final Exam",
  "description": "Comprehensive test covering all topics",
  "questions": ["question_id_1", "question_id_2"],
  "duration": 120,
  "totalMarks": 100,
  "passingMarks": 60,
  "startDate": "2024-12-15",
  "endDate": "2024-12-15",
  "startTime": "09:30",
  "endTime": "11:30",
  "assignedStudents": ["student_id_1", "student_id_2"],
  "sendEmailNotification": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Exam created successfully",
  "id": "exam_id",
  "exam": { /* exam details */ },
  "emailNotifications": {
    "sent": 2,
    "failed": 0,
    "total": 2
  }
}
```

### Assigning Students with Email Notifications

**POST** `/api/exams/:examId/assign-students`
```json
{
  "studentIds": ["student_id_1", "student_id_2", "student_id_3"],
  "sendEmailNotification": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Students assigned to exam successfully",
  "assignedCount": 3,
  "emailNotifications": {
    "sent": 3,
    "failed": 0,
    "total": 3
  }
}
```

### Disabling Email Notifications

Set `sendEmailNotification: false` to skip sending emails:
```json
{
  "assignedStudents": ["student_id_1"],
  "sendEmailNotification": false
}
```

## 📧 Email Template Preview

The email includes:

### Header Section
- Beautiful gradient purple header
- Large "New Exam Assigned" title
- Professional styling

### Greeting
- Personalized with student name
- Clear introduction message

### Exam Details Box
- Highlighted exam title
- Description (if provided)
- Color-coded information boxes

### Schedule Section (Red/Pink)
- Start date and time
- End date and time
- Formatted in readable format

### Stats Grid
- **Duration** (Green box): Shows exam duration in minutes
- **Questions** (Blue box): Number of questions
- **Total Marks** (Yellow box): Maximum marks
- **Passing Marks** (Pink box): Minimum marks to pass

### Important Instructions (Yellow Box)
- Stable internet connection reminder
- Login 5 minutes early
- Cannot pause once started
- Device charging reminder
- Single session policy

### Call-to-Action Button
- Prominent "Go to Dashboard" button
- Links to frontend dashboard
- Purple gradient styling

### Footer
- Automated notification message
- Contact information
- Copyright notice

## 🎨 Email Format Examples

### Date Format
```
Input: "2024-12-15"
Output: "Friday, December 15, 2024"
```

### Time Format
```
Input: "09:30"
Output: "9:30 AM"

Input: "14:45"
Output: "2:45 PM"
```

## 🔧 Configuration

### SMTP Settings (Already Configured)
From your `.env` file:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=mmsinghal17@gmail.com
SMTP_PASS=mbpm hixt tini qddf
SMTP_FROM="Exam Admin <mmsinghal17@gmail.com>"
```

### Frontend URL
```env
FRONTEND_URL=http://localhost:5173
```
This is used in the email's "Go to Dashboard" button.

## 📊 Email Sending Flow

### When Creating Exam:
```
1. Teacher creates exam with assigned students
2. System validates all student IDs
3. Exam saved to database
4. If sendEmailNotification !== false:
   a. Prepare exam details
   b. For each student:
      - Generate beautiful HTML email
      - Generate plain text version
      - Send via SMTP
      - Wait 500ms (rate limiting)
   c. Collect results (sent/failed)
5. Return response with email stats
```

### When Assigning Students:
```
1. Teacher assigns students to existing exam
2. System validates student IDs
3. Update exam's assignedCandidates
4. If sendEmailNotification !== false:
   a. Fetch exam details
   b. Send emails to all assigned students
   c. Return results
5. Return response with email stats
```

## 🎯 Example Email Content

**Subject:** 📝 New Exam Assigned: Mathematics Final Exam

**Body:**
```
Dear John Student,

You have been assigned to take the following examination:

MATHEMATICS FINAL EXAM
Comprehensive test covering all topics

SCHEDULE
Start: Friday, December 15, 2024 at 9:30 AM
End: Friday, December 15, 2024 at 11:30 AM

EXAM DETAILS
Duration: 120 minutes
Questions: 25
Total Marks: 100
Passing Marks: 60

IMPORTANT INSTRUCTIONS
• Ensure you have a stable internet connection
• Login at least 5 minutes before the exam starts
• Once started, the exam cannot be paused
• Make sure your device is fully charged
• Only one active session is allowed per student

[Go to Dashboard Button]
```

## 🧪 Testing Email Functionality

### Test 1: Create Exam with Email
```bash
POST /api/exams/new
Authorization: Bearer <teacher_token>
{
  "title": "Test Exam",
  "questions": ["q1", "q2"],
  "duration": 30,
  "totalMarks": 50,
  "passingMarks": 30,
  "startDate": "2024-12-20",
  "startTime": "10:00",
  "assignedStudents": ["student_id"],
  "sendEmailNotification": true
}

# Check student's email inbox
# Should receive beautifully formatted email
```

### Test 2: Assign Students with Email
```bash
POST /api/exams/:examId/assign-students
Authorization: Bearer <teacher_token>
{
  "studentIds": ["student_id_1", "student_id_2"],
  "sendEmailNotification": true
}

# Both students should receive emails
```

### Test 3: Disable Email Notifications
```bash
POST /api/exams/new
{
  "...": "...",
  "assignedStudents": ["student_id"],
  "sendEmailNotification": false
}

# No emails sent
```

## 📝 Email Template Customization

To customize the email template, edit:
`src/utils/emailTemplates.js`

You can modify:
- Colors and styling
- Email structure
- Text content
- Logo/branding
- Call-to-action button

## ⚠️ Important Notes

1. **SMTP Configuration**: Emails are sent using your Gmail SMTP settings
2. **Rate Limiting**: 500ms delay between emails to avoid Gmail rate limits
3. **Fallback**: Plain text version included for all email clients
4. **Error Handling**: Failed emails are logged but don't block the API response
5. **Async Sending**: Emails sent asynchronously - API responds immediately

## 🚀 Benefits

✅ **Professional Appearance**: Beautiful, branded emails
✅ **Mobile Responsive**: Looks great on all devices
✅ **Automatic Sending**: No manual email needed
✅ **Bulk Support**: Send to multiple students efficiently
✅ **Error Tracking**: Know which emails succeeded/failed
✅ **Plain Text Fallback**: Works with all email clients

## 🔄 Future Enhancements (Optional)

Consider adding:
- Email templates for exam reminders
- Email when exam results are available
- Scheduled emails (send day before exam)
- Email queue system for large batches
- Email delivery status tracking

## 📞 Troubleshooting

### Emails Not Sending
```
1. Check SMTP credentials in .env
2. Verify Gmail "Less secure app access" or App Password
3. Check console for error messages
4. Test with single student first
```

### Emails Going to Spam
```
1. Verify SMTP_FROM matches SMTP_USER
2. Add SPF/DKIM records (production)
3. Ask students to whitelist sender
```

### Formatting Issues
```
1. Test in multiple email clients
2. Plain text version always works
3. Check HTML template syntax
```

## 🎉 You're All Set!

The email notification system is **fully functional**! 

**Try it now:**
1. Create an exam with assigned students
2. Set `sendEmailNotification: true`
3. Students will receive beautiful email notifications
4. Check the response for email sending stats

---

**Questions?** The email system is integrated and ready to use!

