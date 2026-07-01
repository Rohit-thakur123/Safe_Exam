# Teacher Coding Question Module — Professional Redesign

## Goal
Redesign the Teacher Coding Question Module to match production standards similar to LeetCode/HackerRank admin panels. The existing backend APIs and Docker execution layer are correct and will be preserved. Only the Teacher-facing frontend pages and the backend model/validation will be updated to support per-language starter codes.

---

## Key Gaps in Current Implementation
1. **Single `starterCode` field** — one string for all languages. Must become per-language `starterCode` object: `{ python: '', java: '', cpp: '', c: '', javascript: '' }`.
2. **No Examples array** — teacher cannot create/edit examples shown to students.
3. **CodingQuestions list uses cards** — must become a professional sortable table.
4. **CreateCodingQuestion is one massive flat form** — must be sectioned.
5. **No Duplicate Question action** on the list.
6. **No Preview** — teacher cannot see what the student sees.
7. **No tags/status fields** on the question.
8. **No per-language Monaco tabs** on the starter code section.
9. **CodingQuestionDetails** mixes question details and testcase management into one view.
10. **Teacher Dashboard** has debug `console.log`s that must be removed.

---

## Backend Changes

### 1. CodingQuestion Model (`Backend/src/models/exam/codingQuestion.js`)
- Remove single `starterCode: String` field.
- Add `starterCode: { type: Map, of: String }` — stored as language-keyed map.
- Add `examples: [{ input, output, explanation }]` array.
- Add `tags: [String]` array (optional, no validation required).
- Keep `isActive` boolean (used as status: active/inactive).
- Keep all other fields unchanged.

### 2. Validation Middleware (`Backend/src/middlewares/codingQuestion.validation.js`)
- Remove `starterCode` string check.
- Add validation: `starterCode` must be an object where every key in `supportedLanguages` is present.
- `examples` — if present, each entry must have `input` and `output`.

### 3. CodingQuestion Controller (`Backend/src/controllers/codingQuestionController.js`)
- Add `duplicateCodingQuestion` endpoint: copies the question, clears testcases (returns a clean draft).
- Update filter logic: teachers see their own questions regardless of `isActive` value (teacher admin view vs student view).

### 4. CodingQuestion Routes (`Backend/src/routes/codingQuestion.routes.js`)
- Add `POST /:id/duplicate` route.

---

## Frontend Changes

### 5. Types (`frontend/src/types/index.ts`)
- Update `CodingQuestion` interface: `starterCode` becomes `Record<string, string>`.
- Add `examples?: { input: string; output: string; explanation?: string }[]`.
- Add `tags?: string[]`.
- Add `isActive?: boolean`.

### 6. API Service (`frontend/src/services/api.ts`)
- Add `codingQuestionAPI.duplicate(id)` method.
- Add `codingQuestionAPI.updateStatus(id, isActive)` method.

### 7. `CodingQuestions.tsx` — Complete Redesign (List Page)
- Professional table with columns: Title, Difficulty, Marks, Languages, Visible, Hidden, Created, Status, Actions.
- Filter bar: search + difficulty + language + status.
- Actions: Edit, Duplicate, Delete, Preview, Manage Testcases.
- Pagination.
- Reuse `TeacherNavbar` pattern (use shared nav from Dashboard).

### 8. `CreateCodingQuestion.tsx` — Complete Redesign (Create/Edit Page)
**Sectioned layout:**
- Section 1: Basic Information (Title, Difficulty, Marks, Time Limit, Memory Limit, Status, Tags)
- Section 2: Problem Statement (Description, Constraints, Input Format, Output Format, Explanation)
- Section 3: Examples (Add/Edit/Delete/Reorder examples with Input, Output, Explanation — LeetCode style)
- Section 4: Supported Languages (checkbox pills)
- Section 5: Starter Code (Monaco Editor with language tabs, one per selected language)
- Submit: Validate all sections with inline error display.

### 9. `CodingQuestionDetails.tsx` → Rename/Repurpose as `ManageTestCases.tsx`
- Focused purely on testcase management.
- Tabs: Visible / Hidden.
- Add, Edit, Delete, Duplicate, Reorder (drag or up/down arrows).
- Show question title at top with breadcrumb.

### 10. New: `CodingQuestionPreview.tsx`
- Preview page accessible via `/teacher/coding-questions/:id/preview`.
- Renders a read-only version of `CodingAssessment` component (the student view).
- Shows a "Preview Mode" banner clearly visible to teacher.

### 11. `App.tsx`
- Add route for `/teacher/coding-questions/:questionId/preview`.
- Keep all existing routes untouched.

### 12. Teacher Dashboard (`teacher/Dashboard.tsx`)
- Remove debug `console.log` statements.

---

## Data Migration
- Existing questions have `starterCode` as a string. When loading, the edit form falls back gracefully: if `starterCode` is a string, pre-fill the first selected language with that string, other languages empty.
- No destructive migration script needed. Backward compatible.

---

## Verification Plan
| Item | Verification |
|------|-------------|
| Create Question | Submit with all sections → stored in DB |
| Edit Question | Load existing question → all fields pre-filled → save |
| Per-language starter code | Switch tabs in Monaco → each persists independently |
| Duplicate | Duplicates question details without testcases |
| Delete | Deletes or archives correctly |
| Manage Testcases | Add/Edit/Delete/Duplicate/Reorder visible and hidden |
| Preview | Shows student view correctly |
| List Table | Search/Filter/Paginate work |
| Backend validation | Missing fields return 400 errors |
| Student UI unchanged | TakeExam.tsx, CodingAssessment.tsx not modified |
