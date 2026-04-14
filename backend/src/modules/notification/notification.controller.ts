import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /** GET /notifications — list notifications for the authenticated user */
  @Get()
  async list(@Request() req: any) {
    return this.notificationService.findForUser(req.user.userId);
  }

  /** GET /notifications/unread-count */
  @Get('unread-count')
  async unreadCount(@Request() req: any) {
    const count = await this.notificationService.unreadCount(req.user.userId);
    return { success: true, count };
  }

  /** POST /notifications/:id/read */
  @Post(':id/read')
  async markRead(@Param('id') id: string, @Request() req: any) {
    return this.notificationService.markRead(id, req.user.userId);
  }

  /** POST /notifications/read-all */
  @Post('read-all')
  async markAllRead(@Request() req: any) {
    return this.notificationService.markAllRead(req.user.userId);
  }
}
