import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController, StaffController } from './admin.controller';
import { PublicPackagesController } from './admin.controller';
import { PaymentModule } from '../payment/payment.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { NotificationModule } from '../notification/notification.module';
import { MailService } from '../auth/mail.service';
import { SmsService } from '../auth/sms.service';
import { AuthModule } from '../auth/auth.module';
import { ChildProfileModule } from '../child-profile/child-profile.module';

@Module({
  imports: [PaymentModule, ActivityLogModule, NotificationModule, AuthModule, ChildProfileModule],
  controllers: [AdminController, PublicPackagesController, StaffController],
  providers: [AdminService, MailService, SmsService],
})
export class AdminModule {}


