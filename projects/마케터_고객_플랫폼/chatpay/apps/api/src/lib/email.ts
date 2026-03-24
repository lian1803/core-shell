import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const verifyUrl = `${process.env.APP_URL || 'http://localhost:3001'}/verify-email?token=${token}`

  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'ChatPay <noreply@chatpay.kr>',
    to,
    subject: '[ChatPay] 이메일 인증을 완료해주세요',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>ChatPay 이메일 인증</h2>
        <p>아래 버튼을 클릭하여 이메일 인증을 완료해주세요.</p>
        <a href="${verifyUrl}" style="
          display: inline-block;
          padding: 12px 24px;
          background: #6366f1;
          color: white;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
        ">이메일 인증하기</a>
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
          이 링크는 24시간 후 만료됩니다.
        </p>
      </div>
    `,
  })
}
