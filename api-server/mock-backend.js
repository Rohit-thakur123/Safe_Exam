import express from 'express';

const app = express();
app.use(express.json());

/**
 * Mock Backend Server for Testing
 * This simulates the main backend's verify-exam-link endpoint
 */

app.post('/api/seb/verify-exam-link', (req, res) => {
  const { examId, studentId, token } = req.body;
  
  console.log('Received verification request:', { examId, studentId, token });
  
  // Simulate different scenarios based on token
  if (token === 'invalid-token') {
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired exam access token'
    });
  }
  
  if (token === 'cannot-attempt') {
    return res.json({
      success: true,
      message: 'Exam found',
      data: {
        examId,
        studentId,
        exam: {
          title: 'Mathematics Final Exam',
          description: 'Final exam covering chapters 1-10',
          duration: 120,
          totalMarks: 100,
          passingMarks: 40,
          startDate: '2025-10-05T09:00:00.000Z',
          endDate: '2025-10-05T11:00:00.000Z',
          questionsCount: 50
        },
        student: {
          name: 'John Doe',
          email: 'john@example.com'
        },
        canAttempt: false, // Student cannot attempt
        attemptStatus: {
          hasAttempted: true,
          previousAttempts: 1,
          allowRetakes: false
        }
      }
    });
  }
  
  // Default: Successful validation
  res.json({
    success: true,
    message: 'Exam is available',
    data: {
      examId,
      studentId,
      exam: {
        title: 'Mathematics Final Exam',
        description: 'Final exam covering chapters 1-10',
        duration: 120,
        totalMarks: 100,
        passingMarks: 40,
        startDate: '2025-10-05T09:00:00.000Z',
        endDate: '2025-10-05T11:00:00.000Z',
        questionsCount: 50
      },
      student: {
        name: 'John Doe',
        email: 'john@example.com'
      },
      canAttempt: true,
      attemptStatus: {
        hasAttempted: false,
        previousAttempts: 0,
        allowRetakes: false
      }
    }
  });
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`🧪 Mock Backend Server running on port ${PORT}`);
  console.log('');
  console.log('Test scenarios:');
  console.log('- Use token "invalid-token" to test invalid token error');
  console.log('- Use token "cannot-attempt" to test cannot attempt error');
  console.log('- Use any other token for successful validation');
});
