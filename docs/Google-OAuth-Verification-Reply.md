# Apply2Campus – Google OAuth Verification – E-posta Cevabı

**Project ID: apply2campus (353277778017)**

---

## Gönderilecek e-posta metni

E-postada Markdown (tablo, kalın) işlenmez; yapıştırınca | ve ** olduğu gibi kalır. Bu yüzden e-postaya yapıştırmak için düz metin kullanın:

- **En kolay:** `docs/Google-OAuth-Email-PlainText.txt` dosyasını açın, Ctrl+A ile hepsini seçin, kopyalayıp mail gövdesine yapıştırın. Tablolar satırlarla ayrılmış, her e-posta istemcisinde okunaklı görünür.
- Alternatif: Aşağıda “Düz metin (e-posta için)” bölümündeki kutu içeriğini kopyalayın (``` işaretlerini almamaya dikkat edin).

**Konu:** Re: Verification – Apply2Campus (353277778017) – OAuth testing instructions

---

### Metin (Markdown – bazı istemcilerde biçim kaybolur)

**Hello,**

Thank you for your message. Please find below a short description of our application in its current state, how to use it, and the requested instructions for testing the OAuth consent flow and OAuth scope functionalities.

---

### About Apply2Campus (application overview)

Apply2Campus is an education consultancy portal used by **students** and **staff** (consultants, admins, operation team). The app is in production use as follows:

- **Students** log in at the application URL and are redirected to their **Dashboard** (`/dashboard`). From there they can: connect their Gmail account (required for consultants to manage their email), view their profile, applications, offers, documents, visa info, and videos. They manage their Gmail connection and login details under **Ayarlar** (Settings) at `/dashboard/settings`. The student interface is in Turkish (e.g. “Gmail ile Bağlan” = Connect with Gmail).

- **Staff (consultants, admins, operation roles)** log in and are redirected to **Panel** (`/panel`) or **Operasyon Inbox** (`/operasyon/inbox`) or **Admin** (`/admin`) depending on role. They open the **Students** list (`/students`), then a student’s profile (`/students/[studentId]`). For each student, staff can: connect the student’s Gmail on their behalf (OAuth), view and sync that student’s **Inbox** (`/students/[studentId]/inbox`), send and reply to emails as the student, manage applications, documents, offers, and visa info. Gmail is used so that consultants can read and send email on behalf of the student within the app, without seeing the student’s password.

**OAuth usage:** Gmail is connected **per student**. A student can connect their own Gmail from the dashboard (or Settings). A consultant/admin can also start the same Gmail connection flow for a student from the student’s profile. The consent screen is shown by Google; after the user grants access, the app stores tokens and uses the Gmail API to read (inbox/sent), send, and modify (e.g. read/unread) messages for that student.

---

### 1. How to test the OAuth consent flow

**Prerequisites**

- **Application URL:** https://apply2campus.com  
  *(If your live URL is different, replace it in the links below.)*
- **Test accounts** (from our seed data; ensure the database has been seeded so these exist):

| Role       | Email                     | Password    |
|-----------|----------------------------|-------------|
| Admin     | admin@educonsult.local     | password123 |
| Consultant| sarah@educonsult.local     | password123 |
| Student   | alex.johnson@example.com   | password123 |

**Steps**

1. Open the application: **https://apply2campus.com**
2. Click **Login** (or go to **https://apply2campus.com/login**).
3. Log in as the **student**: email `alex.johnson@example.com`, password `password123`.
4. After login you will be on the **Student Dashboard** (https://apply2campus.com/dashboard). If Gmail is not connected, you will see a **“Gmail ile Bağlan”** (Connect with Gmail) button.
5. Click **“Gmail ile Bağlan”**. You will be redirected to **Google’s OAuth consent screen**.
6. Choose a Google account (any Gmail or Google Workspace account), review the requested permissions (read, send, and manage email), and click **Allow**.
7. Google redirects back to **https://apply2campus.com/api/oauth/gmail/callback?code=...&state=...**. The app exchanges the code for tokens and redirects you to the dashboard with `?gmail=connected`. The dashboard will show that Gmail is connected (e.g. “Gmail bağlı” and the connected email).

**Alternative (from Settings):** From the student dashboard, open **Ayarlar** (Settings) in the sidebar: **https://apply2campus.com/dashboard/settings**, and use the **“Gmail ile Bağlan”** button there. The flow is the same.

**Optional – staff-initiated OAuth:** Log in as **consultant** (`sarah@educonsult.local` / `password123`). Go to **Students** (https://apply2campus.com/students), open the student “Alex Johnson”, and on the student overview or inbox area click **“Gmail ile Bağlan”** (or the link that starts Gmail connection for that student). The same Google OAuth consent screen appears; after allowing, you are redirected back to that student’s page with `?gmail=connected`.

**Note:** The redirect URI used by the app is **https://apply2campus.com/api/oauth/gmail/callback**. This must be configured exactly in the Google Cloud Console under Authorized redirect URIs for the OAuth 2.0 client.

---

### 2. How to test OAuth scope functionalities

After completing the OAuth consent flow above, the requested scopes are used as follows. Testers can verify each as described.

| Scope | Purpose in the app | How to verify |
|-------|--------------------|----------------|
| **gmail.readonly** | Read the student’s Gmail inbox and sent items so consultants can view and manage student email inside the app. | Log in as consultant (`sarah@educonsult.local`), go to **Students** → open the student whose Gmail was connected → open **Inbox** (https://apply2campus.com/students/[studentId]/inbox). The app syncs and displays messages from the connected Gmail (INBOX and SENT). |
| **gmail.send** | Send email on behalf of the student (e.g. replies to universities or advisors). | As consultant, open that student’s Inbox, open a message, and use **Reply** or **Compose**. Send an email. The message is sent via Gmail API as the connected student account. |
| **gmail.modify** | Mark messages as read/unread and manage labels when organizing the student’s mailbox from the app. | In the student’s Inbox (staff view), mark a message as read or unread if the UI exposes it; the app uses the Gmail API to update message state. |
| **userinfo.email** | Identify which Google account was connected and display it to the user. | After OAuth, on the student dashboard or **Ayarlar** (Settings), the connected Gmail address is shown (e.g. “Gmail bağlı” and the email). |

**Summary:**  
- **gmail.readonly** → Viewing and syncing student emails in the app.  
- **gmail.send** → Sending emails as the student from the app.  
- **gmail.modify** → Updating read state and labels of messages.  
- **userinfo.email** → Showing the connected Gmail address to the user.

---

### 3. Quick reference (URLs)

- Login: https://apply2campus.com/login  
- Student dashboard: https://apply2campus.com/dashboard  
- Student settings (Gmail): https://apply2campus.com/dashboard/settings  
- OAuth start (from app): https://apply2campus.com/api/oauth/gmail/start (student) or with `?studentId=...` (staff)  
- OAuth callback: https://apply2campus.com/api/oauth/gmail/callback  
- Students list (staff): https://apply2campus.com/students  
- Student inbox (staff): https://apply2campus.com/students/[studentId]/inbox  

If the consent screen cannot be reached, please check: (1) you are logged in as the student (or as consultant with a student selected when using the staff flow); (2) the redirect URI in Google Cloud Console exactly matches https://apply2campus.com/api/oauth/gmail/callback; (3) the test accounts exist (database seeded).

We have addressed the above and are ready for the verification process. If you need a different production URL or dedicated test accounts, or a short screen recording of the OAuth flow, we can provide them.

Best regards,  
Apply2Campus Team

---

### Düz metin (e-posta için – bunu kopyalayıp yapıştırın, tablolar okunaklı görünür)

Aşağıdaki kutunun içindeki metni kopyalayıp mail gövdesine yapıştırın. Tablolar satır satır yazıldığı için Gmail/Outlook’ta düzgün görünür.

```
Hello,

Thank you for your message. Please find below a short description of our application in its current state, how to use it, and the requested instructions for testing the OAuth consent flow and OAuth scope functionalities.

--------------------------------------------------------------------
ABOUT APPLY2CAMPUS (APPLICATION OVERVIEW)
--------------------------------------------------------------------

Apply2Campus is an education consultancy portal used by students and staff (consultants, admins, operation team). The app is in production use as follows:

- Students log in at the application URL and are redirected to their Dashboard (/dashboard). From there they can: connect their Gmail account (required for consultants to manage their email), view their profile, applications, offers, documents, visa info, and videos. They manage their Gmail connection and login details under Ayarlar (Settings) at /dashboard/settings. The student interface is in Turkish (e.g. "Gmail ile Bağlan" = Connect with Gmail).

- Staff (consultants, admins, operation roles) log in and are redirected to Panel (/panel) or Operasyon Inbox (/operasyon/inbox) or Admin (/admin) depending on role. They open the Students list (/students), then a student's profile (/students/[studentId]). For each student, staff can: connect the student's Gmail on their behalf (OAuth), view and sync that student's Inbox (/students/[studentId]/inbox), send and reply to emails as the student, manage applications, documents, offers, and visa info. Gmail is used so that consultants can read and send email on behalf of the student within the app, without seeing the student's password.

OAuth usage: Gmail is connected per student. A student can connect their own Gmail from the dashboard (or Settings). A consultant/admin can also start the same Gmail connection flow for a student from the student's profile. The consent screen is shown by Google; after the user grants access, the app stores tokens and uses the Gmail API to read (inbox/sent), send, and modify (e.g. read/unread) messages for that student.

--------------------------------------------------------------------
1. HOW TO TEST THE OAUTH CONSENT FLOW
--------------------------------------------------------------------

Prerequisites:
- Application URL: https://apply2campus.com
  (If your live URL is different, replace it in the links below.)
- Test accounts (ensure the database has been seeded so these exist):

  Role        | Email                      | Password
  ------------|----------------------------|-------------
  Admin       | admin@educonsult.local     | password123
  Consultant  | sarah@educonsult.local     | password123
  Student     | alex.johnson@example.com   | password123

Steps:
1. Open the application: https://apply2campus.com
2. Click Login (or go to https://apply2campus.com/login).
3. Log in as the student: email alex.johnson@example.com, password password123.
4. After login you will be on the Student Dashboard (https://apply2campus.com/dashboard). If Gmail is not connected, you will see a "Gmail ile Bağlan" (Connect with Gmail) button.
5. Click "Gmail ile Bağlan". You will be redirected to Google's OAuth consent screen.
6. Choose a Google account (any Gmail or Google Workspace account), review the requested permissions (read, send, and manage email), and click Allow.
7. Google redirects back to https://apply2campus.com/api/oauth/gmail/callback. The app exchanges the code for tokens and redirects you to the dashboard with ?gmail=connected. The dashboard will show that Gmail is connected (e.g. "Gmail bağlı" and the connected email).

Alternative (from Settings): From the student dashboard, open Ayarlar (Settings) in the sidebar: https://apply2campus.com/dashboard/settings, and use the "Gmail ile Bağlan" button there. The flow is the same.

Optional – staff-initiated OAuth: Log in as consultant (sarah@educonsult.local / password123). Go to Students (https://apply2campus.com/students), open the student "Alex Johnson", and on the student overview or inbox area click "Gmail ile Bağlan". The same Google OAuth consent screen appears; after allowing, you are redirected back to that student's page with ?gmail=connected.

Note: The redirect URI used by the app is https://apply2campus.com/api/oauth/gmail/callback. This must be configured exactly in the Google Cloud Console under Authorized redirect URIs for the OAuth 2.0 client.

--------------------------------------------------------------------
2. HOW TO TEST OAUTH SCOPE FUNCTIONALITIES
--------------------------------------------------------------------

After completing the OAuth consent flow above, the requested scopes are used as follows:

Scope: gmail.readonly
Purpose: Read the student's Gmail inbox and sent items so consultants can view and manage student email inside the app.
How to verify: Log in as consultant (sarah@educonsult.local), go to Students, open the student whose Gmail was connected, open Inbox (https://apply2campus.com/students/[studentId]/inbox). The app syncs and displays messages from the connected Gmail (INBOX and SENT).

Scope: gmail.send
Purpose: Send email on behalf of the student (e.g. replies to universities or advisors).
How to verify: As consultant, open that student's Inbox, open a message, use Reply or Compose and send an email. The message is sent via Gmail API as the connected student account.

Scope: gmail.modify
Purpose: Mark messages as read/unread and manage labels when organizing the student's mailbox from the app.
How to verify: In the student's Inbox (staff view), mark a message as read or unread if the UI exposes it; the app uses the Gmail API to update message state.

Scope: userinfo.email
Purpose: Identify which Google account was connected and display it to the user.
How to verify: After OAuth, on the student dashboard or Ayarlar (Settings), the connected Gmail address is shown (e.g. "Gmail bağlı" and the email).

Summary:
- gmail.readonly  → Viewing and syncing student emails in the app.
- gmail.send      → Sending emails as the student from the app.
- gmail.modify    → Updating read state and labels of messages.
- userinfo.email → Showing the connected Gmail address to the user.

--------------------------------------------------------------------
3. QUICK REFERENCE (URLs)
--------------------------------------------------------------------

Login: https://apply2campus.com/login
Student dashboard: https://apply2campus.com/dashboard
Student settings (Gmail): https://apply2campus.com/dashboard/settings
OAuth start: https://apply2campus.com/api/oauth/gmail/start (student) or with ?studentId=... (staff)
OAuth callback: https://apply2campus.com/api/oauth/gmail/callback
Students list (staff): https://apply2campus.com/students
Student inbox (staff): https://apply2campus.com/students/[studentId]/inbox

If the consent screen cannot be reached, please check: (1) you are logged in as the student (or as consultant with a student selected when using the staff flow); (2) the redirect URI in Google Cloud Console exactly matches https://apply2campus.com/api/oauth/gmail/callback; (3) the test accounts exist (database seeded).

We have addressed the above and are ready for the verification process. If you need a different production URL or dedicated test accounts, or a short screen recording of the OAuth flow, we can provide them.

Best regards,
Apply2Campus Team
```

---

## Ek (takip) maili

İlk maili attıktan sonra test hesaplarını tamamlamak için ek mail atacaksanız:  
`docs/Google-OAuth-FollowUp-Email.txt` dosyasının içeriğini aynı e-posta zincirine **yanıt** olarak gönderin. Konu "Re: ... Supplementary test accounts" olarak kalabilir.  
Google tarafında ek mail atmanız sorun oluşturmaz; eksik bilgiyi tamamlamak için takip maili göndermek normal ve olumlu karşılanır.

---

## Sizin yapmanız gerekenler (Apply2Campus geliştiricisi)

1. **Production URL:** Yukarıdaki e-posta metninde **https://apply2campus.com** kullandık. Canlı uygulamanız farklı bir domain’deyse (örn. `https://app.apply2campus.com`), e-postada bu URL’i arama-değiştir ile kendi domain’inizle değiştirin.

2. **Test hesapları:** Placeholder’lar seed’deki hesaplarla dolduruldu:
   - Admin: `admin@educonsult.local` / `password123`
   - Danışman: `sarah@educonsult.local` / `password123`
   - Öğrenci: `alex.johnson@example.com` / `password123`  
   Production ortamında bu hesapların var olduğundan emin olun (`npx prisma db seed` veya `tsx prisma/seed.ts` çalıştırılmış olmalı). Farklı test hesapları kullanacaksanız e-postadaki tabloyu güncelleyin.

3. **E-postayı gönderin:** Trust and Safety’den gelen e-postayı yanıtlayın; **“Gönderilecek e-posta metni”** başlığından **“Apply2Campus Team”** imzasına kadar olan kısmı kopyalayıp e-postanın gövdesine yapıştırın.

4. **Google Cloud Console:** OAuth 2.0 client’ta **Authorized redirect URIs** listesinde production callback’inizin tam olarak eklendiğinden emin olun (örn. `https://apply2campus.com/api/oauth/gmail/callback`).
