import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  filename: string;
  attachmentBuffer: Buffer;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = Number(this.configService.get<number>('SMTP_PORT')) || 587;
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');

    if (smtpHost && smtpUser) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });
    } else {
      this.transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }
  }

  async sendReportMail(options: SendMailOptions): Promise<void> {
    await this.transporter.sendMail({
      from: '"FinKing Reports" <reports@finking.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: [
        {
          filename: options.filename,
          content: options.attachmentBuffer,
        },
      ],
    });
    this.logger.log(`Report email successfully sent to ${options.to}`);
  }
}
