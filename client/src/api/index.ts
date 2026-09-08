import { apiClient } from './client';
import {
  UserDTO,
  CropDTO,
  FarmerCropDTO,
  ProcurementCentreDTO,
  QueueTokenDTO,
  GovernmentCropPriceDTO,
  MarketPriceDTO,
  WeatherDataDTO,
  NotificationDTO,
  AlertDTO,
  SystemStatsDTO,
  AuditLogDTO,
  AIChatRequest,
  AICropRecommendationRequest,
  AICropRecommendationResponse,
  AIDiseaseDetectionResponse,
  AIIrrigationRequest,
  AIIrrigationResponse,
  AICentreRecommendationRequest,
  AICentreRecommendationResponse,
} from '@smart-farmer/shared';

export const api = {
  // Auth
  auth: {
    login: (data: any) => apiClient.post<{ success: boolean; token: string; user: UserDTO }>('/auth/login', data),
    register: (data: any) => apiClient.post<{ success: boolean; token: string; user: UserDTO }>('/auth/register', data),
    getMe: () => apiClient.get<{ success: boolean; user: UserDTO }>('/auth/me'),
    changePassword: (data: any) => apiClient.post('/auth/change-password', data),
    logout: () => apiClient.post('/auth/logout'),
  },

  // Farmer
  farmer: {
    getProfile: () => apiClient.get<{ success: boolean; farmer: UserDTO }>('/farmers/profile'),
    updateProfile: (data: any) => apiClient.put<{ success: boolean; user: UserDTO }>('/farmers/profile', data),
    uploadProfilePicture: (formData: FormData) =>
      apiClient.post<{ success: boolean; imageUrl: string }>('/farmers/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    deleteProfilePicture: () => apiClient.delete('/farmers/profile-picture'),
    updateNotificationPreferences: (data: any) => apiClient.put('/farmers/notification-preferences', data),
  },

  // Crops
  crops: {
    getAll: (params?: { category?: string; search?: string }) =>
      apiClient.get<{ success: boolean; crops: CropDTO[] }>('/crops', { params }),
    createCrop: (data: any) => apiClient.post('/crops', data),
    getFarmerCrops: () => apiClient.get<{ success: boolean; crops: FarmerCropDTO[] }>('/crops/my-crops'),
    addFarmerCrop: (data: any) => apiClient.post<{ success: boolean; crop: FarmerCropDTO }>('/crops/my-crops', data),
    updateFarmerCrop: (id: string, data: any) => apiClient.put(`/crops/my-crops/${id}`, data),
    deleteFarmerCrop: (id: string) => apiClient.delete(`/crops/my-crops/${id}`),
  },

  // Procurement Centres
  centres: {
    getAll: (params?: { state?: string; district?: string; cropId?: string; status?: string; search?: string }) =>
      apiClient.get<{ success: boolean; count: number; centres: ProcurementCentreDTO[] }>('/procurement-centres', { params }),
    getById: (id: string) =>
      apiClient.get<{ success: boolean; centre: ProcurementCentreDTO & { waitingTokens: QueueTokenDTO[]; calledTokens: QueueTokenDTO[]; processingTokens: QueueTokenDTO[] } }>(
        `/procurement-centres/${id}`
      ),
    create: (data: any) => apiClient.post('/procurement-centres', data),
    updateCapacity: (id: string, data: { currentUsage?: number; totalCapacity?: number; processingRate?: number; status?: string }) =>
      apiClient.patch(`/procurement-centres/${id}/capacity`, data),
  },

  // Digital Queue
  queue: {
    join: (data: { centreId: string; cropId: string; quantity: number; unit?: string }) =>
      apiClient.post<{ success: boolean; message: string; token: QueueTokenDTO }>('/queue/join', data),
    getMyToken: () => apiClient.get<{ success: boolean; token: QueueTokenDTO | null }>('/queue/my-token'),
    getCentreQueue: (centreId: string) =>
      apiClient.get<{ success: boolean; centre: any; queue: { waiting: QueueTokenDTO[]; called: QueueTokenDTO[]; processing: QueueTokenDTO[]; completedTodayCount: number } }>(
        `/queue/centre/${centreId}`
      ),
    callToken: (id: string) => apiClient.post(`/queue/${id}/call`),
    startProcessing: (id: string) => apiClient.post(`/queue/${id}/start`),
    completeProcurement: (id: string) => apiClient.post(`/queue/${id}/complete`),
    skipToken: (id: string) => apiClient.post(`/queue/${id}/skip`),
    cancelToken: (id: string, reason?: string) => apiClient.post(`/queue/${id}/cancel`, { reason }),
    togglePause: (centreId: string, pause: boolean) =>
      apiClient.post(`/queue/centre/${centreId}/toggle-pause`, { pause }),
  },

  // Prices
  prices: {
    getGovernmentPrices: (params?: { season?: string; marketingYear?: string; cropName?: string }) =>
      apiClient.get<{ success: boolean; count: number; prices: GovernmentCropPriceDTO[] }>('/prices/government', { params }),
    createGovernmentPrice: (data: any) => apiClient.post('/prices/government', data),
    updateGovernmentPrice: (id: string, data: any) => apiClient.put(`/prices/government/${id}`, data),
    deleteGovernmentPrice: (id: string) => apiClient.delete(`/prices/government/${id}`),
    getMarketPrices: (params?: { state?: string; district?: string; cropName?: string }) =>
      apiClient.get<{ success: boolean; source: string; count: number; records: MarketPriceDTO[]; message?: string }>('/prices/market', { params }),
  },

  // Weather
  weather: {
    get: (params?: { lat?: number; lon?: number; locationName?: string }) =>
      apiClient.get<{ success: boolean; weather: WeatherDataDTO | null; message?: string }>('/weather', { params }),
  },

  // AI Suite
  ai: {
    chat: (data: AIChatRequest) => apiClient.post<{ success: boolean; reply: string }>('/ai/chat', data),
    cropRecommendation: (data: AICropRecommendationRequest) =>
      apiClient.post<{ success: boolean; recommendation: AICropRecommendationResponse }>('/ai/crop-recommendation', data),
    diseaseDetection: (formData: FormData) =>
      apiClient.post<{ success: boolean; diagnosis: AIDiseaseDetectionResponse }>('/ai/disease-detection', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    irrigation: (data: AIIrrigationRequest) =>
      apiClient.post<{ success: boolean; advisory: AIIrrigationResponse }>('/ai/irrigation', data),
    centreRecommendation: (data: AICentreRecommendationRequest) =>
      apiClient.post<{ success: boolean; recommendation: AICentreRecommendationResponse }>('/ai/procurement-recommendation', data),
  },

  // Notifications
  notifications: {
    getAll: (params?: { unreadOnly?: boolean }) =>
      apiClient.get<{ success: boolean; count: number; unreadCount: number; notifications: NotificationDTO[] }>('/notifications', { params }),
    markAsRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),
    markAllAsRead: () => apiClient.post('/notifications/read-all'),
  },

  // Alerts
  alerts: {
    getAll: (params?: { cropId?: string; location?: string }) =>
      apiClient.get<{ success: boolean; count: number; alerts: AlertDTO[] }>('/alerts', { params }),
    create: (data: any) => apiClient.post('/alerts', data),
    delete: (id: string) => apiClient.delete(`/alerts/${id}`),
  },

  // Admin
  admin: {
    getStats: () => apiClient.get<{ success: boolean; stats: SystemStatsDTO }>('/admin/stats'),
    getFarmers: (params?: { search?: string; state?: string; district?: string; isActive?: boolean }) =>
      apiClient.get<{ success: boolean; count: number; farmers: UserDTO[] }>('/admin/farmers', { params }),
    toggleUserStatus: (userId: string, isActive: boolean) =>
      apiClient.patch(`/admin/users/${userId}/status`, { isActive }),
    getManagers: () => apiClient.get<{ success: boolean; count: number; managers: UserDTO[] }>('/admin/managers'),
    assignManager: (userId: string, centreId: string) =>
      apiClient.post('/admin/managers/assign', { userId, centreId }),
    getAuditLogs: (params?: { entity?: string; action?: string; take?: number }) =>
      apiClient.get<{ success: boolean; count: number; logs: AuditLogDTO[] }>('/admin/audit-logs', { params }),
  },
};
