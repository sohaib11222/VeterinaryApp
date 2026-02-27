/**
 * Veterinary Backend API route paths (mirrors VeterinaryFrontend apiConfig).
 * All paths are relative to API_BASE_URL (e.g. http://localhost:5000/api).
 */

export const API_ROUTES = {
  HEALTH: '/health',

  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    CHANGE_PASSWORD: '/auth/change-password',
    REFRESH_TOKEN: '/auth/refresh-token',
    FORGOT_PASSWORD: '/auth/forgot-password',
    VERIFY_RESET_CODE: '/auth/verify-reset-code',
    RESET_PASSWORD: '/auth/reset-password',
    SEND_PHONE_OTP: '/auth/phone-otp/send',
    VERIFY_PHONE_OTP: '/auth/phone-otp/verify',
    APPROVE_VETERINARIAN: '/auth/approve-veterinarian',
    REJECT_VETERINARIAN: '/auth/reject-veterinarian',
    APPROVE_PET_STORE: '/auth/approve-pet-store',
    REJECT_PET_STORE: '/auth/reject-pet-store',
  },

  USERS: {
    ME: '/users/me',
    PROFILE: '/users/profile',
    GET: (id: string) => `/users/${id}`,
  },

  MAPPING: {
    BASE: '/mapping',
    ROUTE: '/mapping/route',
    NEARBY: '/mapping/nearby',
    CLINICS: '/mapping/clinics',
    CLINIC: (id: string) => `/mapping/clinic/${id}`,
  },

  PET_OWNER: {
    DASHBOARD: '/pet-owners/dashboard',
    APPOINTMENTS: '/pet-owners/appointments',
    PAYMENTS: '/pet-owners/payments',
  },

  MEDICAL_RECORDS: {
    LIST: '/medical-records',
    GET: (id: string) => `/medical-records/${id}`,
    CREATE: '/medical-records',
    DELETE: (id: string) => `/medical-records/${id}`,
  },

  UPLOAD: {
    VETERINARIAN_DOCS: '/upload/veterinarian-docs',
    PET_STORE_DOCS: '/upload/pet-store-docs',
    PET_STORE: '/upload/pet-store',
    PRODUCT: '/upload/product',
    PET: '/upload/pet',
    PROFILE: '/upload/profile',
    MEDICAL_RECORDS: '/upload/medical-records',
    CHAT: '/upload/chat',
    CHAT_MULTIPLE: '/upload/chat/multiple',
  },

  APPOINTMENTS: {
    BASE: '/appointments',
    LIST: '/appointments',
    CREATE: '/appointments',
    GET: (id: string) => `/appointments/${id}`,
    ACCEPT: (id: string) => `/appointments/${id}/accept`,
    REJECT: (id: string) => `/appointments/${id}/reject`,
    CANCEL: (id: string) => `/appointments/${id}/cancel`,
    COMPLETE: (id: string) => `/appointments/${id}/complete`,
    UPDATE_STATUS: (id: string) => `/appointments/${id}/status`,
  },

  WEEKLY_SCHEDULE: {
    BASE: '/weekly-schedule',
    LIST: '/weekly-schedule',
    SLOTS: '/weekly-schedule/slots',
  },

  RESCHEDULE_REQUEST: {
    BASE: '/reschedule-request',
    LIST: '/reschedule-request',
    CREATE: '/reschedule-request',
    GET: (id: string) => `/reschedule-request/${id}`,
    APPROVE: (id: string) => `/reschedule-request/${id}/approve`,
    REJECT: (id: string) => `/reschedule-request/${id}/reject`,
    PAY: (id: string) => `/reschedule-request/${id}/pay`,
    ELIGIBLE_APPOINTMENTS: '/reschedule-request/eligible-appointments',
  },

  VACCINES: {
    BASE: '/vaccines',
    LIST: '/vaccines',
  },

  WEIGHT_RECORDS: {
    BASE: '/weight-records',
    LIST: '/weight-records',
    CREATE: '/weight-records',
    GET: (id: string) => `/weight-records/${id}`,
    UPDATE: (id: string) => `/weight-records/${id}`,
    DELETE: (id: string) => `/weight-records/${id}`,
  },

  VACCINATIONS: {
    BASE: '/vaccinations',
    LIST: '/vaccinations',
    CREATE: '/vaccinations',
    UPDATE: (id: string) => `/vaccinations/${id}`,
    DELETE: (id: string) => `/vaccinations/${id}`,
    UPCOMING: '/vaccinations/upcoming',
  },

  PRESCRIPTIONS: {
    BASE: '/prescriptions',
    LIST_MINE: '/prescriptions',
    BY_APPOINTMENT: (appointmentId: string) => `/prescriptions/appointment/${appointmentId}`,
    UPSERT_FOR_APPOINTMENT: (appointmentId: string) => `/prescriptions/appointment/${appointmentId}`,
    GET: (id: string) => `/prescriptions/${id}`,
    PDF: (id: string) => `/prescriptions/${id}/pdf`,
  },

  REVIEWS: {
    BASE: '/reviews',
    CREATE: '/reviews',
    BY_VETERINARIAN: (veterinarianId: string) => `/reviews/veterinarian/${veterinarianId}`,
    MY_APPOINTMENT_REVIEW: (appointmentId: string) => `/reviews/appointment/${appointmentId}/mine`,
  },

  PETS: {
    BASE: '/pets',
    LIST: '/pets',
    CREATE: '/pets',
    GET: (id: string) => `/pets/${id}`,
    UPDATE: (id: string) => `/pets/${id}`,
    DELETE: (id: string) => `/pets/${id}`,
  },

  VETERINARIANS: {
    LIST: '/veterinarians',
    DASHBOARD: '/veterinarians/dashboard',
    PROFILE: '/veterinarians/profile',
    PUBLIC_PROFILE: (id: string) => `/veterinarians/${id}`,
    REVIEWS: '/veterinarians/reviews',
    INVOICES: '/veterinarians/invoices',
    INVOICE: (transactionId: string) => `/veterinarians/invoices/${transactionId}`,
  },

  SPECIALIZATIONS: {
    LIST: '/specializations',
  },

  INSURANCE: {
    LIST: '/insurance',
  },

  FAVORITE: {
    BASE: '/favorite',
    LIST: (petOwnerId: string) => `/favorite/${petOwnerId}`,
    ADD: '/favorite',
    REMOVE: (id: string) => `/favorite/${id}`,
  },

  AVAILABILITY: {
    BASE: '/availability',
    SLOTS: '/availability/slots',
  },

  PAYMENT: {
    PROCESS_APPOINTMENT: '/payment/appointment',
    TRANSACTION: (id: string) => `/payment/transaction/${id}`,
  },

  BALANCE: {
    GET: '/balance',
    WITHDRAW_REQUESTS: '/balance/withdraw/requests',
    WITHDRAW_REQUEST: '/balance/withdraw/request',
  },

  CHAT: {
    CONVERSATIONS: '/chat/conversations',
    CONVERSATION: '/chat/conversation',
    MESSAGES: (conversationId: string) => `/chat/messages/${conversationId}`,
    SEND: '/chat/send',
    MARK_READ: (conversationId: string) => `/chat/conversations/${conversationId}/read`,
    UNREAD_COUNT: '/chat/unread-count',
  },

  VIDEO: {
    CREATE: '/video/create',
    END: '/video/end',
    BY_APPOINTMENT: (appointmentId: string) => `/video/appointment/${appointmentId}`,
  },

  NOTIFICATIONS: {
    LIST: '/notifications',
    UNREAD_COUNT: '/notifications/unread-count',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    READ_ALL: '/notifications/read-all',
  },

  SUBSCRIPTION_PLANS: {
    LIST: '/subscription-plans',
    ACTIVE: '/subscription-plans/active',
    GET: (id: string) => `/subscription-plans/${id}`,
  },

  SUBSCRIPTIONS: {
    MY_SUBSCRIPTION: '/subscriptions/my-subscription',
    PURCHASE: '/subscriptions/purchase',
  },

  ANNOUNCEMENTS: {
    BASE: '/announcements',
    VETERINARIAN_LIST: '/announcements/veterinarian',
    UNREAD_COUNT: '/announcements/unread-count',
    GET: (id: string) => `/announcements/${id}`,
    MARK_READ: (id: string) => `/announcements/${id}/read`,
  },

  PET_STORES: {
    BASE: '/pet-stores',
    LIST: '/pet-stores',
    GET: (id: string) => `/pet-stores/${id}`,
    ME: '/pet-stores/me',
    MY_SUBSCRIPTION: '/pet-stores/my-subscription',
    BUY_SUBSCRIPTION: '/pet-stores/buy-subscription',
    CREATE: '/pet-stores',
    UPDATE: (id: string) => `/pet-stores/${id}`,
  },

  PRODUCTS: {
    BASE: '/products',
    LIST: '/products',
    MINE: '/products/mine',
    GET: (id: string) => `/products/${id}`,
    CREATE: '/products',
    UPDATE: (id: string) => `/products/${id}`,
    DELETE: (id: string) => `/products/${id}`,
  },

  ORDERS: {
    BASE: '/orders',
    LIST: '/orders',
    CREATE: '/orders',
    GET: (id: string) => `/orders/${id}`,
    UPDATE_STATUS: (id: string) => `/orders/${id}/status`,
    UPDATE_SHIPPING: (id: string) => `/orders/${id}/shipping`,
    PAY: (id: string) => `/orders/${id}/pay`,
    CANCEL: (id: string) => `/orders/${id}/cancel`,
  },
} as const;
