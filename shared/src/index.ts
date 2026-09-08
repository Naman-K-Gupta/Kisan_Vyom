// =========================================================
// ENUMS & CONSTANTS
// =========================================================

export enum UserRole {
  FARMER = 'FARMER',
  PROCUREMENT_CENTRE_MANAGER = 'PROCUREMENT_CENTRE_MANAGER',
  ADMIN = 'ADMIN',
}

export enum QueueStatus {
  WAITING = 'WAITING',
  CALLED = 'CALLED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
  CANCELLED = 'CANCELLED',
}

export enum CentreStatus {
  OPEN = 'OPEN',
  BUSY = 'BUSY',
  FULL = 'FULL',
  CLOSED = 'CLOSED',
  TEMPORARILY_UNAVAILABLE = 'TEMPORARILY_UNAVAILABLE',
}

export enum ProcurementRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export enum CropGrowthStatus {
  PLANNED = 'PLANNED',
  SOWN = 'SOWN',
  GROWING = 'GROWING',
  HARVEST_READY = 'HARVEST_READY',
  HARVESTED = 'HARVESTED',
}

export enum AlertPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum NotificationType {
  TOKEN_GENERATED = 'TOKEN_GENERATED',
  QUEUE_POSITION_CHANGED = 'QUEUE_POSITION_CHANGED',
  TURN_APPROACHING = 'TURN_APPROACHING',
  TOKEN_CALLED = 'TOKEN_CALLED',
  PROCESSING_STARTED = 'PROCESSING_STARTED',
  PROCUREMENT_COMPLETED = 'PROCUREMENT_COMPLETED',
  TOKEN_SKIPPED = 'TOKEN_SKIPPED',
  TOKEN_CANCELLED = 'TOKEN_CANCELLED',
  CENTRE_UNAVAILABLE = 'CENTRE_UNAVAILABLE',
  CENTRE_REOPENED = 'CENTRE_REOPENED',
  AGRICULTURAL_ALERT = 'AGRICULTURAL_ALERT',
  SYSTEM_NOTIFICATION = 'SYSTEM_NOTIFICATION',
}

export const SOCKET_EVENTS = {
  // Queue events
  QUEUE_JOINED: 'queue:joined',
  QUEUE_UPDATED: 'queue:updated',
  QUEUE_CALLED: 'queue:called',
  QUEUE_PROCESSING: 'queue:processing',
  QUEUE_COMPLETED: 'queue:completed',
  QUEUE_SKIPPED: 'queue:skipped',
  QUEUE_CANCELLED: 'queue:cancelled',
  
  // Centre events
  CENTRE_CAPACITY_UPDATED: 'centre:capacityUpdated',
  CENTRE_STATUS_UPDATED: 'centre:statusUpdated',
  
  // Notification events
  NOTIFICATION_NEW: 'notification:new',
} as const;

// =========================================================
// DATA MODELS / INTERFACES
// =========================================================

export interface UserDTO {
  id: string;
  email: string;
  mobile: string;
  fullName: string;
  role: UserRole;
  state: string;
  district: string;
  village: string;
  address: string;
  preferredLanguage: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  farmerProfile?: FarmerProfileDTO;
  notificationPreference?: NotificationPreferenceDTO;
  managedCentres?: string[];
}

export interface FarmerProfileDTO {
  id: string;
  userId: string;
  profilePictureUrl?: string | null;
  bio?: string | null;
  landAreaTotal: number;
  notificationPreferences?: NotificationPreferenceDTO;
}

export interface NotificationPreferenceDTO {
  id: string;
  userId: string;
  inApp: boolean;
  sms: boolean;
  whatsapp: boolean;
  push: boolean;
}

export interface CropDTO {
  id: string;
  name: string;
  scientificName?: string | null;
  category: string;
  defaultUnit: string;
  imageUrl?: string | null;
  isActive: boolean;
}

export interface FarmerCropDTO {
  id: string;
  farmerProfileId: string;
  cropId: string;
  crop?: CropDTO;
  variety: string;
  landArea: number;
  sowingDate: string;
  expectedHarvestDate: string;
  expectedProduction: number;
  unit: string;
  status: CropGrowthStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProcurementCentreDTO {
  id: string;
  name: string;
  address: string;
  state: string;
  district: string;
  village: string;
  latitude: number;
  longitude: number;
  contactNumber: string;
  openingHours: string;
  totalCapacity: number;
  currentUsage: number;
  remainingCapacity: number;
  processingRate: number; // e.g. quintals/hour or farmers/hour
  status: CentreStatus;
  supportedCrops?: CentreCropDTO[];
  waitingTokensCount?: number;
  currentlyProcessingToken?: QueueTokenDTO | null;
  createdAt: string;
  updatedAt: string;
}

export interface CentreCropDTO {
  id: string;
  centreId: string;
  cropId: string;
  crop?: CropDTO;
  maxDailyCapacity: number;
  isAccepting: boolean;
}

export interface QueueTokenDTO {
  id: string;
  tokenNumber: string;
  farmerId: string;
  farmer?: {
    id: string;
    fullName: string;
    mobile: string;
    village: string;
  };
  centreId: string;
  centre?: {
    id: string;
    name: string;
    address: string;
    status: CentreStatus;
  };
  cropId: string;
  crop?: CropDTO;
  quantity: number;
  unit: string;
  status: QueueStatus;
  position: number;
  farmersAhead: number;
  estimatedWaitMinutes: number;
  calledAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProcurementRequestDTO {
  id: string;
  farmerId: string;
  centreId: string;
  cropId: string;
  crop?: CropDTO;
  centre?: ProcurementCentreDTO;
  quantity: number;
  unit: string;
  preferredDate: string;
  status: ProcurementRequestStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GovernmentCropPriceDTO {
  id: string;
  cropId?: string | null;
  cropName: string;
  season: string;
  marketingYear: string;
  price: number;
  unit: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  source: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface MarketPriceDTO {
  id: string;
  cropName: string;
  market: string;
  state: string;
  district: string;
  price: number;
  unit: string;
  arrivalDate: string;
  source: string;
}

export interface WeatherDataDTO {
  latitude: number;
  longitude: number;
  locationName?: string;
  current: {
    temperature: number;
    weatherCode: number;
    condition: string;
    humidity: number;
    windSpeed: number;
    rainProbability: number;
    isDay: boolean;
  };
  daily: Array<{
    date: string;
    maxTemp: number;
    minTemp: number;
    condition: string;
    rainProbability: number;
    weatherCode: number;
  }>;
}

export interface NotificationDTO {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface AlertDTO {
  id: string;
  title: string;
  message: string;
  priority: AlertPriority;
  cropId?: string | null;
  crop?: CropDTO;
  location?: string | null;
  isPublished: boolean;
  startTime: string;
  expiryTime: string;
  createdAt: string;
}

export interface AuditLogDTO {
  id: string;
  userId: string;
  user?: {
    fullName: string;
    email: string;
    role: UserRole;
  };
  role: string;
  action: string;
  entity: string;
  entityId: string;
  previousValue?: string | null;
  newValue?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

export interface SystemStatsDTO {
  totalFarmers: number;
  activeFarmers: number;
  totalCentres: number;
  activeCentres: number;
  activeQueueTokens: number;
  pendingProcurementRequests: number;
  completedProcurements: number;
  averageCapacityUtilization: number;
  unreadNotifications: number;
}

// =========================================================
// AI REQUEST & RESPONSE DTOs
// =========================================================

export interface AIChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIChatRequest {
  messages: AIChatMessage[];
  location?: { latitude: number; longitude: number; state?: string; district?: string };
}

export interface AICropRecommendationRequest {
  state: string;
  district: string;
  season: string;
  soilType: string;
  waterAvailability: string;
  landAreaAcres: number;
  previousCrop?: string;
}

export interface AICropRecommendationResponse {
  recommendedCrops: Array<{
    cropName: string;
    suitabilityScore: number; // 0-100
    reason: string;
    expectedYield: string;
    estimatedRevenuePerAcre: string;
    waterRequirement: string;
    riskFactors: string[];
  }>;
  generalAdvisory: string;
  disclaimer: string;
}

export interface AIDiseaseDetectionResponse {
  diseaseName: string;
  isHealthy: boolean;
  confidence: number;
  symptoms: string[];
  suggestedActions: string[];
  organicRemedy?: string;
  chemicalRemedy?: string;
  preventiveMeasures: string[];
  expertConsultationAdvice: string;
  disclaimer: string;
}

export interface AIIrrigationRequest {
  cropName: string;
  growthStage: string;
  soilType: string;
  lastWateredDate?: string;
  location?: { latitude: number; longitude: number; district?: string };
}

export interface AIIrrigationResponse {
  recommendation: 'IRRIGATE_NOW' | 'DELAY_IRRIGATION' | 'MONITOR_CLOSELY';
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  advisory: string;
  rainForecastSummary: string;
  recommendedWaterVolume: string;
  nextCheckDate: string;
  disclaimer: string;
}

export interface AICentreRecommendationRequest {
  cropName: string;
  quantityQuintals: number;
  farmerLatitude: number;
  farmerLongitude: number;
}

export interface AICentreRecommendationResponse {
  bestCentreId: string;
  centreName: string;
  distanceKm: number;
  queueWaitMinutes: number;
  availableCapacityPercent: number;
  reason: string;
  alternatives: Array<{
    centreId: string;
    centreName: string;
    distanceKm: number;
    queueWaitMinutes: number;
    availableCapacityPercent: number;
  }>;
}
