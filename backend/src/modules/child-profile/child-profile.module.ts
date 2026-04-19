import { Module } from '@nestjs/common';
import { ChildProfileService } from './child-profile.service';
import { ChildProfileController } from './child-profile.controller';
import { ProfileListController } from './profile-list.controller';
import { ProfileListService } from './profile-list.service';
import { RuleEngineModule } from '../rule-engine/rule-engine.module';
import { AutoFillService } from '../user/auto-fill.service';
import { MailService } from '../auth/mail.service';

@Module({
  imports: [RuleEngineModule],
  controllers: [ChildProfileController, ProfileListController],
  providers: [ChildProfileService, ProfileListService, AutoFillService, MailService],
  exports: [ChildProfileService],
})
export class ChildProfileModule {}
