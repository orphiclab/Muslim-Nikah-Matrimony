import { Module } from '@nestjs/common';
import { VisibilityService } from './visibility.service';
import { VisibilityController } from './visibility.controller';
import { RuleEngineModule } from '../rule-engine/rule-engine.module';
import { NotificationModule } from '../notification/notification.module';
import { MailService } from '../auth/mail.service';

@Module({
  imports: [RuleEngineModule, NotificationModule],
  controllers: [VisibilityController],
  providers: [VisibilityService, MailService],
})
export class VisibilityModule {}
