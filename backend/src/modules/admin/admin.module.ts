import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PublicPackagesController } from './admin.controller';
import { PaymentModule } from '../payment/payment.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { NotificationModule } from '../notification/notification.module';
import { MailService } from '../auth/mail.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PaymentModule, ActivityLogModule, NotificationModule, AuthModule],
  controllers: [AdminController, PublicPackagesController],
  providers: [AdminService, MailService],
})
export class AdminModule {}

