---
description: Auto-run npm commands without user approval
---

// turbo-all

When running any `npm` command (e.g. `npm run start:dev`, `npm install`, `npm run build`, `npm run seed`, `npx prisma ...`, etc.), always set `SafeToAutoRun` to `true` so the user does not need to manually approve them.
