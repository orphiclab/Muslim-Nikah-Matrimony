/**
 * migrate-mysql-to-postgres.ts
 *
 * Reads data from a local MySQL instance (where the SQL dump has been loaded)
 * and inserts it into the project's PostgreSQL DB via Prisma.
 *
 * Usage:
 *   npx ts-node --project tsconfig.json -e "require('tsconfig-paths/register')" prisma/migrate-mysql-to-postgres.ts
 *
 * Prerequisites:
 *   - Docker MySQL running on port 3307 with database `capitalw_muslimnikah` loaded
 *   - Docker Postgres running on port 5433 with `prisma migrate deploy` already run
 *   - npm install mysql2  (run once in backend/)
 */

import { PrismaClient, Gender, ProfileStatus, PaymentStatus, PaymentMethod, SubscriptionStatus } from '@prisma/client';
import * as mysql from 'mysql2/promise';
import * as bcrypt from 'bcrypt';

// ─── Config ────────────────────────────────────────────────────────────────────

const MYSQL_CONFIG = {
  host: '127.0.0.1',
  port: 3307,               // Docker MySQL temporary container
  user: 'root',
  password: 'rootpass',
  database: 'capitalw_muslimnikah',
  multipleStatements: true,
};

const BCRYPT_ROUNDS = 10;

// ─── Prisma client ─────────────────────────────────────────────────────────────

const prisma = new PrismaClient();

// ─── Helpers ───────────────────────────────────────────────────────────────────

function toInt(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  const n = parseInt(String(val).trim(), 10);
  return isNaN(n) ? null : n;
}

function cleanStr(val: any): string | null {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  return s === '' || s === '0' || s === 'NULL' ? null : s;
}

function toDate(val: any): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) || d.getFullYear() < 1900 ? null : d;
}

function mapGender(val: any): Gender {
  const g = String(val || '').toUpperCase().trim();
  if (g.includes('F')) return Gender.FEMALE;
  return Gender.MALE;
}

function mapProfileStatus(row: any): ProfileStatus {
  if (cleanStr(row.CANCELL) === '1') return ProfileStatus.SUSPENDED;
  // In s_post: POST_APPROVAL='2' means admin fully approved/published
  if (cleanStr(row.POST_APPROVAL) === '2') {
    return ProfileStatus.ACTIVE;
  }
  // Also check legacy s_user APPROVAL field
  if (cleanStr(row.APPROVAL) === '1') {
    return ProfileStatus.ACTIVE;
  }
  if (cleanStr(row.PAYMENT_STATUS) === '1') return ProfileStatus.PAYMENT_PENDING;
  return ProfileStatus.DRAFT;
}

function mapSUserStatus(row: any): ProfileStatus {
  if (cleanStr(row.CANCELL) === '1') return ProfileStatus.SUSPENDED;
  if (cleanStr(row.APPROVAL) === '1') return ProfileStatus.ACTIVE;
  return ProfileStatus.DRAFT;
}

function buildMemberId(refno: string, id: number): string {
  const clean = cleanStr(refno);
  if (clean && clean !== '0') {
    // Normalise: USR/00110 → MN-00110, USR-00110 → MN-00110
    return clean.replace(/^(USR[\/\-]|USRM[\/\-])/, 'MN-').toUpperCase();
  }
  return `MN-MIGR-${id}`;
}

function buildEmail(row: any, fallbackId: number): string {
  const email = cleanStr(row.EMAIL) || cleanStr(row.YOU_EMAIL);
  if (email && email.includes('@')) return email.toLowerCase();
  const username = cleanStr(row.USERNAME);
  if (username && username.length > 1) {
    return `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@muslimnikah.migrated`;
  }
  return `migrated-user-${fallbackId}@muslimnikah.migrated`;
}

// ─── Step 1: Migrate s_post → User + ChildProfile ──────────────────────────────

async function migrateProfiles(conn: mysql.Connection) {
  console.log('\n📥 Fetching s_post rows from MySQL...');

  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT * FROM s_post ORDER BY ID ASC`
  );

  console.log(`   Found ${rows.length} rows in s_post`);

  let created = 0;
  let skipped = 0;
  const memberIdSet = new Set<string>();

  for (const row of rows) {
    try {
      const email = buildEmail(row, row.ID);
      const memberId = buildMemberId(row.REFNO, row.ID);

      // Skip truly duplicate memberIds (shouldn't happen but safety net)
      if (memberIdSet.has(memberId)) {
        const uniqueMemberId = `${memberId}-DUP${row.ID}`;
        memberIdSet.add(uniqueMemberId);
        // use uniqueMemberId below
      }
      memberIdSet.add(memberId);

      const rawPassword = cleanStr(row.PASSWORD) || 'MuslimNikah@2023';
      const hashedPassword = await bcrypt.hash(rawPassword, BCRYPT_ROUNDS);

      // Upsert User
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          password: hashedPassword,
          phone: cleanStr(row.MOBILE_NO),
          whatsappNumber: cleanStr(row.WHATSAPP_NO),
          role: 'PARENT',
          createdAt: toDate(row.USERDATETIME) ?? new Date(),
        },
      });

      // Build full name
      const firstName = cleanStr(row.FIRST_NAME) || '';
      const lastName = cleanStr(row.LAST_NAME) || '';
      const name = [firstName, lastName].filter(Boolean).join(' ').trim()
                   || cleanStr(row.NAME) || 'Unknown';

      const status = mapProfileStatus(row);
      const dob = toDate(row.BDAY) ?? new Date('1990-01-01');

      // Upsert ChildProfile
      const existing = await prisma.childProfile.findUnique({ where: { memberId } });
      if (!existing) {
        await prisma.childProfile.create({
          data: {
            memberId,
            userId: user.id,
            name,
            gender: mapGender(row.GENDER),
            dateOfBirth: dob,
            country: cleanStr(row.COUNTRY),
            city: cleanStr(row.REGION),
            ethnicity: cleanStr(row.ETHNICITY),
            education: cleanStr(row.EDUCATION),
            extraQualification: cleanStr(row.EDU_QLIFY),
            profession: cleanStr(row.PROFESSION),
            occupation: cleanStr(row.ADD_PROFESSION),
            height: toInt(row.HEIGHT),
            weight: toInt(row.WEIGHT),
            complexion: cleanStr(row.COMPLEX),
            appearance: cleanStr(row.APPEARENCE),
            civilStatus: cleanStr(row.CIVIL_STATUS),
            children: cleanStr(row.CHILDREN),
            dressCode: cleanStr(row.DESS_CODE),
            familyStatus: cleanStr(row.FAM_STATUS),
            aboutUs: cleanStr(row.ABOUT),
            expectations: cleanStr(row.ADD_DESCRIPTION),
            brothers: toInt(row.BROTHER) ?? 0,
            sisters: toInt(row.SISTER) ?? 0,
            fatherEthnicity: cleanStr(row.FA_ETHNICITY),
            fatherCountry: cleanStr(row.FA_COUNTRY),
            fatherOccupation: cleanStr(row.FA_PROFESSION),
            fatherCity: cleanStr(row.FA_REGION),
            motherEthnicity: cleanStr(row.MA_ETHNICITY),
            motherCountry: cleanStr(row.MA_COUNTRY),
            motherOccupation: cleanStr(row.MA_PROFESSION),
            motherCity: cleanStr(row.MA_REGION),
            status,
            contactEmail: cleanStr(row.YOU_EMAIL),
            phone: cleanStr(row.MOBILE_NO),
            createdAt: toDate(row.USERDATETIME) ?? new Date(),
          },
        });
        created++;
      } else {
        skipped++;
      }

      // Create Subscription if approved
      if (status === ProfileStatus.ACTIVE) {
        const profile = await prisma.childProfile.findUnique({ where: { memberId } });
        if (profile) {
          const existingSub = await prisma.subscription.findUnique({
            where: { childProfileId: profile.id },
          });
          if (!existingSub) {
            const startDate = toDate(row.PAID_DATE) ?? toDate(row.USERDATETIME) ?? new Date();
            const endDate = toDate(row.EXP_DATE);
            await prisma.subscription.create({
              data: {
                childProfileId: profile.id,
                status: endDate && endDate > new Date() ? SubscriptionStatus.ACTIVE : SubscriptionStatus.EXPIRED,
                startDate,
                endDate,
                planName: cleanStr(row.PACKAGE) ?? 'standard',
                planDurationDays: 30,
              },
            });
          }
        }
      }

      if (created % 50 === 0 && created > 0) {
        process.stdout.write(`   ✓ ${created} profiles created...\r`);
      }
    } catch (err: any) {
      console.error(`   ✗ Row ID=${row.ID} REFNO=${row.REFNO}: ${err.message}`);
    }
  }

  console.log(`\n   ✅ s_post migration done: ${created} created, ${skipped} skipped (already exist)`);
}

// ─── Step 2: Migrate s_payment → Payment ───────────────────────────────────────

async function migratePayments(conn: mysql.Connection) {
  console.log('\n📥 Fetching s_payment rows from MySQL...');

  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT * FROM s_payment WHERE CANCELL != '2' ORDER BY ID ASC`
  );

  console.log(`   Found ${rows.length} payment rows`);

  let created = 0;
  let skipped = 0;

  for (const row of rows) {
    try {
      const userRefno = cleanStr(row.USER_REFNO);
      if (!userRefno) { skipped++; continue; }

      // Find ChildProfile by memberId
      const memberId = buildMemberId(userRefno, 0);
      const profile = await prisma.childProfile.findUnique({ where: { memberId } });
      if (!profile) { skipped++; continue; }

      const amount = parseFloat(row.TOTAL || row.P_AMOUNT || 0);
      const payType = String(row.PAY_TYPE || '').toUpperCase();
      const method: PaymentMethod = payType.includes('MANUAL') || payType.includes('BANK')
        ? PaymentMethod.BANK_TRANSFER : PaymentMethod.GATEWAY;

      const statusVal = String(row.STATUS || '0');
      const payStatus: PaymentStatus = statusVal === '0' ? PaymentStatus.SUCCESS : PaymentStatus.PENDING;

      await prisma.payment.create({
        data: {
          userId: profile.userId,
          childProfileId: profile.id,
          amount,
          currency: 'LKR',
          method,
          status: payStatus,
          purpose: 'SUBSCRIPTION',
          bankRef: cleanStr(row.REFNO),
          adminNote: cleanStr(row.PAY_NOTE),
          approvedAt: toDate(row.USER_DTIME),
          createdAt: toDate(row.USER_DTIME) ?? new Date(),
        },
      });
      created++;
    } catch (err: any) {
      // skip duplicate / FK errors silently
      if (!err.message?.includes('Unique constraint')) {
        console.error(`   ✗ Payment ID=${row.ID}: ${err.message}`);
      }
    }
  }

  console.log(`   ✅ s_payment migration done: ${created} created, ${skipped} skipped`);
}

// ─── Step 3: Seed admin user ────────────────────────────────────────────────────

async function seedAdmin() {
  console.log('\n👤 Seeding ADMIN user...');
  const email = 'admin@muslimnikah.lk';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    await prisma.user.create({
      data: {
        email,
        password: await bcrypt.hash('Admin@123456', BCRYPT_ROUNDS),
        role: 'ADMIN',
      },
    });
    console.log(`   ✅ Admin created: ${email} / Admin@123456`);
  } else {
    console.log(`   ℹ️  Admin already exists`);
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Starting MySQL → PostgreSQL migration...');
  console.log('   Target DB:', process.env.DATABASE_URL);

  let conn: mysql.Connection | null = null;

  try {
    console.log('\n🔌 Connecting to MySQL on 127.0.0.1:3307...');
    conn = await mysql.createConnection(MYSQL_CONFIG);
    console.log('   ✅ MySQL connected');

    await migrateProfiles(conn);
    await migratePayments(conn);
    await seedAdmin();

    console.log('\n🎉 Migration complete!\n');
  } catch (err) {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
    await prisma.$disconnect();
  }
}

main();
