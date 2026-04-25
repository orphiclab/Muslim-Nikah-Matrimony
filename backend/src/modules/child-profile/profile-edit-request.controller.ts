import { Controller, Post, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ProfileEditRequestService } from './profile-edit-request.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileEditRequestController {
  constructor(private readonly service: ProfileEditRequestService) {}

  /** User: submit an edit request for their profile */
  @Post('edit-request/:profileId')
  submitEditRequest(
    @CurrentUser() user: any,
    @Param('profileId') profileId: string,
    @Body() newData: Record<string, any>,
  ) {
    return this.service.submitEditRequest(user.userId, profileId, newData);
  }

  /** User: check if there's a pending edit request for their profile */
  @Get('edit-request/:profileId/pending')
  getMyPendingRequest(
    @CurrentUser() user: any,
    @Param('profileId') profileId: string,
  ) {
    return this.service.getMyPendingRequest(user.userId, profileId);
  }
}
