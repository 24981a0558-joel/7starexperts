// ─────────────────────────────────────────────────────────────────────────────
// DATABASE SEED
// ─────────────────────────────────────────────────────────────────────────────
// 📘 Seeding = filling your database with initial/test data.
// Run with: npm run db:seed
//
// This creates:
// - Service categories (Cleaning, Plumbing, Beauty, etc.)
// - Sample services under each category
// - An admin user
// ─────────────────────────────────────────────────────────────────────────────

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Create admin user ────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    // upsert = update if exists, create if not
    where: { phone: '9999999999' },
    update: {},
    create: {
      name: '7StarExperts Admin',
      phone: '9999999999',
      email: 'admin@7starexperts.com',
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin user created:', admin.phone);

  // ── Create service categories ────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Home Cleaning' },
      update: {},
      create: {
        name: 'Home Cleaning',
        icon: 'https://res.cloudinary.com/7starexperts/image/upload/cleaning.png',
        description: 'Professional home cleaning services',
        sortOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { name: 'Plumbing' },
      update: {},
      create: {
        name: 'Plumbing',
        icon: 'https://res.cloudinary.com/7starexperts/image/upload/plumbing.png',
        description: 'Expert plumbing services',
        sortOrder: 2,
      },
    }),
    prisma.category.upsert({
      where: { name: 'Electrician' },
      update: {},
      create: {
        name: 'Electrician',
        icon: 'https://res.cloudinary.com/7starexperts/image/upload/electrician.png',
        description: 'Certified electrician services',
        sortOrder: 3,
      },
    }),
    prisma.category.upsert({
      where: { name: 'Beauty & Wellness' },
      update: {},
      create: {
        name: 'Beauty & Wellness',
        icon: 'https://res.cloudinary.com/7starexperts/image/upload/beauty.png',
        description: 'Beauty and wellness at home',
        sortOrder: 4,
      },
    }),
    prisma.category.upsert({
      where: { name: 'AC & Appliance Repair' },
      update: {},
      create: {
        name: 'AC & Appliance Repair',
        icon: 'https://res.cloudinary.com/7starexperts/image/upload/ac.png',
        description: 'AC servicing and appliance repair',
        sortOrder: 5,
      },
    }),
    prisma.category.upsert({
      where: { name: 'Pest Control' },
      update: {},
      create: {
        name: 'Pest Control',
        icon: 'https://res.cloudinary.com/7starexperts/image/upload/pest.png',
        description: 'Professional pest control services',
        sortOrder: 6,
      },
    }),
  ]);
  console.log(`✅ ${categories.length} categories created`);

  // ── Create sample services ───────────────────────────────────────────────
  const cleaningCategory = categories[0]!;
  await Promise.all([
    prisma.service.upsert({
      where: { id: 'service-cleaning-1' },
      update: {},
      create: {
        id: 'service-cleaning-1',
        categoryId: cleaningCategory.id,
        name: 'Full Home Cleaning',
        description: 'Deep cleaning of entire home including all rooms, kitchen, and bathrooms',
        basePrice: 999,
        duration: 180, // 3 hours
      },
    }),
    prisma.service.upsert({
      where: { id: 'service-cleaning-2' },
      update: {},
      create: {
        id: 'service-cleaning-2',
        categoryId: cleaningCategory.id,
        name: 'Kitchen Deep Clean',
        description: 'Thorough kitchen cleaning including chimney, shelves, and appliances',
        basePrice: 599,
        duration: 90,
      },
    }),
    prisma.service.upsert({
      where: { id: 'service-cleaning-3' },
      update: {},
      create: {
        id: 'service-cleaning-3',
        categoryId: cleaningCategory.id,
        name: 'Bathroom Cleaning',
        description: 'Complete bathroom sanitization and cleaning',
        basePrice: 299,
        duration: 60,
      },
    }),
  ]);
  console.log('✅ Sample services created');

  console.log('');
  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
