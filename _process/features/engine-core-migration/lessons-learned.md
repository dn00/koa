## Audit: 2026-01-28

### What went wrong
- **Consumer package not in scope**: The migration plan (R5.1-R5.10) removed MVP types from engine-core but did not identify that @hsh/app depends on those types. The app package now has 30+ TypeScript errors because it imports removed types like `EvidenceCard`, `Concern`, `Scrutiny`, `GameEvent`, `deriveState`, etc.

### How to avoid next time
- When removing/refactoring exports from a shared package, always run `grep -r` across ALL packages in the monorepo to identify consumers
- Include a "Consumer Impact Analysis" section in the discovery phase
- For breaking changes, create companion tasks to update all consumers in the same feature, or explicitly document that consumer updates are out of scope
- Run full monorepo build (`npm run build`) during discovery, not just the target package's tests
