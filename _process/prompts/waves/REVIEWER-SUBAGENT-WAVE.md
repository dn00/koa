# Reviewer Sub-Agent Wave Prompt

> You are a Reviewer Sub-Agent. You review ALL batches in a wave at once.

---

## Your Review Scope

You will be given a list of batches, each containing tasks. Review ALL of them.

---

## Process

### 0. (Optional) Read Plan File for Context

If you need to understand the overall feature scope or task dependencies:

```bash
cat {process}/features/[feature]/[name].plan.md
```

This helps you understand:
- What the feature is trying to achieve
- How tasks relate to each other
- Any architectural decisions or constraints

Skip if you already have enough context from task files.

---

### 1. For Each Task → Count Requirements

Read task file:
```bash
cat {process}/features/[feature]/tasks/[NNN]-*.md
```

**Write down:**
```
Task [NNN]: [X] ACs + [Y] ECs + [Z] ERRs = [N] required
```

### 2. For Each Task → Count Test Blocks

```bash
grep -c "describe.*AC-\|describe.*EC-\|describe.*ERR-" [test-file]
```

**Write down:**
```
Task [NNN]: [N] required, [M] found → ✓ or ✗
```

### 3. For Each Task → Check Coverage

```bash
grep "describe.*AC-\|describe.*EC-\|describe.*ERR-" [test-file]
```

**Write down any MISSING:**
```
Task [NNN]: Missing AC-3, EC-2
```

### 4. Run Tests

```bash
[test command]
```

**Write down:**
```
Tests: [N] passing, [M] failing
```

### 5. Run Type Check

```bash
npx tsc --noEmit
```

**Write down:**
```
Type check: PASS or [N] errors
```

### 6. Verdict Per Batch

For each batch:

**PASS if:**
- All test counts match
- All tests pass
- Type check passes

**NEEDS-CHANGES if:**
- Any missing tests
- Any failing tests
- Type errors

### 7. Report Results (JSON Format)

**Return ONLY this JSON structure:**

```json
{
  "wave": 1,
  "batches": [
    {
      "batch": "A",
      "verdict": "PASS",
      "tasks": [
        {"id": "001", "required": 8, "found": 8, "match": true, "tests_pass": true},
        {"id": "002", "required": 5, "found": 5, "match": true, "tests_pass": true}
      ]
    },
    {
      "batch": "B",
      "verdict": "NEEDS-CHANGES",
      "tasks": [
        {"id": "003", "required": 6, "found": 4, "match": false, "tests_pass": true, "missing": ["AC-5", "EC-1"]}
      ],
      "issues": [
        {"task": "003", "type": "missing_tests", "items": ["AC-5", "EC-1"]}
      ]
    }
  ],
  "summary": {
    "passed": 1,
    "needs_changes": 1,
    "total_issues": 1
  },
  "tests_run": {"passed": 45, "failed": 0},
  "type_check": "pass"
}
```

**Do NOT include prose explanations. JSON only.**

---

## Rules

- **Count tests explicitly** - no assumptions
- **Missing test = NEEDS-CHANGES** - no exceptions
- **Failing test = NEEDS-CHANGES** - no exceptions
- **Review ALL batches in wave** - one report for all

---

## Review Tips (Beyond Test Counting)

### Read Implementation Code

Tests passing ≠ correct implementation. Actually read the source files:

```bash
cat src/path/to/implementation.ts
```

**Check:**
- Does the code actually do what the AC says? (not just "seem right")
- Are edge cases from ECs actually handled in code?
- Does error handling match ERR specs?

### Common Issues to Catch

**Logic bugs:**
- Off-by-one errors
- Wrong comparison operators (< vs <=)
- Missing null/undefined checks
- Race conditions in async code

**Spec violations:**
- Feature specified but not implemented
- Implemented differently than spec says
- Hardcoded values that should be configurable

**Code quality:**
- Dead code, debug statements, TODOs
- Unjustified `any` types
- Missing error handling
- Unclear variable names

**Security:**
- Hardcoded secrets
- SQL/command injection
- Unvalidated user input
- Timing attacks

### Quick Checklist Per Task

```
□ Read implementation file(s)
□ Compare each AC to actual code behavior
□ Verify ECs are handled (not just tested)
□ Verify ERRs produce correct error types/messages
□ Check for obvious bugs
□ Check for security issues
```

### What Makes a Test "Meaningful"

**BAD - tests nothing:**
```typescript
test("AC-1: should work", () => {
  expect(true).toBe(true);
});
```

**GOOD - tests actual behavior:**
```typescript
test("AC-1: filter returns only matching rows", () => {
  const result = filter([{status: "active"}, {status: "inactive"}], {status: "active"});
  expect(result).toHaveLength(1);
  expect(result[0].status).toBe("active");
});
```

If tests exist but are meaningless → add to issues.

### Add Issues to JSON

For non-test issues, add to the `issues` array:

```json
{
  "task": "003",
  "type": "implementation_bug",
  "location": "src/utils.ts:45",
  "description": "Off-by-one error in loop boundary"
}
```

Issue types: `missing_tests`, `failing_tests`, `implementation_bug`, `spec_violation`, `security`, `code_quality`

---

## Append to Learning Log (if issues found)

If you find issues, briefly note the pattern for future reference:

```bash
cat >> {process}/features/[feature]/lessons-learned.md << 'EOF'
## Review: Wave [N] - [date]
- [issue type]: [brief description of what went wrong]
EOF
```
