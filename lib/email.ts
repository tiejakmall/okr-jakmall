import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const APP_URL = process.env.NEXTAUTH_URL ?? "https://okr-jakmall.vercel.app";
const FROM_EMAIL = process.env.RESEND_FROM ?? "OKR Tracker <onboarding@resend.dev>";

export type ReminderType = "settings" | "results";

export async function sendReminderEmail({
  to,
  name,
  type,
  quarterName,
  quarterId,
}: {
  to: string;
  name: string;
  type: ReminderType;
  quarterName: string;
  quarterId: string;
}) {
  const isSettings = type === "settings";
  const subject = isSettings
    ? `[Reminder] Mohon isi OKR Divisi – ${quarterName}`
    : `[Reminder] Mohon update progress OKR – ${quarterName}`;

  const actionLabel = isSettings ? "Isi OKR Sekarang" : "Update Progress Sekarang";
  const link = isSettings
    ? `${APP_URL}/okr?quarterId=${quarterId}`
    : `${APP_URL}/distribusi?quarterId=${quarterId}`;

  const bodyText = isSettings
    ? `Halo ${name},<br><br>
       Kamu mendapat reminder untuk segera mengisi <strong>Objective & Key Results (OKR)</strong> divisi kamu
       untuk quarter <strong>${quarterName}</strong>.<br><br>
       Langkah:<br>
       1. Login ke OKR Tracker<br>
       2. Buka menu <strong>OKR Divisi</strong><br>
       3. Buat Objective dan Key Results untuk ${quarterName}<br>
       4. Klik <strong>Kumpulkan OKR</strong> jika sudah selesai`
    : `Halo ${name},<br><br>
       Kamu mendapat reminder untuk segera mengupdate <strong>progress/hasil OKR</strong> divisi kamu
       untuk quarter <strong>${quarterName}</strong>.<br><br>
       Langkah:<br>
       1. Login ke OKR Tracker<br>
       2. Buka menu <strong>Distribusi Anggota</strong><br>
       3. Update progress tiap Key Result untuk masing-masing anggota`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
        <!-- Header -->
        <tr>
          <td style="background:#fbbf24;padding:20px 32px;">
            <p style="margin:0;color:#1c1917;font-size:18px;font-weight:bold;">📈 OKR Tracker</p>
            <p style="margin:4px 0 0;color:#78350f;font-size:13px;">${quarterName}</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 16px;font-size:22px;font-weight:bold;color:#0f172a;">
              ${isSettings ? "⏰ Reminder Pengisian OKR" : "📊 Reminder Update Progress OKR"}
            </p>
            <p style="margin:0 0 20px;color:#475569;font-size:14px;line-height:1.6;">
              ${bodyText}
            </p>
            <a href="${link}"
               style="display:inline-block;background:#fbbf24;color:#1c1917;font-weight:bold;font-size:14px;
                      padding:12px 24px;border-radius:10px;text-decoration:none;margin-top:8px;">
              ${actionLabel} →
            </a>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">
              Email ini dikirim otomatis oleh sistem OKR Tracker. Jangan balas email ini.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });
}
