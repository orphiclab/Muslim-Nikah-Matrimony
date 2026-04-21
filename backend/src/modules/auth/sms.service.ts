import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';

/**
 * Dialog eSMS — URL Message Key (GET) API
 *
 * API docs: https://astransglobal.com/pdf/eSMS%20API%20Document-v3.0.pdf
 *
 * Required env vars:
 *   ESMS_API_KEY        — generated from eSMS Portal → URL Message Key → Generate
 *   ESMS_SOURCE_ADDRESS — your approved Sender ID / mask (e.g. SPHIRIADigi)
 *
 * Returns:
 *   "1"       → success
 *   negative  → error (e.g. -1 invalid key, -11 insufficient balance)
 */

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * Send an SMS to one recipient using the Dialog eSMS URL Message Key / GET API.
   * Returns true on success, false on failure.
   */
  async sendSms(toPhone: string, message: string): Promise<boolean> {
    const apiKey = this.config.get<string>('ESMS_API_KEY');
    const sourceAddress = this.config.get<string>('ESMS_SOURCE_ADDRESS') ?? '';

    if (!apiKey || apiKey === 'your-esmsqk-key-here') {
      this.logger.warn(
        'ESMS_API_KEY not configured — SMS disabled. ' +
        'Generate a key from: eSMS Portal → URL Message Key → Generate',
      );
      return false;
    }

    // Dialog accepts: 9-digit (799999999), 10-digit (0799999999), or 11-digit (94799999999)
    // Strip the leading + if present
    const mobile = toPhone.replace(/^\+/, '');

    const params = new URLSearchParams({
      esmsqk: apiKey,
      list: mobile,
      source_address: sourceAddress,
      message: message,
    });

    const url = `https://e-sms.dialog.lk/api/v1/message-via-url/create/url-campaign?${params.toString()}`;

    this.logger.log(`Sending SMS to ${mobile}…`);

    try {
      const result = await this.httpGet(url);
      const trimmed = result.trim();

      if (trimmed === '1') {
        this.logger.log(`SMS sent ✓ to ${mobile}`);
        return true;
      }

      this.logger.error(`SMS API returned error code: ${trimmed} for ${mobile}`);
      return false;
    } catch (err: any) {
      this.logger.error(`SMS send error: ${err.message}`);
      return false;
    }
  }

  // ── HTTP GET helper ─────────────────────────────────────────────────────────

  private httpGet(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const parsed = new URL(url);

      const options = {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: 'GET',
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      });

      req.on('error', reject);
      req.end();
    });
  }
}
