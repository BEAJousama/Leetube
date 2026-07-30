import crypto from 'crypto';

interface StateData {
  timestamp: number;
  nonce: string;
  deviceFingerprint?: string;
}

export class OAuthStateManager {
  private static readonly STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
  private static readonly SECRET = process.env.OAUTH_STATE_SECRET || 'your-secret-key';

  static generateState(deviceInfo?: { userAgent?: string; ipAddress?: string }): string {
    const stateData: StateData = {
      timestamp: Date.now(),
      nonce: crypto.randomBytes(16).toString('hex'),
      deviceFingerprint: deviceInfo ? crypto
        .createHash('sha256')
        .update((deviceInfo.userAgent || '') + (deviceInfo.ipAddress || ''))
        .digest('hex')
        .substring(0, 8) : undefined
    };

    const stateString = JSON.stringify(stateData);
    const signature = crypto
      .createHmac('sha256', this.SECRET)
      .update(stateString)
      .digest('hex');

    return Buffer.from(JSON.stringify({ data: stateData, signature })).toString('base64url');
  }

  static validateState(
    state: string, 
    deviceInfo?: { userAgent?: string; ipAddress?: string }
  ): boolean {
    try {
      const parsed = JSON.parse(Buffer.from(state, 'base64url').toString());
      const { data, signature } = parsed;

      // Verify signature
      const expectedSignature = crypto
        .createHmac('sha256', this.SECRET)
        .update(JSON.stringify(data))
        .digest('hex');

      if (signature !== expectedSignature) {
        return false;
      }

      // Check expiry
      if (Date.now() - data.timestamp > this.STATE_EXPIRY_MS) {
        return false;
      }

      // Validate device fingerprint if provided
      if (data.deviceFingerprint && deviceInfo) {
        const currentFingerprint = crypto
          .createHash('sha256')
          .update((deviceInfo.userAgent || '') + (deviceInfo.ipAddress || ''))
          .digest('hex')
          .substring(0, 8);

        if (data.deviceFingerprint !== currentFingerprint) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }
}