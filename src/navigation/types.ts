import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

// Auth stack
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  DoctorRegister: undefined;
  DoctorVerificationUpload: undefined;
  PharmacyRegister: undefined;
  PetStoreVerificationUpload: undefined;
  PendingApproval: undefined;
};

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;

// Root (defined before VetTab so VetTabScreenProps can reference it)
export type RootStackParamList = {
  Auth: undefined;
  Pending: undefined;
  Main: NavigatorScreenParams<VetStackParamList>;
};

// Vet tab
export type VetTabParamList = {
  VetDashboard: undefined;
  VetAppointments: undefined;
  VetMessages: undefined;
  VetMore: undefined;
};

export type VetTabScreenProps<T extends keyof VetTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<VetTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

// Vet stack: tabs + all detail screens
export type VetStackParamList = {
  VetTabs: undefined;
  VetAppointmentDetails: { appointmentId?: string };
  VetStartAppointment: { appointmentId?: string };
  VetPetRequests: undefined;
  VetClinicHours: undefined;
  VetMyPets: undefined;
  VetVaccinations: undefined;
  VetReviews: undefined;
  VetInvoices: undefined;
  VetInvoiceView: { transactionId: string };
  VetPaymentSettings: undefined;
  VetRescheduleRequests: undefined;
  Language: undefined;
  VetChatDetail: {
    conversationId: string;
    conversationType?: string;
    petOwnerId?: string;
    appointmentId?: string;
    adminId?: string;
    title?: string;
    subtitle?: string;
    peerImageUri?: string | null;
  };
  VetAdminChat: undefined;
  VetNotifications: undefined;
  VetBlogList: undefined;
  VetBlogCreate: undefined;
  VetBlogDetail: { id: string };
  VetAnnouncements: undefined;
  VetSubscription: undefined;
  VetProfileSettings: undefined;
  VetSpecialities: undefined;
  VetExperienceSettings: undefined;
  VetEducationSettings: undefined;
  VetAwardsSettings: undefined;
  VetInsuranceSettings: undefined;
  VetClinicsSettings: undefined;
  VetBusinessSettings: undefined;
  VetSocialMedia: undefined;
  VetChangePassword: undefined;
  VetPrescription: { appointmentId?: string };
  VetAddWeightRecord: { appointmentId: string; thenVaccinations?: boolean };
  VetAddVaccinations: { appointmentId: string; weightRecord?: { value: number; unit: string; date: string; notes?: string | null } };
};

// Pet Owner tab
export type PetOwnerTabParamList = {
  PetOwnerHome: undefined;
  PetOwnerAppointments: undefined;
  PetOwnerPharmacy: undefined;
  PetOwnerMessages: undefined;
  PetOwnerMore: undefined;
};

// Pharmacy stack (nested under Pet Owner Pharmacy tab – same flow as mydoctor-app)
export type PetOwnerPharmacyStackParamList = {
  PharmacyHome: undefined;
  PharmacySearch: undefined;
  PharmacyDetails: { pharmacyId: string };
  ProductCatalog: { pharmacyId?: string; sellerId?: string; category?: string };
  ProductDetails: { productId: string };
  Cart: undefined;
  Checkout: undefined;
  PaymentSuccess: undefined;
};

// Pharmacy / Parapharmacy tab (shared flow for PET_STORE and PARAPHARMACY)
export type PharmacyTabParamList = {
  PharmacyDashboard: undefined;
  PharmacyProducts: undefined;
  PharmacyOrders: undefined;
  PharmacyMore: undefined;
};

// Products stack (nested under Pharmacy Products tab)
export type PharmacyProductsStackParamList = {
  PharmacyProductList: undefined;
  PharmacyAddProduct: undefined;
  PharmacyEditProduct: { productId: string };
  PharmacyProductDetails: { productId: string };
};

// Orders stack (nested under Pharmacy Orders tab)
export type PharmacyOrdersStackParamList = {
  PharmacyOrdersList: { status?: string } | undefined;
  PharmacyOrderDetails: { orderId: string };
  PharmacyOrderStatus: { orderId: string };
};

// More stack (nested under Pharmacy More tab)
export type PharmacyMoreStackParamList = {
  PharmacyMoreScreen: undefined;
  PharmacyProfile: undefined;
  PharmacySubscription: undefined;
  PharmacyPayouts: undefined;
  PharmacyChangePassword: undefined;
  Language: undefined;
  PharmacyNotifications: undefined;
};

// Pet Owner stack: tabs + all detail screens (match VeterinaryFrontend patient routes)
export type PetOwnerStackParamList = {
  PetOwnerTabs: undefined;
  PetOwnerAppointmentDetails: { appointmentId?: string };
  PetOwnerRequestReschedule: { appointmentId?: string };
  PetOwnerRescheduleRequests: undefined;
  PetOwnerPrescription: { appointmentId?: string };
  PetOwnerVideoCall: { appointmentId?: string };
  PetOwnerFavourites: undefined;
  PetOwnerMyPets: undefined;
  PetOwnerAddPet: undefined;
  PetOwnerEditPet: { petId: string };
  PetOwnerMedicalRecords: undefined;
  PetOwnerMedicalDetails: { recordId?: string };
  PetOwnerWeightRecords: undefined;
  PetOwnerWallet: undefined;
  PetOwnerInvoices: undefined;
  PetOwnerInvoiceView: { transactionId: string };
  PetOwnerOrderHistory: undefined;
  PetOwnerOrderDetails: { orderId: string };
  PetOwnerDocuments: undefined;
  PetOwnerNotifications: undefined;
  Language: undefined;
  PetOwnerChatDetail: {
    conversationId: string;
    veterinarianId?: string;
    petOwnerId?: string;
    appointmentId?: string;
    conversationType?: string;
    title?: string;
    subtitle?: string;
    peerImageUri?: string | null;
  };
  PetOwnerClinicMap: undefined;
  PetOwnerClinicNavigation:
    | {
        clinic?: {
          name?: string;
          address?: string;
          phone?: string;
          lat?: number;
          lng?: number;
        };
      }
    | undefined;
  PetOwnerProfileSettings: undefined;
  PetOwnerChangePassword: undefined;
  PetOwnerSearch: undefined;
  PetOwnerVetProfile: { vetId: string };
  PetOwnerBooking: { vetId?: string };
  PetOwnerBookingCheckout: {
    veterinarianId: string;
    petId: string;
    appointmentDate: string;
    appointmentTime: string;
    bookingType: 'VISIT' | 'ONLINE';
    reason: string;
    petSymptoms?: string;
    timezoneOffset?: number;
  };
  PetOwnerBookingSuccess: { appointmentId: string };
  PetOwnerCart: undefined;
  PetOwnerCheckout: undefined;
  PetOwnerPaymentSuccess: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
    interface AuthParamList extends AuthStackParamList {}
    // NOTE: Do not add self-referential ParamList interfaces here.
    interface PetOwnerPharmacyParamList extends PetOwnerPharmacyStackParamList {}
    interface PharmacyProductsParamList extends PharmacyProductsStackParamList {}
    interface PharmacyOrdersParamList extends PharmacyOrdersStackParamList {}
    interface PharmacyMoreParamList extends PharmacyMoreStackParamList {}
  }
}
