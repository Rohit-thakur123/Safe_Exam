/**
 * Test script to verify exam assignment and token generation
 * Run this after assigning students to an exam
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Exam from './src/models/exam/exam.js';
import User from './src/models/User/user.js';
import { generateExamAccessToken, verifyExamAccessToken } from './src/utils/examLinkUtils.js';

dotenv.config();

const testAssignment = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to database');

        // Get the exam from your error (replace with actual ID)
        const examId = '68e0e73d257a851b70f55a42';
        const studentId = '68e0199aaf8e27f86bd04348';

        console.log('\n=== TESTING EXAM ASSIGNMENT ===');
        console.log('Exam ID:', examId);
        console.log('Student ID:', studentId);

        // Check if exam exists
        const exam = await Exam.findById(examId);
        if (!exam) {
            console.error('❌ Exam not found!');
            process.exit(1);
        }

        console.log('\n✅ Exam found:', exam.title);
        console.log('Exam is active:', exam.isActive);
        console.log('Assigned candidates count:', exam.assignedCandidates?.length || 0);

        if (exam.assignedCandidates && exam.assignedCandidates.length > 0) {
            console.log('\nAssigned candidates:');
            exam.assignedCandidates.forEach((candidateId, index) => {
                console.log(`  ${index + 1}. ${candidateId.toString()}`);
            });
        } else {
            console.log('\n⚠️  No students assigned to this exam!');
        }

        // Check if student exists
        const student = await User.findById(studentId);
        if (!student) {
            console.error('\n❌ Student not found!');
            process.exit(1);
        }

        console.log('\n✅ Student found:', student.name, `(${student.email})`);
        console.log('Student role:', student.role);
        console.log('Student is active:', student.isActive);

        // Check if student is in the assigned candidates
        const isAssigned = exam.assignedCandidates?.some(
            candidateId => candidateId.toString() === studentId
        );

        console.log('\n=== ASSIGNMENT CHECK ===');
        console.log('Is student assigned?', isAssigned ? '✅ YES' : '❌ NO');

        if (!isAssigned) {
            console.log('\n⚠️  PROBLEM IDENTIFIED:');
            console.log('The student is NOT in the exam\'s assignedCandidates array!');
            console.log('\nPossible causes:');
            console.log('1. Assignment API was not called properly');
            console.log('2. Assignment API failed silently');
            console.log('3. Database save failed');
            console.log('\nTo fix:');
            console.log('1. Re-assign the student to the exam from the teacher dashboard');
            console.log('2. Check the backend logs during assignment');
            console.log('3. Verify the assignment API is working');
        }

        // Test token generation and verification
        console.log('\n=== TESTING TOKEN ===');
        const token = generateExamAccessToken(examId, studentId, exam.duration);
        console.log('Generated token:', token.substring(0, 50) + '...');

        const decoded = verifyExamAccessToken(token);
        console.log('\n✅ Token verification successful!');
        console.log('Token examId:', decoded.examId);
        console.log('Token studentId:', decoded.studentId);
        console.log('Token type:', decoded.type);

        // Compare IDs
        console.log('\n=== ID COMPARISON ===');
        console.log('Exam ID match:', decoded.examId === examId ? '✅' : '❌');
        console.log('Student ID match:', decoded.studentId === studentId ? '✅' : '❌');

        console.log('\n=== TEST COMPLETE ===');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from database');
    }
};

testAssignment();

