import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { SmsCampaignService } from './sms-campaign.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateCampaignDto, CreateTemplateDto, SendIndividualSmsDto } from './dto/sms-campaign.dto';

/** Mask a phone — show first 4 and last 2 chars: +94 7XXX XXX45 */
function maskPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/\s/g, '');
  if (cleaned.length < 6) return '•••';
  const prefix = cleaned.slice(0, 4);
  const suffix = cleaned.slice(-2);
  const mid = 'X'.repeat(Math.max(0, cleaned.length - 6));
  return `${prefix} ${mid.slice(0, 3)} ${mid.slice(3)}${suffix}`.trim();
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'MARKETING_MANAGER')
@Controller('admin/sms-campaign')
export class SmsCampaignController {
  constructor(private readonly service: SmsCampaignService) {}

  // ─── Dashboard ────────────────────────────────────────────────────────────
  @Get('stats')
  getStats() { return this.service.getDashboardStats(); }

  // ─── Targeting ────────────────────────────────────────────────────────────
  @Get('users')
  async getUsers(
    @CurrentUser() caller: any,
    @Query('packageStatus') packageStatus?: string,
    @Query('gender') gender?: string,
    @Query('country') country?: string,
    @Query('lastActiveDays') lastActiveDays?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.service.getTargetableUsers({
      packageStatus,
      gender,
      country,
      lastActiveDays: lastActiveDays ? parseInt(lastActiveDays) : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
    // Mask phones for non-ADMIN roles (MARKETING_MANAGER sees masked numbers)
    if (caller?.role !== 'ADMIN' && result.data) {
      result.data = result.data.map((u: any) => ({ ...u, phone: maskPhone(u.phone) }));
    }
    return result;
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
