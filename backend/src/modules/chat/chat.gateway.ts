import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);
  // profileId -> Set of socket IDs
  private profileSockets = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
  ) {}

  /* ── Connection ─────────────────────────────────────────────────── */
  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) { client.disconnect(); return; }

      const payload = this.jwtService.verify(token);
      client.data.userId = payload.sub ?? payload.userId;

      // Client must also send which profileId they are chatting as
      const profileId = client.handshake.query?.profileId as string;
      if (profileId) {
        client.data.profileId = profileId;
        client.join(`profile:${profileId}`);

        if (!this.profileSockets.has(profileId)) this.profileSockets.set(profileId, new Set());
        this.profileSockets.get(profileId)!.add(client.id);
        this.logger.log(`Client connected: socket=${client.id} profile=${profileId}`);
      }
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const profileId = client.data?.profileId;
    if (profileId && this.profileSockets.has(profileId)) {
      this.profileSockets.get(profileId)!.delete(client.id);
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /* ── Send message ────────────────────────────────────────────────── */
  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { senderProfileId: string; receiverProfileId: string; content: string },
  ) {
    try {
      const userId = client.data.userId;
      const result = await this.chatService.send(userId, {
        senderProfileId: data.senderProfileId,
        receiverProfileId: data.receiverProfileId,
        content: data.content,
      });

      const message = result.data;

      // Emit to sender room
      this.server.to(`profile:${data.senderProfileId}`).emit('new_message', message);

      // Emit to receiver room (real-time delivery if online)
      this.server.to(`profile:${data.receiverProfileId}`).emit('new_message', message);

      return { success: true, data: message };
    } catch (err: any) {
      client.emit('error', { message: err.message });
      return { success: false, error: err.message };
    }
  }

  /* ── Typing indicator ────────────────────────────────────────────── */
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { senderProfileId: string; receiverProfileId: string; isTyping: boolean },
  ) {
    this.server.to(`profile:${data.receiverProfileId}`).emit('user_typing', {
      profileId: data.senderProfileId,
      isTyping: data.isTyping,
    });
  }

  /* ── Mark read ───────────────────────────────────────────────────── */
  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { myProfileId: string; otherProfileId: string },
  ) {
    try {
      // Persist readAt in DB for all unread messages from otherProfileId
      const readIds = await this.chatService.markRead(data.myProfileId, data.otherProfileId);

      if (readIds.length > 0) {
        // Notify the SENDER (otherProfileId) so their ticks turn blue
        this.server.to(`profile:${data.otherProfileId}`).emit('messages_read', {
          byProfileId: data.myProfileId,
          messageIds: readIds,
          readAt: new Date().toISOString(),
        });
        this.logger.log(`messages_read emitted to profile:${data.otherProfileId} — ${readIds.length} messages`);
      }
    } catch (err: any) {
      this.logger.error('mark_read error', err.message);
    }
  }

  /* ── Helper to push message from anywhere ───────────────────────── */
  pushMessage(receiverProfileId: string, message: any) {
    this.server.to(`profile:${receiverProfileId}`).emit('new_message', message);
  }
}
