import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaymentService } from '../payment/payment.service';

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockPrisma = {
  payment: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
  childProfile: { findMany: jest.fn(), update: jest.fn() },
  user: { findMany: jest.fn() },
  package: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  siteSettings: { findUnique: jest.fn(), upsert: jest.fn(), create: jest.fn() },
  subscription: { findMany: jest.fn() },
  $transaction: jest.fn((cb) => cb(mockPrisma)),
};

const mockEvents = { emit: jest.fn() };
const mockPaymentService = {
  activateBoost: jest.fn(),
  activateSubscription: jest.fn(),
};

describe('AdminService — Discount Logic', () => {
  let service: AdminService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEvents },
        { provide: PaymentService, useValue: mockPaymentService },
      ],
    }).compile();
    service = module.get<AdminService>(AdminService);
  });

  describe('getActivePackages() — discount stacking', () => {
    it('should return packages with no discount when both site and package discounts are 0', async () => {
      mockPrisma.package.findMany.mockResolvedValue([
        { id: 'pkg-1', name: '1 Month', price: 1000, originalPrice: null, discountPct: null, durationDays: 30, features: [], isActive: true, sortOrder: 0, type: 'SUBSCRIPTION' },
      ]);
      mockPrisma.siteSettings.findUnique.mockResolvedValue({ siteDiscountPct: 0, siteDiscountActive: false, siteDiscountLabel: '' });

      const result = await service.getActivePackages();
      expect(result.data[0].price).toBe(1000);
      expect(result.data[0].effectiveDiscountPct).toBeUndefined();
    });

    it('should apply site-wide discount only when package has no discount', async () => {
      mockPrisma.package.findMany.mockResolvedValue([
        { id: 'pkg-1', name: '1 Month', price: 1000, originalPrice: null, discountPct: null, durationDays: 30, features: [], isActive: true, sortOrder: 0, type: 'SUBSCRIPTION' },
      ]);
      mockPrisma.siteSettings.findUnique.mockResolvedValue({ siteDiscountPct: 20, siteDiscountActive: true, siteDiscountLabel: 'Eid Offer' });

      const result = await service.getActivePackages();
      // 1000 * (1 - 0.20) = 800
      expect(result.data[0].price).toBe(800);
      expect(result.data[0].effectiveDiscountPct).toBe(20);
    });

    it('should STACK site discount on top of package discount (compound)', async () => {
      // pkg has 25% discount: orig=9999, stored price = 9999 * 0.75 = 7499.25
      mockPrisma.package.findMany.mockResolvedValue([
        { id: 'pkg-1', name: '3 Months', price: 7499.25, originalPrice: 9999, discountPct: 25, durationDays: 90, features: [], isActive: true, sortOrder: 0, type: 'SUBSCRIPTION' },
      ]);
      mockPrisma.siteSettings.findUnique.mockResolvedValue({ siteDiscountPct: 20, siteDiscountActive: true, siteDiscountLabel: 'Eid Offer' });

      const result = await service.getActivePackages();
      // 7499.25 * (1 - 0.20) = 5999.40
      expect(result.data[0].price).toBeCloseTo(5999.4, 0);
      // effective = 1 - (5999.4 / 9999) ≈ 40%
      expect(result.data[0].effectiveDiscountPct).toBe(40);
      expect(result.data[0].pkgDiscountPct).toBe(25);
      expect(result.data[0].siteDiscountPct).toBe(20);
    });

    it('should NOT apply site-wide when it is inactive', async () => {
      mockPrisma.package.findMany.mockResolvedValue([
        { id: 'pkg-1', name: '3 Months', price: 7499.25, originalPrice: 9999, discountPct: 25, durationDays: 90, features: [], isActive: true, sortOrder: 0, type: 'SUBSCRIPTION' },
      ]);
      mockPrisma.siteSettings.findUnique.mockResolvedValue({ siteDiscountPct: 20, siteDiscountActive: false, siteDiscountLabel: '' });

      const result = await service.getActivePackages();
      // Site is inactive: only package discount applies — but price is ALREADY stored discounted
      // applyDiscount returns pkg unchanged when siteActive=false and effectiveDisc=0
      expect(result.data[0].price).toBe(7499.25);
    });

    it('should include siteDiscount metadata in response', async () => {
      mockPrisma.package.findMany.mockResolvedValue([]);
      mockPrisma.siteSettings.findUnique.mockResolvedValue({ siteDiscountPct: 15, siteDiscountActive: true, siteDiscountLabel: 'Flash Sale' });

      const result = await service.getActivePackages();
      expect(result.siteDiscount).toEqual({ active: true, pct: 15, label: 'Flash Sale' });
    });
  });

  describe('updatePackage()', () => {
    it('should throw NotFoundException when package does not exist', async () => {
      mockPrisma.package.findUnique.mockResolvedValue(null);
      await expect(service.updatePackage('nonexistent', { price: 500 })).rejects.toThrow('Package not found');
    });

    it('should update price and discount fields correctly', async () => {
      mockPrisma.package.findUnique.mockResolvedValue({ id: 'pkg-1', price: 9999 });
      mockPrisma.package.update.mockResolvedValue({ id: 'pkg-1', price: 7999, discountPct: 20 });

      const result = await service.updatePackage('pkg-1', { price: 7999, discountPct: 20, originalPrice: 9999 });
      expect(result.success).toBe(true);
      expect(mockPrisma.package.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ price: 7999, discountPct: 20, originalPrice: 9999 }),
        }),
      );
    });

    it('should write null to clear discountPct when empty string equivalent is passed', async () => {
      mockPrisma.package.findUnique.mockResolvedValue({ id: 'pkg-1', price: 9999, discountPct: 25 });
      mockPrisma.package.update.mockResolvedValue({ id: 'pkg-1', discountPct: null });

      await service.updatePackage('pkg-1', { discountPct: null as any, originalPrice: null as any });
      const updateCall = mockPrisma.package.update.mock.calls[0][0];
      expect(updateCall.data.discountPct).toBeNull();
      expect(updateCall.data.originalPrice).toBeNull();
    });
  });

  describe('getSiteSettings()', () => {
    it('should return default settings when none exist', async () => {
      const defaults = { id: 'singleton', siteDiscountPct: 0, siteDiscountActive: false, siteDiscountLabel: '' };
      mockPrisma.siteSettings.findUnique.mockResolvedValue(null);
      mockPrisma.siteSettings.create.mockResolvedValue(defaults);
      const result = await service.getSiteSettings();
      expect(result.data.siteDiscountPct).toBe(0);
      expect(result.data.siteDiscountActive).toBe(false);
    });

    it('should return existing settings when they exist', async () => {
      mockPrisma.siteSettings.findUnique.mockResolvedValue({
        id: 'singleton', siteDiscountPct: 15, siteDiscountActive: true, siteDiscountLabel: 'Flash Sale',
      });
      const result = await service.getSiteSettings();
      expect(result.data.siteDiscountPct).toBe(15);
      expect(result.data.siteDiscountLabel).toBe('Flash Sale');
    });
  });

  describe('approvePayment()', () => {
    it('should throw when payment not found', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(null);
      await expect(service.approvePayment('admin-1', { paymentId: 'x' })).rejects.toThrow();
    });

    it('should activate subscription with correct durationDays from package', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue({
        id: 'pay-1', childProfileId: 'profile-1', purpose: 'SUBSCRIPTION',
        packageId: 'pkg-1', packageDurationDays: 90, gatewayPayload: null,
      });
      mockPrisma.package.findUnique.mockResolvedValue({ id: 'pkg-1', durationDays: 90, name: '3 Months Premium' });
      mockPrisma.payment.update.mockResolvedValue({});

      await service.approvePayment('admin-1', { paymentId: 'pay-1' });

      expect(mockPaymentService.activateSubscription).toHaveBeenCalledWith(
        expect.anything(),
        'profile-1',
        90,
        '3 Months Premium',
      );
    });

    it('should fall back to packageDurationDays from payment when package lookup fails', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue({
        id: 'pay-1', childProfileId: 'profile-1', purpose: 'SUBSCRIPTION',
        packageId: null, packageDurationDays: 60, gatewayPayload: null,
      });
      mockPrisma.payment.update.mockResolvedValue({});

      await service.approvePayment('admin-1', { paymentId: 'pay-1' });

      expect(mockPaymentService.activateSubscription).toHaveBeenCalledWith(
        expect.anything(),
        'profile-1',
        60,
        'standard',
      );
    });
  });
});
