# Database Design

Collections: Users, Exams, Questions, CodingQuestions, TestCases, Attempts,
Submissions, Results.

## Exam coding-question integration

The existing `Exams` collection retains its legacy ordered `questions`
references and adds:

```text
codingQuestions: ObjectId[] -> CodingQuestion
```

No separate coding-exam collection is introduced. The order of IDs in
`codingQuestions` is the teacher-defined coding-question order. Duplicate IDs
are rejected by the API.

Deleting a coding question removes references from exams that have no
attempts. If an existing attempt depends on the question, the question is
archived (`isActive: false`) so the historical exam reference remains valid.
