import { Controller, Post, Get, Put, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ChildProfileService } from './child-profile.service';
import { CreateChildProfileDto, UpdateChildProfileDto } from './dto/child-profile.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ChildProfileController {
  constructor(private readonly service: ChildProfileService) {}

  @Post('create')
  create(@CurrentUser() user: any, @Body() dto: CreateChildProfileDto) {
    return this.service.create(user.userId, dto);
  }

  @Put('update/:id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateChildProfileDto) {
    return this.service.update(user.userId, id, dto);
  }

  @Patch('privacy/:id')
  updatePrivacy(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { showRealName?: boolean; nickname?: string },
  ) {
    return this.service.updatePrivacy(user.userId, id, body);
  }

  @Patch('status/:id')
  updateStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.service.updateStatus(user.userId, id, body.status);
  }

  @Post('boost/:id')
  boostProfile(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { days: number },
  ) {
    return this.service.boostProfile(user.userId, id, body.days);
  }

  @Get('my')
  getMyProfiles(@CurrentUser() user: any) {
    return this.service.getMyProfiles(user.userId);
  }

  @Get(':id')
  getOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.getOne(user.userId, id);
  }

  @Delete(':id')
  delete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.delete(user.userId, id);
  }
}
