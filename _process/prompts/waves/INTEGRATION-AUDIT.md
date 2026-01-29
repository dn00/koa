# Integration Audit Review Prompt

> You are running an Integration Audit Review. You review the ENTIRE completed feature as a whole, checking how all pieces integrate together.

---

## When to Run

Only run this audit when:
- ALL batches are complete
- ALL batch reviews have passed
- ALL tests are passing

---

## Process

### 1. Read the Plan File

```bash
cat {process}/features/[feature]/[name].plan.md
```

**Understand:**
- Feature scope and goals
- All tasks and their relationships
- Architectural decisions

### 2. List All Implementation Files

```bash
# Find all files created/modified by this feature
git diff --name-only [base-branch]..HEAD
```

**Write down:**
```
Implementation files:
- src/[file1].ts
- src/[file2].ts
- tests/[file1].test.ts
...
```

### 3. Read All Implementation Files

Actually read each file (not just grep):

```bash
cat src/[file].ts
```

**Check:**
- How modules connect to each other
- Import/export relationships
- Shared types and interfaces

### 4. Run All Tests

```bash
[test command]
```

**Write down:**
```
Tests: [N] passing, [M] failing
```

### 5. Check Integration Points

**For each module pair that interacts:**

```
□ Data flows correctly between modules
□ Types are compatible at boundaries
□ Error handling is consistent
□ No circular dependencies
□ Async/await properly propagated
```

**Common integration issues:**
- Module A exports type X, but Module B expects slightly different shape
- Error thrown in Module A not caught properly by Module B
- Race condition when Module A and B both access shared state
- Missing null checks at module boundaries

### 6. Check for Gaps

**Review each AC from the plan:**
```
□ AC is fully implemented (not partially)
□ AC works in context of full feature (not just in isolation)
□ AC handles edge cases that span multiple tasks
```

**Common gaps:**
- Task 1 creates data, Task 2 uses it, but format doesn't match
- Edge case handled in one task but breaks another
- Error from Task 1 not properly handled by Task 3

### 7. Security Review at Boundaries

```
□ Data validated before crossing module boundaries
□ No sensitive data leaked between modules
□ Auth/permissions checked at entry points
□ No injection vulnerabilities at integration points
```

---

## Report Results (JSON Format)

**Return ONLY this JSON structure:**

```json
{
  "feature": "[name]",
  "verdict": "PASS",
  "files_reviewed": ["src/a.ts", "src/b.ts"],
  "tests_run": {"passed": 45, "failed": 0},
  "integration_checks": {
    "module_connections": "pass",
    "type_compatibility": "pass",
    "error_handling": "pass",
    "no_circular_deps": "pass"
  },
  "gaps_found": [],
  "security_issues": []
}
```

**If issues found:**

```json
{
  "feature": "[name]",
  "verdict": "NEEDS-CHANGES",
  "files_reviewed": ["src/a.ts", "src/b.ts"],
  "tests_run": {"passed": 43, "failed": 2},
  "integration_checks": {
    "module_connections": "pass",
    "type_compatibility": "fail",
    "error_handling": "pass",
    "no_circular_deps": "pass"
  },
  "integration_issues": [
    {
      "type": "type_mismatch",
      "location": "src/b.ts:45",
      "description": "Module B expects User type but receives UserDTO from Module A",
      "severity": "high"
    }
  ],
  "gaps_found": [
    {
      "ac": "AC-5",
      "task": "003",
      "description": "AC-5 works in isolation but fails when Task 001 returns empty array"
    }
  ],
  "security_issues": []
}
```

**Do NOT include prose explanations. JSON only.**

---

## Rules

- **Review the WHOLE feature** - not just individual tasks
- **Actually read the code** - don't just run tests
- **Check boundaries** - most bugs hide at integration points
- **Be thorough** - this is the last check before feature ships

---

## Leave Artifact

**After completing the audit, write the results to the feature folder:**

```bash
# Write audit results to feature folder
cat > {process}/features/[feature]/integration-audit.json << 'EOF'
[your JSON output here]
EOF
```

**The artifact should include:**
- Audit date
- Verdict
- All checks performed
- Any issues found

This creates a permanent record of the integration audit in:
```
{process}/features/[feature]/integration-audit.json
```

---

## Leave Learning Log

**If any issues were found (even if fixed), document lessons learned:**

```bash
cat >> {process}/features/[feature]/lessons-learned.md << 'EOF'
## Audit: [date]

### What went wrong
- [issue]: [root cause]

### How to avoid next time
- [actionable tip]
EOF
```

Skip if no issues found.
