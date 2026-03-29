import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BadRequestException } from '@nestjs/common';

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockPrisma = {
  childProfile: { findUnique: jest.fn(), update: jest.fn() },
  payment: { create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
  subscription: { upsert: jest.fn() },
  $transaction: jest.fn((cb) => cb(mockPrisma)),
};

const mockEvents = { emit: jest.fn() };

describe('PaymentService', () => {
  let service: PaymentService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEvents },
      ],
    }).compile();
    service = module.get<PaymentService>(PaymentService);
  });

  describe('initiate()', () => {
    it('should throw if profile not found', async () => {
      mockPrisma.childProfile.findUnique.mockResolvedValue(null);
      await expect(
        service.initiate('user-1', {
          childProfileId: 'profile-1',
          amount: 100,
          method: 'BANK_TRANSFER' as any,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if profile belongs to different user', async () => {
      mockPrisma.childProfile.findUnique.mockResolvedValue({ id: 'profile-1', userId: 'other-user' });
      await expect(
        service.initiate('user-1', {
          childProfileId: 'profile-1',
          amount: 100,
          method: 'BANK_TRANSFER' as any,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create a payment and set profile to PAYMENT_PENDING', async () => {
      mockPrisma.childProfile.findUnique.mockResolvedValue({ id: 'profile-1', userId: 'user-1' });
      mockPrisma.payment.create.mockResolvedValue({ id: 'pay-1' });
      mockPrisma.childProfile.update.mockResolvedValue({});

      const result = await service.initiate('user-1', {
        childProfileId: 'profile-1',
        amount: 999,
        method: 'BANK_TRANSFER' as any,
        packageId: 'pkg-1',
        packageDurationDays: 90,
      });

      expect(result.success).toBe(true);
      expect(mockPrisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            packageId: 'pkg-1',
            packageDurationDays: 90,
          }),
        }),
      );
      expect(mockPrisma.childProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'PAYMENT_PENDING' } }),
      );
    });

    it('should NOT set PAYMENT_PENDING for BOOST payments', async () => {
      mockPrisma.childProfile.findUnique.mockResolvedValue({ id: 'profile-1', userId: 'user-1' });
      mockPrisma.payment.create.mockResolvedValue({ id: 'pay-2' });

      await service.initiate('user-1', {
        childProfileId: 'profile-1',
        amount: 50,
        method: 'BANK_TRANSFER' as any,
        purpose: 'BOOST' as any,
        days: 7,
      });

      expect(mockPrisma.childProfile.update).not.toHaveBeenCalled();
    });
  });

  describe('activateSubscription()', () => {
    it('should upsert subscription with correct durationDays and activate profile', async () => {
      mockPrisma.subscription = { upsert: jest.fn().mockResolvedValue({}) };
      mockPrisma.childProfile.update.mockResolvedValue({});

      await service.activateSubscription(mockPrisma, 'profile-1', 90, '3 Months Premium');

      const upsertCall = mockPrisma.subscription.upsert.mock.calls[0][0];
      const endDate: Date = upsertCall.create.endDate;
      const startDate: Date = upsertCall.create.startDate;
      const diffDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      expect(diffDays).toBe(90);
      expect(upsertCall.create.planDurationDays).toBe(90);
      expect(upsertCall.create.planName).toBe('3 Months Premium');
      expect(mockPrisma.childProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'ACTIVE' } }),
      );
      expect(mockEvents.emit).toHaveBeenCalledWith('PROFILE_ACTIVATED', expect.any(Object));
    });

    it('should default to 30 days when durationDays is not provided', async () => {
      mockPrisma.subscription = { upsert: jest.fn().mockResolvedValue({}) };
      mockPrisma.childProfile.update.mockResolvedValue({});

      await service.activateSubscription(mockPrisma, 'profile-1');

      const upsertCall = mockPrisma.subscription.upsert.mock.calls[0][0];
      expect(upsertCall.create.planDurationDays).toBe(30);
    });
  });

  describe('activateBoost()', () => {
    it('should extend boostExpiresAt by given days', async () => {
      const now = new Date();
      mockPrisma.childProfile.findUnique.mockResolvedValue({ id: 'profile-1', boostExpiresAt: null });
      mockPrisma.childProfile.update.mockResolvedValue({});

      await service.activateBoost(mockPrisma, 'profile-1', 7);

      const updateCall = mockPrisma.childProfile.update.mock.calls[0][0];
      const boostEnd: Date = updateCall.data.boostExpiresAt;
      const diffDays = Math.round((boostEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      expect(diffDays).toBe(7);
      expect(mockEvents.emit).toHaveBeenCalledWith('PROFILE_BOOSTED', expect.any(Object));
    });

    it('should extend from existing boostExpiresAt if still in future', async () => {
      const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days from now
      mockPrisma.childProfile.findUnique.mockResolvedValue({ id: 'profile-1', boostExpiresAt: future });
      mockPrisma.childProfile.update.mockResolvedValue({});

      await service.activateBoost(mockPrisma, 'profile-1', 7);

      const updateCall = mockPrisma.childProfile.update.mock.calls[0][0];
      const boostEnd: Date = updateCall.data.boostExpiresAt;
      const diffFromFuture = Math.round((boostEnd.getTime() - future.getTime()) / (1000 * 60 * 60 * 24));

      expect(diffFromFuture).toBe(7);
    });
  });

  describe('getMyPayments()', () => {
    it('should return payments for the given user', async () => {
      mockPrisma.payment.findMany.mockResolvedValue([{ id: 'pay-1' }]);
      const result = await service.getMyPayments('user-1');
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(mockPrisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' } }),
      );
    });
  });
});
