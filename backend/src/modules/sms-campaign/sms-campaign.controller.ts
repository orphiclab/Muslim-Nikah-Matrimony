import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SmsCampaignService } from './sms-campaign.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateCampaignDto, CreateTemplateDto, SendIndividualSmsDto } from './dto/sms-campaign.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/sms-campaign')
export class SmsCampaignController {
  constructor(private readonly service: SmsCampaignService) {}

  // ─── Dashboard ────────────────────────────────────────────────────────────
  @Get('stats')
  getStats() { return this.service.getDashboardStats(); }

  // ─── Targeting ────────────────────────────────────────────────────────────
  @Get('users')
  getUsers(
    @Query('packageStatus') packageStatus?: string,
    @Query('gender') gender?: string,
    @Query('country') country?: string,
    @Query('lastActiveDays') lastActiveDays?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getTargetableUsers({
      packageStatus,
      gender,
      country,
      lastActiveDays: lastActiveDays ? parseInt(lastActiveDays) : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
  }

  // ─── Templates — MUST be declared before :id to avoid route shadowing ─────
  @Get('templates/list')
  getTemplates() { return this.service.getTemplates(); }

  @Post('templates')
  createTemplate(@Body() dto: CreateTemplateDto) { return this.service.createTemplate(dto); }

  @Put('templates/:id')
  updateTemplate(@Param('id') id: string, @Body() dto: Partial<CreateTemplateDto>) {
    return this.service.updateTemplate(id, dto);
  }

  @Delete('templates/:id')
  deleteTemplate(@Param('id') id: string) { return this.service.deleteTemplate(id); }

  // ─── Static POST routes before :id/send ───────────────────────────────────
  @Post('send')
  createAndSend(@CurrentUser() user: any, @Body() dto: CreateCampaignDto & { selectedUserIds?: string[] }) {
    return this.service.createAndSendCampaign(user.userId, dto);
  }

  @Post('send-individual')
  sendIndividual(@CurrentUser() user: any, @Body() dto: SendIndividualSmsDto) {
    return this.service.sendIndividualSms(user.userId, dto);
  }

  // ─── Campaign list + create ───────────────────────────────────────────────
  @Get()
  getCampaigns() { return this.service.getCampaigns(); }

  @Post()
  createCampaign(@CurrentUser() user: any, @Body() dto: CreateCampaignDto) {
    return this.service.createCampaign(user.userId, dto);
  }

  // ─── Parameterized :id routes LAST to avoid shadowing static routes ───────
  @Get(':id')
  getCampaign(@Param('id') id: string) { return this.service.getCampaign(id); }

  @Post(':id/send')
  sendExisting(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { recipientType?: string; recipientFilter?: any; selectedUserIds?: string[] },
  ) {
    return this.service.sendCampaign(user.userId, id, body);
  }
}
