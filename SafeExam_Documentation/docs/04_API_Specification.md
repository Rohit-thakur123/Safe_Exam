# API Specification

All endpoints use JSON unless noted otherwise. Protected endpoints require
`Authorization: Bearer <access-token>`.

## Coding Questions

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/coding-questions` | Teacher, Admin | Create a coding question. |
| GET | `/coding-questions` | Authenticated | List active coding questions with pagination. Supports `search`, `difficulty`, `language`, `createdBy`, `page`, and `limit`. |
| GET | `/coding-questions/all` | Authenticated | Compatibility alias for the coding-question list. |
| GET | `/coding-questions/:id` | Authenticated | Get one coding question. |
| PUT | `/coding-questions/:id` | Owner, Admin | Replace the editable coding-question fields. |
| DELETE | `/coding-questions/:id` | Owner, Admin | Delete an unattempted question and remove exam references. If an exam attempt references it, archive it instead. Exams left without questions are deactivated. |

Supported difficulties are `Easy`, `Medium`, and `Hard`. Supported languages
are `Python`, `Java`, `JavaScript`, `C`, and `C++`.

## Test Cases

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/coding-questions/:id/testcases` | Authenticated | Teachers/Admins receive all test cases. Students receive visible cases only, without testcase IDs, creator metadata, or hidden fields. |
| POST | `/coding-questions/:codingQuestionId/testcases` | Owner, Admin | Add a visible or hidden testcase. |
| PUT | `/coding-questions/:codingQuestionId/testcases/:testCaseId` | Owner, Admin | Edit testcase input, expected output, or visibility. |
| DELETE | `/coding-questions/:codingQuestionId/testcases/:testCaseId` | Owner, Admin | Delete a testcase. The final visible or hidden testcase cannot be removed. |
| POST | `/coding-questions/:codingQuestionId/testcases/:testCaseId/duplicate` | Owner, Admin | Duplicate a testcase directly after its source. |
| PUT | `/coding-questions/:codingQuestionId/testcases/reorder` | Owner, Admin | Reorder all testcases using `{ "orderedIds": ["..."] }`. Every testcase ID must appear exactly once. |

## Exams

The existing Exam resource now accepts an additional ordered
`codingQuestions` array alongside the existing `questions` array:

```json
{
  "title": "Mixed Assessment",
  "questions": ["mcqQuestionId"],
  "codingQuestions": ["codingQuestionId"],
  "duration": 60,
  "totalMarks": 100,
  "passingMarks": 40
}
```

| Method | Path | Access | Coding-question behavior |
|---|---|---|---|
| POST | `/exams/new` | Teacher | Validates active coding-question IDs, rejects duplicates, and preserves array order. At least one legacy or coding question is required. |
| PUT | `/exams/:id` | Exam owner | Supports attaching, removing, and reordering `codingQuestions`. Question composition cannot change after attempts exist. |
| GET | `/exams/all` | Authenticated | `questionsCount` includes legacy and coding questions. |
| GET | `/exams/:id` | Authenticated | Returns one combined ordered `questions` payload: legacy questions followed by coding questions. Student coding payloads include visible samples only. |

## Exam Attempts

| Method | Path | Access | Coding-question behavior |
|---|---|---|---|
| POST | `/exam-attempts/start` | Student in SEB | Starts the existing mixed exam attempt and returns MCQ/text/coding questions. Coding questions contain problem metadata, supported languages, starter code, and visible samples only. |
| POST | `/exam-attempts/submit` | Student in SEB | Existing final exam submission. Coding drafts are stored as answer strings but are not executed or evaluated in Milestones 3–4. |

## Compiler Exposure

The former public SafeExam proxy endpoint `POST /code/run` is no longer
registered. The isolated compiler projects remain unchanged for future
Milestones 5–6, and the student exam UI makes no compiler request.
