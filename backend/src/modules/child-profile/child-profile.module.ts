import { Module } from '@nestjs/common';
import { ChildProfileService } from './child-profile.service';
import { ChildProfileController } from './child-profile.controller';
import { ProfileListController } from './profile-list.controller';
import { ProfileListService } from './profile-list.service';
import { ProfileEditRequestService } from './profile-edit-request.service';
import { ProfileEditRequestController } from './profile-edit-request.controller';
import { RuleEngineModule } from '../rule-engine/rule-engine.module';
import { AutoFillService } from '../user/auto-fill.service';
import { MailService } from '../auth/mail.service';
import { SmsService } from '../auth/sms.service';

@Module({
  imports: [RuleEngineModule],
  controllers: [ChildProfileController, ProfileListController, ProfileEditRequestController],
  providers: [ChildProfileService, ProfileListService, AutoFillService, MailService, SmsService, ProfileEditRequestService],
  exports: [ChildProfileService, ProfileEditRequestService],
})
export class ChildProfileModule {}

