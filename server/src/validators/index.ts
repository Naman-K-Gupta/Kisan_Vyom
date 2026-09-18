import { z } from 'zod';

// ==========================================
// AUTH & USER VALIDATORS
// ==========================================

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  mobile: z.string().regex(/^[0-9]{10}$/, 'Mobile number must be a 10-digit number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  // Only FARMER can self-register. Admin & Manager accounts must be created by an existing Admin.
  role: z.enum(['FARMER']).default('FARMER'),
  state: z.string().min(2, 'State is required'),
  district: z.string().min(2, 'District is required'),
  village: z.string().min(2, 'Village/Locality is required'),
  address: z.string().optional().default(''),
  preferredLanguage: z.string().default('en'),
  landAreaTotal: z.number().nonnegative().optional().default(0),
  crops: z.array(z.string()).optional(), // Optional initial crop names/ids
});

export const loginSchema = z.object({
  identifier: z.string().min(3, 'Email or mobile number is required'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  state: z.string().min(2).optional(),
  district: z.string().min(2).optional(),
  village: z.string().min(2).optional(),
  address: z.string().min(5).optional(),
  preferredLanguage: z.string().optional(),
  bio: z.string().max(500).optional(),
  landAreaTotal: z.number().nonnegative().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export const notificationPreferenceSchema = z.object({
  inApp: z.boolean().optional(),
  sms: z.boolean().optional(),
  whatsapp: z.boolean().optional(),
  push: z.boolean().optional(),
});

// ==========================================
// CROP VALIDATORS
// ==========================================

export const createCropSchema = z.object({
  name: z.string().min(2, 'Crop name is required'),
  scientificName: z.string().optional(),
  category: z.string().default('Cereal'),
  defaultUnit: z.string().default('Quintal'),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

export const createFarmerCropSchema = z.object({
  cropId: z.string().uuid('Invalid Crop ID'),
  variety: z.string().min(2, 'Variety is required (e.g. Sharbati, Desi)'),
  landArea: z.number().positive('Land area must be greater than 0'),
  sowingDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid sowing date'),
  expectedHarvestDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid harvest date'),
  expectedProduction: z.number().positive('Expected yield must be greater than 0'),
  unit: z.string().default('Quintal'),
  status: z.enum(['PLANNED', 'SOWN', 'GROWING', 'HARVEST_READY', 'HARVESTED']).default('GROWING'),
});

export const updateFarmerCropSchema = createFarmerCropSchema.partial();

// ==========================================
// PROCUREMENT CENTRE VALIDATORS
// ==========================================

export const createCentreSchema = z.object({
  name: z.string().min(3, 'Centre name is required'),
  address: z.string().min(5, 'Address is required'),
  state: z.string().min(2, 'State is required'),
  district: z.string().min(2, 'District is required'),
  village: z.string().min(2, 'Village is required'),
  latitude: z.number().min(-90).max(90, 'Valid latitude required'),
  longitude: z.number().min(-180).max(180, 'Valid longitude required'),
  contactNumber: z.string().min(8, 'Contact number is required'),
  openingHours: z.string().default('08:00 AM - 05:00 PM'),
  totalCapacity: z.number().positive('Total capacity must be positive'),
  processingRate: z.number().positive('Processing rate must be positive'),
  status: z.enum(['OPEN', 'BUSY', 'FULL', 'CLOSED', 'TEMPORARILY_UNAVAILABLE']).default('OPEN'),
  supportedCropIds: z.array(z.string()).optional(),
  managerUserId: z.string().uuid().optional(),
});

export const updateCentreCapacitySchema = z.object({
  currentUsage: z.number().min(0, 'Current usage cannot be negative').optional(),
  totalCapacity: z.number().positive('Total capacity must be positive').optional(),
  processingRate: z.number().positive('Processing rate must be positive').optional(),
  status: z.enum(['OPEN', 'BUSY', 'FULL', 'CLOSED', 'TEMPORARILY_UNAVAILABLE']).optional(),
});

// ==========================================
// QUEUE VALIDATORS
// ==========================================

export const joinQueueSchema = z.object({
  centreId: z.string().uuid('Valid centre ID is required'),
  cropId: z.string().uuid('Valid crop ID is required'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unit: z.string().default('Quintal'),
  preferredDate: z.string().optional(),
  vehicleNumber: z.string().optional().nullable(),
  vehicleType: z.string().optional().nullable(),
});

export const completeProcurementSchema = z.object({
  actualQuantity: z.number().positive().optional(),
  grossWeight: z.number().optional().nullable(),
  tareWeight: z.number().optional().nullable(),
  moisturePercentage: z.number().min(0).max(50).optional().nullable(),
  foreignMatterPercentage: z.number().min(0).max(25).optional().nullable(),
  damagedGrainPercentage: z.number().min(0).max(25).optional().nullable(),
  qualityGrade: z.string().optional().nullable(),
  deductions: z.number().min(0).optional().nullable(),
  vehicleNumber: z.string().optional().nullable(),
  vehicleType: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const rejectConsignmentSchema = z.object({
  reason: z.string().min(3, 'Rejection reason is required'),
  moisturePercentage: z.number().optional().nullable(),
  foreignMatterPercentage: z.number().optional().nullable(),
  advisoryNote: z.string().optional().nullable(),
});

export const queueActionSchema = z.object({
  notes: z.string().optional(),
});

// ==========================================
// GOVERNMENT MSP & MARKET PRICES VALIDATORS
// ==========================================

export const createGovernmentPriceSchema = z.object({
  cropId: z.string().uuid().optional().nullable(),
  cropName: z.string().min(2, 'Crop name is required'),
  season: z.string().min(2, 'Season (Kharif/Rabi/Zaid) is required'),
  marketingYear: z.string().regex(/^\d{4}-\d{2,4}$/, 'Marketing year format e.g. 2025-26'),
  price: z.number().positive('Price must be greater than 0'),
  unit: z.string().default('Quintal'),
  effectiveFrom: z.string().refine((val) => !isNaN(Date.parse(val)), 'Valid start date required'),
  effectiveTo: z.string().optional().nullable(),
  source: z.string().default('Ministry of Agriculture & Farmers Welfare, GoI'),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

// ==========================================
// ALERT VALIDATORS
// ==========================================

export const createAlertSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  message: z.string().min(5, 'Message is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  cropId: z.string().uuid().optional().nullable(),
  location: z.string().optional().nullable(),
  startTime: z.string().optional(),
  expiryTime: z.string().refine((val) => !isNaN(Date.parse(val)), 'Valid expiry date required'),
});
