import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const mockPrisma = {
  user: { findUnique: jest.fn(), create: jest.fn() },
};
const mockJwt = { sign: jest.fn().mockReturnValue('mock-token') };

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  describe('register()', () => {
    it('should throw ConflictException if email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'a@b.com' });
      await expect(
        service.register({ email: 'a@b.com', password: 'password' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should hash password and create user on success', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1', email: 'a@b.com', role: 'PARENT',
      });

      const result = await service.register({ email: 'a@b.com', password: 'password123' });

      expect(result.token).toBe('mock-token');
      expect(result.success).toBe(true);
      const createCall = mockPrisma.user.create.mock.calls[0][0];
      // Password must be hashed (bcrypt hash starts with $2b$)
      expect(createCall.data.password).toMatch(/^\$2[aby]\$/);
      expect(createCall.data.email).toBe('a@b.com');
    });
  });

  describe('login()', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.login({ email: 'no@one.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is wrong', async () => {
      const hashed = await bcrypt.hash('correct', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1', email: 'a@b.com', password: hashed, role: 'PARENT',
      });
      await expect(
        service.login({ email: 'a@b.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return JWT token on valid credentials', async () => {
      const hashed = await bcrypt.hash('correct', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1', email: 'a@b.com', password: hashed, role: 'PARENT',
      });

      const result = await service.login({ email: 'a@b.com', password: 'correct' });

      expect(result.token).toBe('mock-token');
      expect(result.success).toBe(true);
      expect(mockJwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sub: 'u1', email: 'a@b.com', role: 'PARENT' }),
      );
    });

    it('should not expose the password in the response', async () => {
      const hashed = await bcrypt.hash('correct', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1', email: 'a@b.com', password: hashed, role: 'PARENT',
      });
      const result = await service.login({ email: 'a@b.com', password: 'correct' });
      expect((result.user as any).password).toBeUndefined();
    });
  });
});
