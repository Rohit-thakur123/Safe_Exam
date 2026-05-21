import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { sebAPI } from '../../services/api';
import { Clock, Calendar, CheckCircle, XCircle, AlertTriangle, Download, BookOpen } from 'lucide-react';

interface ExamVerificationProps {
  examIdOverride?: string;
  tokenOverride?: string;
}

interface ExamInfo {
  examId: string;
  studentId: string;
  exam: {
    title: string;
    description: string;
    duration: number;
    totalMarks: number;
    passingMarks: number;
    startDate: string;
    endDate: string;
    questionsCount: number;
  };
  student: {
    name: string;
    email: string;
  };
  canAttempt: boolean;
  attemptStatus: {
    hasAttempted: boolean;
    previousAttempts: number;
    allowRetakes: boolean;
  };
}

const ExamVerification: React.FC<ExamVerificationProps> = ({ examIdOverride, tokenOverride }) => {
  const params = useParams<{ examId: string; studentId: string; token: string }>();
  
  // Use override props if provided (from query params), otherwise use URL params
  const examId = examIdOverride || params.examId;
  const token = tokenOverride || params.token;
  
  // Extract studentId from URL params or decode from token
  const [studentId, setStudentId] = useState<string | undefined>(params.studentId);
  
  const [examInfo, setExamInfo] = useState<ExamInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    const verifyExamLink = async () => {
      if (!examId || !token) {
        setError('Invalid exam link. Please check the link in your email.');
        setLoading(false);
        return;
      }

      // If studentId is not in URL, try to decode from token
      let resolvedStudentId = studentId;
      if (!resolvedStudentId && token) {
        try {
          // Decode JWT token to extract studentId
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const payload = JSON.parse(jsonPayload);
          resolvedStudentId = payload.studentId;
          setStudentId(resolvedStudentId);
        } catch (err) {
          console.error('Failed to decode token:', err);
          setError('Invalid token format. Please use the link from your email.');
          setLoading(false);
          return;
        }
      }

      if (!resolvedStudentId) {
        setError('Student information not found. Please use the link from your email.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await sebAPI.verifyExamLink(examId, resolvedStudentId, token);
        
        if (response.success) {
          setExamInfo(response.data);
          
          // Calculate countdown if exam hasn't started
          if (!response.data.canAttempt && response.data.exam.startDate) {
            const startTime = new Date(response.data.exam.startDate).getTime();
            const now = Date.now();
            const diff = Math.floor((startTime - now) / 1000);
            if (diff > 0) {
              setCountdown(diff);
            }
          }
        } else {
          setError(response.error || 'Failed to verify exam link');
        }
      } catch (err) {
        console.error('Error verifying exam link:', err);
        const error = err as { response?: { data?: { error?: string } } };
        setError(error.response?.data?.error || 'Failed to verify exam link. Please try again or contact support.');
      } finally {
        setLoading(false);
      }
    };

    verifyExamLink();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId, token]); // studentId will be resolved internally from token

  // Countdown timer effect
  useEffect(() => {
    if (countdown && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      // Reload page when countdown reaches 0
      window.location.reload();
    }
  }, [countdown]);

  const handleLaunchSecureExam = async () => {
    if (!examId || !studentId || !token) return;

    try {
      setDownloading(true);
      setError('');

      // Call backend to generate SEB config
      const blob = await sebAPI.generateSEBConfig(examId, studentId, token);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `secure-exam-${examId}-${Date.now()}.seb`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Show success message
      setDownloadSuccess(true);
      
    } catch (err) {
      console.error('Error launching secure exam:', err);
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to generate exam configuration. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying exam link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !examInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-12 text-center">
            <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Verification Failed</h2>
            <p className="text-gray-700 mb-6">{error}</p>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Please check your email for the correct exam link or contact your teacher for assistance.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (downloadSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl">
          <CardHeader className="text-center pb-4">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <CardTitle className="text-2xl">Configuration Downloaded Successfully!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-white rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-lg text-gray-900 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                Next Steps:
              </h3>
              <ol className="list-decimal list-inside space-y-3 text-gray-700">
                <li className="pl-2">Locate the downloaded file: <code className="bg-gray-100 px-2 py-1 rounded text-sm">secure-exam-{examId?.substring(0, 8)}....seb</code></li>
                <li className="pl-2">Double-click the file to open it</li>
                <li className="pl-2">Safe Exam Browser will launch automatically</li>
                <li className="pl-2">Your computer will be locked into secure exam mode</li>
                <li className="pl-2">Complete your exam in the secure browser</li>
                <li className="pl-2">After submission, you can quit using the quit password (if required)</li>
              </ol>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Important:</h3>
                  <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside space-y-1">
                    <li>Do not close Safe Exam Browser during the exam</li>
                    <li>Your progress is auto-saved periodically</li>
                    <li>If you have technical issues, contact support immediately</li>
                    <li>Ensure you have a stable internet connection</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Download className="w-5 h-5 mr-2 text-blue-600" />
                Safe Exam Browser Required
              </h3>
              <p className="text-sm text-gray-700 mb-3">
                Don't have Safe Exam Browser installed? Download it from the official website:
              </p>
              <div className="space-y-2">
                <a 
                  href="https://safeexambrowser.org/download_en.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-blue-600 hover:text-blue-700 underline text-sm"
                >
                  📥 Download for Windows
                </a>
                <a 
                  href="https://safeexambrowser.org/download_en.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-blue-600 hover:text-blue-700 underline text-sm"
                >
                  📥 Download for macOS
                </a>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <Button onClick={handleLaunchSecureExam} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-3xl">Exam Verification</CardTitle>
          <p className="text-gray-600 mt-2">Please review the exam details before starting</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Student Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Student Information</h3>
            <p className="text-gray-700"><strong>Name:</strong> {examInfo?.student.name}</p>
            <p className="text-gray-700"><strong>Email:</strong> {examInfo?.student.email}</p>
          </div>

          {/* Exam Details */}
          <div className="bg-white rounded-lg p-6 space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">{examInfo?.exam.title}</h3>
            {examInfo?.exam.description && (
              <p className="text-gray-700">{examInfo.exam.description}</p>
            )}
            
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-semibold text-gray-900">{examInfo?.exam.duration} minutes</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <BookOpen className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Total Questions</p>
                  <p className="font-semibold text-gray-900">{examInfo?.exam.questionsCount}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Total Marks</p>
                  <p className="font-semibold text-gray-900">{examInfo?.exam.totalMarks}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Passing Marks</p>
                  <p className="font-semibold text-gray-900">{examInfo?.exam.passingMarks}</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-600">Start Date:</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatDate(examInfo?.exam.startDate || '')}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-red-600" />
                <span className="text-sm text-gray-600">End Date:</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatDate(examInfo?.exam.endDate || '')}
                </span>
              </div>
            </div>
          </div>

          {/* Attempt Status */}
          {examInfo?.attemptStatus.hasAttempted && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Previous Attempts</h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    You have already attempted this exam {examInfo.attemptStatus.previousAttempts} time(s).
                    {!examInfo.attemptStatus.allowRetakes && ' Retakes are not allowed for this exam.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Countdown or Error */}
          {countdown !== null && countdown > 0 ? (
            <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
              <div className="flex">
                <Clock className="h-5 w-5 text-orange-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-orange-800">Exam Not Started Yet</h3>
                  <p className="mt-1 text-sm text-orange-700">
                    This exam will be available in: <strong className="text-lg">{formatTime(countdown)}</strong>
                  </p>
                  <p className="mt-1 text-xs text-orange-600">
                    This page will automatically refresh when the exam starts.
                  </p>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <XCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Cannot Start Exam</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Instructions */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">📋 Exam Instructions:</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
              <li>Ensure you have Safe Exam Browser installed on your computer</li>
              <li>Click the "Launch Secure Exam" button to download the configuration file</li>
              <li>Open the downloaded .seb file to start the exam</li>
              <li>Your computer will be locked in secure mode during the exam</li>
              <li>You cannot switch tabs or open other applications</li>
              <li>Answer all questions before submitting</li>
              <li>Your progress will be auto-saved periodically</li>
              <li>Submit the exam before time runs out</li>
            </ul>
          </div>

          {/* Action Button */}
          <div className="flex justify-center pt-4">
            {examInfo?.canAttempt ? (
              <Button 
                onClick={handleLaunchSecureExam}
                disabled={downloading}
                className="px-8 py-3 text-lg"
                size="lg"
              >
                {downloading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Generating Configuration...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Launch Secure Exam
                  </>
                )}
              </Button>
            ) : (
              <Button disabled className="px-8 py-3 text-lg" size="lg">
                <XCircle className="w-5 h-5 mr-2" />
                Exam Not Available
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExamVerification;
