import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter } from 'events';

export interface LogActivityDto {
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  category: string;
  entityId?: string;
  entityLabel?: string;
  targetId?: string;
  targetEmail?: string;
  meta?: Record<string, any>;
  level?: 'INFO' | 'WARNING' | 'ERROR';
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class ActivityLogService {
  private readonly logger = new Logger(ActivityLogService.name);

  /** In-process event bus for SSE real-time streaming */
  readonly emitter = new EventEmitter();

  constructor(private readonly prisma: PrismaService) {
    this.emitter.setMaxListeners(50);
  }

  /** Write one activity entry — fire-and-forget safe */
  async log(dto: LogActivityDto): Promise<void> {
    try {
      const entry = await this.prisma.activityLog.create({
        data: {
          actorId:      dto.actorId     ?? null,
          actorEmail:   dto.actorEmail  ?? null,
          actorRole:    dto.actorRole   ?? null,
          action:       dto.action,
          category:     dto.category,
          entityId:     dto.entityId    ?? null,
          entityLabel:  dto.entityLabel ?? null,
          meta:         dto.meta        ?? undefined,
          level:        dto.level       ?? 'INFO',
          ipAddress:    dto.ipAddress   ?? null,
          userAgent:    dto.userAgent   ?? null,
        },
      });
      // Broadcast to all connected SSE clients
      this.emitter.emit('log', entry);
    } catch (err) {
      this.logger.error(`Failed to write activity log: ${err?.message}`);
    }
  }

  /** Paginated list for admin — newest first */
  async getAll(opts: {
    page?: number;
    limit?: number;
    category?: string;
    level?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    action?: string;
  }) {
    const page  = Math.max(1, opts.page  ?? 1);
    const limit = Math.min(100, opts.limit ?? 10);
    const skip  = (page - 1) * limit;

    const where: any = {};
    if (opts.category) where.category = opts.category;
    if (opts.level)    where.level     = opts.level;
    if (opts.action)   where.action    = opts.action;

    // Date range
    if (opts.dateFrom || opts.dateTo) {
      where.createdAt = {};
      if (opts.dateFrom) where.createdAt.gte = new Date(opts.dateFrom);
      if (opts.dateTo) {
        const to = new Date(opts.dateTo);
        to.setHours(23, 59, 59, 999);
        where.createdAt.lte = to;
      }
    }

    if (opts.search) {
      where.OR = [
        { action:      { contains: opts.search, mode: 'insensitive' } },
        { actorEmail:  { contains: opts.search, mode: 'insensitive' } },
        { entityLabel: { contains: opts.search, mode: 'insensitive' } },
        { ipAddress:   { contains: opts.search, mode: 'insensitive' } },
        { actorId:     { contains: opts.search, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.activityLog.count({ where }),
      this.prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      success: true,
      data,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  /** Export all matching logs as CSV string */
  async exportCsv(opts: {
    category?: string;
    level?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    action?: string;
  }) {
    const where: any = {};
    if (opts.category) where.category = opts.category;
    if (opts.level)    where.level     = opts.level;
    if (opts.action)   where.action    = opts.action;

    if (opts.dateFrom || opts.dateTo) {
      where.createdAt = {};
      if (opts.dateFrom) where.createdAt.gte = new Date(opts.dateFrom);
      if (opts.dateTo) {
        const to = new Date(opts.dateTo);
        to.setHours(23, 59, 59, 999);
        where.createdAt.lte = to;
      }
    }

    if (opts.search) {
      where.OR = [
        { action:      { contains: opts.search, mode: 'insensitive' } },
        { actorEmail:  { contains: opts.search, mode: 'insensitive' } },
        { entityLabel: { contains: opts.search, mode: 'insensitive' } },
        { ipAddress:   { contains: opts.search, mode: 'insensitive' } },
      ];
    }

    const rows = await this.prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 5000,
    });

    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const headers = ['Date', 'Time', 'Action', 'Category', 'Level', 'Actor Email', 'Actor Role', 'IP Address', 'Device', 'Entity', 'Meta'];
    const lines = [
      headers.join(','),
      ...rows.map(r => {
        const d = new Date(r.createdAt);
        return [
          esc(d.toLocaleDateString('en-GB')),
          esc(d.toLocaleTimeString('en-GB', { hour12: false })),
          esc(r.action),
          esc(r.category),
          esc(r.level),
          esc(r.actorEmail),
          esc(r.actorRole),
          esc(r.ipAddress),
          esc(this.parseDevice(r.userAgent)),
          esc(r.entityLabel),
          esc(JSON.stringify(r.meta ?? {})),
        ].join(',');
      }),
    ];
    return lines.join('\r\n');
  }

  /** Parse UA string into short device label */
  parseDevice(ua?: string | null): string {
    if (!ua) return '';
    const browser =
      ua.includes('Edg/')    ? 'Edge' :
      ua.includes('OPR/')    ? 'Opera' :
      ua.includes('Chrome/') ? 'Chrome' :
      ua.includes('Firefox/') ? 'Firefox' :
      ua.includes('Safari/')  ? 'Safari' : 'Browser';
    const os =
      ua.includes('Windows') ? 'Windows' :
      ua.includes('Mac')     ? 'macOS' :
      ua.includes('Android') ? 'Android' :
      ua.includes('iPhone') || ua.includes('iPad') ? 'iOS' :
      ua.includes('Linux')   ? 'Linux' : 'Unknown OS';
    return `${browser} / ${os}`;
  }

  /** Stats helper — category + level breakdown */
  async getStats() {
    const [byCategory, byLevel, recentCount] = await Promise.all([
      this.prisma.activityLog.groupBy({ by: ['category'], _count: { id: true } }),
      this.prisma.activityLog.groupBy({ by: ['level'],    _count: { id: true } }),
      this.prisma.activityLog.count({
        where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
    ]);
    return { success: true, data: { byCategory, byLevel, recentCount } };
  }
}
