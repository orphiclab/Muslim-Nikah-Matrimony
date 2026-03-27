import { Controller, Post, Get, Put, Delete, Body, Query, Param, UseGuards } from '@nestjs/common';
import { AdminService, ApprovePaymentDto, CreatePackageDto } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/** Public endpoints — no auth required */
@Controller()
export class PublicPackagesController {
  constructor(private readonly service: AdminService) {}

  @Get('packages')
  getActivePackages() {
    return this.service.getActivePackages();
  }

  @Get('profiles/public')
  getPublicProfiles(
    @Query('minAge') minAge?: string,
    @Query('maxAge') maxAge?: string,
    @Query('gender') gender?: string,
    @Query('city') city?: string,
    @Query('ethnicity') ethnicity?: string,
    @Query('civilStatus') civilStatus?: string,
    @Query('education') education?: string,
    @Query('occupation') occupation?: string,
  ) {
    return this.service.getPublicProfiles({
      minAge: minAge ? parseInt(minAge) : undefined,
      maxAge: maxAge ? parseInt(maxAge) : undefined,
      gender, city, ethnicity, civilStatus, education, occupation,
    });
  }
}


@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly service: AdminService) {}

  @Get('dashboard')
  dashboard() { return this.service.getDashboard(); }

  @Post('payment/approve')
  approvePayment(@CurrentUser() user: any, @Body() dto: ApprovePaymentDto) {
    return this.service.approvePayment(user.userId, dto);
  }

  @Get('payments')
  payments(@Query('status') status?: string) { return this.service.getAllPayments(status); }

  @Get('users')
  users() { return this.service.getAllUsers(); }

  @Get('profiles')
  profiles(@Query('status') status?: string) { return this.service.getAllProfiles(status); }

  // ─── Packages ─────────────────────────────────────────────────────────────
  @Get('packages')
  getPackages() { return this.service.getPackages(); }

  @Post('packages')
  createPackage(@Body() dto: CreatePackageDto) { return this.service.createPackage(dto); }

  @Put('packages/:id')
  updatePackage(@Param('id') id: string, @Body() dto: Partial<CreatePackageDto>) {
    return this.service.updatePackage(id, dto);
  }

  @Delete('packages/:id')
  deletePackage(@Param('id') id: string) { return this.service.deletePackage(id); }
}
