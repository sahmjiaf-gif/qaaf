
export type OrderStatus = 'pending' | 'approved' | 'shipped' | 'delivered' | 'cancelled';

export interface Category {
  id: string;
  name: string;
  type: string; // e.g., 'skincare', 'haircare'
  image: string;
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string; // Keep for backward compatibility/display
  categoryId?: string; // Link to the new Category object
  price: number;
  image: string;
  description: string;
  inStock: boolean;
  stock?: number;
  reserved?: number;
  minStock?: number;
  barcode?: string;
  isOnSale?: boolean;
  salePrice?: number;
  saleExpiry?: string;
  sizes?: string[]; // Array of size variants, e.g. ["S", "M", "L"]
  colors?: string[]; // Array of color variants, e.g. ["Red", "Black"]
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface Order {
  id: string;
  customerName: string;
  phoneNumber: string;
  governorate?: string;
  city?: string;
  address: string;
  landmark: string;
  products: CartItem[];
  status: OrderStatus;
  date: string;
  promoCode?: string;
  discountAmount?: number;
  shippingFee?: number;
  finalTotal?: number;
  cancelledByCustomer?: boolean;
  cancellationReason?: string;
  assignedTo?: string;
  flashOfferApplied?: boolean;
  invoiceBase64?: string;
  waNotified?: boolean;
  paymentMethod?: 'cash_on_delivery' | 'vodafone_cash';
  paymentStatus?: 'required' | 'pending' | 'confirmed';
  paymentSenderPhone?: string;
  shippingFeePaid?: boolean;
  shippingPaymentNote?: string;
}

export interface SliderItem {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  mobileImage?: string;
  vPos?: 'top' | 'center' | 'bottom';
  hPos?: 'right' | 'center' | 'left';
  buttonVPos?: 'top' | 'bottom';
  buttonHPos?: 'right' | 'center' | 'left';
  fontSize?: number;
}

export interface SocialPost {
  id: string;
  text: string;
  image?: string;
  platforms: string[];
  createdAt: string;
  status: 'published' | 'failed' | 'pending';
}

export interface ShippingGovernorate {
  id: string;
  name: string;
  fee: number;
  deliveryDays: string; // e.g. "1-3 أيام"
}

export interface ShippingProofRecord {
  id: string;
  customerName: string;
  phone: string;
  senderPhone: string;
  amount: number;
  orderId?: string;
  smsText?: string;
  imageUrl?: string;
  createdAt: string;
  status: 'pending' | 'confirmed';
  note?: string;
}

export interface BrandingConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  logoImage: string;
  logoSize?: number;
  aboutTitle: string;
  aboutDescription: string;
  aboutImage: string;
  aboutImages?: string[];
  consultationImage?: string;
  slider: SliderItem[];
  categories?: Category[]; // New field for categories
  customTranslations?: any;
  arabicFont?: string;
  englishFont?: string;
  shippingConfig?: ShippingGovernorate[]; // New field for shipping by governorate
  socialLinks: {
    facebook: string;
    instagram: string;
    whatsapp: string;
    tiktok: string;
  };
  contactNumber: string;
  footerTextAr: string;
  footerTextEn: string;
  connectedAccounts?: {
    facebook?: boolean;
    instagram?: boolean;
    whatsapp?: boolean;
    tiktok?: boolean;
  };
  templateId: string;
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  headerStyle: 'transparent' | 'solid' | 'minimal';
  cardStyle: 'classic' | 'modern' | 'minimal' | 'bold';
  heroLayout: 'center' | 'split' | 'minimal' | 'magazine';
  invoiceStyle?: 'minimal' | 'classic' | 'modern';
  productGridLayout: 'standard' | 'compact' | 'masonry';
  aboutLayout: 'standard' | 'reversed' | 'minimal';
  productDetailLayout: 'standard' | 'reversed' | 'stacked';
  socialPosts?: SocialPost[];
  offers?: Offer[];
  shippingFees?: Record<string, number>;
  showTotalOrdersStat?: boolean;
  totalOrdersCount?: number;
  maintenanceMode?: boolean;
  flashLimitOffer?: FlashLimitOffer;
  greenApiInstanceId?: string;
  greenApiToken?: string;
  adminWhatsappNumber?: string;
  adminWhatsappNumbers?: string[];
  whatsappNumbersWithStaff?: Record<string, string>; // staffId -> phone number
  whatsAppServiceType?: 'green_api' | 'local_free';
  whatsAppCustomerTemplate?: string;
  storeUrl?: string;
}

export interface FlashLimitOffer {
  isActive: boolean;
  type: 'free_shipping' | 'percentage' | 'fixed';
  value: number;
  totalLimit: number;
  currentCount: number;
  messageAr: string;
  messageEn: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  headerStyle: 'transparent' | 'solid' | 'minimal';
  cardStyle: 'classic' | 'modern' | 'minimal' | 'bold';
  heroLayout: 'center' | 'split' | 'minimal' | 'magazine';
  productGridLayout: 'standard' | 'compact' | 'masonry';
  aboutLayout: 'standard' | 'reversed' | 'minimal';
  productDetailLayout: 'standard' | 'reversed' | 'stacked';
  heroTitle?: string;
  heroSubtitle?: string;
  aboutTitle?: string;
  aboutDescription?: string;
  accentColor?: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discount: number;
  expiryDate: string;
  isActive: boolean;
}

export interface AdminCredentials {
  username: string;
  password: string;
  email: string;
  phone: string;
}

export interface ManufacturingRequest {
  id: string;
  productName: string;
  productImage?: string;
  quantity: number;
  type: 'existing' | 'new';
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: string;
  requesterName: string;
}

export interface SalaryRecord {
  id: string;
  employeeName: string;
  amount: number;
  date: string; // ISO string for full precision
  type: 'salary' | 'loan';
  createdAt: string;
  deletedAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  totalSpent: number;
  ordersCount: number;
  lastOrderDate: string;
  customerType: 'new' | 'loyal' | 'vip';
  notes?: string;
}

export interface Consultation {
  id: string;
  customerName: string;
  customerPhone: string;
  age?: number;
  skinType?: string;
  concern: string;
  status: 'pending' | 'replied';
  reply?: string;
  repliedAt?: string;
  createdAt: string;
}

export interface Offer {
  id: string;
  productName: string;
  productType: string;
  productId?: string;
  originalPrice: number;
  salePrice: number;
  image: string;
  expiryDate: string; // ISO date string for countdown
  isActive: boolean;
  stock?: number;
}

export interface Review {
  id: string;
  customerName: string;
  rating: number; // 1-5
  comment: string;
  date: string;
  isApproved: boolean;
}

export type Permission = 'dashboard' | 'customer-stats' | 'orders' | 'invoices' | 'products' | 'promo-codes' | 'appearance' | 'social' | 'manufacturing' | 'manufacturing-reception' | 'salaries' | 'settings' | 'shipping-fees' | 'team' | 'crm' | 'inventory' | 'consultations' | 'reports' | 'reviews' | 'support';

export interface SupportMessage {
  id: string;
  sender: 'customer' | 'agent' | 'system';
  text: string;
  imageUrl?: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  customerName: string;
  phone: string;
  message: string;
  imageUrl?: string;
  status: 'new' | 'waiting' | 'assigned' | 'resolved';
  isOpen?: boolean;
  isClosed?: boolean;
  closedBy?: 'customer' | 'agent' | 'system';
  assignedStaffId?: string;
  orderId?: string;
  orderMatch?: 'matched' | 'pending' | 'none';
  customerIntent?: 'shipping_fee' | 'payment_confirmation' | 'order_status' | 'general';
  botStep?: 'ask_shipping_fee' | 'ask_paid' | 'await_transfer_proof' | 'route_to_agent' | 'queue_wait' | 'payment_verified' | 'completed';
  queuePosition?: number;
  waitingCount?: number;
  availableStaffCount?: number;
  createdAt: string;
  updatedAt: string;
  messages: SupportMessage[];
}

export interface AttendanceRecord {
  startTime: string;
  lastPing: string;
  totalAwaySeconds: number;
  totalActiveSeconds: number;
  shiftHours: number;
  shiftStart?: string;
  shiftEnd?: string;
}

export interface StaffMember {
  id: string;
  username: string;
  password: string;
  email?: string;
  phone?: string;
  permissions: Permission[];
  isOnline: boolean;
  lastActive?: string;
  offlineTimeoutMinutes?: number;
  shiftHours?: number;
  shiftStart?: string;
  shiftEnd?: string;
  attendance?: Record<string, AttendanceRecord>;
}
