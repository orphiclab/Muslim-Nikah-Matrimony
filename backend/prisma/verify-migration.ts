import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function main() {
  const [users, profiles, payments, subscriptions] = await Promise.all([
    p.user.count(),
    p.childProfile.count(),
    p.payment.count(),
    p.subscription.count(),
  ]);
  const byStatus = await p.childProfile.groupBy({ by: ['status'], _count: true });
  console.log('\n✅ PostgreSQL Data Summary:');
  console.log(`   Users:         ${users}`);
  console.log(`   ChildProfiles: ${profiles}`);
  console.log(`   Payments:      ${payments}`);
  console.log(`   Subscriptions: ${subscriptions}`);
  console.log('\n   Profiles by status:');
  byStatus.forEach(s => console.log(`     ${s.status}: ${s._count}`));
  await p.$disconnect();
}
main();
