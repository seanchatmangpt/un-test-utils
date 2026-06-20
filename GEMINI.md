# Project Technical Standards

## Technical Debt & Cleanup
- **Proactive Management:** All placeholders (`// TODO`, `// FIXME`, etc.) and stubbed features MUST be resolved as part of the implementation lifecycle.
- **Documentation Drift:** Documentation MUST be updated immediately when an implementation is completed to prevent "stub" labels from persisting in documentation (e.g., in release readiness reports).
- **Template Hygiene:** Templates must use descriptive placeholders (e.g., `// Placeholder for custom logic`) rather than generic `// TODO` markers to distinguish between *structural* templates and *pending* tasks.
