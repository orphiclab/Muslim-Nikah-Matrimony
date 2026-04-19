import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  private get configured(): boolean {
    return !!(process.env.MAIL_USER && process.env.MAIL_PASS);
  }

  private getTransport() {
    return nodemailer.createTransport({
      host: process.env.MAIL_HOST ?? 'smtp-relay.brevo.com',
      port: parseInt(process.env.MAIL_PORT ?? '587'),
      secure: process.env.MAIL_SECURE === 'true',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  private get fromAddress(): string {
    return `"Muslim Nikah Matrimony" <${process.env.MAIL_FROM ?? process.env.MAIL_USER}>`;
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.configured) {
      this.logger.warn(`[DEV] Email skipped (no MAIL config). To: ${to} | Subject: ${subject}`);
      return;
    }
    try {
      await this.getTransport().sendMail({ from: this.fromAddress, to, subject, html });
      this.logger.log(`Email sent ✓ → ${to} | ${subject}`);
    } catch (err) {
      this.logger.error(`Email FAILED → ${to} | ${subject}`, err);
      // Don't throw — email failures should never break core flows
    }
  }

  // ─── Shared layout wrapper ──────────────────────────────────────────────────
  private wrap(title: string, body: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1B6B4A,#2d9966);padding:36px 40px 28px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">🕌 Muslim Nikah Matrimony</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">${title}</p>
    </div>
    <!-- Body -->
    <div style="padding:36px 40px;">
      ${body}
    </div>
    <!-- Footer -->
    <div style="padding:18px 40px;background:#F9FAFB;border-top:1px solid #E5E7EB;text-align:center;">
      <p style="margin:0;color:#9CA3AF;font-size:12px;">© ${new Date().getFullYear()} Muslim Nikah Matrimony · All rights reserved.</p>
      <p style="margin:4px 0 0;color:#9CA3AF;font-size:11px;">This is an automated message. Please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>`;
  }

  private btn(label: string, href: string, color = '#1B6B4A'): string {
    return `<div style="text-align:center;margin:28px 0;">
      <a href="${href}" style="display:inline-block;background:${color};color:#ffffff;text-decoration:none;
         padding:14px 36px;border-radius:12px;font-size:15px;font-weight:600;letter-spacing:0.3px;
         box-shadow:0 4px 12px rgba(27,107,74,0.3);">${label}</a>
    </div>`;
  }

  private badge(text: string, color: string, bg: string): string {
    return `<span style="display:inline-block;background:${bg};color:${color};border-radius:6px;
      padding:4px 12px;font-size:12px;font-weight:700;letter-spacing:0.5px;">${text}</span>`;
  }

  private row(label: string, value: string): string {
    return `<tr>
      <td style="padding:8px 12px;color:#6B7280;font-size:13px;width:40%;">${label}</td>
      <td style="padding:8px 12px;color:#111827;font-size:13px;font-weight:600;">${value}</td>
    </tr>`;
  }

  private table(rows: string): string {
    return `<table style="width:100%;border-collapse:collapse;background:#F9FAFB;border-radius:10px;overflow:hidden;margin:20px 0;">
      <tbody>${rows}</tbody>
    </table>`;
  }

  // ─── 1. Welcome email ───────────────────────────────────────────────────────
  async sendWelcome(to: string, email: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const body = `
      <h2 style="margin:0 0 12px;color:#111827;font-size:20px;">Assalamu Alaikum! 🌙</h2>
      <p style="margin:0 0 16px;color:#6B7280;font-size:15px;line-height:1.6;">
        Welcome to <strong>Muslim Nikah Matrimony</strong> — your trusted platform for halal matchmaking.
        Your account has been created successfully for <strong>${email}</strong>.
      </p>
      <h3 style="margin:0 0 10px;color:#1B6B4A;font-size:15px;">🚀 Get started in 3 simple steps:</h3>
      <ol style="margin:0 0 20px;color:#6B7280;font-size:14px;line-height:2;padding-left:20px;">
        <li>Complete your profile with accurate details</li>
        <li>Choose a membership plan that suits you</li>
        <li>Browse and connect with compatible matches</li>
      </ol>
      ${this.btn('Complete Your Profile →', `${frontendUrl}/dashboard/create-profile`)}
      <p style="margin:20px 0 0;color:#9CA3AF;font-size:13px;line-height:1.5;">
        If you did not create this account, you can safely ignore this email.
      </p>`;
    await this.send(to, 'Welcome to Muslim Nikah Matrimony 🌙', this.wrap('Welcome Aboard!', body));
  }

  // ─── 2. Password Reset ───────────────────────────────────────────────────────
  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    const body = `
      <h2 style="margin:0 0 12px;color:#111827;font-size:20px;">Reset Your Password</h2>
      <p style="margin:0 0 20px;color:#6B7280;font-size:15px;line-height:1.6;">
        We received a request to reset the password for <strong>${to}</strong>.
        Click the button below — the link expires in <strong>1 hour</strong>.
      </p>
      ${this.btn('Reset My Password', resetUrl)}
      <div style="margin:24px 0 0;padding:14px;background:#F9FAFB;border-radius:10px;border:1px solid #E5E7EB;">
        <p style="margin:0;color:#6B7280;font-size:12px;">Or copy this link into your browser:</p>
        <p style="margin:4px 0 0;color:#1B6B4A;font-size:12px;word-break:break-all;">${resetUrl}</p>
      </div>
      <p style="margin:20px 0 0;color:#9CA3AF;font-size:13px;">
        If you didn't request this, your password won't change and this link will expire automatically.
      </p>`;
    await this.send(to, 'Reset Your Password — Muslim Nikah Matrimony', this.wrap('Password Reset Request', body));
  }

  // ─── 3a. Subscription Payment Submitted (PENDING) ────────────────────────────
  async sendSubscriptionPending(to: string, data: {
    profileName: string;
    planName: string;
    amount: number;
    currency: string;
    bankRef?: string;
  }): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const body = `
      <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">Payment Received for Review</h2>
      <p style="margin:0 0 4px;color:#6B7280;font-size:15px;line-height:1.6;">
        Thank you! Your subscription payment has been submitted and is now <strong>pending admin approval</strong>.
      </p>
      <p style="margin:0 0 20px;">${this.badge('⏳ PENDING APPROVAL', '#92400E', '#FEF3C7')}</p>
      ${this.table(
        this.row('Profile', data.profileName) +
        this.row('Plan', data.planName) +
        this.row('Amount', `${data.currency} ${data.amount.toLocaleString()}`) +
        (data.bankRef ? this.row('Bank Reference', data.bankRef) : '') +
        this.row('Status', 'Pending Approval')
      )}
      <p style="color:#6B7280;font-size:14px;line-height:1.6;">
        Our team typically reviews payments within <strong>24 hours</strong>. You'll receive another email once your
        subscription is activated. You can also monitor the status from your dashboard.
      </p>
      ${this.btn('Go to Dashboard', `${frontendUrl}/dashboard/subscription`)}`;
    await this.send(to, '⏳ Subscription Payment Received — Pending Approval', this.wrap('Subscription Payment Submitted', body));
  }

  // ─── 3b. Subscription Approved (ACTIVE) ─────────────────────────────────────
  async sendSubscriptionApproved(to: string, data: {
    profileName: string;
    planName: string;
    startDate: Date;
    endDate: Date;
    durationDays: number;
  }): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const body = `
      <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">Your Subscription is Now Active! 🎉</h2>
      <p style="margin:0 0 4px;color:#6B7280;font-size:15px;line-height:1.6;">
        Great news! Your subscription payment has been <strong>approved</strong> and your profile is now live.
      </p>
      <p style="margin:0 0 20px;">${this.badge('✅ ACTIVE', '#065F46', '#D1FAE5')}</p>
      ${this.table(
        this.row('Profile', data.profileName) +
        this.row('Plan', data.planName) +
        this.row('Duration', `${data.durationDays} days`) +
        this.row('Activated On', fmt(data.startDate)) +
        this.row('Expires On', fmt(data.endDate))
      )}
      <p style="color:#6B7280;font-size:14px;line-height:1.6;">
        Your profile is now <strong>visible to all members</strong>. Start browsing matches and connecting with compatible profiles!
      </p>
      ${this.btn('Browse Matches Now →', `${frontendUrl}/profiles`)}`;
    await this.send(to, '✅ Subscription Activated — You\'re Now Live!', this.wrap('Subscription Approved', body));
  }

  // ─── 3c. Subscription Rejected ───────────────────────────────────────────────
  async sendSubscriptionRejected(to: string, data: {
    profileName: string;
    planName: string;
    reason: string;
  }): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const body = `
      <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">Subscription Payment Not Approved</h2>
      <p style="margin:0 0 4px;color:#6B7280;font-size:15px;line-height:1.6;">
        Unfortunately, your subscription payment could not be approved at this time.
      </p>
      <p style="margin:0 0 20px;">${this.badge('❌ REJECTED', '#991B1B', '#FEE2E2')}</p>
      ${this.table(
        this.row('Profile', data.profileName) +
        this.row('Plan', data.planName) +
        this.row('Reason', data.reason)
      )}
      <p style="color:#6B7280;font-size:14px;line-height:1.6;">
        Please review the reason above and resubmit your payment. If you believe this was an error,
        please contact our support team via WhatsApp for assistance.
      </p>
      ${this.btn('Resubmit Payment →', `${frontendUrl}/select-plan`, '#DC2626')}`;
    await this.send(to, '❌ Subscription Payment Rejected', this.wrap('Subscription Rejected', body));
  }

  // ─── 4a. Boost Payment Submitted (PENDING) ────────────────────────────────────
  async sendBoostPending(to: string, data: {
    profileName: string;
    days: number;
    amount: number;
    currency: string;
    bankRef?: string;
  }): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const body = `
      <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">Boost Request Under Review ⚡</h2>
      <p style="margin:0 0 4px;color:#6B7280;font-size:15px;line-height:1.6;">
        Your profile boost payment has been submitted and is awaiting admin approval.
      </p>
      <p style="margin:0 0 20px;">${this.badge('⏳ PENDING', '#92400E', '#FEF3C7')}</p>
      ${this.table(
        this.row('Profile', data.profileName) +
        this.row('Boost Duration', `${data.days} days`) +
        this.row('Amount', `${data.currency} ${data.amount.toLocaleString()}`) +
        (data.bankRef ? this.row('Bank Reference', data.bankRef) : '') +
        this.row('Benefit', 'Featured at top of search results')
      )}
      <p style="color:#6B7280;font-size:14px;line-height:1.6;">
        Once approved, your profile will appear at the <strong>top of all search results</strong> for ${data.days} days,
        giving you maximum visibility to potential matches.
      </p>
      ${this.btn('View Dashboard', `${frontendUrl}/dashboard/boosts`)}`;
    await this.send(to, '⚡ Boost Request Received — Pending Approval', this.wrap('Boost Payment Submitted', body));
  }

  // ─── 4b. Boost Approved (ACTIVE) ─────────────────────────────────────────────
  async sendBoostApproved(to: string, data: {
    profileName: string;
    days: number;
    startDate: Date;
    endDate: Date;
  }): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const body = `
      <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">Your Profile Boost is Live! ⚡🚀</h2>
      <p style="margin:0 0 4px;color:#6B7280;font-size:15px;line-height:1.6;">
        Your boost has been activated! Your profile is now <strong>featured at the top of search results</strong>.
      </p>
      <p style="margin:0 0 20px;">${this.badge('✅ BOOSTED', '#065F46', '#D1FAE5')}</p>
      ${this.table(
        this.row('Profile', data.profileName) +
        this.row('Boost Duration', `${data.days} days`) +
        this.row('Activated', fmt(data.startDate)) +
        this.row('Expires', fmt(data.endDate)) +
        this.row('Benefit', '🔝 Top of search results')
      )}
      <p style="color:#6B7280;font-size:14px;line-height:1.6;">
        Make the most of your boost! Update your profile with fresh details to attract the best matches.
      </p>
      ${this.btn('View Your Profile →', `${frontendUrl}/profiles`)}`;
    await this.send(to, '⚡ Profile Boost Activated — You\'re at the Top!', this.wrap('Boost Approved', body));
  }

  // ─── 4c. Boost Rejected ───────────────────────────────────────────────────────
  async sendBoostRejected(to: string, data: {
    profileName: string;
    reason: string;
  }): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const body = `
      <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">Boost Payment Not Approved</h2>
      <p style="margin:0 0 4px;color:#6B7280;font-size:15px;line-height:1.6;">
        Unfortunately, your profile boost payment could not be approved.
      </p>
      <p style="margin:0 0 20px;">${this.badge('❌ REJECTED', '#991B1B', '#FEE2E2')}</p>
      ${this.table(
        this.row('Profile', data.profileName) +
        this.row('Reason', data.reason)
      )}
      <p style="color:#6B7280;font-size:14px;line-height:1.6;">
        Please review the rejection reason and try again. Contact us on WhatsApp if you need assistance.
      </p>
      ${this.btn('Try Again →', `${frontendUrl}/dashboard/boosts`, '#DC2626')}`;
    await this.send(to, '❌ Boost Payment Rejected', this.wrap('Boost Rejected', body));
  }

  // ─── 5a. Subscription Expiry — 7 days ─────────────────────────────────────────
  async sendSubscriptionExpiring7Days(to: string, data: {
    profileName: string;
    planName: string;
    endDate: Date;
  }): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const body = `
      <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">Your Subscription Expires in 7 Days 🔔</h2>
      <p style="margin:0 0 20px;color:#6B7280;font-size:15px;line-height:1.6;">
        This is a friendly reminder that your membership subscription will expire soon. Renew now to stay visible and keep connecting.
      </p>
      ${this.table(
        this.row('Profile', data.profileName) +
        this.row('Plan', data.planName) +
        this.row('Expires On', fmt(data.endDate) + ' (7 days left)')
      )}
      <p style="color:#6B7280;font-size:14px;line-height:1.6;">
        Don't let your profile go offline. Renew your subscription to continue being visible to all members.
      </p>
      ${this.btn('Renew Subscription →', `${frontendUrl}/select-plan`)}`;
    await this.send(to, '🔔 Reminder: Your Subscription Expires in 7 Days', this.wrap('Subscription Expiry Reminder', body));
  }

  // ─── 5b. Subscription Expiry — 1 day ──────────────────────────────────────────
  async sendSubscriptionExpiring1Day(to: string, data: {
    profileName: string;
    planName: string;
    endDate: Date;
  }): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const body = `
      <h2 style="margin:0 0 8px;color:#B45309;font-size:20px;">⚠️ Urgent: Subscription Expires Tomorrow!</h2>
      <p style="margin:0 0 20px;color:#6B7280;font-size:15px;line-height:1.6;">
        Your subscription expires <strong>tomorrow</strong>. After expiry, your profile will no longer be visible to other members.
      </p>
      ${this.table(
        this.row('Profile', data.profileName) +
        this.row('Plan', data.planName) +
        this.row('Expires', fmt(data.endDate) + ' ⚠️ TOMORROW')
      )}
      <p style="color:#6B7280;font-size:14px;line-height:1.6;">
        <strong>Act now</strong> to avoid any interruption to your profile visibility and connections.
      </p>
      ${this.btn('⚡ Renew Now — Last Chance!', `${frontendUrl}/select-plan`, '#D97706')}`;
    await this.send(to, '⚠️ URGENT: Subscription Expires Tomorrow!', this.wrap('⚠️ Final Expiry Warning', body));
  }

  // ─── 5c. Boost Expiry — 2 days ────────────────────────────────────────────────
  async sendBoostExpiring2Days(to: string, data: {
    profileName: string;
    endDate: Date;
  }): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const body = `
      <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">Your Profile Boost Expires in 2 Days ⚡</h2>
      <p style="margin:0 0 20px;color:#6B7280;font-size:15px;line-height:1.6;">
        Your profile boost is about to expire. After expiry, your profile will return to standard listing position.
      </p>
      ${this.table(
        this.row('Profile', data.profileName) +
        this.row('Boost Expires', fmt(data.endDate) + ' (2 days left)')
      )}
      <p style="color:#6B7280;font-size:14px;line-height:1.6;">
        Boost again to maintain your <strong>top position</strong> in search results and attract more matches!
      </p>
      ${this.btn('Boost Again →', `${frontendUrl}/dashboard/boosts`)}`;
    await this.send(to, '⚡ Reminder: Your Profile Boost Expires in 2 Days', this.wrap('Boost Expiry Reminder', body));
  }

  // ─── 6a. Profile Status → ACTIVE ─────────────────────────────────────────────
  async sendProfileStatusActive(to: string, data: { profileName: string }): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const body = `
      <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">Your Profile is Now Active 🟢</h2>
      <p style="margin:0 0 4px;color:#6B7280;font-size:15px;line-height:1.6;">
        Your profile visibility is now set to <strong>Active</strong>.
        You are fully visible in search results to all members.
      </p>
      <p style="margin:0 0 20px;">${this.badge('🟢 ACTIVE', '#065F46', '#D1FAE5')}</p>
      ${this.table(
        this.row('Profile', data.profileName) +
        this.row('Status', 'Active — Visible in search') +
        this.row('Effect', 'Members can find and contact you')
      )}
      <p style="color:#6B7280;font-size:14px;line-height:1.6;">
        Keep your profile details fresh to attract the right match!
      </p>
      ${this.btn('Browse Matches →', `${frontendUrl}/profiles`)}`;
    await this.send(to, '🟢 Profile Active — You\'re Visible in Search!', this.wrap('Profile Status: Active', body));
  }

  // ─── 6b. Profile Status → PAUSED ─────────────────────────────────────────────
  async sendProfileStatusPaused(to: string, data: { profileName: string }): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const body = `
      <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">Your Profile is Paused ⏸️</h2>
      <p style="margin:0 0 4px;color:#6B7280;font-size:15px;line-height:1.6;">
        Your profile visibility is now set to <strong>Paused</strong>.
        Your profile is temporarily hidden from all search results.
      </p>
      <p style="margin:0 0 20px;">${this.badge('⏸️ PAUSED', '#92400E', '#FEF3C7')}</p>
      ${this.table(
        this.row('Profile', data.profileName) +
        this.row('Status', 'Paused — Temporarily hidden') +
        this.row('Effect', 'Other members cannot find you while paused')
      )}
      <p style="color:#6B7280;font-size:14px;line-height:1.6;">
        You can resume at any time from your dashboard. Your subscription stays active and your data is safe.
      </p>
      ${this.btn('Resume My Profile →', `${frontendUrl}/dashboard/profiles`)}`;
    await this.send(to, '⏸️ Profile Paused — Temporarily Hidden from Search', this.wrap('Profile Status: Paused', body));
  }

  // ─── 6c. Profile Status → INACTIVE ───────────────────────────────────────────
  async sendProfileStatusInactive(to: string, data: { profileName: string }): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const body = `
      <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">Your Profile is Now Inactive ⚫</h2>
      <p style="margin:0 0 4px;color:#6B7280;font-size:15px;line-height:1.6;">
        Your profile visibility is now set to <strong>Inactive</strong>.
        You are not currently participating in the matching process.
      </p>
      <p style="margin:0 0 20px;">${this.badge('⚫ INACTIVE', '#374151', '#F3F4F6')}</p>
      ${this.table(
        this.row('Profile', data.profileName) +
        this.row('Status', 'Inactive — Not participating') +
        this.row('Effect', 'Profile is hidden from all searches')
      )}
      <p style="color:#6B7280;font-size:14px;line-height:1.6;">
        You can reactivate at any time by setting your profile back to <strong>Active</strong>. We hope to see you back soon!
      </p>
      ${this.btn('Reactivate My Profile →', `${frontendUrl}/dashboard/profiles`)}`;
    await this.send(to, '⚫ Profile Set to Inactive', this.wrap('Profile Status: Inactive', body));
  }

  // ─── 7. Contact Visibility Changed ───────────────────────────────────────────
  async sendContactVisibilityChanged(to: string, data: {
    profileName: string;
    visible: boolean;
  }): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const body = data.visible
      ? `
      <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">Contact Details Now Visible 👁️</h2>
      <p style="margin:0 0 4px;color:#6B7280;font-size:15px;line-height:1.6;">
        Your contact details for <strong>${data.profileName}</strong> are now <strong>visible</strong> to matched members.
      </p>
      <p style="margin:0 0 20px;">${this.badge('👁️ CONTACT VISIBLE', '#065F46', '#D1FAE5')}</p>
      ${this.table(
        this.row('Profile', data.profileName) +
        this.row('Contact Details', 'Visible to matched members') +
        this.row('Effect', 'Members can now see your phone / WhatsApp')
      )}
      ${this.btn('Manage Privacy →', `${frontendUrl}/dashboard/profiles`)}`
      : `
      <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">Contact Details Hidden 🔒</h2>
      <p style="margin:0 0 4px;color:#6B7280;font-size:15px;line-height:1.6;">
        Your contact details for <strong>${data.profileName}</strong> are now <strong>hidden</strong> from other members.
      </p>
      <p style="margin:0 0 20px;">${this.badge('🔒 CONTACT HIDDEN', '#374151', '#F3F4F6')}</p>
      ${this.table(
        this.row('Profile', data.profileName) +
        this.row('Contact Details', 'Hidden from all members') +
        this.row('Effect', 'Members can still chat but cannot see contact info')
      )}
      ${this.btn('Manage Privacy →', `${frontendUrl}/dashboard/profiles`)}`;
    const subject = data.visible ? '👁️ Contact Details Now Visible' : '🔒 Contact Details Hidden';
    await this.send(to, subject, this.wrap('Contact Visibility Updated', body));
  }
}
