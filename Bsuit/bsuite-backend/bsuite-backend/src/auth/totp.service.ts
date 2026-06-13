import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';

@Injectable()
export class TotpService {

  generateSecret(): string {
    return authenticator.generateSecret();
  }

  generateOtpAuthUrl(userEmail: string, secret: string): string {
    return authenticator.keyuri(userEmail, 'Bsuite', secret);
  }

  async generateQrCode(otpAuthUrl: string): Promise<string> {
    return await qrcode.toDataURL(otpAuthUrl);
  }

  verifyCode(code: string, secret: string): boolean {
    return authenticator.verify({ token: code, secret });
  }
}
