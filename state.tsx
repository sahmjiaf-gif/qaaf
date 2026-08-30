import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { Order, BrandingConfig, AdminCredentials, Product, SliderItem, PromoCode, StaffMember, ThemeConfig, ManufacturingRequest, SalaryRecord, CartItem, OrderStatus, Review, SupportTicket, SupportMessage } from './types';
import { translateContent } from './src/services/geminiService';
import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  setDoc, 
  query, 
  orderBy, 
  limit, 
  getDoc,
  where,
  arrayUnion
} from 'firebase/firestore';
import { THEMES } from './themes';
import { translations as defaultTranslations } from './translations';
import { ARABIC_FONTS, ENGLISH_FONTS } from './fontList';
import dbData from './db.json';

interface AppContextType {
  branding: BrandingConfig;
  setBranding: (config: BrandingConfig) => void;
  firestoreOk: boolean;
  lastRemoteUpdate: string | null;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  addOrder: (order: Order) => Promise<void>;
  updateOrderStatus: (id: string, status: OrderStatus, metadata?: Partial<Order>) => Promise<void>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  wishlist: string[];
  setWishlist: React.Dispatch<React.SetStateAction<string[]>>;
  userRating: number | null;
  setUserRating: (rating: number) => void;
  adminAuth: AdminCredentials;
  setAdminAuth: (auth: AdminCredentials) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (val: boolean) => void;
  language: 'ar' | 'en';
  setLanguage: (lang: 'ar' | 'en') => void;
  isTranslating: boolean;
  promoCodes: PromoCode[];
  setPromoCodes: React.Dispatch<React.SetStateAction<PromoCode[]>>;
  validatePromoCode: (code: string) => PromoCode | null;
  appliedPromo: PromoCode | null;
  setAppliedPromo: (promo: PromoCode | null) => void;
  staff: StaffMember[];
  setStaff: React.Dispatch<React.SetStateAction<StaffMember[]>>;
  addStaff: (member: StaffMember) => Promise<void>;
  updateStaff: (member: StaffMember) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  currentStaff: StaffMember | null;
  setCurrentStaff: (staff: StaffMember | null) => void;
  staffLogin: (staffId: string) => void;
  theme: ThemeConfig;
  resetBranding: () => void;
  deleteOrder: (id: string) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  manufacturingRequests: ManufacturingRequest[];
  setManufacturingRequests: React.Dispatch<React.SetStateAction<ManufacturingRequest[]>>;
  addManufacturingRequest: (req: ManufacturingRequest) => Promise<void>;
  updateManufacturingRequest: (id: string, data: Partial<ManufacturingRequest>) => Promise<void>;
  deleteManufacturingRequest: (id: string) => Promise<void>;
  salaryRecords: SalaryRecord[];
  setSalaryRecords: React.Dispatch<React.SetStateAction<SalaryRecord[]>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  consultations: Consultation[];
  setConsultations: React.Dispatch<React.SetStateAction<Consultation[]>>;
  supportTickets: SupportTicket[];
  setSupportTickets: React.Dispatch<React.SetStateAction<SupportTicket[]>>;
  createSupportTicket: (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'messages'> & { message: string; imageUrl?: string; messages?: SupportMessage[]; }) => Promise<SupportTicket | null>;
  addSupportMessage: (ticketId: string, message: Omit<SupportMessage, 'id' | 'createdAt'>) => Promise<void>;
  assignSupportTicket: (ticketId: string, staffId: string) => Promise<void>;
  resolveSupportTicket: (ticketId: string, note?: string) => Promise<void>;
  closeSupportTicket: (ticketId: string, closedBy?: 'customer' | 'agent' | 'system', note?: string) => Promise<void>;
  getSupportQueueStatus: (ticketId?: string) => { totalWaiting: number; availableStaff: number; queuePosition: number; hasAvailableStaff: boolean; isBusy: boolean; };
  findPendingOrderMatch: (input: { phone?: string; name?: string; text?: string; }) => { orderId?: string; order?: Order; reason: string; matched: boolean; };
  addConsultation: (cons: Consultation) => Promise<void>;
  updateConsultation: (id: string, data: Partial<Consultation>) => Promise<void>;
  updateProductStock: (id: string, data: Partial<Product>) => Promise<void>;
  reviews: Review[];
  setReviews: React.Dispatch<React.SetStateAction<Review[]>>;
  addReview: (review: Review) => Promise<void>;
  updateReview: (id: string, data: Partial<Review>) => Promise<void>;
  deleteReview: (id: string) => Promise<void>;
  initialLoading: boolean;
  updateOrderAssignment: (orderId: string, staffId: string) => Promise<void>;
  updateOrderShippingFee: (orderId: string, fee: number) => Promise<void>;
  t: typeof defaultTranslations.ar;
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

const defaultBranding: BrandingConfig = {
  primaryColor: '#c49a6c',
  secondaryColor: '#ffffff',
  accentColor: '#e11d48',
  fontFamily: 'Cairo',
  heroTitle: '',
  heroSubtitle: '',
  heroImage: '',
  logoImage: '/qaaf-logo.jpg',
  logoSize: 200,
  aboutTitle: '',
  aboutDescription: '',
  aboutImage: '',
  aboutImages: [],
  consultationImage: '',
  slider: [],
  socialLinks: {
    facebook: '',
    instagram: '',
    whatsapp: '',
    tiktok: '',
  },
  contactNumber: '',
  footerTextAr: '',
  footerTextEn: '',
  templateId: 'qaaf-classic',
  borderRadius: 'lg',
  headerStyle: 'transparent',
  cardStyle: 'classic',
  heroLayout: 'center',
  productGridLayout: 'standard',
  aboutLayout: 'standard',
  productDetailLayout: 'standard',
  customTranslations: { 
    ar: {},
    en: {}
  },
  arabicFont: 'Cairo',
  englishFont: 'Inter',
  offers: [],
  categories: []
};

const mergeBrandingConfig = (base: BrandingConfig, incoming?: Partial<BrandingConfig>): BrandingConfig => {
  const next = { ...base, ...(incoming || {}) };
  if (!incoming?.logoImage) next.logoImage = base.logoImage || '/qaaf-logo.jpg';
  if (!incoming?.logoSize) next.logoSize = base.logoSize || 200;
  return next;
};

const defaultAdmin: AdminCredentials = {
  username: 'admin',
  password: '123',
  email: 'admin@drrose.com',
  phone: '0123456789'
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBrandingState] = useState<BrandingConfig>(() => {
    try {
      const baseBranding: BrandingConfig = {
        ...defaultBranding,
        ...dbData.branding,
        logoImage: dbData.branding.logoImage || defaultBranding.logoImage || '/qaaf-logo.jpg',
        logoSize: dbData.branding.logoSize || defaultBranding.logoSize || 200,
      };

      // Force clear old caches to show QAAF clothing brand
      const qaafCacheVersion = localStorage.getItem('qaaf_clothing_cache_v3');
      if (!qaafCacheVersion) {
        localStorage.removeItem('noure_branding_cache');
        localStorage.removeItem('noure_products_cache');
        localStorage.removeItem('noure_reviews_cache');
        localStorage.removeItem('noure_current_staff');
        localStorage.removeItem('noure_logged_in');
        localStorage.removeItem('qaaf_branding_cache');
        localStorage.removeItem('qaaf_products_cache');
        localStorage.setItem('qaaf_clothing_cache_v3', 'true');
        localStorage.setItem('qaaf_branding_cache', JSON.stringify(baseBranding));
        return baseBranding;
      }
      const saved = localStorage.getItem('qaaf_branding_cache');
      if (!saved) {
        localStorage.setItem('qaaf_branding_cache', JSON.stringify(baseBranding));
        return baseBranding;
      }

      const parsed = JSON.parse(saved) as Partial<BrandingConfig>;
      return {
        ...baseBranding,
        ...parsed,
        logoImage: parsed.logoImage || baseBranding.logoImage,
        logoSize: parsed.logoSize || baseBranding.logoSize,
      };
    } catch { return { ...defaultBranding, ...dbData.branding, logoImage: dbData.branding.logoImage || defaultBranding.logoImage || '/qaaf-logo.jpg', logoSize: dbData.branding.logoSize || defaultBranding.logoSize || 200 }; }
  });
  const [firestoreOk, setFirestoreOk] = useState<boolean>(true);
  const [lastRemoteUpdate, setLastRemoteUpdate] = useState<string | null>(null);
  const [lastWriteError, setLastWriteError] = useState<string | null>(null);
  // Bug fix: start empty — let Firebase onSnapshot populate products.
  // Starting from db.json or stale localStorage caused products to flash old data.
  const [products, setProductsState] = useState<Product[]>([]);
  const [orders, setOrdersState] = useState<Order[]>([]);
  const [promoCodes, setPromoCodesState] = useState<PromoCode[]>([]);
  const [staff, setStaffState] = useState<StaffMember[]>([]);
  const [reviews, setReviewsState] = useState<Review[]>(() => {
    try {
      const saved = localStorage.getItem('qaaf_reviews_cache');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [initialLoading, setInitialLoading] = useState(true);

  const staffRef = useRef(staff);
  const ordersRef = useRef(orders);
  
  useEffect(() => { staffRef.current = staff; }, [staff]);
  useEffect(() => { ordersRef.current = orders; }, [orders]);

  const [currentStaff, setCurrentStaffState] = useState<StaffMember | null>(() => {
    try {
      const saved = localStorage.getItem('qaaf_current_staff');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const setCurrentStaff = (member: StaffMember | null) => {
    setCurrentStaffState(member);
    try {
      if (member) localStorage.setItem('qaaf_current_staff', JSON.stringify(member));
      else localStorage.removeItem('qaaf_current_staff');
    } catch { }
  };

  const [manufacturingRequests, setManufacturingRequestsState] = useState<ManufacturingRequest[]>([]);
  const [salaryRecords, setSalaryRecordsState] = useState<SalaryRecord[]>([]);
  const [cart, setCartState] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [userRating, setRatingState] = useState<number | null>(null);
  const [adminAuth, setAdminAuthState] = useState<AdminCredentials>(defaultAdmin);
  
  const setAdminAuth = async (auth: AdminCredentials) => {
    setAdminAuthState(auth);
    await setDoc(doc(db, 'settings', 'adminAuth'), { value: auth });
  };

  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [isLoggedIn, setIsLoggedInState] = useState<boolean>(() => {
    try { return localStorage.getItem('qaaf_logged_in') === 'true'; } catch { return false; }
  });

  const [customers, setCustomersState] = useState<Customer[]>([]);
  const [consultations, setConsultationsState] = useState<Consultation[]>([]);
  const [supportTickets, setSupportTicketsState] = useState<SupportTicket[]>(() => {
    try {
      const saved = localStorage.getItem('qaaf_support_tickets');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const setIsLoggedIn = (val: boolean) => {
    setIsLoggedInState(val);
    try {
      if (val) localStorage.setItem('qaaf_logged_in', 'true');
      else { localStorage.removeItem('qaaf_logged_in'); localStorage.removeItem('qaaf_current_staff'); }
    } catch { }
  };

  const [isTranslating, setIsTranslating] = useState(false);
  const [language, setLanguageState] = useState<'ar' | 'en'>('ar');
  const [translationsCache, setTranslationsCache] = useState<Record<string, any>>({});

  const t = useMemo(() => {
    if (!defaultTranslations || !defaultTranslations[language]) {
        return (defaultTranslations?.ar || {}) as typeof defaultTranslations.ar;
    }
    const base = defaultTranslations[language];
    const custom = (branding?.customTranslations && branding.customTranslations[language]) || {};
    const merged = { ...base };
    try {
        Object.keys(custom).forEach(key => {
          if (typeof custom[key] === 'object' && custom[key] !== null && !Array.isArray(custom[key])) {
            merged[key as keyof typeof merged] = { ...merged[key as keyof typeof merged] as any, ...custom[key] };
          } else {
            merged[key as keyof typeof merged] = custom[key];
          }
        });
    } catch (e) { }
    return merged;
  }, [language, branding?.customTranslations]);

  useEffect(() => {
    if (language === 'en' && branding && products.length > 0) {
      const translateAll = async () => {
        setIsTranslating(true);
        try {
          if (!translationsCache['branding_en']) {
            const toTranslate = {
              heroTitle: branding.heroTitle,
              heroSubtitle: branding.heroSubtitle,
              aboutTitle: branding.aboutTitle,
              aboutDescription: branding.aboutDescription,
              slider: (branding.slider || []).map(s => ({ title: s.title, subtitle: s.subtitle })),
              categories: (branding.categories || []).map(c => ({ name: c.name, description: c.description }))
            };
            const translated = await translateContent(toTranslate, 'en');
            setTranslationsCache(prev => ({ ...prev, ['branding_en']: translated }));
          }
          if (!translationsCache['products_en']) {
            const toTranslate = products.map(p => ({ id: p.id, name: p.name, description: p.description, category: p.category }));
            const translated = await translateContent(toTranslate, 'en');
            setTranslationsCache(prev => ({ ...prev, ['products_en']: translated }));
          }
        } catch (e) { } finally {
          setIsTranslating(false);
        }
      };
      translateAll();
    }
  }, [language, branding, products]);

  const displayBranding = useMemo(() => {
    if (language === 'ar' || !translationsCache['branding_en'] || !branding) return branding || defaultBranding;
    const trans = translationsCache['branding_en'];
    return {
      ...branding,
      heroTitle: trans.heroTitle || branding.heroTitle,
      heroSubtitle: trans.heroSubtitle || branding.heroSubtitle,
      aboutTitle: trans.aboutTitle || branding.aboutTitle,
      aboutDescription: trans.aboutDescription || branding.aboutDescription,
      slider: (branding.slider || []).map((s, i) => ({ ...s, title: trans.slider?.[i]?.title || s.title, subtitle: trans.slider?.[i]?.subtitle || s.subtitle })),
      categories: (branding.categories || []).map((c, i) => ({ ...c, name: trans.categories?.[i]?.name || c.name, description: trans.categories?.[i]?.description || c.description }))
    };
  }, [language, branding, translationsCache]);

  const displayProducts = useMemo(() => {
    let baseProducts = products || [];
    
    // Apply active offers globally so products show discounted in categories
    const activeOffers = branding?.offers?.filter(o => o.isActive && new Date(o.expiryDate) > new Date()) || [];
    if (activeOffers.length > 0) {
      baseProducts = baseProducts.map(p => {
        const offer = activeOffers.find(o => o.productId === p.id);
        if (offer) {
          return { ...p, isOnSale: true, salePrice: offer.salePrice, price: offer.originalPrice };
        }
        return p;
      });
    }

    if (language === 'ar' || !translationsCache['products_en']) return baseProducts;
    
    const trans = translationsCache['products_en'];
    return baseProducts.map(p => {
      const tp = Array.isArray(trans) ? trans.find((t: any) => t.id === p.id) : null;
      return tp ? { ...p, name: tp.name || p.name, description: tp.description || p.description, category: tp.category || p.category } : p;
    });
  }, [language, products, translationsCache, branding?.offers]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Initial fetch of products from Firestore
        const prodSnap = await getDocs(collection(db, 'products'));
        const prods = prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProductsState(prods);
        try { localStorage.setItem('qaaf_products_cache', JSON.stringify(prods)); } catch {}

        // 2. Initial fetch of orders & branding
        const orderSnap = await getDocs(collection(db, 'orders'));
        const brandSnap = await getDoc(doc(db, 'branding', 'main'));
        
        const ordersData = orderSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setOrdersState(ordersData);

        if (brandSnap.exists()) {
          const config = brandSnap.data() as Partial<BrandingConfig>;
          setBrandingState(prev => {
            const merged = mergeBrandingConfig(prev, config);
            if (config.categories === undefined && prev.categories) merged.categories = prev.categories;
            if (config.offers === undefined && prev.offers) merged.offers = prev.offers;
            if (config.slider === undefined && prev.slider) merged.slider = prev.slider;
            try { localStorage.setItem('qaaf_branding_cache', JSON.stringify(merged)); } catch {}
            return merged;
          });
        } else {
          try {
            const initialBrand = mergeBrandingConfig({ ...defaultBranding, ...dbData.branding }, dbData.branding);
            await setDoc(doc(db, 'branding', 'main'), initialBrand);
            setBrandingState(initialBrand);
            try { localStorage.setItem('qaaf_branding_cache', JSON.stringify(initialBrand)); } catch {}
          } catch (e) {
            console.error("Failed to seed branding:", e);
          }
        }
        
        setInitialLoading(false);

        // 3. Real-time listener for products (Firestore)
        onSnapshot(collection(db, 'products'), (snapshot) => {
          const updatedProds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
          setProductsState(updatedProds);
          try { localStorage.setItem('qaaf_products_cache', JSON.stringify(updatedProds)); } catch {}
          setFirestoreOk(true);
          setLastRemoteUpdate(new Date().toISOString());
        });

        // 4. Real-time listener for branding (Firestore)
        onSnapshot(doc(db, 'branding', 'main'), (snapshot) => {
          if (snapshot.exists()) {
            const config = snapshot.data() as Partial<BrandingConfig>;
            setBrandingState(prev => {
              const next = mergeBrandingConfig(prev, config);
              if (config.categories === undefined && prev.categories) next.categories = prev.categories;
              if (config.offers === undefined && prev.offers) next.offers = prev.offers;
              if (config.slider === undefined && prev.slider) next.slider = prev.slider;
              try { localStorage.setItem('qaaf_branding_cache', JSON.stringify(next)); } catch {}
              return next;
            });
          }
        });

        // 5. Real-time listeners for all other collections
        onSnapshot(collection(db, 'orders'), (snapshot) => {
          const ords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
          setOrdersState(ords);
        });

        onSnapshot(collection(db, 'promo_codes'), (snapshot) => {
          const promos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromoCode));
          setPromoCodesState(promos);
        });

        onSnapshot(collection(db, 'staff'), (snapshot) => {
          const stf = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StaffMember));
          setStaffState(stf);
        });

        onSnapshot(collection(db, 'reviews'), (snapshot) => {
          const revs = snapshot.docs.map(doc => {
            const data = doc.data();
            return { 
              id: doc.id, 
              ...data, 
              customerName: data.customerName || data.customer_name || 'عميل مجهول',
              date: data.date || data.created_at || new Date().toISOString(),
              isApproved: data.isApproved || data.is_approved 
            } as Review;
          }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setReviewsState(revs);
          try { localStorage.setItem('qaaf_reviews_cache', JSON.stringify(revs)); } catch {}
        });

        onSnapshot(collection(db, 'consultations'), (snapshot) => {
          const cons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Consultation))
            .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setConsultationsState(cons);
        });

        onSnapshot(collection(db, 'support_tickets'), (snapshot) => {
          const tickets = snapshot.docs.map(doc => {
            const data = doc.data() as any;
            return {
              id: doc.id,
              customerName: data.customerName,
              phone: data.phone,
              message: data.message,
              imageUrl: data.imageUrl || null,
              status: data.status || 'new',
              isOpen: data.isOpen ?? true,
              isClosed: data.isClosed ?? false,
              closedBy: data.closedBy || null,
              assignedStaffId: data.assignedStaffId || undefined,
              orderId: data.orderId || null,
              orderMatch: data.orderMatch || 'none',
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
              messages: (data.messages || []) as SupportMessage[]
            } as SupportTicket;
          }).sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          setSupportTicketsState(tickets);
          try { localStorage.setItem('qaaf_support_tickets', JSON.stringify(tickets)); } catch {}
        });

        onSnapshot(collection(db, 'customers'), (snapshot) => {
          const custs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
          setCustomersState(custs);
        });

        onSnapshot(collection(db, 'manufacturing_requests'), (snapshot) => {
          const mfr = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ManufacturingRequest))
            .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setManufacturingRequestsState(mfr);
        });

        onSnapshot(doc(db, 'settings', 'adminAuth'), (snapshot) => {
          if (snapshot.exists()) setAdminAuthState(snapshot.data().value);
        });

      } catch (e) {
        console.error('Error fetching data from Firestore:', e);
        setInitialLoading(false);
      }
    };

    fetchData();
  }, []);

  // ─── Auto-track offline time every second (لحظي) ────────────────────────────
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const now = Date.now();
        const todayKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
        
        // Update attendance for all offline staff members
        for (const member of staffRef.current) {
          if (member.isOnline) continue; // Skip online members
          
          const lastActiveMs = member.lastActive ? new Date(member.lastActive).getTime() : 0;
          if (lastActiveMs === 0 || now - lastActiveMs < 2000) continue; // Skip if recently active
          
          try {
            const staffRef_doc = doc(db, 'staff', member.id);
            const staffSnap = await getDoc(staffRef_doc);
            if (!staffSnap.exists()) continue;
            
            const staffData = staffSnap.data();
            const attendance = staffData.attendance || {};
            const todayAttendance = attendance[todayKey];
            
            if (!todayAttendance) continue; // No attendance record yet
            
            const lastPingMs = new Date(todayAttendance.lastPing).getTime();
            const startTimeMs = new Date(todayAttendance.startTime).getTime();
            const shiftHours = todayAttendance.shiftHours || staffData.shiftHours || 8;
            const shiftEndMs = startTimeMs + shiftHours * 3600000;
            
            // If the member is offline and we haven't updated since last ping + 1s, add 1 second of away time
            const timeSinceLastPing = now - lastPingMs;
            if (timeSinceLastPing > 1000 && lastPingMs < shiftEndMs) {
              const addedAway = Math.min(2, Math.floor(timeSinceLastPing / 1000)); // Add up to 2 seconds per check
              
              await updateDoc(staffRef_doc, {
                attendance: {
                  ...attendance,
                  [todayKey]: {
                    ...todayAttendance,
                    totalAwaySeconds: (todayAttendance.totalAwaySeconds || 0) + addedAway,
                    lastPing: new Date(Math.min(now, lastPingMs + addedAway * 1000)).toISOString()
                  }
                }
              });
            }
          } catch (err) {
            console.error(`Failed to update attendance for ${member.id}:`, err);
          }
        }
      } catch (e) {
        console.error('Auto-track offline error:', e);
      }
    }, 1000); // Check every 1 second for instant tracking
    
    return () => clearInterval(interval);
  }, []);

  const setBranding = async (config: BrandingConfig) => {
    setBrandingState(config);
    // Always update localStorage immediately so refresh shows latest data
    try { localStorage.setItem('qaaf_branding_cache', JSON.stringify(config)); } catch {}
    try {
      // Use setDoc with merge:false to fully replace — config is always the complete object
      await setDoc(doc(db, 'branding', 'main'), config);
    } catch (e) {
      console.error('Failed to save branding to Firestore:', e);
      if (typeof window !== 'undefined') alert('فشل حفظ التغييرات على الخادم. التغييرات مخزّنة محليًا مؤقتاً.');
    }
  };

  const setProducts = async (action: React.SetStateAction<Product[]>) => {
    // Capture snapshot of previous products BEFORE updating state
    const prev = products;
    const next = typeof action === 'function' ? action(prev) : action;

    // Optimistic local update immediately
    setProductsState(next);
    try { localStorage.setItem('qaaf_products_cache', JSON.stringify(next)); } catch {}

    const nextIds = new Set(next.map(p => p.id));
    let anySuccess = false;

    try {
      // 1. Delete removed products from Firestore
      for (const old of prev) {
        if (!nextIds.has(old.id)) {
          try {
            await deleteDoc(doc(db, 'products', old.id));
            console.info(`Deleted product ${old.id} from Firestore.`);
          } catch (e) {
            console.error(`Failed to delete product ${old.id} from Firestore:`, e);
          }
        }
      }

      // 2. Upsert each product in Firestore
      for (const p of next) {
        await setDoc(doc(db, 'products', p.id), p);
        console.info(`Persisted product ${p.id} to Firestore.`);
      }
      anySuccess = true;
    } catch (e) {
      console.error('setProducts Firestore write error:', e);
    }

    if (anySuccess) {
      setFirestoreOk(true);
      setLastRemoteUpdate(new Date().toISOString());
      setLastWriteError(null);
    } else {
      setFirestoreOk(false);
      const errMsg = 'فشل حفظ التغييرات إلى الخادم.';
      setLastWriteError(errMsg);
      if (typeof window !== 'undefined') alert(errMsg);
    }
  };

  const addToCart = (product: Product, quantity: number = 1, selectedSize?: string, selectedColor?: string) => {
    const stateProduct = products.find(p => p.id === product.id);
    
    // Preserve pricing overrides (e.g. from Offers section) while keeping real-time stock
    const latestProduct = stateProduct ? { 
      ...stateProduct, 
      isOnSale: product.isOnSale ?? stateProduct.isOnSale,
      salePrice: product.salePrice ?? stateProduct.salePrice,
      price: product.price ?? stateProduct.price
    } : product;

    const availableStock = latestProduct.stock || 0;

    setCartState(prev => {
      const existing = prev.find(item => 
        item.product.id === latestProduct.id && 
        item.selectedSize === selectedSize && 
        item.selectedColor === selectedColor
      );
      const currentCartQty = existing ? existing.quantity : 0;
      
      if (currentCartQty + quantity > availableStock) {
        // Use a small delay to avoid blocking render cycles, especially if this is called from an event handler
        setTimeout(() => window.alert(`عذراً، الكمية المتاحة في المخزون هي ${availableStock} فقط`), 10);
        return prev;
      }

      if (existing) {
        return prev.map(item =>
          item.product.id === latestProduct.id && item.selectedSize === selectedSize && item.selectedColor === selectedColor
            ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { product: latestProduct, quantity, selectedSize, selectedColor }];
    });
  };

  const removeFromCart = (productId: string, selectedSize?: string, selectedColor?: string) => {
    setCartState(prev => prev.filter(item => !(item.product.id === productId && item.selectedSize === selectedSize && item.selectedColor === selectedColor)));
  };

  const updateCartQuantity = (productId: string, quantity: number, selectedSize?: string, selectedColor?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, selectedSize, selectedColor);
      return;
    }
    
    const latestProduct = products.find(p => p.id === productId);
    const availableStock = latestProduct?.stock || 0;
    
    if (quantity > availableStock) {
      setTimeout(() => window.alert(`عذراً، الكمية المتاحة في المخزون هي ${availableStock} فقط`), 10);
      setCartState(prev => prev.map(item =>
        item.product.id === productId && item.selectedSize === selectedSize && item.selectedColor === selectedColor 
          ? { ...item, quantity: availableStock } : item
      ));
      return;
    }

    setCartState(prev => prev.map(item =>
      item.product.id === productId && item.selectedSize === selectedSize && item.selectedColor === selectedColor 
        ? { ...item, quantity } : item
    ));
  };

  const addOrder = async (order: Order) => {
    // 1. Save order immediately to ensure it's not lost
    const sanitizedOrder = JSON.parse(JSON.stringify(order));
    await setDoc(doc(db, 'orders', sanitizedOrder.id), sanitizedOrder);
    console.log("Order saved successfully:", sanitizedOrder.id);

    try {
      // 2. Background tasks (stock deduction, staff assignment, CRM update)
      const eligibleStaff = staffRef.current.filter(s => Array.isArray(s.permissions) && s.permissions.includes('orders'));
      let finalOrder = { ...sanitizedOrder };
      
      if (eligibleStaff.length > 0) {
        const loadCount: Record<string, number> = {};
        eligibleStaff.forEach(s => loadCount[s.id] = 0);
        ordersRef.current.forEach(o => {
          if (o.status !== 'delivered' && o.status !== 'cancelled') {
            if (o.assignedTo && loadCount[o.assignedTo] !== undefined) loadCount[o.assignedTo]++;
          }
        });
        let minLoad = Infinity;
        let targetStaffId: string | undefined = undefined;
        eligibleStaff.forEach(s => {
          if (loadCount[s.id] < minLoad) {
             minLoad = loadCount[s.id];
             targetStaffId = s.id;
          }
        });
        if (targetStaffId) {
          finalOrder.assignedTo = targetStaffId;
          await updateDoc(doc(db, 'orders', finalOrder.id), { assignedTo: targetStaffId });
        }
      }

      // Deduct stock
      for (const item of finalOrder.products) {
        if (!item.product?.id) continue;
        const prodRef = doc(db, 'products', item.product.id);
        const prodDoc = await getDoc(prodRef);
        if (prodDoc.exists()) {
          const product = prodDoc.data() as Product;
          const newStock = Math.max(0, (product.stock || 0) - item.quantity);
          await updateDoc(prodRef, { 
             stock: newStock,
             inStock: newStock > 0
          });
        }
      }

      // Deduct offer stock if exists
      if (branding.offers && branding.offers.length > 0) {
        let updatedOffers = [...branding.offers];
        let hasChanges = false;
        for (const item of finalOrder.products) {
          const offerIdx = updatedOffers.findIndex(o => o.productId === item.product.id && o.isActive);
          if (offerIdx > -1 && updatedOffers[offerIdx].stock !== undefined) {
             updatedOffers[offerIdx].stock = Math.max(0, (updatedOffers[offerIdx].stock || 0) - item.quantity);
             hasChanges = true;
          }
        }
        if (hasChanges) {
          await updateDoc(doc(db, 'branding', 'main'), { offers: updatedOffers });
        }
      }

      // Deduct Flash Limit Offer count if applied
      if (order.flashOfferApplied && branding.flashLimitOffer?.isActive) {
        let updatedFlash = { ...branding.flashLimitOffer };
        updatedFlash.currentCount += 1;
        if (updatedFlash.currentCount >= updatedFlash.totalLimit) {
           updatedFlash.isActive = false;
        }
        await updateDoc(doc(db, 'branding', 'main'), { flashLimitOffer: updatedFlash });
      }

      // CRM Update
      const existingCust = customers.find(c => c.phone === order.phoneNumber);
      if (existingCust) {
        await updateDoc(doc(db, 'customers', existingCust.id), {
          totalSpent: existingCust.totalSpent + (order.finalTotal || 0),
          ordersCount: existingCust.ordersCount + 1,
          lastOrderDate: order.date,
          name: order.customerName // Update name to latest
        });
      } else {
        const newCustId = Date.now().toString();
        const newCust: Customer = {
          id: newCustId,
          name: order.customerName,
          phone: order.phoneNumber,
          totalSpent: order.finalTotal || 0,
          ordersCount: 1,
          lastOrderDate: order.date,
          customerType: 'new'
        };
        await setDoc(doc(db, 'customers', newCustId), newCust);
      }
      
    } catch (err) {
      console.error("Background order tasks failed:", err);
      // We don't throw here because the order itself was already saved successfully
    }
  };

  const updateOrderStatus = async (id: string, status: OrderStatus, metadata: Partial<Order> = {}) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    
    await updateDoc(doc(db, 'orders', id), { status, ...metadata });

    if (order.status !== status) {
      // Update delivered orders counter
      if (status === 'delivered') {
        const currentOrdersCount = branding?.totalOrdersCount || 0;
        await updateDoc(doc(db, 'branding', 'main'), { totalOrdersCount: currentOrdersCount + 1 });
      } else if (order.status === 'delivered') {
        const currentOrdersCount = branding?.totalOrdersCount || 0;
        await updateDoc(doc(db, 'branding', 'main'), { totalOrdersCount: Math.max(0, currentOrdersCount - 1) });
      }

      try {
        if (order.status !== 'cancelled' && status === 'cancelled') {
          // Return stock
          for (const item of order.products) {
            if (item.product?.id) {
              const prodDoc = await getDoc(doc(db, 'products', item.product.id));
              if (prodDoc.exists()) {
                const product = prodDoc.data() as Product;
                const newStock = (product.stock || 0) + item.quantity;
                await updateDoc(doc(db, 'products', item.product.id), { 
                   stock: newStock,
                   inStock: newStock > 0
                });
              }
            }
          }
        } else if (order.status === 'cancelled' && status !== 'cancelled') {
          // Deduct stock again
          for (const item of order.products) {
            if (item.product?.id) {
              const prodDoc = await getDoc(doc(db, 'products', item.product.id));
              if (prodDoc.exists()) {
                const product = prodDoc.data() as Product;
                const newStock = Math.max(0, (product.stock || 0) - item.quantity);
                await updateDoc(doc(db, 'products', item.product.id), { 
                   stock: newStock,
                   inStock: newStock > 0
                });
              }
            }
          }
        }
      } catch (stockErr) {
        console.error("Failed to adjust stock for status update:", stockErr);
      }
    }
  };

  const updateOrderAssignment = async (orderId: string, staffId: string) => {
    await updateDoc(doc(db, 'orders', orderId), { assignedTo: staffId });
  };

  const updateOrderShippingFee = async (orderId: string, fee: number) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      const subtotal = (order.products || []).reduce((sum, p) => sum + (p.product.price * p.quantity), 0);
      const discount = order.discountAmount || 0;
      await updateDoc(doc(db, 'orders', orderId), { 
        shippingFee: fee, 
        finalTotal: subtotal - discount + fee 
      });
    }
  };

  const updateProductStock = async (id: string, data: Partial<Product>) => {
    const updateData = { ...data };
    if (data.stock !== undefined) {
      updateData.inStock = data.stock > 0;
    }
    await updateDoc(doc(db, 'products', id), updateData);
  };

  const getSupportQueueStatus = (ticketId?: string) => {
    const activeTickets = (supportTickets || [])
      .filter(ticket => !ticket.isClosed && ticket.status !== 'resolved');

    const waitingTickets = [...activeTickets]
      .filter(ticket => !ticket.assignedStaffId || ticket.status === 'waiting' || ticket.status === 'new')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const availableStaff = staff.filter(member => member.isOnline && (member.permissions.includes('support' as any) || member.permissions.includes('orders' as any) || member.permissions.includes('consultations' as any)));
    const queuePosition = ticketId ? (waitingTickets.findIndex(ticket => ticket.id === ticketId) + 1) : waitingTickets.length;

    return {
      totalWaiting: waitingTickets.length,
      availableStaff: availableStaff.length,
      queuePosition: Math.max(queuePosition, 0),
      hasAvailableStaff: availableStaff.length > 0,
      isBusy: availableStaff.length === 0,
    };
  };

  const buildSupportBotMessages = (text: string, queueStatus?: ReturnType<typeof getSupportQueueStatus>): SupportMessage[] => {
    const now = new Date().toISOString();
    const normalized = (text || '').toLowerCase();
    const isShippingIssue = /(دفع|توصيل|شحن|shipping|delivery|delivery fee|shipping fee|رسوم الشحن)/i.test(normalized);
    const hasPaidAnswer = /(نعم|اه|yes|paid|دفعت|تم الدفع|دفعته|already paid)/i.test(normalized);

    const messages: SupportMessage[] = [
      { id: `msg-${Date.now()}-system-1`, sender: 'system', text: 'هل الرسالة بخصوص دفع التوصيل؟', createdAt: now },
    ];

    if (isShippingIssue) {
      messages.push({ id: `msg-${Date.now()}-system-2`, sender: 'system', text: 'هل قمت بالدفع بالفعل؟', createdAt: now });
    } else {
      messages.push({ id: `msg-${Date.now()}-system-2`, sender: 'system', text: 'تم تحويلك لخدمة العملاء مباشرة.', createdAt: now });
    }

    if (!queueStatus || queueStatus.isBusy) {
      const waitingCount = queueStatus ? Math.max(queueStatus.totalWaiting + 1, queueStatus.queuePosition || 1) : 1;
      messages.push({
        id: `msg-${Date.now()}-system-3`,
        sender: 'system',
        text: `جميع موظفي خدمة العملاء مشغولين الآن. عدد الأشخاص أمامك: ${waitingCount}. سيتم إبلاغك فورًا عند دخول موعدك.`,
        createdAt: now
      });
    } else if (hasPaidAnswer) {
      messages.push({
        id: `msg-${Date.now()}-system-3`,
        sender: 'system',
        text: 'أرسل صورة التحويل وبيانات الطلب (رقم الطلب أو رقم الهاتف) لتأكيد الدفع تلقائيًا.',
        createdAt: now
      });
    }

    return messages;
  };

  const findPendingOrderMatch = (input: { phone?: string; name?: string; text?: string; }) => {
    const cleanPhone = (input.phone || '').replace(/\D/g, '');
    const cleanName = (input.name || '').trim().toLowerCase();
    const text = (input.text || '').trim();

    const match = orders.find(order => {
      const orderPhone = String(order.phoneNumber || '').replace(/\D/g, '');
      const paymentPhone = String(order.paymentSenderPhone || '').replace(/\D/g, '');
      const orderName = String(order.customerName || '').trim().toLowerCase();
      const pending = String(order.status || '').toLowerCase() === 'pending';
      const samePhone = !!cleanPhone && (orderPhone.includes(cleanPhone) || paymentPhone.includes(cleanPhone) || cleanPhone.includes(orderPhone) || cleanPhone.includes(paymentPhone));
      const sameName = !!cleanName && (orderName.includes(cleanName) || cleanName.includes(orderName));
      const textMentions = !!text && (orderPhone.includes(text) || orderName.includes(text.toLowerCase()));
      return pending && (samePhone || sameName || textMentions);
    });

    if (match) {
      return { orderId: match.id, order: match, reason: 'pending order matched by phone or name', matched: true };
    }

    return { reason: 'no pending order matched', matched: false };
  };

  const createSupportTicket = async (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'messages'> & { message: string; imageUrl?: string; messages?: SupportMessage[]; }) => {
    const now = new Date().toISOString();
    const lookup = findPendingOrderMatch({ phone: ticket.phone, name: ticket.customerName, text: ticket.message });
    const queueStatus = getSupportQueueStatus();
    const availableSupportStaff = staff.filter(member => member.isOnline && (member.permissions.includes('support' as any) || member.permissions.includes('orders' as any) || member.permissions.includes('consultations' as any)));
    const assignedSupportStaff = availableSupportStaff.length > 0
      ? [...availableSupportStaff].sort((a, b) => {
          const countA = (supportTickets || []).filter(item => item.assignedStaffId === a.id && item.status !== 'resolved').length;
          const countB = (supportTickets || []).filter(item => item.assignedStaffId === b.id && item.status !== 'resolved').length;
          return countA - countB;
        })[0]
      : undefined;

    const customerMessage: SupportMessage = {
      id: `msg-${Date.now()}-customer`,
      sender: 'customer',
      text: ticket.message,
      imageUrl: ticket.imageUrl,
      createdAt: now
    };

    const supportTicket: SupportTicket = {
      id: `support-${Date.now()}`,
      customerName: ticket.customerName,
      phone: ticket.phone,
      message: ticket.message,
      imageUrl: ticket.imageUrl,
      status: assignedSupportStaff ? 'assigned' : 'waiting',
      isOpen: true,
      isClosed: false,
      closedBy: undefined,
      assignedStaffId: assignedSupportStaff?.id,
      orderId: lookup.orderId,
      orderMatch: lookup.matched ? 'matched' : 'none',
      customerIntent: /(?:دفع|توصيل|شحن|shipping|delivery|paid|payment)/i.test(ticket.message) ? 'shipping_fee' : 'general',
      botStep: assignedSupportStaff ? 'ask_paid' : 'queue_wait',
      queuePosition: assignedSupportStaff ? 0 : Math.max(queueStatus.totalWaiting + 1, 1),
      waitingCount: Math.max(queueStatus.totalWaiting + 1, 1),
      availableStaffCount: queueStatus.availableStaff,
      createdAt: now,
      updatedAt: now,
      messages: ticket.messages && ticket.messages.length > 0 ? ticket.messages : [customerMessage, ...buildSupportBotMessages(ticket.message, queueStatus)]
    };

    // Persist to Firestore for real-time sync
    try {
      await setDoc(doc(db, 'support_tickets', supportTicket.id), {
        customerName: supportTicket.customerName,
        phone: supportTicket.phone,
        message: supportTicket.message,
        imageUrl: supportTicket.imageUrl || null,
        status: supportTicket.status,
        isOpen: supportTicket.isOpen,
        isClosed: supportTicket.isClosed,
        closedBy: supportTicket.closedBy || null,
        assignedStaffId: supportTicket.assignedStaffId || null,
        orderId: supportTicket.orderId || null,
        orderMatch: supportTicket.orderMatch || 'none',
        customerIntent: supportTicket.customerIntent || 'general',
        botStep: supportTicket.botStep || 'ask_shipping_fee',
        queuePosition: supportTicket.queuePosition || 0,
        waitingCount: supportTicket.waitingCount || 0,
        availableStaffCount: supportTicket.availableStaffCount || 0,
        createdAt: supportTicket.createdAt,
        updatedAt: supportTicket.updatedAt,
        messages: supportTicket.messages || []
      });
    } catch (e) {
      console.error('Failed to persist support ticket:', e);
    }

    // Optimistic local update; real source of truth will be Firestore onSnapshot
    const next = [supportTicket, ...supportTickets];
    setSupportTicketsState(next);
    try { localStorage.setItem('qaaf_support_tickets', JSON.stringify(next)); } catch {}
    return supportTicket;
  };

  const addSupportMessage = async (ticketId: string, message: Omit<SupportMessage, 'id' | 'createdAt'>) => {
    const now = new Date().toISOString();
    const msg: SupportMessage = { ...message, id: `msg-${Date.now()}-${Math.random()}`, createdAt: now };
    const ticket = supportTickets.find(item => item.id === ticketId);
    const ticketRef = doc(db, 'support_tickets', ticketId);

    const normalizedText = (message.text || '').toLowerCase();
    const isShippingQuestion = /(دفع|توصيل|شحن|shipping|delivery|delivery fee|shipping fee)/i.test(normalizedText);
    const answeredYes = /(نعم|اه|yes|paid|دفعت|تم الدفع|already paid)/i.test(normalizedText);
    const answeredNo = /(لا|no|not|لم|not yet|nope)/i.test(normalizedText);

    let nextStatus: SupportTicket['status'] = msg.sender === 'customer' ? 'waiting' : 'assigned';
    let nextBotStep: SupportTicket['botStep'] = ticket?.botStep || 'ask_shipping_fee';
    let nextCustomerIntent: SupportTicket['customerIntent'] = ticket?.customerIntent || 'general';
    let updateData: Record<string, any> = {
      messages: arrayUnion(msg),
      status: nextStatus,
      updatedAt: now,
      isOpen: true
    };

    if (msg.sender === 'customer') {
      if (isShippingQuestion && answeredNo) {
        const queueState = getSupportQueueStatus(ticketId);
        const availableStaff = staff.filter(member => member.isOnline && (member.permissions.includes('support' as any) || member.permissions.includes('orders' as any) || member.permissions.includes('consultations' as any)));
        const assigned = availableStaff.length > 0 ? [...availableStaff].sort((a, b) => {
          const countA = (supportTickets || []).filter(item => item.assignedStaffId === a.id && item.status !== 'resolved').length;
          const countB = (supportTickets || []).filter(item => item.assignedStaffId === b.id && item.status !== 'resolved').length;
          return countA - countB;
        })[0] : undefined;

        nextStatus = assigned ? 'assigned' : 'waiting';
        nextBotStep = assigned ? 'route_to_agent' : 'queue_wait';
        nextCustomerIntent = 'shipping_fee';

        const queueMessage: SupportMessage = {
          id: `msg-${Date.now()}-system-route`,
          sender: 'system',
          text: assigned
            ? 'تم تحويلك لخدمة العملاء مباشرة.'
            : `جميع موظفي خدمة العملاء مشغولين الآن. عدد الأشخاص أمامك: ${Math.max(queueState.totalWaiting + 1, 1)}. سيتم إبلاغك فورًا عند دخول موعدك.`,
          createdAt: now
        };

        updateData = {
          ...updateData,
          status: nextStatus,
          assignedStaffId: assigned?.id || ticket?.assignedStaffId || null,
          botStep: nextBotStep,
          customerIntent: nextCustomerIntent,
          queuePosition: assigned ? 0 : Math.max(queueState.totalWaiting + 1, 1),
          waitingCount: Math.max(queueState.totalWaiting + 1, 1),
          availableStaffCount: queueState.availableStaff,
          messages: arrayUnion(msg, queueMessage)
        };
      }

      if (answeredYes && isShippingQuestion) {
        nextBotStep = 'await_transfer_proof';
        nextCustomerIntent = 'payment_confirmation';
        const proofPrompt: SupportMessage = {
          id: `msg-${Date.now()}-system-proof`,
          sender: 'system',
          text: 'أرسل صورة التحويل مع رقم الطلب أو رقم الهاتف لتأكيد الدفع تلقائيًا.',
          createdAt: now
        };

        updateData = {
          ...updateData,
          botStep: nextBotStep,
          customerIntent: nextCustomerIntent,
          messages: arrayUnion(msg, proofPrompt)
        };
      }
    }

    try {
      await updateDoc(ticketRef, updateData);
    } catch (e) {
      // Fallback to local update if remote fails
      console.error('Failed to write support message to remote DB:', e);
      const next: SupportTicket[] = supportTickets.map(item => {
        if (item.id !== ticketId) return item;
        return {
          ...item,
          isOpen: !item.isClosed,
          isClosed: !!item.isClosed,
          status: nextStatus,
          botStep: nextBotStep,
          customerIntent: nextCustomerIntent,
          messages: [...item.messages, msg],
          updatedAt: now,
        };
      });
      setSupportTicketsState(next);
      try { localStorage.setItem('qaaf_support_tickets', JSON.stringify(next)); } catch {}
      return;
    }
    // optimistic local update will be replaced by onSnapshot listener
  };

  const assignSupportTicket = async (ticketId: string, staffId: string) => {
    const next: SupportTicket[] = supportTickets.map(ticket => ticket.id === ticketId ? {
      ...ticket,
      assignedStaffId: staffId,
      status: 'assigned',
      isOpen: !ticket.isClosed,
      isClosed: !!ticket.isClosed,
      queuePosition: 0,
      waitingCount: 0,
      availableStaffCount: staff.filter(member => member.isOnline && (member.permissions.includes('support' as any) || member.permissions.includes('orders' as any) || member.permissions.includes('consultations' as any))).length,
      updatedAt: new Date().toISOString()
    } : ticket);
    setSupportTicketsState(next);
    try { localStorage.setItem('qaaf_support_tickets', JSON.stringify(next)); } catch {}
  };

  const resolveSupportTicket = async (ticketId: string, note?: string) => {
    const next: SupportTicket[] = supportTickets.map(ticket => ticket.id === ticketId ? { ...ticket, status: 'resolved', isOpen: false, isClosed: true, closedBy: 'agent', queuePosition: 0, waitingCount: 0, updatedAt: new Date().toISOString(), messages: [...ticket.messages, { id: `msg-${Date.now()}`, sender: 'system', text: note || 'تم حل الطلب / إغلاق التذكرة', createdAt: new Date().toISOString() }] } as SupportTicket : ticket);
    setSupportTicketsState(next);
    try { localStorage.setItem('qaaf_support_tickets', JSON.stringify(next)); } catch {}
  };

  const closeSupportTicket = async (ticketId: string, closedBy: 'customer' | 'agent' | 'system' = 'customer', note?: string) => {
    const next: SupportTicket[] = supportTickets.map(ticket => {
      if (ticket.id !== ticketId) return ticket;
      const closeText = note || (closedBy === 'customer' ? 'تم إغلاق المحادثة من العميل.' : closedBy === 'agent' ? 'تم إغلاق المحادثة من الموظف.' : 'تم إغلاق المحادثة.');
      return {
        ...ticket,
        status: 'resolved',
        isOpen: false,
        isClosed: true,
        closedBy,
        queuePosition: 0,
        waitingCount: 0,
        updatedAt: new Date().toISOString(),
        messages: [...ticket.messages, { id: `msg-${Date.now()}`, sender: 'system', text: closeText, createdAt: new Date().toISOString() }]
      } as SupportTicket;
    });
    setSupportTicketsState(next);
    try { localStorage.setItem('qaaf_support_tickets', JSON.stringify(next)); } catch {}
  };

  const addConsultation = async (cons: Consultation) => {
    await setDoc(doc(db, 'consultations', cons.id), cons);
  };

  const updateConsultation = async (id: string, data: Partial<Consultation>) => {
    await updateDoc(doc(db, 'consultations', id), data);
  };

  const deleteOrder = async (id: string) => {
    const order = orders.find(o => o.id === id);
    if (order && order.status !== 'cancelled') {
      for (const item of order.products) {
        const prodDoc = await getDoc(doc(db, 'products', item.product.id));
        if (prodDoc.exists()) {
          const product = prodDoc.data() as Product;
          const newStock = (product.stock || 0) + item.quantity;
          await updateDoc(doc(db, 'products', item.product.id), { 
             stock: newStock,
             inStock: newStock > 0
          });
        }
      }
      
      // Decrement counter if the deleted order was marked as delivered
      if (order.status === 'delivered') {
        const currentOrdersCount = branding?.totalOrdersCount || 0;
        await updateDoc(doc(db, 'branding', 'main'), { totalOrdersCount: Math.max(0, currentOrdersCount - 1) });
      }
    }
    
    await deleteDoc(doc(db, 'orders', id));
  };

  const setPromoCodes = async (action: React.SetStateAction<PromoCode[]>) => {
    const next = typeof action === 'function' ? action(promoCodes) : action;
    for (const p of next) {
      await setDoc(doc(db, 'promo_codes', p.id), p);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (e) {
      console.error('Failed to delete product from Firestore:', e);
      // Optimistically remove locally so admin sees immediate effect
      setProductsState(prev => (prev || []).filter(p => p.id !== id));
      try { localStorage.setItem('qaaf_products_cache', JSON.stringify((products || []).filter(p => p.id !== id))); } catch {}
      if (typeof window !== 'undefined') alert('فشل حذف المنتج من الخادم؛ تم إخفاؤه محلياً مؤقتاً.');
    }
  };

  const addStaff = async (member: StaffMember) => {
    const staffWithId = {
      ...member,
      id: member.id || Date.now().toString(),
    };
    await setDoc(doc(db, 'staff', staffWithId.id), staffWithId);
  };

  const updateStaff = async (member: StaffMember) => {
    await updateDoc(doc(db, 'staff', member.id), member as any);
  };

  const deleteStaff = async (id: string) => {
    await deleteDoc(doc(db, 'staff', id));
  };

  const addManufacturingRequest = async (req: ManufacturingRequest) => {
    await setDoc(doc(db, 'manufacturing_requests', req.id), req);
  };

  const updateManufacturingRequest = async (id: string, data: Partial<ManufacturingRequest>) => {
    await updateDoc(doc(db, 'manufacturing_requests', id), data);
  };

  const deleteManufacturingRequest = async (id: string) => {
    await deleteDoc(doc(db, 'manufacturing_requests', id));
  };

  const addReview = async (review: Review) => {
    try {
      const cleanReview = {
        id: review.id || Date.now().toString(),
        customerName: review.customerName || 'عميل مجهول',
        rating: review.rating || 5,
        comment: review.comment || '',
        date: review.date || new Date().toISOString(),
        isApproved: review.isApproved ?? false
      };
      
      // Optimistic update so it shows instantly in the Admin Panel
      setReviewsState(prev => [cleanReview, ...(prev || [])]);
      
      await setDoc(doc(db, 'reviews', String(cleanReview.id)), cleanReview);
      console.log("Review added successfully:", cleanReview.id);
    } catch (error) {
      console.error("Error adding review to Firebase:", error);
      throw error;
    }
  };

  const updateReview = async (id: string, data: Partial<Review>) => {
    try {
      // Optimistic update for instant UI feedback
      setReviewsState(prev => prev.map(r => r.id === String(id) ? { ...r, ...data } : r));
      
      const docRef = doc(db, 'reviews', String(id));
      await updateDoc(docRef, data);
      console.log("Review updated successfully:", id);
    } catch (error) {
      console.error("Error updating review:", error);
      throw error;
    }
  };

  const deleteReview = async (id: string) => {
    const review = reviews.find(r => r.id === id || r.id === String(id));
    if (review?.isApproved) {
      console.warn("Cannot delete an approved review.");
      return;
    }
    
    // Optimistic update
    setReviewsState(prev => prev.filter(r => r.id !== String(id) && r.id !== id));
    await deleteDoc(doc(db, 'reviews', String(id)));
  };

  const staffLogin = async (id: string) => {
    const member = staff.find(s => s.id === id);
    if (member) {
      setCurrentStaff(member);
      await updateDoc(doc(db, 'staff', id), { isOnline: true, lastActive: new Date().toISOString() });
    }
  };

  const currentTheme = useMemo((): ThemeConfig => {
    const baseTheme = THEMES.find(t => t.id === branding?.templateId) || THEMES[0];
    return {
      id: branding?.templateId || baseTheme.id,
      name: baseTheme.name,
      description: baseTheme.description,
      primaryColor: branding?.primaryColor || baseTheme.primaryColor,
      secondaryColor: branding?.secondaryColor || baseTheme.secondaryColor,
      fontFamily: language === 'en' ? (branding?.englishFont || 'Inter') : (branding?.fontFamily || 'Cairo'),
      borderRadius: branding?.borderRadius || baseTheme.borderRadius,
      headerStyle: branding?.headerStyle || baseTheme.headerStyle,
      cardStyle: branding?.cardStyle || baseTheme.cardStyle,
      heroLayout: branding?.heroLayout || baseTheme.heroLayout,
      productGridLayout: branding?.productGridLayout || baseTheme.productGridLayout,
      aboutLayout: branding?.aboutLayout || baseTheme.aboutLayout,
      productDetailLayout: branding?.productDetailLayout || baseTheme.productDetailLayout,
      accentColor: branding?.accentColor || baseTheme.accentColor || '#e11d48'
    };
  }, [branding, language]);

  return (
    <AppContext.Provider value={{
      branding: displayBranding, setBranding,
      orders, setOrders: setOrdersState as any, addOrder,
      products: displayProducts, setProducts,
      cart, setCart: setCartState,
      wishlist, setWishlist,
      userRating, setUserRating: setRatingState,
      adminAuth, setAdminAuth,
      isLoggedIn, setIsLoggedIn,
      language, setLanguage: setLanguageState,
      isTranslating,
      promoCodes, setPromoCodes,
      validatePromoCode: (code) => promoCodes.find(p => p.code === code) || null,
      appliedPromo, setAppliedPromo,
      customers, setCustomers: setCustomersState,
      consultations, setConsultations: setConsultationsState,
      supportTickets, setSupportTickets: setSupportTicketsState,
      createSupportTicket, addSupportMessage, assignSupportTicket, resolveSupportTicket, closeSupportTicket, getSupportQueueStatus, findPendingOrderMatch,
      manufacturingRequests, setManufacturingRequests: setManufacturingRequestsState,
      staff, setStaff: setStaffState,
      addStaff, updateStaff, deleteStaff,
      currentStaff, setCurrentStaff,
      staffLogin,
      theme: currentTheme,
      resetBranding: () => setBranding(defaultBranding),
      deleteOrder, deleteProduct, updateOrderStatus,
      updateOrderAssignment, updateOrderShippingFee,
      addToCart, removeFromCart, updateCartQuantity,
      addManufacturingRequest, updateManufacturingRequest, deleteManufacturingRequest,
      salaryRecords, setSalaryRecords: setSalaryRecordsState,
      addConsultation, updateConsultation, updateProductStock,
      reviews, setReviews: setReviewsState,
      addReview, updateReview, deleteReview,
      initialLoading, t,
      firestoreOk, lastRemoteUpdate, lastWriteError
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
