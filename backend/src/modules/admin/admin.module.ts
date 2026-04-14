import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PublicPackagesController } from './admin.controller';
import { PaymentModule } from '../payment/payment.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PaymentModule, ActivityLogModule, NotificationModule],
  controllers: [AdminController, PublicPackagesController],
  providers: [AdminService],
})
export class AdminModule {}

