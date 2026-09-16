import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Smart Farmer Assistance Database Seeding...');

  // 1. Create Default Admin User
  const adminPassword = await bcrypt.hash('Admin@12345', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@smartfarmer.gov.in' },
    update: {},
    create: {
      email: 'admin@smartfarmer.gov.in',
      mobile: '9876543210',
      passwordHash: adminPassword,
      fullName: 'Dr. Rajesh Verma (Director APMC)',
      role: 'ADMIN',
      state: 'National Capital Region',
      district: 'New Delhi',
      village: 'Krishi Bhawan',
      address: 'Department of Agriculture & Farmers Welfare, New Delhi',
      preferredLanguage: 'en',
      isActive: true,
      notificationPreference: {
        create: {
          inApp: true,
          sms: true,
          whatsapp: false,
          push: true,
        },
      },
    },
  });
  console.log(`✅ Admin user seeded: ${admin.email}`);

  // 2. Seed Official Crops
  const cropsData = [
    { name: 'Wheat', scientificName: 'Triticum aestivum', category: 'Cereal', defaultUnit: 'Quintal' },
    { name: 'Paddy (Common)', scientificName: 'Oryza sativa', category: 'Cereal', defaultUnit: 'Quintal' },
    { name: 'Paddy (Grade A)', scientificName: 'Oryza sativa var.', category: 'Cereal', defaultUnit: 'Quintal' },
    { name: 'Mustard / Rapeseed', scientificName: 'Brassica juncea', category: 'Oilseed', defaultUnit: 'Quintal' },
    { name: 'Cotton (Medium Staple)', scientificName: 'Gossypium hirsutum', category: 'Cash Crop', defaultUnit: 'Quintal' },
    { name: 'Cotton (Long Staple)', scientificName: 'Gossypium barbadense', category: 'Cash Crop', defaultUnit: 'Quintal' },
    { name: 'Soybean (Yellow)', scientificName: 'Glycine max', category: 'Oilseed', defaultUnit: 'Quintal' },
    { name: 'Gram (Chana)', scientificName: 'Cicer arietinum', category: 'Pulse', defaultUnit: 'Quintal' },
    { name: 'Maize (Makka)', scientificName: 'Zea mays', category: 'Cereal', defaultUnit: 'Quintal' },
    { name: 'Sugarcane', scientificName: 'Saccharum officinarum', category: 'Cash Crop', defaultUnit: 'Quintal' },
    { name: 'Onion', scientificName: 'Allium cepa', category: 'Horticulture', defaultUnit: 'Quintal' },
    { name: 'Potato', scientificName: 'Solanum tuberosum', category: 'Horticulture', defaultUnit: 'Quintal' },
  ];

  const createdCrops: Record<string, any> = {};
  for (const c of cropsData) {
    const crop = await prisma.crop.upsert({
      where: { name: c.name },
      update: {},
      create: c,
    });
    createdCrops[c.name] = crop;
  }
  console.log(`✅ Seeded ${Object.keys(createdCrops).length} standard crops`);

  // 3. Seed Official Government MSP Prices (Official CACP / MoA&FW Rates)
  const mspPrices = [
    { cropName: 'Wheat', season: 'Rabi', marketingYear: '2025-26', price: 2425, unit: 'Quintal' },
    { cropName: 'Paddy (Common)', season: 'Kharif', marketingYear: '2025-26', price: 2300, unit: 'Quintal' },
    { cropName: 'Paddy (Grade A)', season: 'Kharif', marketingYear: '2025-26', price: 2320, unit: 'Quintal' },
    { cropName: 'Mustard / Rapeseed', season: 'Rabi', marketingYear: '2025-26', price: 5950, unit: 'Quintal' },
    { cropName: 'Cotton (Medium Staple)', season: 'Kharif', marketingYear: '2025-26', price: 7121, unit: 'Quintal' },
    { cropName: 'Cotton (Long Staple)', season: 'Kharif', marketingYear: '2025-26', price: 7521, unit: 'Quintal' },
    { cropName: 'Soybean (Yellow)', season: 'Kharif', marketingYear: '2025-26', price: 4892, unit: 'Quintal' },
    { cropName: 'Gram (Chana)', season: 'Rabi', marketingYear: '2025-26', price: 5650, unit: 'Quintal' },
    { cropName: 'Maize (Makka)', season: 'Kharif', marketingYear: '2025-26', price: 2225, unit: 'Quintal' },
  ];

  for (const p of mspPrices) {
    const crop = createdCrops[p.cropName];
    await prisma.governmentCropPrice.upsert({
      where: {
        cropName_season_marketingYear: {
          cropName: p.cropName,
          season: p.season,
          marketingYear: p.marketingYear,
        },
      },
      update: { price: p.price },
      create: {
        cropId: crop?.id || null,
        cropName: p.cropName,
        season: p.season,
        marketingYear: p.marketingYear,
        price: p.price,
        unit: p.unit,
        effectiveFrom: new Date('2025-04-01'),
        source: 'Commission for Agricultural Costs and Prices (CACP), Ministry of Agriculture',
        status: 'ACTIVE',
        createdById: admin.id,
      },
    });
  }
  console.log(`✅ Seeded ${mspPrices.length} Government MSP Prices`);

  // 4. Seed Real Procurement Centres
  const centre1 = await prisma.procurementCentre.create({
    data: {
      name: 'Karnal Central Grain Procurement Hub',
      address: 'Near New Anaj Mandi, GT Road, Karnal',
      state: 'Haryana',
      district: 'Karnal',
      village: 'Karnal Sub-Division',
      latitude: 29.6857,
      longitude: 76.9905,
      contactNumber: '0184-2256789',
      openingHours: '08:00 AM - 06:00 PM',
      totalCapacity: 5000,
      currentUsage: 1250,
      processingRate: 50, // 50 quintals/hr
      status: 'OPEN',
      supportedCrops: {
        create: [
          { cropId: createdCrops['Wheat'].id, maxDailyCapacity: 2500, isAccepting: true },
          { cropId: createdCrops['Paddy (Common)'].id, maxDailyCapacity: 2500, isAccepting: true },
          { cropId: createdCrops['Mustard / Rapeseed'].id, maxDailyCapacity: 1000, isAccepting: true },
        ],
      },
    },
  });

  const centre2 = await prisma.procurementCentre.create({
    data: {
      name: 'Indore Krishi Upaj Mandi Procurement Centre',
      address: 'Laxmibai Nagar Mandi Complex, Sanwer Road, Indore',
      state: 'Madhya Pradesh',
      district: 'Indore',
      village: 'Laxmibai Nagar',
      latitude: 22.7533,
      longitude: 75.8643,
      contactNumber: '0731-2412345',
      openingHours: '07:30 AM - 05:30 PM',
      totalCapacity: 8000,
      currentUsage: 3400,
      processingRate: 65,
      status: 'OPEN',
      supportedCrops: {
        create: [
          { cropId: createdCrops['Soybean (Yellow)'].id, maxDailyCapacity: 4000, isAccepting: true },
          { cropId: createdCrops['Wheat'].id, maxDailyCapacity: 3000, isAccepting: true },
          { cropId: createdCrops['Gram (Chana)'].id, maxDailyCapacity: 2000, isAccepting: true },
        ],
      },
    },
  });

  const centre3 = await prisma.procurementCentre.create({
    data: {
      name: 'Rajkot APMC Cotton & Groundnut Procurement Depot',
      address: 'Bedi Yard APMC, Morbi Road, Rajkot',
      state: 'Gujarat',
      district: 'Rajkot',
      village: 'Bedi',
      latitude: 22.3385,
      longitude: 70.8022,
      contactNumber: '0281-2703456',
      openingHours: '08:30 AM - 05:00 PM',
      totalCapacity: 6000,
      currentUsage: 4800,
      processingRate: 40,
      status: 'BUSY',
      supportedCrops: {
        create: [
          { cropId: createdCrops['Cotton (Medium Staple)'].id, maxDailyCapacity: 3000, isAccepting: true },
          { cropId: createdCrops['Cotton (Long Staple)'].id, maxDailyCapacity: 2000, isAccepting: true },
          { cropId: createdCrops['Wheat'].id, maxDailyCapacity: 1500, isAccepting: true },
        ],
      },
    },
  });

  // Seed Punjab Regional Centres
  await prisma.procurementCentre.create({
    data: {
      name: 'Phagwara APMC Grain Procurement Hub',
      address: 'Near GT Road Bypass, Dana Mandi, Phagwara',
      state: 'Punjab',
      district: 'Kapurthala',
      village: 'Phagwara',
      latitude: 31.224,
      longitude: 75.7708,
      contactNumber: '01824-261234',
      openingHours: '08:00 AM - 06:00 PM',
      totalCapacity: 6500,
      currentUsage: 1400,
      processingRate: 45,
      status: 'OPEN',
      supportedCrops: {
        create: [
          { cropId: createdCrops['Wheat'].id, maxDailyCapacity: 3000, isAccepting: true },
          { cropId: createdCrops['Paddy (Common)'].id, maxDailyCapacity: 2500, isAccepting: true },
          { cropId: createdCrops['Paddy (Grade A)'].id, maxDailyCapacity: 2500, isAccepting: true },
          { cropId: createdCrops['Maize (Makka)'].id, maxDailyCapacity: 1500, isAccepting: true },
        ],
      },
    },
  });

  await prisma.procurementCentre.create({
    data: {
      name: 'Ludhiana Central Dana Mandi Complex',
      address: 'Gill Road Grain Market Complex, Ludhiana',
      state: 'Punjab',
      district: 'Ludhiana',
      village: 'Gill',
      latitude: 30.901,
      longitude: 75.8573,
      contactNumber: '0161-2401234',
      openingHours: '07:30 AM - 06:00 PM',
      totalCapacity: 9500,
      currentUsage: 2800,
      processingRate: 60,
      status: 'OPEN',
      supportedCrops: {
        create: [
          { cropId: createdCrops['Wheat'].id, maxDailyCapacity: 4000, isAccepting: true },
          { cropId: createdCrops['Paddy (Common)'].id, maxDailyCapacity: 3500, isAccepting: true },
          { cropId: createdCrops['Mustard / Rapeseed'].id, maxDailyCapacity: 2000, isAccepting: true },
        ],
      },
    },
  });

  await prisma.procurementCentre.create({
    data: {
      name: 'Jalandhar Maqsudan Procurement Complex',
      address: 'Maqsudan Mandi, GT Road, Jalandhar',
      state: 'Punjab',
      district: 'Jalandhar',
      village: 'Maqsudan',
      latitude: 31.3532,
      longitude: 75.5684,
      contactNumber: '0181-2294567',
      openingHours: '08:00 AM - 05:30 PM',
      totalCapacity: 8000,
      currentUsage: 3100,
      processingRate: 50,
      status: 'OPEN',
      supportedCrops: {
        create: [
          { cropId: createdCrops['Wheat'].id, maxDailyCapacity: 3500, isAccepting: true },
          { cropId: createdCrops['Paddy (Common)'].id, maxDailyCapacity: 3000, isAccepting: true },
          { cropId: createdCrops['Potato'].id, maxDailyCapacity: 2000, isAccepting: true },
        ],
      },
    },
  });
  console.log(`✅ Seeded Procurement Centres including Punjab Hubs`);

  // 5. Seed Centre Manager User
  const managerPassword = await bcrypt.hash('Manager@12345', 10);
  const manager = await prisma.user.upsert({
    where: { email: 'manager.karnal@smartfarmer.gov.in' },
    update: {},
    create: {
      email: 'manager.karnal@smartfarmer.gov.in',
      mobile: '9876543211',
      passwordHash: managerPassword,
      fullName: 'Suresh Chandra (Centre Superintendent)',
      role: 'PROCUREMENT_CENTRE_MANAGER',
      state: 'Haryana',
      district: 'Karnal',
      village: 'Karnal Sub-Division',
      address: 'Staff Quarters, Mandi Board, Karnal',
      preferredLanguage: 'hi',
      isActive: true,
      managedCentres: {
        create: {
          centreId: centre1.id,
        },
      },
      notificationPreference: {
        create: {
          inApp: true,
          sms: true,
          whatsapp: true,
          push: true,
        },
      },
    },
  });
  console.log(`✅ Centre Manager seeded: ${manager.email}`);

  // 6. Farmer accounts will be created by users via registration form

  // 7. Seed Sample Official Alerts
  await prisma.alert.create({
    data: {
      title: 'Wheat Procurement Commencing for Rabi Marketing Season 2026',
      message: 'Procurement centres across Haryana and Punjab will open for Wheat MSP registration from April 1st. Ensure your moisture content is below 12%.',
      priority: 'HIGH',
      cropId: createdCrops['Wheat'].id,
      location: 'Haryana',
      isPublished: true,
      startTime: new Date(),
      expiryTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      createdById: admin.id,
    },
  });

  console.log('✨ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
