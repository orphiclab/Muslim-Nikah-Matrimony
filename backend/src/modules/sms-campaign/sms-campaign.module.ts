import { Module } from '@nestjs/common';
import { SmsCampaignService } from './sms-campaign.service';
import { SmsCampaignController } from './sms-campaign.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [SmsCampaignController],
  providers: [SmsCampaignService],
})
export class SmsCampaignModule {}
