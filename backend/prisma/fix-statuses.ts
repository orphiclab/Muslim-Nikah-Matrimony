/**
 * fix-statuses.ts
 * Updates ChildProfile status from DRAFT → ACTIVE for profiles where
 * MySQL s_post.POST_APPROVAL = '2', and creates missing Subscriptions.
 */
import { PrismaClient, ProfileStatus, SubscriptionStatus } from '@prisma/client';
import * as mysql from 'mysql2/promise';

const prisma = new PrismaClient();

const MYSQL_CONFIG = {
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  password: 'rootpass',
  database: 'capitalw_muslimnikah',
};

function cleanStr(val: any): string | null {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  return s === '' || s === 'NULL' ? null : s;
}

function toDate(val: any): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) || d.getFullYear() < 1900 ? null : d;
}

function buildMemberId(refno: string, id: number): string {
  const clean = cleanStr(refno);
  if (clean && clean !== '0') {
    return clean.replace(/^(USR[\/\-]|USRM[\/\-])/, 'MN-').toUpperCase();
  }
  return `MN-MIGR-${id}`;
}

async function main() {
  console.log('🔧 Fixing profile statuses and creating subscriptions...');

  const conn = await mysql.createConnection(MYSQL_CONFIG);

  // Get all approved rows from MySQL
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT REFNO, ID, POST_APPROVAL, APPROVAL, CANCELL, PAYMENT_STATUS, 
            PAID_DATE, EXP_DATE, USERDATETIME, PACKAGE
     FROM s_post`
  );

  let activeUpdated = 0, subCreated = 0, errors = 0;

  for (const row of rows) {
    try {
      const memberId = buildMemberId(row.REFNO, row.ID);
      const profile = await prisma.childProfile.findUnique({ where: { memberId } });
      if (!profile) continue;

      // Determine correct status
      let newStatus: ProfileStatus = ProfileStatus.DRAFT;
      if (cleanStr(row.CANCELL) === '1') {
        newStatus = ProfileStatus.SUSPENDED;
      } else if (cleanStr(row.POST_APPROVAL) === '2') {
        newStatus = ProfileStatus.ACTIVE;
      } else if (cleanStr(row.APPROVAL) === '1') {
        newStatus = ProfileStatus.ACTIVE;
      } else if (cleanStr(row.PAYMENT_STATUS) === '1') {
        newStatus = ProfileStatus.PAYMENT_PENDING;
      }

      // Update status if changed
      if (profile.status !== newStatus) {
        await prisma.childProfile.update({
          where: { id: profile.id },
          data: { status: newStatus },
        });
        if (newStatus === ProfileStatus.ACTIVE) activeUpdated++;
      }

      // Create Subscription if ACTIVE and no subscription yet
      if (newStatus === ProfileStatus.ACTIVE) {
        const existingSub = await prisma.subscription.findUnique({
          where: { childProfileId: profile.id },
        });
        if (!existingSub) {
          const startDate = toDate(row.PAID_DATE) ?? toDate(row.USERDATETIME) ?? new Date();
          const endDate = toDate(row.EXP_DATE);
          const isActive = endDate ? endDate > new Date() : false;

          await prisma.subscription.create({
            data: {
              childProfileId: profile.id,
              status: isActive ? SubscriptionStatus.ACTIVE : SubscriptionStatus.EXPIRED,
              startDate,
              endDate,
              planName: cleanStr(row.PACKAGE) ?? 'standard',
              planDurationDays: endDate && startDate
                ? Math.max(30, Math.round((endDate.getTime() - startDate.getTime()) / 86400000))
                : 30,
            },
          });
          subCreated++;
        }
      }
    } catch (err: any) {
      errors++;
    }
  }

  await conn.end();
  await prisma.$disconnect();

  console.log(`\n✅ Done!`);
  console.log(`   Profiles set to ACTIVE: ${activeUpdated}`);
  console.log(`   Subscriptions created:  ${subCreated}`);
  console.log(`   Errors skipped:         ${errors}`);

  // Final summary
  const p2 = new PrismaClient();
  const [users, profiles, payments, subs] = await Promise.all([
    p2.user.count(), p2.childProfile.count(), p2.payment.count(), p2.subscription.count(),
  ]);
  const byStatus = await p2.childProfile.groupBy({ by: ['status'], _count: true });
  console.log(`\n📊 Final PostgreSQL Summary:`);
  console.log(`   Users:         ${users}`);
  console.log(`   ChildProfiles: ${profiles}`);
  console.log(`   Payments:      ${payments}`);
  console.log(`   Subscriptions: ${subs}`);
  console.log('\n   Profiles by status:');
  byStatus.forEach(s => console.log(`     ${s.status}: ${s._count}`));
  await p2.$disconnect();
}

main().catch(console.error);
