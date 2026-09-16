
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  mobile: 'mobile',
  passwordHash: 'passwordHash',
  fullName: 'fullName',
  role: 'role',
  state: 'state',
  district: 'district',
  village: 'village',
  address: 'address',
  preferredLanguage: 'preferredLanguage',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.FarmerProfileScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  profilePictureUrl: 'profilePictureUrl',
  bio: 'bio',
  landAreaTotal: 'landAreaTotal',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CropScalarFieldEnum = {
  id: 'id',
  name: 'name',
  scientificName: 'scientificName',
  category: 'category',
  defaultUnit: 'defaultUnit',
  imageUrl: 'imageUrl',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.FarmerCropScalarFieldEnum = {
  id: 'id',
  farmerProfileId: 'farmerProfileId',
  cropId: 'cropId',
  variety: 'variety',
  landArea: 'landArea',
  sowingDate: 'sowingDate',
  expectedHarvestDate: 'expectedHarvestDate',
  expectedProduction: 'expectedProduction',
  unit: 'unit',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProcurementCentreScalarFieldEnum = {
  id: 'id',
  name: 'name',
  address: 'address',
  state: 'state',
  district: 'district',
  village: 'village',
  latitude: 'latitude',
  longitude: 'longitude',
  contactNumber: 'contactNumber',
  openingHours: 'openingHours',
  totalCapacity: 'totalCapacity',
  currentUsage: 'currentUsage',
  processingRate: 'processingRate',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CentreCropScalarFieldEnum = {
  id: 'id',
  centreId: 'centreId',
  cropId: 'cropId',
  maxDailyCapacity: 'maxDailyCapacity',
  isAccepting: 'isAccepting',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CentreManagerScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  centreId: 'centreId',
  assignedAt: 'assignedAt'
};

exports.Prisma.ProcurementRequestScalarFieldEnum = {
  id: 'id',
  farmerId: 'farmerId',
  centreId: 'centreId',
  cropId: 'cropId',
  quantity: 'quantity',
  unit: 'unit',
  preferredDate: 'preferredDate',
  status: 'status',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.QueueTokenScalarFieldEnum = {
  id: 'id',
  tokenNumber: 'tokenNumber',
  farmerId: 'farmerId',
  centreId: 'centreId',
  cropId: 'cropId',
  quantity: 'quantity',
  unit: 'unit',
  status: 'status',
  position: 'position',
  estimatedWaitMinutes: 'estimatedWaitMinutes',
  calledAt: 'calledAt',
  startedAt: 'startedAt',
  completedAt: 'completedAt',
  vehicleNumber: 'vehicleNumber',
  vehicleType: 'vehicleType',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  title: 'title',
  message: 'message',
  type: 'type',
  isRead: 'isRead',
  metadata: 'metadata',
  createdAt: 'createdAt'
};

exports.Prisma.NotificationPreferenceScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  inApp: 'inApp',
  sms: 'sms',
  whatsapp: 'whatsapp',
  push: 'push',
  updatedAt: 'updatedAt'
};

exports.Prisma.GovernmentCropPriceScalarFieldEnum = {
  id: 'id',
  cropId: 'cropId',
  cropName: 'cropName',
  season: 'season',
  marketingYear: 'marketingYear',
  price: 'price',
  unit: 'unit',
  effectiveFrom: 'effectiveFrom',
  effectiveTo: 'effectiveTo',
  source: 'source',
  status: 'status',
  createdById: 'createdById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MarketPriceScalarFieldEnum = {
  id: 'id',
  cropName: 'cropName',
  market: 'market',
  state: 'state',
  district: 'district',
  price: 'price',
  unit: 'unit',
  arrivalDate: 'arrivalDate',
  source: 'source',
  createdAt: 'createdAt'
};

exports.Prisma.WeatherRecordScalarFieldEnum = {
  id: 'id',
  latitude: 'latitude',
  longitude: 'longitude',
  temperature: 'temperature',
  condition: 'condition',
  humidity: 'humidity',
  windSpeed: 'windSpeed',
  rainProbability: 'rainProbability',
  recordedAt: 'recordedAt'
};

exports.Prisma.AlertScalarFieldEnum = {
  id: 'id',
  title: 'title',
  message: 'message',
  priority: 'priority',
  cropId: 'cropId',
  location: 'location',
  isPublished: 'isPublished',
  startTime: 'startTime',
  expiryTime: 'expiryTime',
  createdById: 'createdById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AuditLogScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  role: 'role',
  action: 'action',
  entity: 'entity',
  entityId: 'entityId',
  previousValue: 'previousValue',
  newValue: 'newValue',
  ipAddress: 'ipAddress',
  createdAt: 'createdAt'
};

exports.Prisma.PushSubscriptionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  endpoint: 'endpoint',
  p256dh: 'p256dh',
  auth: 'auth',
  createdAt: 'createdAt'
};

exports.Prisma.PaymentScalarFieldEnum = {
  id: 'id',
  paymentNumber: 'paymentNumber',
  farmerId: 'farmerId',
  centreId: 'centreId',
  cropId: 'cropId',
  queueTokenId: 'queueTokenId',
  procurementRequestId: 'procurementRequestId',
  quantity: 'quantity',
  unit: 'unit',
  ratePerUnit: 'ratePerUnit',
  grossAmount: 'grossAmount',
  deductions: 'deductions',
  netAmount: 'netAmount',
  status: 'status',
  paymentMethod: 'paymentMethod',
  utrNumber: 'utrNumber',
  bankName: 'bankName',
  accountNumberMasked: 'accountNumberMasked',
  ifscCode: 'ifscCode',
  qualityGrade: 'qualityGrade',
  vehicleNumber: 'vehicleNumber',
  paidAt: 'paidAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};


exports.Prisma.ModelName = {
  User: 'User',
  FarmerProfile: 'FarmerProfile',
  Crop: 'Crop',
  FarmerCrop: 'FarmerCrop',
  ProcurementCentre: 'ProcurementCentre',
  CentreCrop: 'CentreCrop',
  CentreManager: 'CentreManager',
  ProcurementRequest: 'ProcurementRequest',
  QueueToken: 'QueueToken',
  Notification: 'Notification',
  NotificationPreference: 'NotificationPreference',
  GovernmentCropPrice: 'GovernmentCropPrice',
  MarketPrice: 'MarketPrice',
  WeatherRecord: 'WeatherRecord',
  Alert: 'Alert',
  AuditLog: 'AuditLog',
  PushSubscription: 'PushSubscription',
  Payment: 'Payment'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
