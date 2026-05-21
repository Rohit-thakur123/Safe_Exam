import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User/user.js';
import Question from './src/models/exam/question.js';
import Exam from './src/models/exam/exam.js';

dotenv.config();

const seedDatabase = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear existing data
        await User.deleteMany({});
        await Question.deleteMany({});
        await Exam.deleteMany({});
        console.log('Cleared existing data');

        // Create test users
        const teacher = await User.create({
            name: 'John Teacher',
            email: 'teacher@test.com',
            password: 'teacher123',
            role: 'teacher'
        });

        const student = await User.create({
            name: 'Jane Student',
            email: 'student@test.com',
            password: 'student123',
            role: 'student'
        });

        console.log('Created test users:');
        console.log('Teacher:', teacher.email, '/ teacher123');
        console.log('Student:', student.email, '/ student123');

        // Create sample questions
        const questions = await Question.insertMany([
            {
                question: 'What is 2 + 2?',
                options: ['3', '4', '5', '6'],
                answer: '4',
                explanation: 'Basic arithmetic: 2 + 2 = 4',
                difficulty: 'easy',
                category: 'Mathematics',
                createdBy: teacher._id
            },
            {
                question: 'What is the capital of France?',
                options: ['London', 'Berlin', 'Paris', 'Madrid'],
                answer: 'Paris',
                explanation: 'Paris is the capital and largest city of France.',
                difficulty: 'easy',
                category: 'Geography',
                createdBy: teacher._id
            },
            {
                question: 'Which planet is known as the Red Planet?',
                options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
                answer: 'Mars',
                explanation: 'Mars appears red due to iron oxide on its surface.',
                difficulty: 'easy',
                category: 'Science',
                createdBy: teacher._id
            },
            {
                question: 'What is the largest ocean on Earth?',
                options: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'],
                answer: 'Pacific Ocean',
                explanation: 'The Pacific Ocean is the largest and deepest ocean.',
                difficulty: 'medium',
                category: 'Geography',
                createdBy: teacher._id
            },
            {
                question: 'Who wrote "Romeo and Juliet"?',
                options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'],
                answer: 'William Shakespeare',
                explanation: 'Shakespeare wrote this famous tragedy in the 1590s.',
                difficulty: 'medium',
                category: 'Literature',
                createdBy: teacher._id
            },
            {
                question: 'What is the chemical symbol for gold?',
                options: ['Go', 'Gd', 'Au', 'Ag'],
                answer: 'Au',
                explanation: 'Au comes from the Latin word "aurum" meaning gold.',
                difficulty: 'medium',
                category: 'Science',
                createdBy: teacher._id
            },
            {
                question: 'In which year did World War II end?',
                options: ['1943', '1944', '1945', '1946'],
                answer: '1945',
                explanation: 'World War II ended in 1945 with the surrender of Japan.',
                difficulty: 'medium',
                category: 'History',
                createdBy: teacher._id
            },
            {
                question: 'What is the square root of 144?',
                options: ['10', '11', '12', '13'],
                answer: '12',
                explanation: '12 × 12 = 144',
                difficulty: 'easy',
                category: 'Mathematics',
                createdBy: teacher._id
            },
            {
                question: 'Which programming language is known for its use in web development?',
                options: ['Python', 'JavaScript', 'C++', 'Java'],
                answer: 'JavaScript',
                explanation: 'JavaScript is the primary language for web browser programming.',
                difficulty: 'easy',
                category: 'Technology',
                createdBy: teacher._id
            },
            {
                question: 'What is the speed of light in vacuum?',
                options: ['300,000 km/s', '150,000 km/s', '450,000 km/s', '600,000 km/s'],
                answer: '300,000 km/s',
                explanation: 'Light travels at approximately 299,792 km/s in vacuum.',
                difficulty: 'hard',
                category: 'Physics',
                createdBy: teacher._id
            }
        ]);

        console.log(`Created ${questions.length} sample questions`);

        // Create sample exam
        const exam = await Exam.create({
            title: 'Sample General Knowledge Quiz',
            description: 'A quick test covering basic topics including math, science, geography, and history.',
            questions: questions.slice(0, 5).map(q => q._id),
            duration: 10, // 10 minutes for quick testing
            totalMarks: 50,
            passingMarks: 30,
            isActive: true,
            createdBy: teacher._id
        });

        console.log('Created sample exam:', exam.title);

        // Create another exam
        const exam2 = await Exam.create({
            title: 'Advanced Science Test',
            description: 'Test your knowledge in science and technology',
            questions: questions.slice(5, 10).map(q => q._id),
            duration: 15,
            totalMarks: 50,
            passingMarks: 35,
            isActive: true,
            createdBy: teacher._id
        });

        console.log('Created sample exam:', exam2.title);

        console.log('\n✅ Database seeded successfully!');
        console.log('\n📝 Test Credentials:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Teacher Account:');
        console.log('  Email: teacher@test.com');
        console.log('  Password: teacher123');
        console.log('  Role: teacher');
        console.log('\nStudent Account:');
        console.log('  Email: student@test.com');
        console.log('  Password: student123');
        console.log('  Role: student');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();

