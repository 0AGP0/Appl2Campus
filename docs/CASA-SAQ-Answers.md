# CASA SAQ (Self-Assessment Questionnaire) – Cevaplar

Portalda her madde için **Applicable?** sütununda **Yes** veya **No** seçeceksiniz; **Comment** kutusuna aşağıdaki kısa açıklamayı (İngilizce) yapıştıracaksınız.

**Nasıl kullanılır:** Aşağıdaki tabloda # sütunu SAQ’daki madde numarası. Her satırda "Yes/No" ve "Comment" var. Portalda o maddeye gelince "Yes" veya "No"yı işaretleyin, Comment alanına ilgili metni kopyalayın.

---

| # | Applicable? | Comment |
|---|-------------|--------|
| 1 | **Yes** | Trust boundaries documented: Next.js frontend, API routes (server), Prisma DB, Gmail API. Session boundary at server; student data access via canAccessStudent. |
| 2 | **Yes** | Application uses only modern web stack (React, Next.js). No NSAPI, Flash, Shockwave, ActiveX, Silverlight, NACL, or Java applets. |
| 3 | **Yes** | Access control enforced on server only: getServerSession and canAccessStudent on all relevant API routes and pages. No access control decisions on client. |
| 4 | **Yes** | Sensitive data classified: PII (student/consultant data, emails), credentials (hashed), OAuth tokens (encrypted at rest). |
| 5 | **Yes** | Protection levels applied: passwords bcrypt hashed; Gmail tokens AES-256-GCM encrypted; PII in DB; HTTPS in production; Cache-Control no-store for sensitive pages. |
| 6 | **Yes** | No external scripts or styles loaded from CDN or internet. Application does not load or execute code from untrusted sources; only bundled framework and library code. |
| 7 | **Yes** | We use only our own domain (apply2campus.com). No orphan subdomains or CNAMEs; DNS and hosting under our control. |
| 8 | **Yes** | Anti-automation: rate limiting on login (per email), registration (per IP), and Gmail sync (per studentId, 1 per 5 min). Limits applied server-side. |
| 9 | **Yes** | User-uploaded files stored under data/uploads (or UPLOAD_DIR), outside web-accessible root. Permissions and path sanitization (safeBasename) applied. |
| 10 | **No** | Server-side antivirus scanning on uploads not implemented. Uploads are validated by type and size; consider adding AV in future. |
| 11 | **Yes** | API keys and secrets in environment variables only. Session tokens in httpOnly cookies. No sensitive data in URLs or query strings. |
| 12 | **Yes** | Authorization at URI level (middleware + route handlers) and at resource level (canAccessStudent per studentId). Role-based checks (ADMIN, CONSULTANT, STUDENT). |
| 13 | **Yes** | REST methods restricted per route (GET/POST/PATCH etc.). Sensitive actions require session; no unauthenticated DELETE/PUT on protected resources. |
| 14 | **Yes** | Build and deploy are repeatable (e.g. Node/npm build, deployment via hosting provider). Configuration via env; no manual steps required for deploy. |
| 15 | **Yes** | Application and dependencies can be redeployed from repo and env; backups and runbooks as per hosting provider. |
| 16 | **Yes** | Configuration and secrets in env; admins can verify via deployment and access control (no hardcoded secrets). |
| 17 | **Yes** | Debug mode disabled in production (NODE_ENV=production). No developer consoles or debug endpoints exposed. |
| 18 | **Yes** | Authentication and access control use session/JWT and server-side checks only. Origin header is not used for auth or access decisions. |
| 19 | **Yes** | User passwords must be at least 12 characters (validatePassword enforces min length 12, max 128). |
| 20 | **Yes** | Initial/demo passwords are randomly generated (e.g. seed); production users set their own password at registration. No long-term default passwords. |
| 21 | **Yes** | Passwords stored as bcrypt hashes (salted, cost factor 10). No plaintext or reversible storage. |
| 22 | **Yes** | No shared or default accounts (e.g. root, admin, sa). Users created via registration or admin; each has unique credentials. |
| 23 | **Yes** | One-time tokens (e.g. OAuth state) are signed and time-limited; not reused. |
| 24 | **Yes** | OAuth state and similar verifiers expire (e.g. 10 minutes). No long-lived one-time codes. |
| 25 | **Yes** | Authentication state and tokens generated using secure random (crypto, NextAuth). Sufficient entropy for session and OAuth. |
| 26 | **Yes** | Logout and session expiry invalidate session (NextAuth). Back button does not restore authenticated session without valid token. |
| 27 | **No** | Option to terminate all other sessions after password change is not currently implemented. Sessions invalidated on logout only. |
| 28 | **Yes** | Application uses session tokens (JWT via NextAuth), not static API keys for user authentication. |
| 29 | **Yes** | Sensitive actions (e.g. Gmail connect, send email, student data access) require valid session; re-auth via login. |
| 30 | **Yes** | Access control enforced on server (API routes and getServerSession/canAccessStudent). Client-side checks are not relied upon for security. |
| 31 | **Yes** | User roles and studentId come from server session only; not settable or overridable by client. |
| 32 | **Yes** | Least privilege: users access only their assigned students (CONSULTANT) or own data (STUDENT); ADMIN has separate scope. |
| 33 | **Yes** | Access control fails closed: missing or invalid session returns 401; failed canAccessStudent returns 403. |
| 34 | **Yes** | IDOR prevented: all student-scoped APIs validate studentId via canAccessStudent; users cannot access other users’ records. |
| 35 | **No** | Admin interface does not currently use MFA. Access controlled by role and strong password policy. |
| 36 | **Yes** | Next.js parses body and query separately; no mixing of sources for auth. Parameters validated per route. |
| 37 | **Yes** | Email headers (To, Subject, Cc, Bcc) sanitized with safeEmailHeaderValue to prevent injection (CRLF, etc.). |
| 38 | **Yes** | No eval() or dynamic code execution from user input. Only standard framework and library code. |
| 39 | **Yes** | No user-controlled URL fetch to external sites; Gmail API calls use fixed Google endpoints. No SSRF exposure from user input. |
| 40 | **Yes** | SVG from user content not rendered as scriptable; HTML from email sanitized (safeEmailBodyHtml) including SVG/foreignObject. |
| 41 | **Yes** | Output encoding: HTML sanitized (xss filter, safeEmailBodyHtml); headers sanitized (safeEmailHeaderValue, safeFilename). |
| 42 | **Yes** | JSON from client parsed by framework; no eval or expression evaluation. Prisma used for DB; no user-driven code execution. |
| 43 | **No** | LDAP not used. No LDAP injection surface. |
| 44 | **Yes** | Gmail OAuth tokens encrypted at rest (AES-256-GCM). PII in DB; DB and transport protected (HTTPS, access control). |
| 45 | **Yes** | Cryptographic comparisons use standard libraries (bcrypt, Node crypto). No short-circuit or custom comparison of secrets. |
| 46 | **Yes** | UUIDs generated with crypto.randomUUID() (CSPRNG). Used for document IDs and similar. |
| 47 | **Yes** | Keys and secrets in environment variables (TOKEN_ENCRYPTION_SECRET, NEXTAUTH_SECRET); not in code or logs. |
| 48 | **Yes** | Credentials and payment details not logged. Session tokens not logged in plain form; audit logs record actions only. |
| 49 | **Yes** | Sensitive pages send Cache-Control: no-store, private (next.config.js). Load balancers receive same headers. |
| 50 | **Yes** | Session in httpOnly cookie; no sensitive data in localStorage, sessionStorage, or client-visible cookies. |
| 51 | **Yes** | Sensitive data sent in body or headers; no passwords or tokens in query string. |
| 52 | **Yes** | Access to sensitive data (e.g. student actions, email send) recorded in audit log without logging sensitive content. |
| 53 | **Yes** | Production uses HTTPS with trusted TLS certificates. No self-signed certs for production traffic. |
| 54 | **Yes** | TLS and certificate validation handled by hosting/provider. OCSP/revocation as per server configuration. |

---

## Özet: No cevaplar

- **10:** Antivirus taraması yok (isteğe bağlı iyileştirme).
- **27:** Şifre değişince diğer oturumları sonlandırma seçeneği yok.
- **35:** Admin için MFA yok.
- **43:** LDAP kullanılmıyor (N/A).

Bu dört madde için portalda **No** seçin ve Comment’e yukarıdaki kısa açıklamayı yapıştırın. Diğer tüm maddelere **Yes** ve ilgili Comment’i girin.

## Şifre uzunluğu

SAQ #19 için uygulama tarafında minimum şifre uzunluğu **12 karakter** olacak şekilde güncellendi (`lib/password.ts`). Deploy sonrası yeni kayıtlar ve şifre değişiklikleri 12 karakter zorunluluğuna uyacak.
