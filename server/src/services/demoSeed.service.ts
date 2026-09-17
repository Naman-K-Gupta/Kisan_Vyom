import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

export async function ensureComprehensiveDemoData(force: boolean = false): Promise<void> {
  try {
    if (!force) {
      const adminUser = await prisma.user.findUnique({ where: { email: 'admin@smartfarmer.gov.in' } });
      const managerUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: 'manager.karnal@smartfarmer.gov.in' },
            { email: 'manager@smartfarmer.gov.in' },
          ],
        },
      });
      const farmerJaskirat = await prisma.user.findUnique({ where: { mobile: '9464204021' } });
      const cropCount = await prisma.crop.count().catch(() => 0);

      if (adminUser && managerUser && farmerJaskirat && cropCount > 5) {
        return;
      }
    }

    logger.info('🌱 Seeding comprehensive demo data for Farmer, Manager, and Admin portals...');

    // ----------------------------------------------------
    // 1. Password Hashes (Harmonized for Portal Demo Logins)
    // ----------------------------------------------------
    const adminPassword = await bcrypt.hash('Admin@123', 10);
    const managerPassword = await bcrypt.hash('Manager@12345', 10);
    const farmerPassword = await bcrypt.hash('Password@123', 10);

    // ----------------------------------------------------
    // 2. Admin User
    // ----------------------------------------------------
    const admin = await prisma.user.upsert({
      where: { email: 'admin@smartfarmer.gov.in' },
      update: { passwordHash: adminPassword },
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
      },
    });

    // ----------------------------------------------------
    // 3. Master Crops Catalog
    // ----------------------------------------------------
    const cropsData = [
      { name: 'Wheat (Kanak)', scientificName: 'Triticum aestivum', category: 'Cereal', defaultUnit: 'Quintal', isActive: true },
      { name: 'Paddy (Dhaan - Common)', scientificName: 'Oryza sativa', category: 'Cereal', defaultUnit: 'Quintal', isActive: true },
      { name: 'Paddy (Grade A)', scientificName: 'Oryza sativa var.', category: 'Cereal', defaultUnit: 'Quintal', isActive: true },
      { name: 'Mustard / Rapeseed (Sarson)', scientificName: 'Brassica juncea', category: 'Oilseed', defaultUnit: 'Quintal', isActive: true },
      { name: 'Cotton (Kapas)', scientificName: 'Gossypium hirsutum', category: 'Cash Crop', defaultUnit: 'Quintal', isActive: true },
      { name: 'Soybean (Yellow)', scientificName: 'Glycine max', category: 'Oilseed', defaultUnit: 'Quintal', isActive: true },
      { name: 'Gram (Chana / Chickpea)', scientificName: 'Cicer arietinum', category: 'Pulse', defaultUnit: 'Quintal', isActive: true },
      { name: 'Maize (Makka)', scientificName: 'Zea mays', category: 'Cereal', defaultUnit: 'Quintal', isActive: true },
      { name: 'Sugarcane (Ganna)', scientificName: 'Saccharum officinarum', category: 'Cash Crop', defaultUnit: 'Quintal', isActive: true },
      { name: 'Moong (Green Gram)', scientificName: 'Vigna radiata', category: 'Pulse', defaultUnit: 'Quintal', isActive: true },
      { name: 'Bajra (Pearl Millet)', scientificName: 'Pennisetum glaucum', category: 'Millet', defaultUnit: 'Quintal', isActive: true },
      { name: 'Groundnut (Mungfali)', scientificName: 'Arachis hypogaea', category: 'Oilseed', defaultUnit: 'Quintal', isActive: true },
    ];

    const cropMap: Record<string, any> = {};
    for (const c of cropsData) {
      const crop = await prisma.crop.upsert({
        where: { name: c.name },
        update: {},
        create: c,
      });
      cropMap[c.name] = crop;
    }

    // ----------------------------------------------------
    // 4. Official MSP Floor Rates
    // ----------------------------------------------------
    const mspRates = [
      { name: 'Wheat (Kanak)', price: 2425, season: 'Rabi' },
      { name: 'Paddy (Dhaan - Common)', price: 2300, season: 'Kharif' },
      { name: 'Paddy (Grade A)', price: 2320, season: 'Kharif' },
      { name: 'Mustard / Rapeseed (Sarson)', price: 5950, season: 'Rabi' },
      { name: 'Cotton (Kapas)', price: 7121, season: 'Kharif' },
      { name: 'Soybean (Yellow)', price: 4892, season: 'Kharif' },
      { name: 'Gram (Chana / Chickpea)', price: 5650, season: 'Rabi' },
      { name: 'Maize (Makka)', price: 2225, season: 'Kharif' },
    ];

    for (const m of mspRates) {
      const crop = cropMap[m.name];
      await prisma.governmentCropPrice.upsert({
        where: {
          cropName_season_marketingYear: {
            cropName: m.name,
            season: m.season,
            marketingYear: '2025-26',
          },
        },
        update: { price: m.price },
        create: {
          cropId: crop?.id || null,
          cropName: m.name,
          season: m.season,
          marketingYear: '2025-26',
          price: m.price,
          unit: 'Quintal',
          effectiveFrom: new Date('2025-04-01'),
          source: 'Commission for Agricultural Costs and Prices (CACP), Ministry of Agriculture',
          status: 'ACTIVE',
          createdById: admin.id,
        },
      }).catch(() => {});
    }

    // ----------------------------------------------------
    // 5. APMC Procurement Mandis
    // ----------------------------------------------------
    const karnalCentre = await prisma.procurementCentre.upsert({
      where: { id: 'centre-karnal-001' },
      update: {},
      create: {
        id: 'centre-karnal-001',
        name: 'Karnal Central Grain Procurement Hub',
        address: 'Near New Anaj Mandi, GT Road, Karnal',
        state: 'Haryana',
        district: 'Karnal',
        village: 'Karnal Sub-Division',
        latitude: 29.6857,
        longitude: 76.9905,
        contactNumber: '0184-2256789',
        openingHours: '08:00 AM - 06:00 PM',
        totalCapacity: 10000,
        currentUsage: 3450,
        processingRate: 60,
        status: 'OPEN',
      },
    });

    const ambalaCentre = await prisma.procurementCentre.upsert({
      where: { id: 'centre-ambala-001' },
      update: {},
      create: {
        id: 'centre-ambala-001',
        name: 'Ambala City APMC Grain Market',
        address: 'Old Grain Market Yard, GT Road, Ambala City',
        state: 'Haryana',
        district: 'Ambala',
        village: 'Ambala City',
        latitude: 30.3782,
        longitude: 76.7767,
        contactNumber: '0171-2551234',
        openingHours: '08:00 AM - 06:00 PM',
        totalCapacity: 8500,
        currentUsage: 2100,
        processingRate: 50,
        status: 'OPEN',
      },
    });

    const ludhianaCentre = await prisma.procurementCentre.upsert({
      where: { id: 'centre-ludhiana-001' },
      update: {},
      create: {
        id: 'centre-ludhiana-001',
        name: 'Ludhiana Central Dana Mandi Complex',
        address: 'Gill Road Grain Market Complex, Gate No. 2, Ludhiana',
        state: 'Punjab',
        district: 'Ludhiana',
        village: 'Gill',
        latitude: 30.901,
        longitude: 75.8573,
        contactNumber: '0161-2401234',
        openingHours: '07:30 AM - 06:00 PM',
        totalCapacity: 12000,
        currentUsage: 4200,
        processingRate: 75,
        status: 'OPEN',
      },
    });

    // Link crops to centres
    const allCropsList = Object.values(cropMap);
    for (const c of [karnalCentre, ambalaCentre, ludhianaCentre]) {
      for (const crop of allCropsList.slice(0, 8)) {
        await prisma.centreCrop.upsert({
          where: {
            centreId_cropId: {
              centreId: c.id,
              cropId: crop.id,
            },
          },
          update: {},
          create: {
            centreId: c.id,
            cropId: crop.id,
            maxDailyCapacity: 3000,
            isAccepting: true,
          },
        }).catch(() => {});
      }
    }

    // ----------------------------------------------------
    // 6. Manager User (Karnal Mandi Superintendent)
    // ----------------------------------------------------
    await prisma.user.deleteMany({
      where: {
        email: 'manager@smartfarmer.gov.in',
        mobile: '9876543211',
      },
    }).catch(() => {});

    const manager = await prisma.user.upsert({
      where: { email: 'manager.karnal@smartfarmer.gov.in' },
      update: {
        mobile: '9876543211',
        passwordHash: managerPassword,
        fullName: 'Suresh Chandra (Centre Superintendent)',
        role: 'PROCUREMENT_CENTRE_MANAGER',
      },
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
      },
    });

    await prisma.centreManager.upsert({
      where: {
        userId_centreId: {
          userId: manager.id,
          centreId: karnalCentre.id,
        },
      },
      update: {},
      create: {
        userId: manager.id,
        centreId: karnalCentre.id,
      },
    }).catch(() => {});

    // ----------------------------------------------------
    // 7. Demo Farmers & Rich Profiles
    // ----------------------------------------------------
    const farmer1 = await prisma.user.upsert({
      where: { email: 'farmer@smartfarmer.gov.in' },
      update: { passwordHash: farmerPassword },
      create: {
        email: 'farmer@smartfarmer.gov.in',
        mobile: '9876500001',
        passwordHash: farmerPassword,
        fullName: 'Rajeshwar Singh (Farmer)',
        role: 'FARMER',
        state: 'Haryana',
        district: 'Karnal',
        village: 'Taraori',
        address: 'VPO Taraori, Near GT Road, Karnal',
        preferredLanguage: 'hi',
        isActive: true,
      },
    });

    const farmerProfile = await prisma.farmerProfile.upsert({
      where: { userId: farmer1.id },
      update: {},
      create: {
        userId: farmer1.id,
        landAreaTotal: 12.5,
        bio: 'Progressive farmer cultivating Wheat, Mustard, and Gram with solar micro-irrigation.',
      },
    });

    // Cultivated Crops for Farmer Dashboard
    const wheatCrop = cropMap['Wheat (Kanak)'];
    const mustardCrop = cropMap['Mustard / Rapeseed (Sarson)'];
    const gramCrop = cropMap['Gram (Chana / Chickpea)'];

    if (wheatCrop && farmerProfile) {
      await prisma.farmerCrop.upsert({
        where: { id: `fc-wheat-${farmer1.id}` },
        update: {},
        create: {
          id: `fc-wheat-${farmer1.id}`,
          farmerProfileId: farmerProfile.id,
          cropId: wheatCrop.id,
          variety: 'HD-2967 (Kanak)',
          landArea: 6.0,
          sowingDate: new Date('2025-11-10'),
          expectedHarvestDate: new Date('2026-04-15'),
          expectedProduction: 120,
          unit: 'Quintal',
          status: 'SOWN',
        },
      }).catch(() => {});
    }

    if (mustardCrop && farmerProfile) {
      await prisma.farmerCrop.upsert({
        where: { id: `fc-mustard-${farmer1.id}` },
        update: {},
        create: {
          id: `fc-mustard-${farmer1.id}`,
          farmerProfileId: farmerProfile.id,
          cropId: mustardCrop.id,
          variety: 'Pusa Bold (Sarson)',
          landArea: 4.0,
          sowingDate: new Date('2025-10-25'),
          expectedHarvestDate: new Date('2026-03-20'),
          expectedProduction: 36,
          unit: 'Quintal',
          status: 'SOWN',
        },
      }).catch(() => {});
    }

    if (gramCrop && farmerProfile) {
      await prisma.farmerCrop.upsert({
        where: { id: `fc-gram-${farmer1.id}` },
        update: {},
        create: {
          id: `fc-gram-${farmer1.id}`,
          farmerProfileId: farmerProfile.id,
          cropId: gramCrop.id,
          variety: 'Desi Chana',
          landArea: 2.5,
          sowingDate: new Date('2025-11-05'),
          expectedHarvestDate: new Date('2026-03-30'),
          expectedProduction: 22,
          unit: 'Quintal',
          status: 'GROWING',
        },
      }).catch(() => {});
    }

    // ----------------------------------------------------
    // Seed Primary Test Farmer: Jaskirat Singh (9464204021)
    // ----------------------------------------------------
    const jaskirat = await prisma.user.upsert({
      where: { mobile: '9464204021' },
      update: {
        passwordHash: farmerPassword,
        fullName: 'Jaskirat Singh',
      },
      create: {
        email: 'namankgupta2008@gmail.com',
        mobile: '9464204021',
        passwordHash: farmerPassword,
        fullName: 'Jaskirat Singh',
        role: 'FARMER',
        state: 'Punjab',
        district: 'Amritsar',
        village: 'Attari',
        address: 'Attari Border Road, Amritsar',
        preferredLanguage: 'pa',
        isActive: true,
      },
    });

    const jaskiratProfile = await prisma.farmerProfile.upsert({
      where: { userId: jaskirat.id },
      update: {},
      create: {
        userId: jaskirat.id,
        landAreaTotal: 15.0,
        bio: 'Progressive wheat and paddy grower from Punjab.',
      },
    });

    if (wheatCrop && jaskiratProfile) {
      await prisma.farmerCrop.upsert({
        where: { id: `fc-wheat-${jaskirat.id}` },
        update: {},
        create: {
          id: `fc-wheat-${jaskirat.id}`,
          farmerProfileId: jaskiratProfile.id,
          cropId: wheatCrop.id,
          variety: 'PBW-725 (Kanak)',
          landArea: 8.0,
          sowingDate: new Date('2025-11-12'),
          expectedHarvestDate: new Date('2026-04-18'),
          expectedProduction: 160,
          unit: 'Quintal',
          status: 'SOWN',
        },
      }).catch(() => {});
    }

    if (mustardCrop && jaskiratProfile) {
      await prisma.farmerCrop.upsert({
        where: { id: `fc-mustard-${jaskirat.id}` },
        update: {},
        create: {
          id: `fc-mustard-${jaskirat.id}`,
          farmerProfileId: jaskiratProfile.id,
          cropId: mustardCrop.id,
          variety: 'Pusa Bold (Sarson)',
          landArea: 5.0,
          sowingDate: new Date('2025-10-28'),
          expectedHarvestDate: new Date('2026-03-25'),
          expectedProduction: 45,
          unit: 'Quintal',
          status: 'SOWN',
        },
      }).catch(() => {});
    }

    // Pre-link Jaskirat Singh's Telegram to Chat ID 8365953425
    if ((prisma as any).farmerTelegramLink) {
      await (prisma as any).farmerTelegramLink.upsert({
        where: { mobile: '9464204021' },
        update: {
          chatId: '8365953425',
          userId: jaskirat.id,
          firstName: 'Jaskirat Singh',
          isActive: 1,
        },
        create: {
          mobile: '9464204021',
          chatId: '8365953425',
          userId: jaskirat.id,
          firstName: 'Jaskirat Singh',
          isActive: 1,
        },
      }).catch(() => {});
    }

    // Additional farmers in queue
    const farmer2 = await prisma.user.upsert({
      where: { email: 'farmer.balwinder@smartfarmer.gov.in' },
      update: { passwordHash: farmerPassword },
      create: {
        email: 'farmer.balwinder@smartfarmer.gov.in',
        mobile: '9876500002',
        passwordHash: farmerPassword,
        fullName: 'Balwinder Dhillon',
        role: 'FARMER',
        state: 'Haryana',
        district: 'Karnal',
        village: 'Gharaunda',
        address: 'Ward 4, Gharaunda, Karnal',
        preferredLanguage: 'pa',
        isActive: true,
      },
    });

    const farmer3 = await prisma.user.upsert({
      where: { email: 'farmer.gurpreet@smartfarmer.gov.in' },
      update: { passwordHash: farmerPassword },
      create: {
        email: 'farmer.gurpreet@smartfarmer.gov.in',
        mobile: '9876500003',
        passwordHash: farmerPassword,
        fullName: 'Gurpreet Kaur',
        role: 'FARMER',
        state: 'Haryana',
        district: 'Karnal',
        village: 'Indri',
        address: 'Near Sugar Mill, Indri, Karnal',
        preferredLanguage: 'hi',
        isActive: true,
      },
    });

    const farmer4 = await prisma.user.upsert({
      where: { email: 'farmer.harinder@smartfarmer.gov.in' },
      update: { passwordHash: farmerPassword },
      create: {
        email: 'farmer.harinder@smartfarmer.gov.in',
        mobile: '9876500004',
        passwordHash: farmerPassword,
        fullName: 'Harinder Singh',
        role: 'FARMER',
        state: 'Haryana',
        district: 'Karnal',
        village: 'Nilokheri',
        address: 'GT Road, Nilokheri, Karnal',
        preferredLanguage: 'pa',
        isActive: true,
      },
    });

    // ----------------------------------------------------
    // 8. Queue Tokens for Manager & Farmer Dashboards
    // ----------------------------------------------------
    // 1) Active Called Token at Weighbridge Bay 1
    const calledToken = await prisma.queueToken.upsert({
      where: { id: 'token-karnal-0038' },
      update: {},
      create: {
        id: 'token-karnal-0038',
        tokenNumber: 'T-2026-0038',
        farmerId: farmer4.id,
        centreId: karnalCentre.id,
        cropId: wheatCrop?.id || allCropsList[0].id,
        quantity: 50,
        unit: 'Quintal',
        status: 'CALLED',
        vehicleNumber: 'HR-05-CD-1122',
        vehicleType: 'Tractor Trolley',
        estimatedWaitMinutes: 0,
        calledAt: new Date(Date.now() - 5 * 60 * 1000),
      },
    });

    // 2) Waiting Token #1
    await prisma.queueToken.upsert({
      where: { id: 'token-karnal-0039' },
      update: {},
      create: {
        id: 'token-karnal-0039',
        tokenNumber: 'T-2026-0039',
        farmerId: farmer2.id,
        centreId: karnalCentre.id,
        cropId: wheatCrop?.id || allCropsList[0].id,
        quantity: 40,
        unit: 'Quintal',
        status: 'WAITING',
        vehicleNumber: 'HR-05-EF-3344',
        vehicleType: 'Tractor Trolley',
        estimatedWaitMinutes: 10,
        createdAt: new Date(Date.now() - 35 * 60 * 1000),
      },
    });

    // 3) Waiting Token #2
    await prisma.queueToken.upsert({
      where: { id: 'token-karnal-0040' },
      update: {},
      create: {
        id: 'token-karnal-0040',
        tokenNumber: 'T-2026-0040',
        farmerId: farmer3.id,
        centreId: karnalCentre.id,
        cropId: mustardCrop?.id || allCropsList[3].id,
        quantity: 28,
        unit: 'Quintal',
        status: 'WAITING',
        vehicleNumber: 'HR-05-GH-5566',
        vehicleType: 'Mini Truck',
        estimatedWaitMinutes: 20,
        createdAt: new Date(Date.now() - 25 * 60 * 1000),
      },
    });

    // 4) Farmer1 Active Token (Shown on Farmer Dashboard)
    const activeFarmerToken = await prisma.queueToken.upsert({
      where: { id: 'token-karnal-0042' },
      update: {},
      create: {
        id: 'token-karnal-0042',
        tokenNumber: 'T-2026-0042',
        farmerId: farmer1.id,
        centreId: karnalCentre.id,
        cropId: wheatCrop?.id || allCropsList[0].id,
        quantity: 45,
        unit: 'Quintal',
        status: 'WAITING',
        vehicleNumber: 'HR-05-AB-4321',
        vehicleType: 'Tractor Trolley',
        estimatedWaitMinutes: 30,
        createdAt: new Date(Date.now() - 15 * 60 * 1000),
      },
    });

    // ----------------------------------------------------
    // 9. Past Completed Payment Records (Tulai Parchi)
    // ----------------------------------------------------
    const completedToken = await prisma.queueToken.upsert({
      where: { id: 'token-karnal-0012' },
      update: {},
      create: {
        id: 'token-karnal-0012',
        tokenNumber: 'T-2026-0012',
        farmerId: farmer1.id,
        centreId: karnalCentre.id,
        cropId: mustardCrop?.id || allCropsList[3].id,
        quantity: 55,
        unit: 'Quintal',
        status: 'COMPLETED',
        vehicleNumber: 'HR-05-AB-4321',
        vehicleType: 'Tractor Trolley',
        completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.payment.upsert({
      where: { id: 'pay-karnal-0012' },
      update: {},
      create: {
        id: 'pay-karnal-0012',
        paymentNumber: 'PAY-20260310-0012-7891',
        farmerId: farmer1.id,
        centreId: karnalCentre.id,
        cropId: mustardCrop?.id || allCropsList[3].id,
        queueTokenId: completedToken.id,
        quantity: 55,
        unit: 'Quintal',
        ratePerUnit: 5950,
        grossAmount: 327250,
        deductions: 0,
        netAmount: 327250,
        status: 'PAID',
        paymentMethod: 'DBT_PFMS',
        utrNumber: 'DBT-RBI-20260310-884920',
        bankName: 'State Bank of India (Karnal Main)',
        accountNumberMasked: 'XXXXXX4021',
        ifscCode: 'SBIN0001234',
        qualityGrade: 'Grade A (FAQ Passed)',
        vehicleNumber: 'HR-05-AB-4321',
        paidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    });

    // ----------------------------------------------------
    // 10. Government Policies & Welfare Schemes (Admin Dashboard)
    // ----------------------------------------------------
    const welfareSchemes = [
      {
        id: 'scheme-kusum-001',
        title: 'PM-KUSUM Solar Agriculture Pump Subsidy Scheme',
        category: 'SOLAR_PUMP',
        ministry: 'Ministry of New & Renewable Energy',
        benefitAmount: 'Up to 90% Subsidy (₹2.5 Lakhs)',
        summary: 'Provides up to 90% standalone solar water pump subsidy for off-grid irrigation, lowering diesel expenses for small farmers.',
        details: 'Eligible for individual farmers, water user associations, and farmer producer organizations (FPOs). State nodal agency verifies land borewell telemetry.',
        eligibilityCriteria: 'Minimum 1 acre cultivated land with valid water access. Tenant farmers with valid lease certificate eligible.',
        maxLandAcreage: 15.0,
        applicableStates: 'ALL',
        applicationUrl: 'https://pmkusum.mnre.gov.in',
        officialCircularUrl: 'https://mnre.gov.in/solar/schemes/',
        deadlineDate: new Date('2026-08-31'),
        status: 'ACTIVE',
        isFeatured: true,
      },
      {
        id: 'scheme-kisan-002',
        title: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN DBT)',
        category: 'FINANCE',
        ministry: 'Ministry of Agriculture & Farmers Welfare',
        benefitAmount: '₹6,000 / Year (₹2,000 every 4 months)',
        summary: 'Direct income support of ₹6,000 per year transferred into Aadhaar-seeded bank accounts across three equal installments.',
        details: 'Disbursed directly via DBT without middlemen. Verification done against digital land records (Bhoomi / Jamabandi).',
        eligibilityCriteria: 'All landholding farmer families with cultivable land. Excludes institutional landholders and income tax payees.',
        maxLandAcreage: null,
        applicableStates: 'ALL',
        applicationUrl: 'https://pmkisan.gov.in',
        officialCircularUrl: 'https://pmkisan.gov.in/Documents.aspx',
        deadlineDate: null,
        status: 'ACTIVE',
        isFeatured: true,
      },
      {
        id: 'scheme-pmfby-003',
        title: 'Pradhan Mantri Fasal Bima Yojana (PMFBY Comprehensive Crop Insurance)',
        category: 'INSURANCE',
        ministry: 'Ministry of Agriculture & Farmers Welfare',
        benefitAmount: 'Up to 100% Insured Value Coverage',
        summary: 'Lowest premium insurance coverage (1.5% Rabi, 2% Kharif) shielding farmers against yield losses from drought, floods, pest attacks, and post-harvest unseasonal rains.',
        details: 'Automatic coverage through KCC banks and CSC centers. Satellite and drone based crop cutting experiments determine payout triggers.',
        eligibilityCriteria: 'All sharecroppers and tenant farmers growing notified crops in notified areas are eligible.',
        maxLandAcreage: null,
        applicableStates: 'ALL',
        applicationUrl: 'https://pmfby.gov.in',
        officialCircularUrl: 'https://pmfby.gov.in/guidelines',
        deadlineDate: new Date('2026-07-31'),
        status: 'ACTIVE',
        isFeatured: true,
      },
      {
        id: 'scheme-smam-004',
        title: 'Sub-Mission on Agricultural Mechanization (SMAM Machinery Subsidy)',
        category: 'MACHINERY',
        ministry: 'Department of Agriculture & Cooperation',
        benefitAmount: '50% to 80% Subsidy on Modern Farm Equipment',
        summary: 'Financial assistance for procurement of tractors, Happy Seeders, Super Seeders, Mulchers, laser land levelers, and custom hiring centers.',
        details: 'Promotes residue management and stubble burning prevention with high subsidies for SC/ST, small, and women farmers.',
        eligibilityCriteria: 'Registered farmer on agriculture mechanization portal with valid land title.',
        maxLandAcreage: 25.0,
        applicableStates: 'Punjab, Haryana, Uttar Pradesh, Rajasthan, Madhya Pradesh',
        applicationUrl: 'https://agrimachinery.nic.in',
        officialCircularUrl: 'https://agrimachinery.nic.in/Index/Guideline',
        deadlineDate: new Date('2026-06-30'),
        status: 'NEW_AMENDMENT',
        isFeatured: false,
      },
      {
        id: 'scheme-drip-005',
        title: 'Per Drop More Crop (Micro-Irrigation & Drip Subsidy)',
        category: 'IRRIGATION',
        ministry: 'Ministry of Jal Shakti & Agriculture',
        benefitAmount: 'Up to 55% Subsidy for Drip & Sprinkler Systems',
        summary: 'Water efficiency scheme encouraging installation of drip and sprinkler irrigation technologies, maximizing yield per drop of water.',
        details: 'Subsidy credited directly to manufacturer escrow or farmer bank upon GPS field verification.',
        eligibilityCriteria: 'Farmers with assured source of irrigation water and valid land records.',
        maxLandAcreage: 12.0,
        applicableStates: 'ALL',
        applicationUrl: 'https://pmksy.gov.in',
        officialCircularUrl: 'https://pmksy.gov.in/microirrigation/',
        deadlineDate: new Date('2026-09-30'),
        status: 'CLOSING_SOON',
        isFeatured: false,
      },
    ];

    if ((prisma as any).governmentScheme?.upsert) {
      for (const s of welfareSchemes) {
        await (prisma as any).governmentScheme.upsert({
          where: { id: s.id },
          update: {},
          create: s as any,
        }).catch(() => {});
      }
    }

    logger.success('✨ Comprehensive demo data successfully seeded for all 3 dashboards!');
  } catch (err: any) {
    logger.warn('Demo seeding notice:', err.stack || err.message || err);
  }
}
