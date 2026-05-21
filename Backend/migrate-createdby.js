/**
 * Database Migration Script
 * Purpose: Fix missing createdBy fields in exams and questions
 * Date: October 4, 2025
 *
 * This script will:
 * 1. Find all exams without createdBy field
 * 2. Find all questions without createdBy field
 * 3. Assign them to a default teacher or prompt for teacher ID
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Exam from './src/models/exam/exam.js';
import Question from './src/models/exam/question.js';
import User from './src/models/User/user.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/secureexam';

async function migrateCreatedBy() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find a default teacher
        console.log('🔍 Finding default teacher...');
        const defaultTeacher = await User.findOne({ role: 'teacher', isActive: true });

        if (!defaultTeacher) {
            console.error('❌ No active teacher found in the database!');
            console.log('Please create a teacher account first, then run this script again.');
            process.exit(1);
        }

        console.log(`✅ Using default teacher: ${defaultTeacher.name} (${defaultTeacher.email})`);
        console.log(`   Teacher ID: ${defaultTeacher._id}\n`);

        // Migrate Exams
        console.log('📝 Checking exams...');
        const examsWithoutCreator = await Exam.find({
            $or: [
                { createdBy: { $exists: false } },
                { createdBy: null }
            ]
        });

        if (examsWithoutCreator.length > 0) {
            console.log(`⚠️  Found ${examsWithoutCreator.length} exams without createdBy field`);

            for (const exam of examsWithoutCreator) {
                exam.createdBy = defaultTeacher._id;
                await exam.save();
                console.log(`   ✅ Updated exam: "${exam.title}" (ID: ${exam._id})`);
            }

            console.log(`✅ Updated ${examsWithoutCreator.length} exams\n`);
        } else {
            console.log('✅ All exams have createdBy field\n');
        }

        // Migrate Questions
        console.log('📝 Checking questions...');
        const questionsWithoutCreator = await Question.find({
            $or: [
                { createdBy: { $exists: false } },
                { createdBy: null }
            ]
        });

        if (questionsWithoutCreator.length > 0) {
            console.log(`⚠️  Found ${questionsWithoutCreator.length} questions without createdBy field`);

            for (const question of questionsWithoutCreator) {
                question.createdBy = defaultTeacher._id;
                await question.save();
                console.log(`   ✅ Updated question: "${question.question.substring(0, 50)}..." (ID: ${question._id})`);
            }

            console.log(`✅ Updated ${questionsWithoutCreator.length} questions\n`);
        } else {
            console.log('✅ All questions have createdBy field\n');
        }

        // Summary
        console.log('═══════════════════════════════════════');
        console.log('📊 MIGRATION SUMMARY');
        console.log('═══════════════════════════════════════');
        console.log(`Exams updated:     ${examsWithoutCreator.length}`);
        console.log(`Questions updated: ${questionsWithoutCreator.length}`);
        console.log(`Default teacher:   ${defaultTeacher.name}`);
        console.log('═══════════════════════════════════════\n');

        // Verify the migration
        console.log('🔍 Verifying migration...');
        const remainingExams = await Exam.countDocuments({
            $or: [
                { createdBy: { $exists: false } },
                { createdBy: null }
            ]
        });

        const remainingQuestions = await Question.countDocuments({
            $or: [
                { createdBy: { $exists: false } },
                { createdBy: null }
            ]
        });

        if (remainingExams > 0 || remainingQuestions > 0) {
            console.log(`❌ Migration incomplete!`);
            console.log(`   Exams still missing: ${remainingExams}`);
            console.log(`   Questions still missing: ${remainingQuestions}`);
        } else {
            console.log('✅ Migration successful! All records have createdBy field.\n');
        }

        console.log('🎉 Migration completed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run migration
migrateCreatedBy();

