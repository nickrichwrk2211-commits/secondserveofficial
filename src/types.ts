export type UserRole = 'admin' | 'restaurant' | 'ngo' | 'user';
export type UserStatus = 'active' | 'suspended';
export type VerificationStatus = 'verified' | 'pending' | 'rejected';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  verificationStatus: VerificationStatus;
  organizationName?: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
  operatingArea?: string;
  createdAt: string;
  updatedAt: string;
}

export type FoodCategory =
  | 'Bakery & Pastries'
  | 'Prepared Meals'
  | 'Fresh Produce'
  | 'Pantry & Dairy'
  | 'Beverages';

export type ListingStatus =
  | 'available'
  | 'partially_reserved'
  | 'fully_reserved'
  | 'completed'
  | 'expired'
  | 'cancelled';

export interface FoodListing {
  id: string;
  restaurantId: string;
  restaurantName: string;
  title: string;
  description: string;
  category: FoodCategory;
  photoUrl: string;
  originalQuantity: number;
  availableQuantity: number;
  unit: string;
  allergens: string[];
  storageNotes: string;
  pickupAddress: string;
  pickupStartTime: string;
  pickupEndTime: string;
  pickupInstructions: string;
  estimatedWeightKg?: number;
  status: ListingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  category: FoodCategory;
  photoUrl: string;
  allergens: string[];
  standardPortionUnit: string;
}

export type RequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'confirmed'
  | 'ready_for_pickup'
  | 'completed'
  | 'cancelled';

export interface FoodRequest {
  id: string;
  listingId: string;
  foodTitle: string;
  restaurantId: string;
  restaurantName: string;
  requesterId: string;
  requesterName: string;
  requesterRole: 'ngo' | 'user';
  requesterOrg?: string;
  requestedQuantity: number;
  unit: string;
  pickupAddress: string;
  pickupWindow: string;
  pickupCode: string;
  status: RequestStatus;
  rejectionReason?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type:
    | 'request_created'
    | 'request_approved'
    | 'request_rejected'
    | 'pickup_ready'
    | 'pickup_completed'
    | 'verification_updated'
    | 'system';
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  timestamp: string;
}

export interface PlatformStats {
  availableListingsCount: number;
  participatingRestaurantsCount: number;
  registeredNgosCount: number;
  completedPickupsCount: number;
  totalPortionsRescued: number;
  activeRequestsCount: number;
  totalKgRescued: number;
  mealsDistributed: number;
  backupMealsServed: number;
}
