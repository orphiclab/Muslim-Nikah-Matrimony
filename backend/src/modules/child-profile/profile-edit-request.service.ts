import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SmsService } from '../auth/sms.service';

@Injectable()
export class ProfileEditRequestService {
  private readonly logger = new Logger(ProfileEditRequestService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sms: SmsService,
  ) {}

  // ── User: submit an edit request ─────────────────────────────────────────
  async submitEditRequest(userId: string, profileId: string, newData: Record<string, any>) {
    // Verify ownership
    const profile = await this.prisma.childProfile.findUnique({
      where: { id: profileId },
      include: { user: { select: { id: true, phone: true, whatsappNumber: true, email: true } } },
    });
    if (!profile) throw new NotFoundException({ success: false, message: 'Profile not found' });
    if (profile.userId !== userId)
      throw new ForbiddenException({ success: false, message: 'You do not own this profile' });

    // Only ACTIVE profiles can submit edits
    if (profile.status !== 'ACTIVE') {
      throw new ForbiddenException({
        success: false,
        message: 'Only active profiles can submit edit requests',
      });
    }

    // Cancel any existing PENDING edit request for this profile
    await this.prisma.profileEditRequest.updateMany({
      where: { profileId, status: 'PENDING' },
      data: { status: 'CANCELLED' } as any,
    });

    // Build a clean snapshot of the profile's editable fields
    const previousData: Record<string, any> = {
      name: profile.name,
      dateOfBirth: profile.dateOfBirth,
      height: profile.height,
      weight: profile.weight,
      complexion: profile.complexion,
      appearance: profile.appearance,
      dressCode: profile.dressCode,
      ethnicity: profile.ethnicity,
      civilStatus: profile.civilStatus,
      children: profile.children,
      familyStatus: profile.familyStatus,
      country: profile.country,
      city: profile.city,
      state: profile.state,
      residencyStatus: profile.residencyStatus,
      education: profile.education,
      fieldOfStudy: profile.fieldOfStudy,
      occupation: profile.occupation,
      profession: profile.profession,
      fatherEthnicity: profile.fatherEthnicity,
      fatherCountry: profile.fatherCountry,
      fatherOccupation: profile.fatherOccupation,
      motherEthnicity: profile.motherEthnicity,
      motherCountry: profile.motherCountry,
      motherOccupation: profile.motherOccupation,
      siblings: profile.siblings,
      countryPreference: profile.countryPreference,
      aboutUs: profile.aboutUs,
      expectations: profile.expectations,
    };

    // Normalize dateOfBirth in newData to YYYY-MM-DD string so it compares
    // cleanly with previousData (which may come as full ISO from the DB).
    if (newData.dateOfBirth) {
      const d = new Date(newData.dateOfBirth);
      if (!isNaN(d.getTime())) {
        newData.dateOfBirth = d.toISOString().slice(0, 10);
      }
    }
    // Also normalize previousData.dateOfBirth for consistent diff display
    if (previousData.dateOfBirth) {
      const d = new Date(previousData.dateOfBirth as string);
      if (!isNaN(d.getTime())) {
        previousData.dateOfBirth = d.toISOString().slice(0, 10);
      }
    }

    // Create the edit request and set profile to EDIT_PENDING
    const [editRequest] = await this.prisma.$transaction([
      this.prisma.profileEditRequest.create({
        data: {
          profileId,
          previousData,
          newData,
          status: 'PENDING',
        },
      }),
      this.prisma.childProfile.update({
        where: { id: profileId },
        data: { status: 'EDIT_PENDING' } as any,
      }),
    ]);

    this.logger.log(`Edit request created for profile ${profileId} by user ${userId}`);

    // SMS to user: under review
    const userPhone = profile.user?.phone || profile.user?.whatsappNumber;
    if (userPhone) {
      this.sms.sendSms(userPhone,
        `Hi! Your profile (${profile.memberId}) has been submitted for review. We'll notify you once it's approved by our team. - Muslim Nikah`
      ).catch(() => {});
    }

    // SMS to all admins
    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { phone: true, whatsappNumber: true },
    });
    for (const admin of admins) {
      const adminPhone = admin.phone || admin.whatsappNumber;
      if (adminPhone) {
        this.sms.sendSms(adminPhone,
          `[Muslim Nikah Admin] Profile edit request received for ${profile.memberId}. Please review in the admin panel.`
        ).catch(() => {});
      }
    }

    return { success: true, data: editRequest };
  }

  // ── Admin: list all edit requests ────────────────────────────────────────
  async getEditRequests(status?: string) {
    const where: any = {};
    if (status) where.status = status;

    const requests = await this.prisma.profileEditRequest.findMany({
      where,
      include: {
        profile: {
          select: {
            id: true,
            memberId: true,
            name: true,
            gender: true,
            status: true,
            user: { select: { id: true, email: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: requests };
  }

  // ── Admin: get a single edit request ─────────────────────────────────────
  async getEditRequest(requestId: string) {
    const request = await this.prisma.profileEditRequest.findUnique({
      where: { id: requestId },
      include: {
        profile: {
          select: {
            id: true,
            memberId: true,
            name: true,
            gender: true,
            status: true,
            user: { select: { id: true, email: true, phone: true, whatsappNumber: true } },
          },
        },
      },
    });
    if (!request) throw new NotFoundException({ success: false, message: 'Edit request not found' });
    return { success: true, data: request };
  }

  // ── Admin: approve an edit request ───────────────────────────────────────
  async approveEditRequest(adminId: string, requestId: string, adminNote?: string) {
    const request = await this.prisma.profileEditRequest.findUnique({
      where: { id: requestId },
      include: {
        profile: {
          include: { user: { select: { phone: true, whatsappNumber: true } } },
        },
      },
    });
    if (!request) throw new NotFoundException({ success: false, message: 'Edit request not found' });
    if (request.status !== 'PENDING') {
      throw new ForbiddenException({ success: false, message: 'This request is no longer pending' });
    }

    const newData = request.newData as Record<string, any>;

    // Build a safe update payload — only include fields explicitly present in newData.
    // Convert dateOfBirth string to Date. Convert empty-string fields to null so
    // they actually clear the DB value (instead of being ignored as undefined).
    const UPDATABLE_FIELDS = [
      'name','dateOfBirth','height','weight','complexion','appearance','dressCode',
      'ethnicity','civilStatus','children','familyStatus','country','city','state',
      'residencyStatus','education','fieldOfStudy','occupation','profession',
      'fatherEthnicity','fatherCountry','fatherOccupation','motherEthnicity',
      'motherCountry','motherOccupation','siblings','countryPreference',
      'aboutUs','expectations','gender',
    ];

    // These fields are NON-NULLABLE in the schema — never set them to null.
    // If the incoming value is empty/null, skip updating that field entirely.
    const NON_NULLABLE = new Set(['name', 'gender', 'dateOfBirth', 'country', 'city']);

    const updateData: Record<string, any> = { status: 'ACTIVE' };
    for (const field of UPDATABLE_FIELDS) {
      if (!(field in newData)) continue;
      const val = newData[field];

      if (field === 'dateOfBirth') {
        // Convert to Date object; skip if empty
        if (val) updateData.dateOfBirth = new Date(val);
        continue;
      }

      if (NON_NULLABLE.has(field)) {
        // Skip rather than null — required fields must have a real value
        if (val !== null && val !== undefined && val !== '') {
          updateData[field] = val;
        }
        continue;
      }

      // Nullable optional fields: empty string → null (clears the DB value)
      updateData[field] = (val === '' || val === undefined) ? null : val;
    }

    await this.prisma.$transaction([
      // Apply changes to profile, restore ACTIVE status
      this.prisma.childProfile.update({
        where: { id: request.profileId },
        data: updateData as any,
      }),
      // Mark the request as approved
      this.prisma.profileEditRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          adminNote: adminNote ?? null,
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
      }),
    ]);

    this.logger.log(`Edit request ${requestId} APPROVED by admin ${adminId}`);

    // SMS to user: approved
    const userPhone = request.profile.user?.phone || request.profile.user?.whatsappNumber;
    if (userPhone) {
      this.sms.sendSms(userPhone,
        `Great news! Your profile (${request.profile.memberId}) has been updated and is now ACTIVE. - Muslim Nikah`
      ).catch(() => {});
    }

    return { success: true, message: 'Edit request approved and profile updated' };
  }

  // ── Admin: reject an edit request ────────────────────────────────────────
  async rejectEditRequest(adminId: string, requestId: string, adminNote: string) {
    const request = await this.prisma.profileEditRequest.findUnique({
      where: { id: requestId },
      include: {
        profile: {
          include: { user: { select: { phone: true, whatsappNumber: true } } },
        },
      },
    });
    if (!request) throw new NotFoundException({ success: false, message: 'Edit request not found' });
    if (request.status !== 'PENDING') {
      throw new ForbiddenException({ success: false, message: 'This request is no longer pending' });
    }

    await this.prisma.$transaction([
      // Restore ACTIVE status, discard changes
      this.prisma.childProfile.update({
        where: { id: request.profileId },
        data: { status: 'ACTIVE' } as any,
      }),
      // Mark request as rejected
      this.prisma.profileEditRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          adminNote,
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
      }),
    ]);

    this.logger.log(`Edit request ${requestId} REJECTED by admin ${adminId}`);

    // SMS to user: rejected
    const userPhone = request.profile.user?.phone || request.profile.user?.whatsappNumber;
    if (userPhone) {
      this.sms.sendSms(userPhone,
        `Your profile edit request (${request.profile.memberId}) was rejected. Reason: ${adminNote}. Your profile remains active with the previous data. - Muslim Nikah`
      ).catch(() => {});
    }

    return { success: true, message: 'Edit request rejected. Profile restored to active.' };
  }

  // ── User: get their profile's pending edit request ───────────────────────
  async getMyPendingRequest(userId: string, profileId: string) {
    // Verify ownership
    const profile = await this.prisma.childProfile.findUnique({ where: { id: profileId } });
    if (!profile || profile.userId !== userId)
      throw new ForbiddenException({ success: false, message: 'Access denied' });

    const request = await this.prisma.profileEditRequest.findFirst({
      where: { profileId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: request ?? null };
  }
}
