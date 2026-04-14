import { Module } from '@nestjs/common';
import { VisibilityService } from './visibility.service';
import { VisibilityController } from './visibility.controller';
import { RuleEngineModule } from '../rule-engine/rule-engine.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [RuleEngineModule, NotificationModule],
  controllers: [VisibilityController],
  providers: [VisibilityService],
})
export class VisibilityModule {}
