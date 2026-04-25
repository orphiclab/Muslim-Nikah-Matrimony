import { Injectable, Logger } from '@nestjs/common';
import { ChildProfile, FieldVisibility, SubscriptionStatus } from '@prisma/client';

export interface RuleContext {
  viewer: ChildProfile & { subscription?: { status: SubscriptionStatus } | null };
  target: ChildProfile & { subscription?: { status: SubscriptionStatus } | null };
}

export interface VisibilityResult {
  allowed: boolean;
  reason?: string;
}

@Injectable()
export class RuleEngineService {
  private readonly logger = new Logger(RuleEngineService.name);

  // ─── Pure helper: get age from DOB ───────────────────────────────────────
  private getAge(dateOfBirth: Date): number {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  // ─── 1. canViewProfile ────────────────────────────────────────────────────
  // Male → can see Female only; Female → can see Male only
  // Viewer must have ACTIVE subscription
  // Target must be ACTIVE profile
  canViewProfile(ctx: RuleContext): VisibilityResult {
    const { viewer, target } = ctx;

    // Viewer must have active subscription
    if (viewer.subscription?.status !== SubscriptionStatus.ACTIVE) {
      const reason = 'Viewer subscription is not ACTIVE';
      this.logger.debug(`canViewProfile DENIED: ${reason}`);
      return { allowed: false, reason };
    }

    // Target must be ACTIVE profile
    if (target.status !== 'ACTIVE') {
      const reason = `Target profile status is ${target.status}`;
      this.logger.debug(`canViewProfile DENIED: ${reason}`);
      return { allowed: false, reason };
    }

    // Gender rule: opposite gender only
    if (viewer.gender === target.gender) {
      const reason = 'Same gender — not allowed';
      this.logger.debug(`canViewProfile DENIED: ${reason}`);
      return { allowed: false, reason };
    }

    // Age rules
    const viewerAge = this.getAge(viewer.dateOfBirth);
    const targetAge = this.getAge(target.dateOfBirth);

    if (viewer.gender === 'MALE') {
      // Male cannot see females older than him
      if (targetAge > viewerAge) {
        const reason = `Male viewer (${viewerAge}) cannot see female older (${targetAge})`;
        this.logger.debug(`canViewProfile DENIED: ${reason}`);
        return { allowed: false, reason };
      }
    } else {
      // Female cannot see males younger than her
      if (targetAge < viewerAge) {
        const reason = `Female viewer (${viewerAge}) cannot see male younger (${targetAge})`;
        this.logger.debug(`canViewProfile DENIED: ${reason}`);
        return { allowed: false, reason };
      }
    }

    // ── Bidirectional Country Preference ──────────────────────────────────
    // countryPreference may be comma-separated (e.g. "Australia,United Kingdom")
    const parsePrefs = (pref: string) =>
      pref.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

    // Rule 1: If viewer has a countryPreference, target must live in one of those countries.
    if (viewer.countryPreference && target.country) {
      const prefs = parsePrefs(viewer.countryPreference);
      if (!prefs.includes(target.country.toLowerCase())) {
        const reason = `Viewer prefers [${viewer.countryPreference}] but target lives in "${target.country}"`;
        this.logger.debug(`canViewProfile DENIED: ${reason}`);
        return { allowed: false, reason };
      }
    }

    // Rule 2: If target has a countryPreference, viewer must live in one of those countries.
    if (target.countryPreference && viewer.country) {
      const prefs = parsePrefs(target.countryPreference);
      if (!prefs.includes(viewer.country.toLowerCase())) {
        const reason = `Target prefers [${target.countryPreference}] but viewer lives in "${viewer.country}"`;
        this.logger.debug(`canViewProfile DENIED: ${reason}`);
        return { allowed: false, reason };
      }
    }

    // ── Bidirectional Age Preference ───────────────────────────────────────
    // Rule 3: If viewer has minAgePreference/maxAgePreference, target age must be within range.
    if ((viewer.minAgePreference || viewer.maxAgePreference) && target.dateOfBirth) {
      const targetAge = this.getAge(target.dateOfBirth);
      if (viewer.minAgePreference && targetAge < viewer.minAgePreference) {
        const reason = `Viewer prefers min age ${viewer.minAgePreference} but target is ${targetAge}`;
        this.logger.debug(`canViewProfile DENIED: ${reason}`);
        return { allowed: false, reason };
      }
      if (viewer.maxAgePreference && targetAge > viewer.maxAgePreference) {
        const reason = `Viewer prefers max age ${viewer.maxAgePreference} but target is ${targetAge}`;
        this.logger.debug(`canViewProfile DENIED: ${reason}`);
        return { allowed: false, reason };
      }
    }

    // Rule 4: If target has minAgePreference/maxAgePreference, viewer age must be within range.
    if ((target.minAgePreference || target.maxAgePreference) && viewer.dateOfBirth) {
      const viewerAge = this.getAge(viewer.dateOfBirth);
      if (target.minAgePreference && viewerAge < target.minAgePreference) {
        const reason = `Target prefers min age ${target.minAgePreference} but viewer is ${viewerAge}`;
        this.logger.debug(`canViewProfile DENIED: ${reason}`);
        return { allowed: false, reason };
      }
      if (target.maxAgePreference && viewerAge > target.maxAgePreference) {
        const reason = `Target prefers max age ${target.maxAgePreference} but viewer is ${viewerAge}`;
        this.logger.debug(`canViewProfile DENIED: ${reason}`);
        return { allowed: false, reason };
      }
    }

    this.logger.debug(`canViewProfile ALLOWED: viewer=${viewer.id} → target=${target.id}`);
    return { allowed: true };
  }

  // ─── 2. canViewContact ────────────────────────────────────────────────────
  canViewContact(ctx: RuleContext): VisibilityResult {
    const { viewer, target } = ctx;

    // Must pass profile visibility first
    const profileCheck = this.canViewProfile(ctx);
    if (!profileCheck.allowed) return profileCheck;

    // Target must have contact visible
    if (!target.contactVisible) {
      return { allowed: false, reason: 'Contact visibility is disabled by profile owner' };
    }

    // Target subscription must be ACTIVE
    if (target.subscription?.status !== SubscriptionStatus.ACTIVE) {
      return { allowed: false, reason: 'Target subscription is not ACTIVE' };
    }

    // Height preference check (if viewer set minHeight preference)
    if (viewer.minHeightPreference && target.height) {
      if (target.height < viewer.minHeightPreference) {
        return { allowed: false, reason: `Target height ${target.height}cm below preference ${viewer.minHeightPreference}cm` };
      }
    }

    this.logger.debug(`canViewContact ALLOWED: viewer=${viewer.id} → target=${target.id}`);
    return { allowed: true };
  }

  // ─── 3. canViewField ─────────────────────────────────────────────────────
  canViewField(
    field: 'phone' | 'email',
    ctx: RuleContext,
  ): VisibilityResult {
    const { target } = ctx;

    // Check contact visibility first
    const contactCheck = this.canViewContact(ctx);
    if (!contactCheck.allowed) {
      return { allowed: false, reason: `Contact not visible: ${contactCheck.reason}` };
    }

    // Check field-level visibility
    const visibilityField = field === 'phone' ? target.phoneVisibility : target.emailVisibility;
    if (visibilityField === FieldVisibility.PRIVATE) {
      return { allowed: false, reason: `Field '${field}' is marked PRIVATE` };
    }

    return { allowed: true };
  }

  // ─── 4. Filter visible profiles from a list ──────────────────────────────
  getVisibleProfiles(
    viewerProfile: RuleContext['viewer'],
    allProfiles: RuleContext['target'][],
  ): Array<{ profile: RuleContext['target']; contactVisible: boolean }> {
    const results: Array<{ profile: RuleContext['target']; contactVisible: boolean }> = [];

    for (const target of allProfiles) {
      if (target.id === viewerProfile.id) continue; // skip own profile

      const ctx: RuleContext = { viewer: viewerProfile, target };
      const profileResult = this.canViewProfile(ctx);

      if (profileResult.allowed) {
        const contactResult = this.canViewContact(ctx);
        results.push({ profile: target, contactVisible: contactResult.allowed });
      }
    }

    this.logger.debug(
      `getVisibleProfiles: ${results.length}/${allProfiles.length} profiles visible for viewer=${viewerProfile.id}`,
    );

    return results;
  }

  // ─── 5. Strip private fields from profile ────────────────────────────────
  sanitizeProfile(
    profile: RuleContext['target'],
    ctx: RuleContext,
  ): Partial<RuleContext['target']> {
    const { password: _, ...safe } = profile as any;

    const phoneAllowed = this.canViewField('phone', ctx).allowed;
    const emailAllowed = this.canViewField('email', ctx).allowed;

    return {
      ...safe,
      phone: phoneAllowed ? profile.phone : undefined,
      contactEmail: emailAllowed ? profile.contactEmail : undefined,
    };
  }
}
