import { Controller, Get, Param, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { ProfileListService } from './profile-list.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('profile')
export class ProfileListController {
  constructor(
    private readonly service: ProfileListService,
    private readonly prisma: PrismaService,
  ) {}

  // GET /api/profile/list/:viewerProfileId  (requires auth)
  @UseGuards(JwtAuthGuard)
  @Get('list/:viewerProfileId')
  getList(@Param('viewerProfileId') viewerProfileId: string) {
    return this.service.getVisibleProfiles(viewerProfileId);
  }

  // GET /api/profile/public/:id?viewerProfileId=xxx  (NO auth — public detail page + records view)
  @Get('public/:id')
  getPublicProfile(
    @Param('id') id: string,
    @Query('viewerProfileId') viewerProfileId?: string,
  ) {
    return this.service.getPublicProfile(id, viewerProfileId);
  }

  // GET /api/profile/views/:profileId  (auth required — owner only)
  @UseGuards(JwtAuthGuard)
  @Get('views/:profileId')
  async getProfileViews(
    @CurrentUser() user: any,
    @Param('profileId') profileId: string,
    @Query('limit') limit?: string,
  ) {
    // Verify the requesting user owns this profile
    const profile = await this.prisma.childProfile.findUnique({
      where: { id: profileId },
      select: { userId: true },
    });
    if (!profile || profile.userId !== user.userId) {
      throw new ForbiddenException({ success: false, message: 'Access denied' });
    }
    return this.service.getProfileViews(profileId, limit ? parseInt(limit) : 50);
  }
}

