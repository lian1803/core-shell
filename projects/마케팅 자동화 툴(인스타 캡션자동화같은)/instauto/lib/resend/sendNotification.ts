// lib/resend/sendNotification.ts
// Resend를 사용한 이메일 알림 발송

import { Resend } from 'resend';
import { EmailNotificationType, PLAN_CONFIG, formatDateKST, getDaysUntil } from '@/types';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'Instauto <noreply@instauto.kr>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://instauto.kr';

export interface SendNotificationOptions {
  to: string;
  type: EmailNotificationType;
  data?: Record<string, unknown>;
}

export interface SendNotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * 이메일 알림 발송
 */
export async function sendNotification(
  options: SendNotificationOptions
): Promise<SendNotificationResult> {
  const { to, type, data = {} } = options;

  try {
    const emailContent = getEmailContent(type, data);

    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (error) {
      console.error('Resend error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      messageId: result?.id,
    };
  } catch (error) {
    console.error('Send notification error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 이메일 타입별 콘텐츠 생성
 */
function getEmailContent(
  type: EmailNotificationType,
  data: Record<string, unknown>
): { subject: string; html: string } {
  const baseStyle = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { text-align: center; padding: 20px 0; }
      .logo { font-size: 24px; font-weight: bold; color: #6366f1; }
      .content { background: #f9fafb; border-radius: 12px; padding: 24px; margin: 20px 0; }
      .button { display: inline-block; background: #6366f1; color: white !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; }
      .footer { text-align: center; font-size: 12px; color: #9ca3af; padding: 20px 0; }
    </style>
  `;

  switch (type) {
    case 'content_ready': {
      const shopName = data.shopName as string || '사장님';
      const thumbnailUrl = data.thumbnailUrl as string;

      return {
        subject: `[Instauto] 오늘의 인스타그램 콘텐츠가 준비되었어요!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyle}</head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Instauto</div>
              </div>
              <h2>안녕하세요, ${shopName} 사장님!</h2>
              <p>오늘의 인스타그램 콘텐츠가 준비되었습니다.</p>
              <div class="content">
                ${thumbnailUrl ? `<img src="${thumbnailUrl}" alt="오늘의 콘텐츠" style="width:100%;border-radius:8px;margin-bottom:16px;" />` : ''}
                <p>지금 바로 확인하고 인스타그램에 업로드해보세요!</p>
              </div>
              <div style="text-align:center;">
                <a href="${APP_URL}/home" class="button">콘텐츠 확인하기</a>
              </div>
              <div class="footer">
                <p>이 메일은 Instauto에서 발송되었습니다.</p>
                <p>더 이상 메일을 받고 싶지 않으시면 <a href="${APP_URL}/settings">설정</a>에서 변경해주세요.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };
    }

    case 'trial_expiry_reminder': {
      const daysRemaining = data.daysRemaining as number || 7;
      const trialEndAt = data.trialEndAt as Date;
      const endDateStr = trialEndAt ? formatDateKST(new Date(trialEndAt)) : '';

      return {
        subject: `[Instauto] 무료 체험이 ${daysRemaining}일 후 종료됩니다`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyle}</head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Instauto</div>
              </div>
              <h2>무료 체험이 곧 종료됩니다</h2>
              <div class="content">
                <p>현재 무료 체험 기간이 <strong>${daysRemaining}일</strong> 남았습니다.</p>
                <p>체험 종료일: ${endDateStr}</p>
                <p>계속해서 매일 자동으로 인스타그램 콘텐츠를 받아보시려면 유료 플랜으로 업그레이드해주세요.</p>
              </div>
              <h3>요금제 안내</h3>
              <div class="content">
                <p><strong>Basic 플랜</strong> - 월 ${PLAN_CONFIG.BASIC.price.toLocaleString()}원</p>
                <ul>
                  <li>매일 AI 콘텐츠 자동 생성</li>
                  <li>하루 ${PLAN_CONFIG.BASIC.regenerateLimit}회 재생성</li>
                </ul>
                <p><strong>Pro 플랜</strong> - 월 ${PLAN_CONFIG.PRO.price.toLocaleString()}원</p>
                <ul>
                  <li>매일 AI 콘텐츠 자동 생성</li>
                  <li>하루 ${PLAN_CONFIG.PRO.regenerateLimit}회 재생성</li>
                </ul>
              </div>
              <div style="text-align:center;">
                <a href="${APP_URL}/settings" class="button">플랜 선택하기</a>
              </div>
              <div class="footer">
                <p>리뷰를 작성하면 체험 기간이 7일 연장됩니다!</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };
    }

    case 'trial_expired': {
      return {
        subject: `[Instauto] 무료 체험이 종료되었습니다`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyle}</head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Instauto</div>
              </div>
              <h2>무료 체험이 종료되었습니다</h2>
              <div class="content">
                <p>Instauto 무료 체험 기간이 종료되었습니다.</p>
                <p>계속해서 서비스를 이용하시려면 유료 플랜을 구독해주세요.</p>
              </div>
              <div style="text-align:center;">
                <a href="${APP_URL}/settings" class="button">플랜 구독하기</a>
              </div>
              <div class="footer">
                <p>그동안 Instauto를 이용해주셔서 감사합니다.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };
    }

    case 'payment_success': {
      const plan = data.plan as string || 'BASIC';
      const amount = data.amount as number || 0;
      const periodEnd = data.periodEnd as Date;
      const periodEndStr = periodEnd ? formatDateKST(new Date(periodEnd)) : '';

      return {
        subject: `[Instauto] 결제가 완료되었습니다`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyle}</head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Instauto</div>
              </div>
              <h2>결제가 완료되었습니다</h2>
              <div class="content">
                <p><strong>플랜:</strong> ${plan}</p>
                <p><strong>결제 금액:</strong> ${amount.toLocaleString()}원</p>
                <p><strong>이용 기간:</strong> ~${periodEndStr}</p>
              </div>
              <p>이제 매일 새로운 인스타그램 콘텐츠를 받아보실 수 있습니다!</p>
              <div style="text-align:center;">
                <a href="${APP_URL}/home" class="button">콘텐츠 확인하기</a>
              </div>
              <div class="footer">
                <p>결제 관련 문의: support@instauto.kr</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };
    }

    case 'payment_failed': {
      const reason = data.reason as string || '결제 정보를 확인해주세요.';

      return {
        subject: `[Instauto] 결제에 실패했습니다`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyle}</head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Instauto</div>
              </div>
              <h2>결제에 실패했습니다</h2>
              <div class="content" style="background:#fef2f2;">
                <p>정기 결제가 실패했습니다.</p>
                <p><strong>사유:</strong> ${reason}</p>
                <p>7일 이내에 결제 수단을 변경하지 않으면 서비스 이용이 중단됩니다.</p>
              </div>
              <div style="text-align:center;">
                <a href="${APP_URL}/settings" class="button">결제 수단 변경</a>
              </div>
              <div class="footer">
                <p>문의: support@instauto.kr</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };
    }

    case 'subscription_canceled': {
      const endDate = data.endDate as Date;
      const endDateStr = endDate ? formatDateKST(new Date(endDate)) : '';

      return {
        subject: `[Instauto] 구독이 취소되었습니다`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyle}</head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Instauto</div>
              </div>
              <h2>구독이 취소되었습니다</h2>
              <div class="content">
                <p>구독 취소가 완료되었습니다.</p>
                <p>${endDateStr}까지는 서비스를 계속 이용하실 수 있습니다.</p>
              </div>
              <p>언제든 다시 구독하실 수 있습니다. 감사합니다!</p>
              <div style="text-align:center;">
                <a href="${APP_URL}/settings" class="button">다시 구독하기</a>
              </div>
              <div class="footer">
                <p>그동안 Instauto를 이용해주셔서 감사합니다.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };
    }

    default:
      return {
        subject: '[Instauto] 알림',
        html: '<p>알림이 있습니다.</p>',
      };
  }
}

/**
 * 대량 이메일 발송 (Cron Job용)
 */
export async function sendBulkNotifications(
  recipients: Array<{ email: string; data?: Record<string, unknown> }>,
  type: EmailNotificationType
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const result = await sendNotification({
      to: recipient.email,
      type,
      data: recipient.data,
    });

    if (result.success) {
      success++;
    } else {
      failed++;
    }

    // Rate limiting: 100ms 간격
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return { success, failed };
}
