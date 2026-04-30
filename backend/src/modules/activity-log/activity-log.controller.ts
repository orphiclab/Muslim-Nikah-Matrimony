import { Controller, Get, Query, Res, Sse, UseGuards, MessageEvent } from '@nestjs/common';
import type { Response } from 'express';
import { Observable, fromEvent } from 'rxjs';
import { map } from 'rxjs/operators';
import { ActivityLogService } from './activity-log.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('admin/activity-logs')
export class ActivityLogController {
  constructor(private readonly service: ActivityLogService) {}

  @Get()
  getAll(
    @Query('page')      page?:      string,
    @Query('limit')     limit?:     string,
    @Query('category')  category?:  string,
    @Query('level')     level?:     string,
    @Query('search')    search?:    string,
    @Query('dateFrom')  dateFrom?:  string,
    @Query('dateTo')    dateTo?:    string,
    @Query('action')    action?:    string,
  ) {
    return this.service.getAll({
      page:     page     ? parseInt(page)  : 1,
      limit:    limit    ? parseInt(limit) : 10,
      category: category || undefined,
      level:    level    || undefined,
      search:   search   || undefined,
      dateFrom: dateFrom || undefined,
      dateTo:   dateTo   || undefined,
      action:   action   || undefined,
    });
  }

  @Get('stats')
  getStats() {
    return this.service.getStats();
  }

  /** CSV export — streams the file directly */
  @Get('export')
  async exportCsv(
    @Res() res: Response,
    @Query('category')  category?:  string,
    @Query('level')     level?:     string,
    @Query('search')    search?:    string,
    @Query('dateFrom')  dateFrom?:  string,
    @Query('dateTo')    dateTo?:    string,
    @Query('action')    action?:    string,
  ) {
    const csv = await this.service.exportCsv({
      category: category || undefined,
      level:    level    || undefined,
      search:   search   || undefined,
      dateFrom: dateFrom || undefined,
      dateTo:   dateTo   || undefined,
      action:   action   || undefined,
    });
    const filename = `activity-log-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  /** SSE — admin panel subscribes to receive live log entries */
  @Sse('stream')
  stream(): Observable<MessageEvent> {
    return new Observable<MessageEvent>(subscriber => {
      const handler = (entry: any) => {
        subscriber.next({ data: entry } as MessageEvent);
      };
      this.service.emitter.on('log', handler);
      return () => this.service.emitter.off('log', handler);
    });
  }
}
