import { MailService } from './mail.service';
import { ConfigService } from '@nestjs/config';

describe('MailService', () => {
  let service: MailService;
  let configService: jest.Mocked<Partial<ConfigService>>;

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'SMTP_HOST') return 'smtp.mailtrap.io';
        if (key === 'SMTP_PORT') return 587;
        if (key === 'SMTP_USER') return 'testuser';
        if (key === 'SMTP_PASS') return 'testpass';
        return null;
      }),
    };

    service = new MailService(configService as ConfigService);
  });

  it('should initialize transporter and send email without throwing', async () => {
    const sendMailSpy = jest
      .spyOn((service as any).transporter, 'sendMail')
      .mockResolvedValue({ messageId: 'msg-123' } as any);

    await service.sendReportMail({
      to: 'recipient@finking.com',
      subject: 'Test Report',
      html: '<h1>Report</h1>',
      filename: 'report.xlsx',
      attachmentBuffer: Buffer.from('excel-data'),
    });

    expect(sendMailSpy).toHaveBeenCalledWith({
      from: '"FinKing Reports" <reports@finking.com>',
      to: 'recipient@finking.com',
      subject: 'Test Report',
      html: '<h1>Report</h1>',
      attachments: [
        {
          filename: 'report.xlsx',
          content: Buffer.from('excel-data'),
        },
      ],
    });
  });

  it('should fallback to jsonTransport if SMTP credentials are missing', () => {
    const emptyConfigService = {
      get: jest.fn().mockReturnValue(undefined),
    } as any;

    const fallbackService = new MailService(emptyConfigService);
    expect((fallbackService as any).transporter).toBeDefined();
  });
});
