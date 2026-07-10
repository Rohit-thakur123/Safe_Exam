// Run from inside Backend/ : node mint-test-session.js <examId> <studentId> <examDurationMinutes>
// Prints a ready-to-open URL for the SEB frontend, skipping the (currently
// unfinished) email-link -> verify -> get-session-token chain.
require('dotenv').config();
const jwt = require('jsonwebtoken');

const [examId, studentId, durationStr] = process.argv.slice(2);

if (!examId || !studentId || !durationStr) {
  console.error('Usage: node mint-test-session.js <examId> <studentId> <examDurationMinutes>');
  process.exit(1);
}

const duration = parseInt(durationStr, 10);

const payload = {
  type: 'seb-session',
  examId,
  studentId,
  purpose: 'seb-exam-attempt',
  iat: Math.floor(Date.now() / 1000)
};

const token = jwt.sign(payload, process.env.JWT_SECRET, {
  expiresIn: `${duration + 30}m`
});

// Change the port below to whatever port your seb-frontend dev server is
// actually running on (see note below about running it on 5174).
const SEB_FRONTEND_PORT = 5174;

console.log('\nSEB session token minted.\n');
console.log(`Open this URL in your browser (seb-frontend must be running):\n`);
console.log(`http://localhost:${SEB_FRONTEND_PORT}/exam/${examId}/${token}\n`);