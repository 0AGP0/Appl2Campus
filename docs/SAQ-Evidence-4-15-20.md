# CASA SAQ – Evidence for Points 4, 15, 20

This document and the referenced screenshots provide evidence for the following SAQ items.

---

## SAQ #4: Sensitive data identified and classified into protection levels

**Claim:** Sensitive data classified: PII (student/consultant data, emails), credentials (hashed), OAuth tokens (encrypted at rest).

### Classification summary

| Data type | Protection level | How it is stored / protected |
|-----------|------------------|------------------------------|
| **PII** (student/consultant names, emails, profile data) | High | Stored in PostgreSQL; access controlled via `canAccessStudent()` and role-based checks on all API routes and pages. |
| **Email content** (synced from Gmail) | High | Stored in `EmailMessage` table (e.g. `bodyHtml`, `from`, `to`, `subject`); same access control as PII. |
| **Credentials** (user passwords) | High | Never stored in plaintext. Stored as bcrypt hashes (salted, cost factor 10) in `User.passwordHash`. |
| **OAuth tokens** (Gmail access/refresh) | High | Encrypted at rest with AES-256-GCM using `TOKEN_ENCRYPTION_SECRET` before storage in `GmailConnection.accessTokenEncrypted` and `GmailConnection.refreshTokenEncrypted`. |

### Evidence to attach

1. **Screenshot: Prisma schema** – In `prisma/schema.prisma`, show:
   - `User` model: `passwordHash` (credentials stored only as hash).
   - `GmailConnection` model: `accessTokenEncrypted`, `refreshTokenEncrypted` (tokens encrypted at rest).
   - `EmailMessage` model (or similar): fields holding email/PII (e.g. `from`, `to`, `subject`, `bodyHtml`).
2. **Screenshot: Encryption implementation** – `lib/encryption.ts` showing AES-256-GCM and use of `TOKEN_ENCRYPTION_SECRET` (no secret value visible).

---

## SAQ #15: Application and dependencies can be redeployed; runbook / backups

**Claim:** Application and dependencies can be redeployed from repo and env; backups and runbooks as per hosting provider.

### Deployment process (repeatable)

1. **Source:** Code from Git repository (`git pull` or clone).
2. **Dependencies:** `npm install` (all dependencies, including Prisma, in `package.json`).
3. **Database:** `npx prisma generate` and `npx prisma db push` (or `prisma migrate deploy` in production).
4. **Build:** `npm run build` (Next.js production build).
5. **Run:** `npm run start` or process manager (e.g. PM2, systemd) restart.
6. **Configuration:** All secrets and config via environment variables (`.env`); no hardcoded secrets in code.

### Recovery

- **Redeploy:** Same steps as above; application can be restored from repo + env in a short time.
- **Backups:** Database and any file storage are backed up according to the hosting provider’s runbook (e.g. automated PostgreSQL backups, volume snapshots). We do not maintain a separate custom backup script in the repo; we rely on the provider’s documented procedures.

### Evidence to attach

1. **Screenshot: README.md** – Section “Setup” and “Project Structure” (or equivalent) showing install, env vars, database steps, and run commands.
2. **Optional:** Short runbook (e.g. one-page) or hosting provider backup/deploy documentation reference.

---

## SAQ #20: System-generated initial passwords / activation codes

**Claim:** Initial/demo passwords are randomly generated (e.g. seed); production users set their own password at registration. No long-term default passwords.

### Behaviour

- **Production – student login created by admin:** When an admin creates a login for a student (API `create-login`), the admin supplies a password. The application enforces **at least 12 characters** (and max 128) via `validatePassword()`; the password is then hashed with bcrypt and stored. This is a one-time setup password; we recommend the student change it on first login. It is not a shared or default password.
- **Production – registration:** End users who register (e.g. consultant/admin) set their **own** password at registration; again validated with `validatePassword()` (min 12 characters) and stored as bcrypt hash. No system-generated initial password.
- **Demo / seed:** Seed scripts (e.g. `prisma/seed.ts`, `prisma/seed-demo-users.ts`) use a fixed demo password only for **local/development** (e.g. `admin@educonsult.local`). These accounts are not used as long-term production defaults; production deployments use unique credentials set by admins or users.

### Evidence to attach

1. **Screenshot: Password policy** – `lib/password.ts` showing `MIN_LENGTH = 12` and `validatePassword()` enforcing minimum length (and optionally max length).
2. **Screenshot: Create-login API** – `app/api/students/[studentId]/create-login/route.ts` showing:
   - Use of `validatePassword(password)` before creating the user.
   - `bcrypt.hash(password, 10)` for storing the password (no plaintext storage).
3. **Screenshot: Registration** – `app/api/auth/register/route.ts` (or equivalent) showing that the user provides and sets their own password, validated and hashed (no system-generated initial password for real users).

---

*End of evidence document. Attach the screenshots referenced above when sending to TAC.*
