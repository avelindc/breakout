import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key');
const fromEmail = process.env.RESEND_FROM_EMAIL || 'BREAKOUT <noreply@breakoutmusic.online>';

const BASE_STYLES = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background-color: #f9fafb;
  color: #111827;
  padding: 40px 20px;
  line-height: 1.5;
`;

const HEADER_STYLES = `
  text-align: center;
  margin-bottom: 30px;
  border-bottom: 2px solid #f3f4f6;
  padding-bottom: 20px;
`;

const LOGO_TEXT_STYLES = `
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -1px;
  color: #2563eb;
  margin: 0;
`;

const BUTTON_STYLES = `
  display: inline-block;
  background-color: #2563eb;
  color: #ffffff;
  font-weight: 600;
  text-decoration: none;
  padding: 12px 24px;
  border-radius: 8px;
  margin-top: 20px;
`;

function generateEmailHtml(title: string, content: string) {
  return `
    <div style="${BASE_STYLES}">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <div style="${HEADER_STYLES}">
          <h1 style="${LOGO_TEXT_STYLES}">BREAKOUT.ID</h1>
        </div>
        <h2 style="color: #111827; font-size: 20px; font-weight: 700; margin-bottom: 20px;">${title}</h2>
        <div style="color: #4b5563; font-size: 16px;">
          ${content}
        </div>
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 14px; text-align: center;">
          <p>&copy; ${new Date().getFullYear()} BREAKOUT.ID. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
}

export async function sendAccountApprovedEmail(to: string, name: string) {
  const subject = 'Akun BREAKOUT Disetujui';
  const html = generateEmailHtml(
    'Selamat Datang di BREAKOUT!',
    `
      <p>Halo ${name},</p>
      <p>Selamat! Akun artis Anda telah <strong>disetujui</strong> oleh tim kami.</p>
      <p>Anda sekarang sudah bisa login ke dashboard dan mulai mendistribusikan musik Anda ke seluruh platform digital (Spotify, Apple Music, YouTube, dll).</p>
      <a href="https://breakoutmusic.online/login" style="${BUTTON_STYLES}">Login ke Dashboard</a>
    `
  );

  if (!process.env.RESEND_API_KEY) {
    console.warn('Simulated Email Send:', subject, to);
    return { success: true };
  }

  try {
    await resend.emails.send({ from: fromEmail, to, subject, html });
    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { error };
  }
}

export async function sendAccountRejectedEmail(to: string, name: string, reason: string) {
  const subject = 'Pendaftaran BREAKOUT Ditolak';
  const html = generateEmailHtml(
    'Status Pendaftaran Akun',
    `
      <p>Halo ${name},</p>
      <p>Terima kasih atas ketertarikan Anda untuk mendistribusikan musik bersama BREAKOUT.</p>
      <p>Mohon maaf, saat ini kami <strong>belum dapat menyetujui</strong> pendaftaran akun Anda.</p>
      <div style="background-color: #fee2e2; color: #991b1b; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <strong>Alasan penolakan:</strong><br/>
        ${reason}
      </div>
      <p>Jika Anda memiliki pertanyaan lebih lanjut, silakan balas email ini atau hubungi tim support kami.</p>
    `
  );

  if (!process.env.RESEND_API_KEY) {
    console.warn('Simulated Email Send:', subject, to);
    return { success: true };
  }

  try {
    await resend.emails.send({ from: fromEmail, to, subject, html });
    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { error };
  }
}

export async function sendReleaseApprovedEmail(to: string, name: string, title: string) {
  const subject = 'Rilisan Disetujui';
  const html = generateEmailHtml(
    'Rilisan Musik Disetujui',
    `
      <p>Halo ${name},</p>
      <p>Kabar baik! Rilisan Anda yang berjudul <strong>"${title}"</strong> telah lolos proses review dan <strong>disetujui</strong>.</p>
      <p>Tim kami akan segera memproses perilisan musik Anda ke berbagai platform digital (DSP) sesuai dengan tanggal rilis yang telah Anda tentukan.</p>
      <p>Pantau terus status rilisan Anda melalui dashboard BREAKOUT.</p>
      <a href="https://breakoutmusic.online/dashboard/releases" style="${BUTTON_STYLES}">Lihat Dashboard</a>
    `
  );

  if (!process.env.RESEND_API_KEY) {
    console.warn('Simulated Email Send:', subject, to);
    return { success: true };
  }

  try {
    await resend.emails.send({ from: fromEmail, to, subject, html });
    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { error };
  }
}

export async function sendReleaseRejectedEmail(to: string, name: string, title: string, reason: string) {
  const subject = 'Rilisan Ditolak';
  const html = generateEmailHtml(
    'Pemberitahuan Status Rilisan',
    `
      <p>Halo ${name},</p>
      <p>Terima kasih telah mengunggah rilisan <strong>"${title}"</strong>.</p>
      <p>Mohon maaf, setelah melewati proses peninjauan, rilisan Anda <strong>tidak dapat kami setujui</strong> pada saat ini.</p>
      <div style="background-color: #fee2e2; color: #991b1b; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <strong>Alasan penolakan:</strong><br/>
        ${reason}
      </div>
      <p>Silakan perbaiki rilisan Anda sesuai dengan alasan di atas, kemudian Anda dapat mencoba mengunggahnya kembali melalui dashboard.</p>
      <a href="https://breakoutmusic.online/dashboard/upload" style="${BUTTON_STYLES}">Upload Ulang Rilisan</a>
    `
  );

  if (!process.env.RESEND_API_KEY) {
    console.warn('Simulated Email Send:', subject, to);
    return { success: true };
  }

  try {
    await resend.emails.send({ from: fromEmail, to, subject, html });
    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { error };
  }
}

export async function sendNewMessageNotification(to: string, name: string, messageSubject: string) {
  const subject = 'Pesan Baru dari Admin BREAKOUT';
  const html = generateEmailHtml(
    'Anda Memiliki Pesan Baru',
    `
      <p>Halo ${name},</p>
      <p>Anda memiliki pesan baru dari tim Admin BREAKOUT dengan subjek:</p>
      <div style="background-color: #f3f4f6; color: #111827; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <strong>${messageSubject}</strong>
      </div>
      <p>Silakan login ke dashboard dan buka menu <strong>Inbox</strong> untuk membaca pesan selengkapnya dan mengunduh lampiran (jika ada).</p>
      <a href="https://breakoutmusic.online/dashboard/inbox" style="${BUTTON_STYLES}">Buka Inbox</a>
    `
  );

  if (!process.env.RESEND_API_KEY) {
    console.warn('Simulated Email Send:', subject, to);
    return { success: true };
  }

  try {
    await resend.emails.send({ from: fromEmail, to, subject, html });
    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { error };
  }
}

// BATCH SENDING
export async function sendNewMessageNotificationBatch(users: {email: string, name: string}[], messageSubject: string) {
  const subject = 'Pesan Baru dari Admin BREAKOUT';
  
  const emails = users.map(user => ({
    from: fromEmail,
    to: user.email,
    subject: subject,
    html: generateEmailHtml(
      'Anda Memiliki Pesan Baru',
      `
        <p>Halo ${user.name},</p>
        <p>Anda memiliki pesan baru dari tim Admin BREAKOUT dengan subjek:</p>
        <div style="background-color: #f3f4f6; color: #111827; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <strong>${messageSubject}</strong>
        </div>
        <p>Silakan login ke dashboard dan buka menu <strong>Inbox</strong> untuk membaca pesan selengkapnya dan mengunduh lampiran (jika ada).</p>
        <a href="https://breakoutmusic.online/dashboard/inbox" style="${BUTTON_STYLES}">Buka Inbox</a>
      `
    )
  }));

  if (!process.env.RESEND_API_KEY) {
    console.warn('Simulated Batch Email Send:', emails.length, 'emails');
    return { success: true };
  }

  try {
    // Resend batch allows up to 100 emails per request
    // We chunk it just in case
    const CHUNK_SIZE = 90;
    for (let i = 0; i < emails.length; i += CHUNK_SIZE) {
      const chunk = emails.slice(i, i + CHUNK_SIZE);
      await resend.batch.send(chunk);
    }
    return { success: true };
  } catch (error) {
    console.error('Failed to send batch emails:', error);
    return { error };
  }
}

export async function sendOtpEmail(to: string, otp: string) {
  const subject = 'Kode Verifikasi OTP - BREAKOUT MUSIC';
  const html = generateEmailHtml(
    'Verifikasi Email Anda',
    `
      <p>Gunakan kode OTP berikut untuk melanjutkan proses pendaftaran Anda:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <div style="background-color: #f0f4ff; border: 2px dashed #4f46e5; border-radius: 8px; padding: 15px; display: inline-block;">
          <h1 style="color: #4f46e5; margin: 0; font-size: 36px; letter-spacing: 5px;">${otp}</h1>
        </div>
      </div>
      
      <p style="color: #555; line-height: 1.6; font-size: 14px;">
        Kode OTP ini hanya berlaku selama <strong>10 menit</strong>.<br/>
        Jangan berikan kode ini kepada siapapun.
      </p>
    `
  );

  if (!process.env.RESEND_API_KEY) {
    console.warn('Simulated Email Send OTP:', subject, to, otp);
    return { success: true };
  }

  try {
    await resend.emails.send({ from: fromEmail, to, subject, html });
    return { success: true };
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return { error };
  }
}

export async function sendWithdrawalPaidEmail(to: string, name: string) {
  const subject = 'Pembayaran Royalti Berhasil';
  const html = generateEmailHtml(
    'Pembayaran Telah Dikirim',
    `
      <p>Halo ${name},</p>
      <p>Kabar gembira! Permintaan penarikan royalti (withdrawal) Anda <strong>telah berhasil kami bayarkan</strong>.</p>
      <p>Silakan periksa saldo di rekening bank atau e-wallet yang Anda daftarkan.</p>
      <p>Terima kasih telah mempercayakan distribusi musik Anda kepada BREAKOUT.</p>
      <a href="https://breakoutmusic.online/dashboard/withdraw" style="${BUTTON_STYLES}">Lihat Riwayat Penarikan</a>
    `
  );

  if (!process.env.RESEND_API_KEY) {
    console.warn('Simulated Email Send Withdrawal:', subject, to);
    return { success: true };
  }

  try {
    await resend.emails.send({ from: fromEmail, to, subject, html });
    return { success: true };
  } catch (error) {
    console.error('Failed to send withdrawal email:', error);
    return { error };
  }
}
