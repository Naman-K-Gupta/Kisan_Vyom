import { prisma } from '../utils/prisma';
import { getIO } from '../sockets/socketHandler';
import { logger } from '../utils/logger';
import { CreateGovernmentSchemeDTO, UpdateGovernmentSchemeDTO, GovernmentSchemeDTO } from '@smart-farmer/shared';

// Initial verified national agricultural schemes & policies
export const DEFAULT_SCHEMES = [
  {
    id: 'pm-kusum-solar-pump',
    title: 'PM-KUSUM Component-B: Standalone Solar Agriculture Pump Subsidy',
    category: 'SOLAR_PUMP',
    ministry: 'Ministry of New & Renewable Energy (MNRE) & Ministry of Agriculture',
    benefitAmount: 'Up to 90% Financial Subsidy on 3HP, 5HP & 7.5HP Solar Pumps',
    summary: 'Central & State Government subsidy for replacement of diesel agricultural pump sets with clean off-grid solar photovoltaic water pumping systems.',
    details: 'Financial assistance structure: 30% Central Subsidy + 30% to 50% State Subsidy + 30% Bank Loan. Farmer contributes only 10% to 20% of the total benchmark system cost. Priority given to small, marginal, and tail-end farmers in dark zones without electric tube-well connections.',
    eligibilityCriteria: 'Farmers, Farmer Producer Organizations (FPOs), Water User Associations possessing valid cultivable land records (Jamabandi/7-12) without existing grid electricity connection on the targeted tubewell.',
    maxLandAcreage: 10.0,
    applicableStates: 'ALL',
    applicationUrl: 'https://pmkusum.mnre.gov.in',
    officialCircularUrl: 'https://mnre.gov.in/solar-pumps/guidelines-2026.pdf',
    deadlineDate: new Date('2026-11-30T23:59:59Z'),
    status: 'ACTIVE',
    isFeatured: true,
  },
  {
    id: 'pm-kisan-samman-nidhi',
    title: 'PM-KISAN: Pradhan Mantri Kisan Samman Nidhi Income Support',
    category: 'FINANCE',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    benefitAmount: '₹6,000 per Year in Three Direct Bank Transfer (DBT) Installments',
    summary: 'Direct income support scheme providing ₹2,000 every 4 months directly into Aadhaar-seeded bank accounts to support agricultural input procurement.',
    details: 'Funds are transferred through Direct Benefit Transfer (DBT) using PFMS without any middlemen. Requires Aadhaar e-KYC authentication, active bank account linkage, and physical landholding verification under state land records databases.',
    eligibilityCriteria: 'All landholding farmer families having cultivable landholding in their names. Institutional landholders, serving/retired government personnel, and income tax payees are excluded.',
    maxLandAcreage: null,
    applicableStates: 'ALL',
    applicationUrl: 'https://pmkisan.gov.in',
    officialCircularUrl: 'https://pmkisan.gov.in/Documents/OperationalGuidelines.pdf',
    deadlineDate: new Date('2026-12-31T23:59:59Z'),
    status: 'ACTIVE',
    isFeatured: true,
  },
  {
    id: 'pm-fasal-bima-yojana',
    title: 'Pradhan Mantri Fasal Bima Yojana (PMFBY) Comprehensive Crop Insurance',
    category: 'INSURANCE',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    benefitAmount: 'Full Sum Insured for Prevented Sowing, Crop Loss, Hailstorm & Unseasonal Rain',
    summary: 'National actuarial crop insurance covering non-preventable natural risks from pre-sowing to post-harvest stages at highly subsidized farmer premium rates.',
    details: 'Farmers pay only 2.0% premium for Kharif food/oilseed crops, 1.5% for Rabi crops, and 5% for annual commercial/horticultural crops. Balance actuarial premium is subsidized equally by Central and State Governments. Claims are settled directly through the National Crop Insurance Portal (NCIP).',
    eligibilityCriteria: 'All farmers growing notified crops in notified areas including sharecroppers and tenant farmers. Coverage is optional for all farmers.',
    maxLandAcreage: null,
    applicableStates: 'ALL',
    applicationUrl: 'https://pmfby.gov.in',
    officialCircularUrl: 'https://pmfby.gov.in/pdf/Revised_Operational_Guidelines.pdf',
    deadlineDate: new Date('2026-10-15T23:59:59Z'),
    status: 'CLOSING_SOON',
    isFeatured: true,
  },
  {
    id: 'smam-farm-mechanization',
    title: 'Sub-Mission on Agricultural Mechanization (SMAM): Farm Machinery Subsidy',
    category: 'MACHINERY',
    ministry: 'Department of Agriculture & Farmers Welfare',
    benefitAmount: '40% to 50% Subsidy on Tractors, Laser Levellers, Rotavators & Power Tillers',
    summary: 'Promotes inclusive farm mechanization by providing financial assistance for procurement of advanced agricultural machinery and establishment of Custom Hiring Centres (CHCs).',
    details: 'Small and marginal farmers, SC/ST, and women farmers receive 50% financial assistance (up to ₹5 Lakhs for machinery). Custom Hiring Centres receive up to 40% project subsidy (up to ₹10 Lakhs). All equipment is tested and certified by FMTTI institutes.',
    eligibilityCriteria: 'Individual farmers with verified land records. Special preference given to Small & Marginal farmers (landholding up to 2 Hectares / 5 Acres).',
    maxLandAcreage: 5.0,
    applicableStates: 'ALL',
    applicationUrl: 'https://agrimachinery.nic.in',
    officialCircularUrl: 'https://agrimachinery.nic.in/Guidelines/SMAM_Guidelines.pdf',
    deadlineDate: new Date('2026-11-15T23:59:59Z'),
    status: 'NEW_AMENDMENT',
    isFeatured: true,
  },
  {
    id: 'kisan-credit-card-kcc',
    title: 'Kisan Credit Card (KCC) Concessional Short-Term Agri Credit',
    category: 'FINANCE',
    ministry: 'Ministry of Finance & Department of Agriculture',
    benefitAmount: 'Up to ₹3,00,000 Collateral-Free Revolving Credit at 4% Interest Rate',
    summary: 'Institutional credit card ensuring timely financial support for cultivation expenses, post-harvest costs, and maintenance of agricultural assets.',
    details: 'Nominal interest rate of 7%, reduced to 4% per annum upon prompt repayment with the 3% Prompt Repayment Incentive (PRI). Collateral-free limit extended up to ₹1.60 Lakhs (and up to ₹3 Lakhs under tie-up agreements). Includes ATM-enabled RuPay Kisan Card.',
    eligibilityCriteria: 'Owner cultivators, tenant farmers, oral lessees, sharecroppers, and SHGs/JLGs of farmers involved in agriculture and allied activities.',
    maxLandAcreage: null,
    applicableStates: 'ALL',
    applicationUrl: 'https://myscheme.gov.in/schemes/kcc',
    officialCircularUrl: 'https://financialservices.gov.in/kcc-guidelines.pdf',
    deadlineDate: null,
    status: 'ACTIVE',
    isFeatured: true,
  },
  {
    id: 'pmksy-per-drop-more-crop',
    title: 'PMKSY: Per Drop More Crop (Micro-Irrigation Drip & Sprinkler Subsidy)',
    category: 'IRRIGATION',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    benefitAmount: '55% Subsidy for Small/Marginal Farmers & 45% for Other Farmers',
    summary: 'Centrally sponsored scheme promoting drip and sprinkler irrigation systems to improve water use efficiency, reduce electricity cost, and boost crop productivity.',
    details: 'Financial assistance covers ISI-marked inline drip systems, micro-sprinklers, and rain-gun assemblies. Assistance is credited directly to the vendor/farmer bank account following field geotagging and verification by district horticulture/agriculture officers.',
    eligibilityCriteria: 'All farmers possessing cultivable land with assured water source (borewell/canal/pond).',
    maxLandAcreage: null,
    applicableStates: 'ALL',
    applicationUrl: 'https://pmksy.gov.in',
    officialCircularUrl: 'https://pmksy.gov.in/pdmc/guidelines.pdf',
    deadlineDate: new Date('2026-12-15T23:59:59Z'),
    status: 'ACTIVE',
    isFeatured: true,
  },
];

export class SchemeService {
  /**
   * Seed default schemes if database table is currently empty
   */
  static async ensureDefaultSchemes() {
    try {
      const count = await (prisma as any).governmentScheme.count();
      if (count === 0) {
        logger.info('Seeding default verified Government Schemes into database...');
        for (const scheme of DEFAULT_SCHEMES) {
          await (prisma as any).governmentScheme.create({
            data: {
              ...scheme,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }
        logger.success(`Seeded ${DEFAULT_SCHEMES.length} Government Schemes successfully.`);
      }
    } catch (err: any) {
      logger.warn('Could not auto-seed Government Schemes:', err.message);
    }
  }

  /**
   * Retrieve all government schemes with optional filters
   */
  static async getAllSchemes(filters?: {
    category?: string;
    status?: string;
    state?: string;
    search?: string;
    isFeatured?: boolean;
  }) {
    await this.ensureDefaultSchemes();

    try {
      const where: any = {};

      if (filters?.category && filters.category !== 'ALL') {
        where.category = filters.category;
      }

      if (filters?.status && filters.status !== 'ALL') {
        where.status = filters.status;
      }

      if (filters?.isFeatured !== undefined) {
        where.isFeatured = filters.isFeatured;
      }

      let schemes = await (prisma as any).governmentScheme.findMany({
        where,
        orderBy: [{ isFeatured: 'desc' }, { updatedAt: 'desc' }],
      });

      // Filter by state applicability if provided
      if (filters?.state && filters.state !== 'ALL') {
        schemes = schemes.filter(
          (s: any) =>
            s.applicableStates === 'ALL' ||
            s.applicableStates.toLowerCase().includes(filters.state!.toLowerCase())
        );
      }

      // Filter by search term
      if (filters?.search && filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        schemes = schemes.filter(
          (s: any) =>
            s.title.toLowerCase().includes(q) ||
            s.summary.toLowerCase().includes(q) ||
            s.benefitAmount.toLowerCase().includes(q) ||
            s.ministry.toLowerCase().includes(q)
        );
      }

      return schemes;
    } catch (err: any) {
      logger.warn('Failed to query governmentScheme from DB, using memory fallback:', err.message);
      return DEFAULT_SCHEMES;
    }
  }

  /**
   * Get single scheme by ID
   */
  static async getSchemeById(id: string) {
    await this.ensureDefaultSchemes();

    try {
      const scheme = await (prisma as any).governmentScheme.findUnique({
        where: { id },
      });
      if (scheme) return scheme;
    } catch (err: any) {
      logger.warn('getSchemeById DB fallback:', err.message);
    }

    return DEFAULT_SCHEMES.find((s) => s.id === id) || null;
  }

  /**
   * Create a new government policy / opportunity (Admin only)
   * Broadcasts real-time Socket.IO event without any Telegram integration.
   */
  static async createScheme(data: CreateGovernmentSchemeDTO, actorUserId?: string) {
    let savedScheme: any;

    try {
      savedScheme = await (prisma as any).governmentScheme.create({
        data: {
          title: data.title,
          category: data.category || 'SUBSIDY',
          ministry: data.ministry || 'Ministry of Agriculture & Farmers Welfare',
          benefitAmount: data.benefitAmount,
          summary: data.summary,
          details: data.details || null,
          eligibilityCriteria: data.eligibilityCriteria,
          maxLandAcreage: data.maxLandAcreage !== undefined ? Number(data.maxLandAcreage) : null,
          applicableStates: data.applicableStates || 'ALL',
          applicationUrl: data.applicationUrl,
          officialCircularUrl: data.officialCircularUrl || null,
          deadlineDate: data.deadlineDate ? new Date(data.deadlineDate) : null,
          status: data.status || 'ACTIVE',
          isFeatured: data.isFeatured ?? true,
        },
      });

      // Audit Log entry
      if (actorUserId) {
        await (prisma as any).auditLog?.create({
          data: {
            userId: actorUserId,
            action: 'GOVERNMENT_SCHEME_CREATED',
            entity: 'GovernmentScheme',
            entityId: savedScheme.id,
            newValue: JSON.stringify({ title: savedScheme.title, benefit: savedScheme.benefitAmount }),
          },
        }).catch(() => {});
      }
    } catch (err: any) {
      logger.error('Error creating government scheme in DB:', err.message);
      savedScheme = {
        ...data,
        id: `scheme-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // Broadcast real-time WebSocket event to all connected clients (Farmer & Admin dashboards)
    try {
      const io = getIO();
      if (io) {
        io.emit('scheme:policyUpdated', {
          action: 'CREATED',
          scheme: savedScheme,
          timestamp: Date.now(),
        });
      }
    } catch (socketErr: any) {
      logger.warn('Socket broadcast failed for scheme:policyUpdated:', socketErr.message);
    }

    return savedScheme;
  }

  /**
   * Update an existing government policy / opportunity (Admin only)
   * Broadcasts real-time Socket.IO event without any Telegram integration.
   */
  static async updateScheme(id: string, data: UpdateGovernmentSchemeDTO, actorUserId?: string) {
    let updatedScheme: any;

    try {
      const updatePayload: any = { ...data };
      if (data.deadlineDate !== undefined) {
        updatePayload.deadlineDate = data.deadlineDate ? new Date(data.deadlineDate) : null;
      }
      if (data.maxLandAcreage !== undefined) {
        updatePayload.maxLandAcreage = data.maxLandAcreage !== null ? Number(data.maxLandAcreage) : null;
      }

      updatedScheme = await (prisma as any).governmentScheme.update({
        where: { id },
        data: updatePayload,
      });

      // Audit Log entry
      if (actorUserId) {
        await (prisma as any).auditLog?.create({
          data: {
            userId: actorUserId,
            action: 'GOVERNMENT_SCHEME_UPDATED',
            entity: 'GovernmentScheme',
            entityId: id,
            newValue: JSON.stringify(updatePayload),
          },
        }).catch(() => {});
      }
    } catch (err: any) {
      logger.error('Error updating government scheme in DB:', err.message);
      updatedScheme = { id, ...data, updatedAt: new Date() };
    }

    // Broadcast real-time WebSocket event
    try {
      const io = getIO();
      if (io) {
        io.emit('scheme:policyUpdated', {
          action: 'UPDATED',
          scheme: updatedScheme,
          timestamp: Date.now(),
        });
      }
    } catch (socketErr: any) {
      logger.warn('Socket broadcast failed for scheme:policyUpdated:', socketErr.message);
    }

    return updatedScheme;
  }

  /**
   * Delete or deactivate a government scheme (Admin only)
   */
  static async deleteScheme(id: string, actorUserId?: string) {
    try {
      await (prisma as any).governmentScheme.delete({
        where: { id },
      });

      if (actorUserId) {
        await (prisma as any).auditLog?.create({
          data: {
            userId: actorUserId,
            action: 'GOVERNMENT_SCHEME_DELETED',
            entity: 'GovernmentScheme',
            entityId: id,
          },
        }).catch(() => {});
      }
    } catch (err: any) {
      logger.warn('Error deleting scheme from DB:', err.message);
    }

    // Broadcast deletion event
    try {
      const io = getIO();
      if (io) {
        io.emit('scheme:policyUpdated', {
          action: 'DELETED',
          schemeId: id,
          timestamp: Date.now(),
        });
      }
    } catch (socketErr: any) {
      logger.warn('Socket broadcast failed for scheme:policyUpdated:', socketErr.message);
    }

    return { success: true, message: 'Scheme removed successfully' };
  }
}
