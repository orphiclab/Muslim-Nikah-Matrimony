import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { NotificationModule } from '../notification/notification.module';
import { MailService } from '../auth/mail.service';

@Module({
  imports: [NotificationModule],
  controllers: [PaymentController],
  providers: [PaymentService, MailService],
  exports: [PaymentService],
})
export class PaymentModule {}

