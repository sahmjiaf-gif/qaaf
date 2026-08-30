import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../state';
import { translations } from '../translations';
import { Home as HomeIcon, ShoppingCart, ShoppingBag, Facebook, Instagram, MessageCircle, CheckCircle2, X, Trash2, MapPin, Phone, User, Tag, ChevronRight, ChevronLeft, ShieldCheck, Truck, Heart, Star, Ban, Menu, Globe, Droplet, Music2, Minus, Plus, Search, Quote, MessageSquare, Zap } from 'lucide-react';
import { Product, Order, Offer } from '../types';
import { egyptLocations } from '../egyptLocations';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import Invoice from '../components/Invoice';

const TypewriterText = ({ text, className = "" }: { text: string, className?: string }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setDisplayedText("");
    setIndex(0);
  }, [text]);

  useEffect(() => {
    if (index < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText((prev) => prev + text[index]);
        setIndex((prev) => prev + 1);
      }, 20);
      return () => clearTimeout(timer);
    }
  }, [index, text]);

  return <p className={`${className} border-r-2 border-[#c5a059] pr-1 animate-pulse`}>{displayedText}</p>;
};

const Logo = ({ className = "", variant = "auto" }: { className?: string, variant?: "light" | "dark" | "auto" }) => {
  const { branding, language, theme, scrolled } = useApp();
  const t = translations[language] || translations.ar;

  // Determine text color based on variant and scroll state
  const isDarkBg = variant === "light" || (!scrolled && variant === "auto");
  const textColor = isDarkBg ? "text-white" : "text-black";
  const subTextColor = isDarkBg ? "text-white/60" : "text-gray-400";

  if (branding?.logoImage) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <img
          src={branding.logoImage}
          alt="Logo"
          style={{ width: `clamp(${(branding.logoSize || 100) * 0.7}px, 11vw, ${(branding.logoSize || 100) * 1.1}px)`, height: `clamp(${(branding.logoSize || 100) * 0.7}px, 11vw, ${(branding.logoSize || 100) * 1.1}px)` }}
          className="block rounded-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center justify-center select-none">
        <div className="flex items-center justify-center" style={{
          fontFamily: theme?.fontFamily || 'Cairo',
          background: '#36070a',
          width: 'clamp(72px, 18vw, 96px)',
          minHeight: 'clamp(72px, 18vw, 96px)',
          padding: '0.18rem',
          borderRadius: '9999px',
          overflow: 'hidden',
          boxShadow: '0 0 0 1px rgba(243,239,233,0.15)',
        }}>
          <div className="flex flex-col items-center justify-center text-center leading-none" style={{ transform: 'translateY(1px)' }}>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif',
              lineHeight: 0.7,
              fontSize: 'clamp(1.43rem, 3.51vw, 3.51rem)',
              letterSpacing: '-0.12em',
              fontWeight: 400,
              color: '#f3efe9',
            }}>
              {branding?.logoTitle || 'قاف'}
            </div>
            <div style={{
              fontFamily: 'Amiri, serif',
              lineHeight: 0.82,
              fontSize: 'clamp(0.845rem, 2.21vw, 1.365rem)',
              letterSpacing: '0.02em',
              fontWeight: 400,
              color: '#f3efe9',
              marginTop: '0.22em',
            }}>
              قاف
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const OfferCountdown = ({ expiryDate, language }: { expiryDate: string, language: string }) => {
  const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);

  useEffect(() => {
    const calculate = () => {
      const difference = new Date(expiryDate).getTime() - new Date().getTime();
      if (difference <= 0) return null;

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    };

    setTimeLeft(calculate());
    const timer = setInterval(() => {
      const remaining = calculate();
      if (!remaining) clearInterval(timer);
      setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [expiryDate]);

  if (!timeLeft) return null;

  return (
    <div className={`flex gap-4 md:gap-6 ${language === 'ar' ? 'flex-row' : 'flex-row-reverse'}`}>
      {[
        { label: language === 'ar' ? 'يوم' : 'Days', value: timeLeft.days },
        { label: language === 'ar' ? 'ساعة' : 'Hrs', value: timeLeft.hours },
        { label: language === 'ar' ? 'دقيقة' : 'Min', value: timeLeft.minutes },
        { label: language === 'ar' ? 'ثانية' : 'Sec', value: timeLeft.seconds }
      ].map((unit, i) => (
        <div key={i} className="flex flex-col items-center group">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 w-16 h-16 md:w-24 md:h-24 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center shadow-2xl transition-all duration-500 group-hover:bg-amber-600 group-hover:border-amber-400 group-hover:scale-110">
            <span className="text-2xl md:text-5xl font-black text-white tracking-tighter">{unit.value.toString().padStart(2, '0')}</span>
          </div>
          <span className="mt-4 text-[8px] md:text-[10px] font-black text-white/40 uppercase tracking-[0.3em] group-hover:text-amber-400 transition-colors">{unit.label}</span>
        </div>
      ))}
    </div>
  );
};

const Countdown = ({ expiryDate, language }: { expiryDate: string, language: string }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(expiryDate).getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [expiryDate]);

  const units: any = {
    days: language === 'ar' ? 'يوم' : 'D',
    hours: language === 'ar' ? 'ساعة' : 'H',
    minutes: language === 'ar' ? 'دقيقة' : 'M',
    seconds: language === 'ar' ? 'ثانية' : 'S'
  };

  return (
    <div className="flex gap-2" dir="ltr">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} className="flex flex-col items-center">
          <div className="bg-black/60 backdrop-blur-md text-white w-10 h-10 rounded-lg flex items-center justify-center text-xs font-black border border-white/20">
            {value.toString().padStart(2, '0')}
          </div>
          <span className="text-[7px] font-bold text-white/60 mt-1 uppercase tracking-tighter">{units[unit]}</span>
        </div>
      ))}
    </div>
  );
};

const ProductCard = ({
  product,
  language,
  t,
  handleAddToCart,
  theme,
  getBorderRadius,
  index
}: {
  product: Product,
  language: string,
  t: any,
  handleAddToCart: (p: Product) => void,
  theme: any,
  getBorderRadius: any,
  index: number
}) => {
  const { branding } = useApp();
  const discountPercent = product.isOnSale && product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  return (
    <div className={`animate-entrance stagger-${(index % 4) + 1} group bg-white rounded-2xl overflow-hidden border border-gray-100/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all duration-500 hover:shadow-[0_15px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1`}>
      <Link to={`/product/${product.id}`} className="block">
        {/* Image wrapper with portrait 3:4 aspect ratio */}
        <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />

          {/* Elegant Circular Red Sticker Discount Badge */}
          {discountPercent > 0 && (
            <div className="absolute top-3 left-3 z-20">
              <div className="w-10 h-10 bg-[#b81c25] text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-lg uppercase tracking-tighter">
                -{discountPercent}%
              </div>
            </div>
          )}

          <img
            src={product.image}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
            alt={product.name}
          />
          
          {((product.stock ?? 0) <= 0 || !product.inStock) && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-20">
              <span className="bg-black text-white px-4 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-lg">
                {language === 'ar' ? 'نفذت الكمية' : 'Out of Stock'}
              </span>
            </div>
          )}
        </div>

        {/* Product Details Section */}
        <div className="p-4 md:p-5 space-y-3 text-right" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <div>
            {product.categoryId && branding?.categories && (
              <span className="text-[10px] font-medium text-[#8e8e8e] uppercase tracking-wider block mb-1">
                {branding.categories.find(c => c.id === product.categoryId)?.name}
              </span>
            )}
            <h3 className="text-[14px] md:text-[15px] font-bold text-[#1c1c1c] tracking-tight leading-tight line-clamp-1">{product.name}</h3>
          </div>

          <div className="flex items-baseline gap-2.5 pt-1 justify-start">
            {product.isOnSale && product.salePrice ? (
              <>
                <span className="text-base font-black text-[#b81c25]">{product.salePrice} {t.egp}</span>
                <span className="text-[11px] text-[#a8a8a8] line-through font-normal">{product.price} {t.egp}</span>
              </>
            ) : (
              <span className="text-base font-black text-[#b81c25]">{product.price} {t.egp}</span>
            )}
          </div>

          {/* Premium Pill Black Select Options Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              if ((product.stock ?? 0) <= 0) return;
              handleAddToCart(product);
            }}
            disabled={(product.stock ?? 0) <= 0}
            style={{
              backgroundColor: (product.stock ?? 0) > 0 ? (branding?.primaryColor || theme?.primaryColor || '#1c1c1c') : undefined
            }}
            className={`w-full py-3 mt-2 rounded-full font-bold text-[10px] uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 shadow-sm ${(product.stock ?? 0) > 0
              ? 'text-white hover:opacity-90 hover:shadow-md active:scale-95'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
          >
            <ShoppingBag size={12} strokeWidth={2} />
            {(product.stock ?? 0) > 0 
              ? (language === 'ar' ? 'إضافة للسلة' : 'Select Options') 
              : (language === 'ar' ? 'غير متوفر' : 'Out of Stock')}
          </button>
        </div>
      </Link>
    </div>
  );
};


const Home: React.FC = () => {
  const { branding, orders, products: contextProducts, cart, setCart, addOrder, addToCart, removeFromCart, updateCartQuantity, wishlist, setWishlist, userRating, setUserRating, language, setLanguage, isTranslating, validatePromoCode, appliedPromo, setAppliedPromo, theme, reviews, addReview, initialLoading, createSupportTicket, findPendingOrderMatch, addSupportMessage, closeSupportTicket, staff, getSupportQueueStatus, validateShippingProof, supportTickets } = useApp();
  const t = (translations as any)[language || 'ar'] || translations.ar;
  const [toast, setToast] = useState<{ show: boolean, message: string }>({ show: false, message: '' });
  const [showCart, setShowCart] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState<{ show: boolean, type: 'shipping' | 'refund' | 'about' }>({ show: false, type: 'shipping' });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const [newReview, setNewReview] = useState({ rating: 5, customerName: '', comment: '' });
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [isOrderAnimating, setIsOrderAnimating] = useState(false);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<any>(null);
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState<Order | null>(null);
  const [showBot, setShowBot] = useState(false);
  const [botStep, setBotStep] = useState<'welcome' | 'name' | 'phone' | 'shipping_question' | 'paid_question' | 'proof' | 'active' | 'closed'>('welcome');
  const [botIssueType, setBotIssueType] = useState<'shipping' | 'general' | 'unknown'>('unknown');
  const [botAlreadyPaid, setBotAlreadyPaid] = useState<'yes' | 'no' | 'unknown'>('unknown');
  const [botMessages, setBotMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string }>>([
    { sender: 'bot', text: 'مرحباً بك في قاف 👋\nأولاً: اكتب اسمك الكامل، ثم رقم التواصل.' }
  ]);
  const [botName, setBotName] = useState('');
  const [botPhone, setBotPhone] = useState('');
  const [botDetails, setBotDetails] = useState('');
  const [botImage, setBotImage] = useState<string | null>(null);
  const [botTicketId, setBotTicketId] = useState<string | null>(null);
  const [botSubmitting, setBotSubmitting] = useState(false);

  useEffect(() => {
    const phone = botPhone.replace(/\D/g, '');
    const matchingTicket = supportTickets.find(ticket => {
      if (botTicketId && ticket.id === botTicketId) return true;
      if (!phone) return false;
      return ticket.phone === phone && !ticket.isClosed;
    });

    if (matchingTicket && matchingTicket.id !== botTicketId) {
      setBotTicketId(matchingTicket.id);
    }

    if (matchingTicket && matchingTicket.messages?.length) {
      const remoteMessages = matchingTicket.messages.map(message => ({
        sender: message.sender === 'customer' ? 'user' : 'bot',
        text: message.text
      }));

      setBotMessages(prev => {
        const prevTextSet = new Set(prev.map(item => `${item.sender}:${item.text}`));
        const newMessages = remoteMessages.filter(item => !prevTextSet.has(`${item.sender}:${item.text}`));
        return newMessages.length ? [...prev, ...newMessages] : prev;
      });
    }
  }, [supportTickets, botPhone, botTicketId]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Professional SEO & Favicon Sync
  useEffect(() => {
    if (branding?.siteTitle) {
      document.title = branding.siteTitle;
    }
    if (branding?.siteDescription) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', branding.siteDescription);
    }
    if (branding?.favicon) {
      let link: any = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = branding.favicon;
    }
  }, [branding]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.1 });

    const observeElements = () => {
      document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    };

    observeElements();
    return () => observer.disconnect();
  }, [initialLoading, selectedCategory, contextProducts]);

  const approvedReviews = (reviews || []).filter(r => r.isApproved);
  const sliderItems = branding?.slider && branding.slider.length > 0 ? branding.slider.filter(s => s.image || s.mobileImage) : [];

  const validHeroImage = branding?.heroImage && branding.heroImage !== 'undefined' && branding.heroImage !== 'null' ? branding.heroImage : null;

  const filteredProducts = selectedCategory
    ? contextProducts.filter(p => p.categoryId === selectedCategory)
    : contextProducts;

  const currentCategoryName = selectedCategory
    ? branding?.categories?.find(c => c.id === selectedCategory)?.name
    : null;

  useEffect(() => {
    if (sliderItems.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => {
        if (Number.isNaN(prev)) return 0;
        return (prev + 1) % sliderItems.length;
      });
    }, 6000);
    return () => clearInterval(timer);
  }, [sliderItems.length]);

  // Auto-slide for Reviews
  useEffect(() => {
    if (approvedReviews.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentReviewIndex((prev) => (prev + 1) % approvedReviews.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [approvedReviews.length]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBotImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      if (result) {
        if (botStep === 'shipping_question' || botStep === 'paid_question' || botStep === 'proof' || botStep === 'details') {
          setBotImage(result);
          setBotMessages(prev => [...prev, { sender: 'user', text: 'تمت إضافة صورة' }]);
        } else {
          setBotImage(result);
          setBotMessages(prev => [...prev, { sender: 'user', text: 'تمت إضافة صورة في الرسالة' }]);
        }
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleBotSubmit = async () => {
    if (botStep === 'welcome') {
      setBotStep('name');
      setBotMessages([{ sender: 'bot', text: 'أهلاً، ما هو اسم حضرتك بالكامل؟' }]);
      return;
    }

    if (botStep === 'name') {
      if (!botName.trim()) {
        setBotMessages(prev => [...prev, { sender: 'bot', text: 'يرجى كتابة الاسم أولاً.' }]);
        return;
      }
      setBotStep('phone');
      setBotMessages(prev => [...prev, { sender: 'user', text: botName.trim() }, { sender: 'bot', text: 'شكراً، الآن اكتب رقم التواصل الخاص بك.' }]);
      return;
    }

    if (botStep === 'phone') {
      const cleanPhone = botPhone.replace(/\D/g, '');
      if (!cleanPhone || cleanPhone.length < 9) {
        setBotMessages(prev => [...prev, { sender: 'bot', text: 'يرجى كتابة رقم صحيح للتواصل.' }]);
        return;
      }

      setBotStep('shipping_question');
      setBotMessages(prev => [...prev, { sender: 'user', text: botPhone }, { sender: 'bot', text: 'هل الرسالة متعلقة بدفع التوصيل أم بشيء آخر؟ اكتب: توصيل / دفع / غير ذلك.' }]);
      return;
    }

    if (botStep === 'shipping_question') {
      const directText = (botDetails || '').trim();
      if (!directText) {
        setBotMessages(prev => [...prev, { sender: 'bot', text: 'يرجى الإجابة على السؤال أولاً.' }]);
        return;
      }

      const lower = directText.toLowerCase();
      const isShippingQuestion = /(توصيل|شحن|shipping|delivery|delivery fee|شحنة|دفع التوصيل|دفع الشحن)/i.test(lower) || /(دفع|payment|pay)/i.test(lower) && /(توصيل|شحن|shipping|delivery)/i.test(lower);

      if (!isShippingQuestion) {
        const cleanPhone = botPhone.replace(/\D/g, '');
        setBotSubmitting(true);
        const queueStatus = getSupportQueueStatus();
        const ticket = await createSupportTicket({
          customerName: botName.trim(),
          phone: cleanPhone,
          message: `الرسالة غير متعلقة بالدفع أو الشحن - ${directText}`,
          imageUrl: botImage || undefined,
          messages: [{
            id: `bot-${Date.now()}`,
            sender: 'customer',
            text: directText || 'رسالة مباشرة من البوت',
            imageUrl: botImage || undefined,
            createdAt: new Date().toISOString()
          }]
        });

        setBotTicketId(ticket?.id || null);
        const waitingCount = queueStatus.totalWaiting + 1;
        const supportMessage = ticket
          ? `تم تحويلك لخدمة العملاء مباشرةً ✅\nعدد الأشخاص أمامك الآن: ${waitingCount}\nسيتم التواصل معك فوراً.`
          : 'تم تحويلك لخدمة العملاء مباشرةً ✅\nسيتم التواصل معك فوراً.';

        setBotMessages(prev => [...prev, { sender: 'user', text: directText }, { sender: 'bot', text: supportMessage }]);
        setBotStep('active');
        setBotSubmitting(false);
        setBotDetails('');
        setBotImage(null);
        return;
      }

      setBotIssueType('shipping');
      setBotStep('paid_question');
      setBotMessages(prev => [...prev, { sender: 'user', text: directText }, { sender: 'bot', text: 'هل قمت بدفع رسوم التوصيل بالفعل؟' }]);
      setBotDetails('');
      return;
    }

    if (botStep === 'paid_question') {
      const answer = (botDetails || '').trim();
      if (!answer) {
        setBotMessages(prev => [...prev, { sender: 'bot', text: 'يرجى الإجابة بنعم أو لا.' }]);
        return;
      }

      const lower = answer.toLowerCase();
      const paid = /(نعم|yes|اه|ok|تم|paid|دفع)/i.test(lower);
      const notPaid = /(لا|no|ليس|ما|لم|not yet|not)/i.test(lower);

      if (!paid && !notPaid) {
        setBotMessages(prev => [...prev, { sender: 'bot', text: 'الرجاء الإجابة بنعم أو لا فقط.' }]);
        return;
      }

      if (paid) {
        setBotAlreadyPaid('yes');
        setBotStep('proof');
        setBotMessages(prev => [...prev, { sender: 'user', text: answer }, { sender: 'bot', text: 'حسناً، أرسل صورة التحويل وبيانات الطلب أو رقم الطلب، وسنقوم بتأكيد الدفع تلقائياً.' }]);
        setBotDetails('');
        return;
      }

      setBotAlreadyPaid('no');
      const cleanPhone = botPhone.replace(/\D/g, '');
      const queueStatus = getSupportQueueStatus();
      setBotSubmitting(true);
      const ticket = await createSupportTicket({
        customerName: botName.trim(),
        phone: cleanPhone,
        message: `العميل لم يدفع رسوم التوصيل بعد - تحويل مباشر لخدمة العملاء`,
        imageUrl: botImage || undefined,
        messages: [{
          id: `bot-${Date.now()}`,
          sender: 'customer',
          text: 'لم يتم الدفع بعد - تحويل لخدمة العملاء',
          imageUrl: botImage || undefined,
          createdAt: new Date().toISOString()
        }]
      });
      setBotTicketId(ticket?.id || null);
      const waiting = Math.max(queueStatus.totalWaiting + 1, 1);
      setBotMessages(prev => [...prev, { sender: 'user', text: answer }, { sender: 'bot', text: `تم تحويلك لخدمة العملاء مباشرةً ✅\nعدد الأشخاص أمامك الآن: ${waiting}\nسيتم التواصل معك فوراً.` }]);
      setBotStep('active');
      setBotSubmitting(false);
      setBotDetails('');
      setBotImage(null);
      return;
    }

    if (botStep === 'proof') {
      const trimmedDetails = botDetails.trim();
      if (!trimmedDetails && !botImage) {
        setBotMessages(prev => [...prev, { sender: 'bot', text: 'يرجى إرفاق صورة التحويل أو كتابة بيانات الطلب قبل الإرسال.' }]);
        return;
      }

      setBotSubmitting(true);
      const cleanPhone = botPhone.replace(/\D/g, '');
      const validation = await validateShippingProof({
        phone: cleanPhone,
        name: botName.trim(),
        text: trimmedDetails || `اسم: ${botName.trim()}\nرقم: ${cleanPhone}`,
        imageUrl: botImage || undefined,
        senderPhone: cleanPhone
      });

      const finalMessage = validation.approved
        ? `تم تأكيد الدفع بنجاح ✅\nالمبلغ المدفوع: ${validation.amount ?? 0} جنيه\nتم تفعيل الطلب تلقائياً.`
        : `تم استلام صورة التحويل ✅\nلكن المبلغ المدفوع (${validation.amount ?? 0}) أقل من رسوم الشحن (${validation.requiredFee ?? 0})\nتم تسجيل ملاحظة على الطلب: الدفع غير مكتمل.`;

      setBotMessages(prev => [
        ...prev,
        { sender: 'user', text: trimmedDetails || (botImage ? 'إرفاق صورة التحويل' : 'تم إرسال تفاصيل الطلب') },
        { sender: 'bot', text: finalMessage }
      ]);

      setBotStep('active');
      setBotSubmitting(false);
      setBotDetails('');
      setBotImage(null);
      return;
    }

    if (botStep === 'active' && botTicketId) {
      const text = botDetails.trim();
      if (!text && !botImage) {
        setBotMessages(prev => [...prev, { sender: 'bot', text: 'اكتب رسالة أو أضف صورة قبل الإرسال.' }]);
        return;
      }

      setBotSubmitting(true);
      const messageText = text || 'تم إرسال صورة';
      await addSupportMessage(botTicketId, {
        sender: 'customer',
        text: messageText,
        imageUrl: botImage || undefined
      });

      setBotMessages(prev => [...prev, { sender: 'user', text: messageText }, { sender: 'bot', text: 'تم إرسال رسالتك لخدمة العملاء، وسيقوم الفريق بالرد عليك قريباً.' }]);
      setBotDetails('');
      setBotImage(null);
      setBotSubmitting(false);
      return;
    }

    if (botStep === 'closed') {
      setBotStep('welcome');
      setBotMessages([{ sender: 'bot', text: 'مرحباً بك في قاف 👋\nأولاً: اكتب اسمك الكامل، ثم رقم التواصل.' }]);
      setBotName('');
      setBotPhone('');
      setBotDetails('');
      setBotImage(null);
      setBotTicketId(null);
      setBotIssueType('unknown');
      setBotAlreadyPaid('unknown');
      return;
    }
  };

  const handleCloseBotChat = async () => {
    if (!botTicketId) {
      setBotStep('closed');
      setBotMessages(prev => [...prev, { sender: 'bot', text: 'تم إغلاق المحادثة. يمكنك بدء محادثة جديدة في أي وقت.' }]);
      return;
    }

    await closeSupportTicket(botTicketId, 'customer', 'تم إغلاق المحادثة من العميل.');
    setBotStep('closed');
    setBotMessages(prev => [...prev, { sender: 'bot', text: 'تم إغلاق المحادثة. يمكنك بدء محادثة جديدة في أي وقت.' }]);
  };

  const handleAddToCart = (product: Product, isOffer: boolean = false) => {
    // Always use the latest product from context to get real-time stock
    const contextProduct = contextProducts.find(p => p.id === product.id);
    
    // If it's an offer, we force the passed salePrice and isOnSale
    let latestProduct = contextProduct ? { ...contextProduct } : { ...product };
    if (isOffer) {
      latestProduct.isOnSale = true;
      latestProduct.salePrice = product.salePrice;
      latestProduct.price = product.price;
      // In case it's a mocked product with no real stock but offer has stock
      if (!contextProduct) {
        latestProduct.inStock = true;
        latestProduct.stock = product.stock ?? 999;
      }
    } else {
      latestProduct = contextProduct || product;
    }

    if (!latestProduct.inStock || (latestProduct.stock ?? 0) <= 0) {
      setToast({ show: true, message: language === 'ar' ? 'عذراً، هذا المنتج غير متوفر حالياً' : 'Sorry, this product is out of stock' });
      setTimeout(() => setToast({ show: false, message: '' }), 3000);
      return;
    }
    addToCart(latestProduct);
    setToast({ show: true, message: t.addedToCart.replace('{name}', latestProduct.name) });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  const [customerInfo, setCustomerInfo] = useState({
    name: '', phone: '', governorate: '', area: '', city: '', street: '', landmark: ''
  });

  // Auto-fill customer data if they have previous orders
  useEffect(() => {
    if (customerInfo.phone.length === 11 && orders && orders.length > 0) {
      const lastOrder = [...orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .find(o => o.phoneNumber === customerInfo.phone);

      if (lastOrder) {
        setCustomerInfo(prev => ({
          ...prev,
          name: prev.name || lastOrder.customerName || '',
          governorate: prev.governorate || lastOrder.governorate || '',
          area: prev.area || lastOrder.city || '',
          street: prev.street || lastOrder.address || '',
          landmark: prev.landmark || lastOrder.landmark || ''
        }));
      }
    }
  }, [customerInfo.phone, orders]);

  const totalPrice = cart.reduce((sum, item) => {
    const product = item.product;
    const currentPrice = (product?.isOnSale && product?.salePrice) ? product.salePrice : (product?.price || 0);
    return sum + (currentPrice * (item.quantity || 1));
  }, 0);

  const getBorderRadius = (type: 'card' | 'button' | 'input') => {
    if (theme.borderRadius === 'none') return 'rounded-none';
    if (theme.borderRadius === 'sm') return 'rounded-sm';
    if (theme.borderRadius === 'md') return 'rounded-md';
    if (theme.borderRadius === 'lg') return type === 'card' ? 'rounded-[3rem]' : 'rounded-2xl';
    if (theme.borderRadius === 'full') return 'rounded-full';
    return 'rounded-[3rem]';
  };

  const submitOrder = async () => {
    // Validation
    if (!customerInfo.name || !customerInfo.name.trim()) {
      setToast({ show: true, message: 'يرجى إدخال الاسم' });
      setTimeout(() => setToast({ show: false, message: '' }), 3000);
      return;
    }
    if (!customerInfo.phone.startsWith('01') || customerInfo.phone.length !== 11) {
      setToast({ show: true, message: 'رقم الهاتف يجب أن يبدأ بـ 01 ويتكون من 11 رقم' });
      setTimeout(() => setToast({ show: false, message: '' }), 3000);
      return;
    }
    if (cart.length === 0) return;
    if (isOrderAnimating) return;

    setIsOrderAnimating(true);

    try {
      const { setDoc, doc, getFirestore } = await import('firebase/firestore');
      const { default: app } = await import('../firebase');
      const firestoreDb = getFirestore(app);

      const selectedGov = branding?.shippingFees?.[customerInfo.governorate];
      let shippingFee = (typeof selectedGov === 'object' ? (selectedGov as any).fee : selectedGov) || 0;

      // Calculate discount
      let discountAmount = appliedPromo
        ? (appliedPromo.discountType === 'percentage'
          ? Math.round((totalPrice * appliedPromo.discount) / 100)
          : appliedPromo.discount)
        : 0;

      let usedFlashOffer = false;
      if (branding?.flashLimitOffer?.isActive && branding.flashLimitOffer.currentCount < branding.flashLimitOffer.totalLimit) {
         usedFlashOffer = true;
         if (branding.flashLimitOffer.type === 'free_shipping') {
            shippingFee = 0;
         } else if (branding.flashLimitOffer.type === 'percentage') {
            discountAmount += Math.round((totalPrice * branding.flashLimitOffer.value) / 100);
         } else if (branding.flashLimitOffer.type === 'fixed') {
            discountAmount += branding.flashLimitOffer.value;
         }
      }

      const orderId = Date.now().toString();
      const orderData = {
        id: orderId,
        customerName: customerInfo.name.trim(),
        phoneNumber: customerInfo.phone,
        governorate: customerInfo.governorate || '',
        city: customerInfo.area || '',
        address: customerInfo.street || '',
        landmark: customerInfo.landmark || '',
        paymentMethod: 'vodafone_cash',
        paymentStatus: 'required',
        shippingFeePaid: false,
        shippingPaymentNote: 'معلق لحين دفع مبلغ التوصيل',
        products: cart.map(item => ({
          quantity: item.quantity,
          product: {
            id: item.product?.id || '',
            name: item.product?.name || '',
            price: item.product?.price || 0,
            salePrice: item.product?.salePrice || 0,
            isOnSale: item.product?.isOnSale || false,
            image: item.product?.image || '',
            category: item.product?.category || '',
          }
        })),
        status: 'pending',
        date: new Date().toISOString(),
        finalTotal: totalPrice,
        shippingFee: shippingFee,
        promoCode: appliedPromo?.code || (usedFlashOffer ? 'FLASH_OFFER' : ''),
        discountAmount: discountAmount || 0,
        flashOfferApplied: usedFlashOffer,
        waNotified: false,
        invoiceBase64: '',
      };

      await addOrder(orderData);
      console.log('✅ Order submitted via addOrder with ID:', orderId);

      setCart([]);
      setCustomerInfo({ name: '', phone: '', governorate: '', area: '', city: '', street: '', landmark: '' });
      setShowCheckout(false);
      setIsOrderAnimating(false);
      setLastPlacedOrder(orderData);

      const fullAddress = [
        orderData.governorate,
        orderData.city,
        orderData.address,
        orderData.landmark ? `بجوار ${orderData.landmark}` : ''
      ].filter(Boolean).join('، ');

      // 🧾 Generate invoice image using the unified <Invoice /> component
      const generateAndSaveInvoice = async () => {
        try {
          setActiveInvoiceOrder(orderData);
          await new Promise(resolve => setTimeout(resolve, 300));

          const element = document.querySelector('#temp-invoice-container #printable-invoice');
          if (!element) {
            console.warn('Could not find temp-invoice-container #printable-invoice element');
            setActiveInvoiceOrder(null);
            return;
          }

          const html2canvas = (await import('html2canvas')).default;
          const canvas = await html2canvas(element as HTMLElement, { 
            scale: 2, 
            useCORS: true, 
            backgroundColor: '#ffffff',
            logging: false 
          });

          setActiveInvoiceOrder(null);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
          const base64File = dataUrl.split(',')[1];

          await updateDoc(doc(db, 'orders', orderData.id), { invoiceBase64: base64File });
          console.log('✅ Invoice image successfully generated from component and saved to Firestore for order', orderData.id);
        } catch (err) {
          console.warn('Invoice generation failed:', err);
          setActiveInvoiceOrder(null);
        }
      };

      generateAndSaveInvoice();


    } catch (error: any) {
      console.error('❌ Order FAILED:', error);
      setIsOrderAnimating(false);
      setToast({ show: true, message: 'خطأ: ' + (error?.message || 'حاول مرة أخرى') });
      setTimeout(() => setToast({ show: false, message: '' }), 6000);
    }
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    submitOrder();
  };

  const scrollToProducts = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById('products');
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div
      style={{ fontFamily: theme.fontFamily }}
      className={`relative overflow-x-hidden min-h-screen flex flex-col bg-white ${branding?.showTexture ? 'brand-texture' : ''}`}
    >
      {/* Maintenance Mode Overlay */}
      {branding?.maintenanceMode && (
        <div className="fixed inset-0 z-[2000] bg-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-1000">
          <div className="max-w-md space-y-12">
            <Logo className="scale-150 mb-12" />
            <div className="space-y-6">
              <h2 className="text-3xl md:text-5xl font-black text-gray-900 serif leading-tight">نحن نطور عالمنا الجديد</h2>
              <p className="text-sm md:text-base text-gray-500 leading-relaxed italic">
                {language === 'ar'
                  ? 'انتظرونا قريباً.. نحن الآن بصدد تحديث مجموعتنا الجديدة لنقدم لكم أفضل تجربة للعناية بالبشرة.'
                  : 'Coming soon.. We are currently updating our collection to provide you with the best skincare experience.'}
              </p>
            </div>
            <div className="flex justify-center pt-8">
              <div className="w-12 h-1 bg-amber-600 animate-pulse rounded-full" />
            </div>
            <div className="pt-12 text-[10px] font-bold text-gray-400 tracking-[0.4em] uppercase">
              © {new Date().getFullYear()} {branding?.logoTitle || 'قاف'} WORLDWIDE
            </div>
          </div>
        </div>
      )}

      {/* Flash Limit Offer Bar — shown at very top */}
      {branding?.flashLimitOffer?.isActive && branding.flashLimitOffer.currentCount < branding.flashLimitOffer.totalLimit && (
        <div
          className="fixed top-0 left-0 right-0 z-[130] py-3 px-6 text-center shadow-lg bg-gradient-to-r from-red-600 via-red-500 to-amber-500 text-white cursor-pointer hover:opacity-95 transition-all"
          dir={language === 'ar' ? 'rtl' : 'ltr'}
          onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              <Zap size={16} fill="white" className="text-white animate-pulse shrink-0" />
              <span className="text-[11px] md:text-sm font-black tracking-wide">
                {language === 'ar' ? branding.flashLimitOffer.messageAr : branding.flashLimitOffer.messageEn}
              </span>
            </div>
            <div className="bg-white/25 border border-white/40 px-4 py-1 rounded-full text-[11px] font-black tracking-widest uppercase">
              {language === 'ar'
                ? `متبقي ${branding.flashLimitOffer.totalLimit - branding.flashLimitOffer.currentCount} فقط!`
                : `Only ${branding.flashLimitOffer.totalLimit - branding.flashLimitOffer.currentCount} left!`}
            </div>
          </div>
        </div>
      )}

      {/* Announcement Bar */}
      {branding?.showAnnouncement && (
        <div
          className={`fixed left-0 right-0 z-[120] py-2.5 px-4 text-center text-[9px] md:text-[11px] font-bold tracking-[0.2em] uppercase flex items-center justify-center gap-2 shadow-sm ${
            branding?.flashLimitOffer?.isActive && branding.flashLimitOffer.currentCount < branding.flashLimitOffer.totalLimit
              ? 'top-[44px] md:top-[48px]'
              : 'top-0'
          }`}
          style={{
            backgroundColor: branding.announcementBg || '#000',
            color: '#fff'
          }}
        >
          <span className="animate-pulse">{branding.announcementText}</span>
        </div>
      )}

      {/* Scroll Progress Bar */}
      {(() => {
        const hasFlash = branding?.flashLimitOffer?.isActive && branding.flashLimitOffer.currentCount < branding.flashLimitOffer.totalLimit;
        const hasAnnouncement = branding?.showAnnouncement;
        const topOffset = hasFlash && hasAnnouncement ? 'top-[82px] md:top-[86px]' : hasFlash ? 'top-[44px] md:top-[48px]' : hasAnnouncement ? 'top-[34px] md:top-[40px]' : 'top-0';
        return (
          <div className={`fixed left-0 right-0 h-1 bg-[#c5a059]/10 z-[110] origin-left ${topOffset}`}>
            <div className="h-full bg-[#c5a059] animate-scroll-progress" />
          </div>
        );
      })()}

      {toast.show && (
        <div className={`fixed right-4 z-[100] animate-in slide-in-from-right duration-300 ${
          (branding?.flashLimitOffer?.isActive && branding.flashLimitOffer.currentCount < branding.flashLimitOffer.totalLimit) || branding?.showAnnouncement ? 'top-32' : 'top-24'
        }`}>
          <div className="bg-white shadow-2xl border border-green-100 rounded-2xl p-4 flex items-center gap-4 min-w-[280px]">
            <div className={`${toast.message.includes('غير متوفر') ? 'bg-red-500' : 'bg-green-500'} p-2 rounded-full text-white`}>
              {toast.message.includes('غير متوفر') ? <Ban size={18} /> : <CheckCircle2 size={18} />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-800">{toast.message}</p>
            </div>
            <button onClick={() => setToast({ show: false, message: '' })} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {(() => {
        const hasFlash = branding?.flashLimitOffer?.isActive && branding.flashLimitOffer.currentCount < branding.flashLimitOffer.totalLimit;
        const hasAnnouncement = branding?.showAnnouncement;
        const navTop = hasFlash && hasAnnouncement ? 'top-[82px] md:top-[86px]' : hasFlash ? 'top-[44px] md:top-[48px]' : hasAnnouncement ? 'top-[34px] md:top-[40px]' : 'top-0';
        return (
      <nav className={`fixed w-full z-50 transition-all duration-700 ${navTop} ${scrolled ? 'py-3 nav-glass' : 'py-7 bg-transparent'}`}>
        <div className="max-w-[1800px] mx-auto px-8 md:px-14 flex items-center justify-between">
          <div className="flex items-center">
            <Logo className="scale-110" />
          </div>
          <div className="hidden md:flex gap-12 items-center">
            {[{ label: t.home, href: '/', onClick: undefined }, { label: t.shop, href: undefined, onClick: scrollToProducts }, { label: t.myOrders, href: '/my-orders', onClick: undefined }, { label: t.categories, href: undefined, onClick: () => document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' }) }].map((item, i) => (
              item.href
                ? <Link key={i} to={item.href} className={`text-[8px] font-bold tracking-[0.35em] uppercase transition-colors duration-300 hover:text-[#b8966e] ${scrolled ? 'text-[#2c2c2a]' : 'text-white/80'}`}>{item.label}</Link>
                : <button key={i} onClick={item.onClick} className={`text-[8px] font-bold tracking-[0.35em] uppercase transition-colors duration-300 hover:text-[#b8966e] ${scrolled ? 'text-[#2c2c2a]' : 'text-white/80'}`}>{item.label}</button>
            ))}
          </div>
          <div className="flex items-center gap-8">
            <div className="hidden lg:flex items-center gap-5">
              {branding?.socialLinks?.instagram && (
                <a href={branding.socialLinks.instagram.includes('http') ? branding.socialLinks.instagram : `https://instagram.com/${branding.socialLinks.instagram}`} target="_blank" rel="noopener noreferrer" className={`transition-all hover:scale-110 ${scrolled ? 'text-[#E4405F]' : 'text-white/70 hover:text-white'}`}>
                  <Instagram size={16} strokeWidth={1.5} />
                </a>
              )}
              {branding?.socialLinks?.facebook && (
                <a href={branding.socialLinks.facebook.includes('http') ? branding.socialLinks.facebook : `https://facebook.com/${branding.socialLinks.facebook}`} target="_blank" rel="noopener noreferrer" className={`transition-all hover:scale-110 ${scrolled ? 'text-[#1877F2]' : 'text-white/70 hover:text-white'}`}>
                  <Facebook size={16} strokeWidth={1.5} />
                </a>
              )}
              {branding?.socialLinks?.whatsapp && (
                <a href={`https://wa.me/${branding.socialLinks.whatsapp.startsWith('0') ? '2' + branding.socialLinks.whatsapp : branding.socialLinks.whatsapp}`} target="_blank" rel="noopener noreferrer" className={`transition-all hover:scale-110 ${scrolled ? 'text-[#25D366]' : 'text-white/70 hover:text-white'}`}>
                  <MessageCircle size={16} strokeWidth={1.5} />
                </a>
              )}
            </div>
            <button onClick={() => setShowCart(true)} className={`relative transition-all hover:opacity-60 ${scrolled ? 'text-[#1a1a18]' : 'text-white'}`}>
              <ShoppingBag size={20} strokeWidth={1.2} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#b8966e] text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            <button onClick={() => setShowMobileMenu(true)} className={`md:hidden ${scrolled ? 'text-[#1a1a18]' : 'text-white'}`}><Menu size={22} strokeWidth={1.2} /></button>
          </div>
        </div>
      </nav>
        );
      })()}

      {!selectedCategory && (
        <header className="relative overflow-hidden h-[100svh] md:h-[90vh] flex items-center justify-center bg-black">
          {theme.heroLayout === 'magazine' ? (
            <div className="w-full h-full flex flex-col items-center justify-center relative bg-black overflow-hidden">
              <div className="absolute inset-0 z-0 bg-gradient-to-br from-gray-900 via-black to-gray-900">
                {(sliderItems[currentSlide]?.image || sliderItems[currentSlide]?.mobileImage || validHeroImage) ? (
                  <>
                    <img 
                      src={sliderItems[currentSlide]?.image || sliderItems[currentSlide]?.mobileImage || validHeroImage} 
                      className={`w-full h-full object-cover object-top opacity-70 animate-slow-zoom ${sliderItems[currentSlide]?.mobileImage ? 'hidden md:block' : 'block'}`}
                      alt="Hero" 
                    />
                    {sliderItems[currentSlide]?.mobileImage && (
                        <img 
                          src={sliderItems[currentSlide].mobileImage} 
                          className="w-full h-full object-cover object-top opacity-70 animate-slow-zoom md:hidden"
                        alt="Hero Mobile" 
                      />
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 luxury-aura-bg opacity-30" />
                )}
              </div>
              <div className="relative z-10 text-center space-y-8 p-12">
                 <Logo className="scale-[2] shimmer-gold mx-auto" variant="light" />
                 <div className="gold-line-short mt-6 mb-2" />
                 <div className="space-y-5">
                    <h1 className="text-4xl md:text-7xl font-light text-white serif leading-tight tracking-[0.2em] uppercase" style={{fontFamily: 'Cormorant Garamond, serif'}}>{sliderItems[currentSlide]?.title}</h1>
                    <p className="text-white/50 text-base md:text-xl tracking-[0.4em] font-light uppercase">{sliderItems[currentSlide]?.subtitle}</p>
                 </div>
              </div>
            </div>
          ) : theme.heroLayout === 'split' ? (
            <div className="w-full h-full flex flex-col md:flex-row items-center bg-black">
              <div className="w-full md:w-1/2 h-full relative overflow-hidden bg-gray-900">
                {(sliderItems[currentSlide]?.image || sliderItems[currentSlide]?.mobileImage || validHeroImage) ? (
                  <>
                    <img 
                      src={sliderItems[currentSlide]?.image || sliderItems[currentSlide]?.mobileImage || validHeroImage} 
                      className={`w-full h-full object-cover object-top animate-slow-zoom ${sliderItems[currentSlide]?.mobileImage ? 'hidden md:block' : 'block'}`}
                      alt="Split Hero" 
                    />
                    {sliderItems[currentSlide]?.mobileImage && (
                      <img 
                        src={sliderItems[currentSlide].mobileImage} 
                        className="w-full h-full object-cover object-top animate-slow-zoom md:hidden"
                        alt="Split Hero Mobile" 
                      />
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 luxury-aura-bg opacity-20" />
                )}
              </div>
              <div className="w-full md:w-1/2 h-full bg-[#1a1814] flex items-center justify-center p-12">
                <div className="text-center space-y-8">
                   <Logo className="scale-150 shimmer-gold" variant="light" />
                   <div className="gold-line-short" />
                   <div className="space-y-5">
                      <h2 className="text-3xl md:text-5xl font-light text-white serif tracking-[0.15em]" style={{fontFamily: 'Cormorant Garamond, serif'}}>{sliderItems[currentSlide]?.title}</h2>
                      <p className="text-white/40 text-sm tracking-[0.3em] uppercase">{sliderItems[currentSlide]?.subtitle}</p>
                   </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full relative">
              {sliderItems.length === 0 && (
                <div className="absolute inset-0 bg-black flex items-center justify-center">
                  {validHeroImage ? (
                    <img src={validHeroImage} className="w-full h-full object-cover opacity-50" alt="Hero" />
                  ) : (
                    <div className="absolute inset-0 luxury-aura-bg opacity-30" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Logo className="scale-150 shimmer-text" variant="light" />
                  </div>
                </div>
              )}
              {sliderItems.map((slide, index) => {
                const isActive = index === currentSlide;
                const getFlexPos = (v?: string, h?: string) => {
                  const vMap: any = { top: 'justify-start', center: 'justify-center', bottom: 'justify-end' };
                  const hMap: any = { left: 'items-start text-left', center: 'items-center text-center', right: 'items-end text-right' };
                  return `${vMap[v || 'center']} ${hMap[h || 'center']}`;
                };

                return (
                  <div key={slide.id} className={`absolute inset-0 transition-all duration-[2000ms] ease-in-out ${isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <div className="absolute inset-0 overflow-hidden">
                      <img
                        src={slide.image || slide.mobileImage || validHeroImage}
                        className={`w-full h-full object-cover object-top transition-transform duration-[3000ms] ${isActive ? 'scale-100' : 'scale-105'} ${slide.mobileImage ? 'hidden md:block' : 'block'}`}
                        style={{
                          transform: `translateY(${scrolled ? (window.scrollY * 0.2) : 0}px) scale(${isActive ? 1 : 1.05})`,
                          transition: 'transform 0.5s cubic-bezier(0.33, 1, 0.68, 1)'
                        }}
                        alt={slide.title}
                      />
                      {slide.mobileImage && (
                        <img
                          src={slide.mobileImage}
                          className={`w-full h-full object-cover object-top transition-transform duration-[3000ms] ${isActive ? 'scale-100' : 'scale-105'} md:hidden`}
                          style={{
                            transform: `translateY(${scrolled ? (window.scrollY * 0.2) : 0}px) scale(${isActive ? 1 : 1.05})`,
                            transition: 'transform 0.5s cubic-bezier(0.33, 1, 0.68, 1)'
                          }}
                          alt={slide.title + " Mobile"}
                        />
                      )}
                    </div>
                    {/* Text Overlay */}
                    <div className={`absolute inset-0 z-10 flex flex-col p-5 sm:p-8 md:p-12 lg:p-16 xl:p-20 transition-all duration-1000 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${getFlexPos(slide.vPos, slide.hPos)}`}>
                      <div className="w-full max-w-[90vw] sm:max-w-[80vw] md:max-w-[70vw] lg:max-w-[62vw] xl:max-w-[58vw] px-1 md:px-2">
                        <div className="space-y-2 sm:space-y-3 md:space-y-4">
                          {slide.title && (
                            <h2
                              className="font-bold text-white drop-shadow-2xl serif leading-[0.95] tracking-[0.06em] sm:tracking-[0.1em] md:tracking-[0.12em]"
                              style={{
                                fontSize: `clamp(${Math.min(1.8, (slide.fontSize || 56) * 0.03)}rem, 4vw, ${(slide.fontSize || 56) * 0.8}px)`,
                                transform: `translateY(${scrolled ? (window.scrollY * -0.1) : 0}px)`
                              }}
                            >
                              {slide.title}
                            </h2>
                          )}
                          {slide.subtitle && (
                            <p className="text-white/80 font-medium uppercase drop-shadow-md tracking-[0.12em] sm:tracking-[0.15em] md:tracking-[0.18em]"
                              style={{
                                fontSize: 'clamp(0.65rem, 1.5vw, 1.35rem)'
                              }}
                            >
                              {slide.subtitle}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {sliderItems.length > 1 && (
                <div className="absolute bottom-12 left-0 right-0 z-20 flex justify-center items-center gap-3">
                  {sliderItems.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`h-[2px] transition-all duration-700 rounded-full ${i === currentSlide ? 'w-10 bg-[#c5a059]' : 'w-5 bg-gray-300 opacity-50 hover:opacity-100'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </header>
      )}

      {/* Categories Section */}
      {!selectedCategory && branding?.categories && branding.categories.length > 0 && (
        <section id="categories" className="py-32 bg-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-24 relative flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#c5a059] block mb-4">{t.categories}</span>
              <h2 className="text-3xl md:text-5xl font-light text-gray-900 serif leading-tight shimmer-text">{t.shopByCategory}</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {(branding?.categories || []).slice(0, 8).map((cat: any, idx: number) => (
                <div
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`group cursor-pointer relative overflow-hidden rounded-[2rem] aspect-[3/4] shadow-[0_15px_30px_-5px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_60px_-10px_rgba(197,160,89,0.25)] border border-gray-100/50 transition-all duration-700 reveal stagger-${(idx % 4) + 1}`}
                >
                  <img
                    src={cat.image}
                    className="w-full h-full object-cover transition-transform duration-[1800ms] ease-out group-hover:scale-110"
                    alt={cat.name}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-90 group-hover:opacity-95 transition-all duration-700" />
                  <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 flex flex-col items-center text-center z-10 space-y-2">
                    <span className="text-[8px] md:text-[9px] text-[#c5a059] font-black tracking-[0.4em] uppercase opacity-90 block">QAAF COLLECTION</span>
                    <h3 className="text-base md:text-lg font-bold text-white tracking-wider serif pb-2 relative after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-[2px] after:bg-[#c5a059] group-hover:after:w-10 after:transition-all after:duration-500">
                      {cat.name}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Offers Section */}
      {!selectedCategory && branding?.offers && branding.offers.some(o => o.isActive && (o.stock === undefined || o.stock > 0) && new Date(o.expiryDate) > new Date()) && (
        <section className="py-32 bg-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16 space-y-4">
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.4em] block">
                {language === 'ar' ? 'عروض لفترة محدودة' : 'LIMITED OFFERS'}
              </span>
              <h2 className="text-3xl md:text-5xl font-bold serif text-gray-900">
                {language === 'ar' ? 'اغتنمي الفرصة الآن' : 'Unmissable Deals'}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {branding.offers.filter(o => o.isActive && new Date(o.expiryDate) > new Date()).map((offer, idx) => (
                <div key={offer.id} className="relative aspect-[3/4] overflow-hidden group rounded-[2rem] shadow-xl border border-gray-100 flex flex-col">
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" />
                  
                  {/* Discount Badge */}
                  <div className="absolute top-4 right-4 z-20">
                    <div className="w-12 h-12 bg-red-600 text-white rounded-full flex flex-col items-center justify-center font-black shadow-lg uppercase tracking-tighter leading-none transform rotate-12 group-hover:rotate-0 transition-transform">
                      <span className="text-sm">-{Math.round(((offer.originalPrice - offer.salePrice) / offer.originalPrice) * 100)}%</span>
                    </div>
                  </div>

                  <img src={offer.image} className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105" alt={offer.productName} />
                  
                  {/* Elongated Offer Content (Bottom Overlay) */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6 space-y-4 z-20">
                    <div className="text-center space-y-1">
                      <h3 className="text-xl md:text-2xl font-bold text-white serif line-clamp-2">{offer.productName}</h3>
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-xl font-black text-amber-400">{offer.salePrice} {t.egp}</span>
                        <span className="text-sm text-white/50 line-through font-medium">{offer.originalPrice} {t.egp}</span>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/20">
                      <div className="flex justify-center">
                        <Countdown expiryDate={offer.expiryDate} language={language} />
                      </div>
                      <button
                        onClick={() => handleAddToCart({ id: offer.productId || offer.id, name: offer.productName, price: offer.originalPrice, salePrice: offer.salePrice, isOnSale: true, image: offer.image, stock: offer.stock } as any, true)}
                        style={{ backgroundColor: branding?.primaryColor || theme?.primaryColor || '#c5a059' }}
                        className="w-full py-4 text-white rounded-full text-[11px] font-bold uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
                      >
                        <ShoppingBag size={14} />
                        {language === 'ar' ? 'إضافة للسلة' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Products Section */}
      <section id="products" className="py-32 bg-[#fafafa]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24 space-y-6">
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em] mb-4 hover:opacity-70 transition-all flex items-center gap-2 mx-auto"
              >
                <ChevronLeft size={14} className="rotate-180" />
                {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
              </button>
            )}
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#c5a059] block">
              {selectedCategory ? currentCategoryName : t.shop}
            </span>
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 serif">
              {selectedCategory
                ? (language === 'ar' ? `مجموعة ${currentCategoryName}` : `${currentCategoryName} Collection`)
                : (language === 'ar' ? 'منتجاتنا المميزة' : 'Our Bestsellers')}
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  language={language}
                  t={t}
                  handleAddToCart={handleAddToCart}
                  theme={theme}
                  getBorderRadius={getBorderRadius}
                  index={idx}
                />
              ))
            ) : (
              <div className="col-span-full py-20 text-center space-y-4">
                <p className="text-gray-400 italic">{language === 'ar' ? 'لا توجد منتجات في هذا القسم حالياً' : 'No products found in this category'}</p>
                <button onClick={() => setSelectedCategory(null)} className="text-xs font-bold text-amber-600 border-b border-amber-600 pb-1 hover:opacity-70 transition-all">
                  {language === 'ar' ? 'عرض جميع المنتجات' : 'View all products'}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>



      {/* About Section */}
      {!selectedCategory && (branding?.aboutDescription || branding?.aboutImage) && (
        <section className="py-16 md:py-20 bg-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <div className={`flex flex-col ${branding?.aboutLayout === 'reversed' ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-16 md:gap-24`}>
              <div className="w-full md:w-1/2 relative group">
                <div className="absolute -inset-4 bg-amber-50 rounded-[3rem] -rotate-2 group-hover:rotate-0 transition-transform duration-700" />
                <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border border-white bg-gray-50">
                  {branding?.aboutImage && (
                    <img 
                      src={branding.aboutImage} 
                      className="w-full h-auto transition-transform duration-[2000ms] group-hover:scale-105" 
                      alt={branding?.aboutTitle || "About QAAF"} 
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              </div>
              <div className="w-full md:w-1/2 space-y-8 text-right">
                <div className="space-y-4">
                  <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.4em] block">
                    {language === 'ar' ? 'قصتنا' : 'OUR STORY'}
                  </span>
                  <h2 className="text-4xl md:text-6xl font-bold text-gray-900 serif leading-tight">
                    {branding?.aboutTitle || (language === 'ar' ? 'عن قاف' : 'About QAAF')}
                  </h2>
                </div>
                <div className="space-y-6">
                  <p className="text-lg md:text-xl text-gray-600 leading-relaxed italic serif whitespace-pre-line">
                    {branding?.aboutDescription || (language === 'ar' 
                      ? 'قاف هي علامة تجارية مصرية رائدة في مجال العناية بالبشرة، نؤمن بأن الجمال يبدأ من الطبيعة والوعي.' 
                      : 'QAAF is a leading Egyptian skincare brand, believing that beauty begins with nature and awareness.')}
                  </p>
                  {branding?.showTotalOrdersStat && (
                    <div className="pt-8 border-t border-gray-100 flex justify-end">
                      <div className="text-center group cursor-default">
                        <div className="text-4xl md:text-5xl font-black text-amber-600 mb-2 tracking-tighter transition-transform group-hover:scale-105">
                          +{branding?.totalOrdersCount?.toLocaleString('en-US') || 0}
                        </div>
                        <div className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest group-hover:text-amber-700 transition-colors">
                          {language === 'ar' ? 'طلب تم توصيله بنجاح' : 'ORDERS DELIVERED SUCCESSFULLY'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}



      <footer className="py-12 md:py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 items-center">
          <div className="flex flex-col items-center md:items-start gap-5 md:gap-6">
            <Logo className="scale-75 md:scale-90" />
            
            <div className="flex gap-3 md:gap-4">
              {branding?.socialLinks?.facebook && <a href={branding.socialLinks.facebook} target="_blank" className="p-2.5 bg-gray-50 rounded-full text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all"><Facebook size={18} /></a>}
              {branding?.socialLinks?.instagram && <a href={branding.socialLinks.instagram} target="_blank" className="p-2.5 bg-gray-50 rounded-full text-gray-400 hover:bg-pink-50 hover:text-pink-600 transition-all"><Instagram size={18} /></a>}
              {branding?.socialLinks?.tiktok && <a href={branding.socialLinks.tiktok} target="_blank" className="p-2.5 bg-gray-50 rounded-full text-gray-400 hover:bg-black hover:text-white transition-all"><Music2 size={18} /></a>}
              {branding?.socialLinks?.whatsapp && <a href={`https://wa.me/${branding.socialLinks.whatsapp}`} target="_blank" className="p-2.5 bg-gray-50 rounded-full text-gray-400 hover:bg-green-50 hover:text-green-600 transition-all"><MessageCircle size={18} /></a>}
            </div>

            <div className="flex gap-6 md:gap-8 text-[8px] md:text-[9px] font-bold text-black tracking-widest uppercase">
              <button onClick={() => setShowPolicyModal({ show: true, type: 'about' })} className="hover:text-[#c5a059] transition-colors">{language === 'ar' ? 'عن قاف' : 'ABOUT QAAF'}</button>
              <button onClick={() => setShowPolicyModal({ show: true, type: 'shipping' })} className="hover:text-[#c5a059] transition-colors">{language === 'ar' ? 'سياسة الشحن' : 'SHIPPING'}</button>
              <button onClick={() => setShowPolicyModal({ show: true, type: 'refund' })} className="hover:text-[#c5a059] transition-colors">{language === 'ar' ? 'سياسة الاسترجاع' : 'REFUND'}</button>
            </div>
          </div>

          <div className="text-center md:text-right space-y-4 md:space-y-5">
            <p className="text-[9px] md:text-[10px] font-bold text-gray-300 tracking-[0.32em] uppercase">© {new Date().getFullYear()} {branding?.logoTitle || 'قاف'} WORLDWIDE. ALL RIGHTS RESERVED.</p>
            <div className="pt-3 md:pt-4 border-t border-black inline-block">
              <Link
                to="/admin/login"
                className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-gray-50 hover:bg-[#c5a059] hover:text-white text-gray-400 rounded-full transition-all duration-500 group shadow-sm"
                title={t.adminPanel}
              >
                <ShieldCheck size={18} className="group-hover:scale-110 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Drawer Components remain the same */}
      {showCart && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-700">
            <div className="p-8 border-b flex items-center justify-between">
              <h3 className="text-xl serif italic">{t.cart}</h3>
              <button onClick={() => setShowCart(false)}><X size={24} strokeWidth={1} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                  <ShoppingBag size={48} strokeWidth={1} />
                  <p className="text-sm italic">{t.cartEmpty}</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product?.id} className="flex gap-6">
                    <img src={item.product?.image} className="w-20 h-24 object-cover bg-gray-50" alt={item.product?.name} />
                    <div className="flex-1 space-y-2">
                      <h4 className="text-sm font-medium">{item.product?.name}</h4>
                      <div className="text-xs text-gray-400">
                        {item.product?.isOnSale && item.product?.salePrice ? (
                          <div className="flex items-center gap-2">
                            <span className="text-amber-600 font-bold">{item.product.salePrice} {t.egp}</span>
                            <span className="line-through opacity-50">{item.product.price} {t.egp}</span>
                          </div>
                        ) : (
                          <span>{item.product?.price} {t.egp}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <button onClick={() => updateCartQuantity(item.product?.id || '', item.quantity - 1)} className="p-1 border rounded"><Minus size={12} /></button>
                        <span className="text-xs">{item.quantity}</span>
                        <button onClick={() => updateCartQuantity(item.product?.id || '', item.quantity + 1)} className="p-1 border rounded"><Plus size={12} /></button>
                      </div>
                    </div>
                    <button onClick={() => removeFromCart(item.product?.id || '')}><Trash2 size={16} className="text-gray-300 hover:text-red-500 transition" /></button>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-8 border-t space-y-6">
                <div className="flex justify-between text-lg font-medium">
                  <span>{t.total}</span>
                  <span>{totalPrice} {t.egp}</span>
                </div>
                <button 
                  onClick={() => setShowCheckout(true)} 
                  style={{ backgroundColor: branding?.primaryColor || theme?.primaryColor || '#000' }}
                  className="w-full py-5 text-white text-[10px] font-bold uppercase tracking-[0.4em] hover:opacity-90 transition"
                >
                  {t.confirmOrder}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showCheckout && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowCheckout(false)} />
          <form onSubmit={handleSubmitOrder} className="relative bg-white w-full max-w-2xl rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] p-10 md:p-16 space-y-12 animate-in zoom-in duration-500 max-h-[90vh] overflow-y-auto custom-scrollbar border border-white/20">
            <div className="text-center space-y-4">
              <div className="flex justify-center mb-6">
                <div className="w-12 h-1 bg-amber-200 rounded-full" />
              </div>
              <h3 className="text-5xl serif italic font-light text-gray-900">{t.checkout}</h3>
              <p className="text-[11px] text-amber-700 uppercase tracking-[0.5em] font-black">{language === 'ar' ? 'بيانات الشحن الفاخرة' : 'PREMIUM SHIPPING DETAILS'}</p>
            </div>

            <div className="space-y-8">
              {/* Name & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="group space-y-3 text-right">
                  <label className="text-[11px] font-black text-gray-400 group-focus-within:text-amber-600 uppercase tracking-widest px-1 transition-colors">{t.fullName}</label>
                  <input type="text" required placeholder={t.fullName} value={customerInfo.name} onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })} className="w-full bg-gray-50/50 border-b-2 border-gray-100 rounded-none px-0 py-4 text-gray-900 text-lg font-bold outline-none focus:border-amber-600 transition-all placeholder:text-gray-200" />
                </div>
                <div className="group space-y-3 text-right">
                  <label className="text-[11px] font-black text-gray-400 group-focus-within:text-amber-600 uppercase tracking-widest px-1 transition-colors">{t.phone}</label>
                  <input
                    type="tel"
                    required
                    pattern="01[0-9]{9}"
                    maxLength={11}
                    placeholder="01xxxxxxxxx"
                    value={customerInfo.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      if (val.length <= 11) setCustomerInfo({ ...customerInfo, phone: val });
                    }}
                    className="w-full bg-gray-50/50 border-b-2 border-gray-100 rounded-none px-0 py-4 text-gray-900 text-lg font-bold outline-none focus:border-amber-600 transition-all placeholder:text-gray-200"
                  />
                  <p className="text-[10px] text-amber-600 font-bold mt-2">
                    {language === 'ar' ? 'شرط يكون بادء ب 01 ويكونوا 11 رقم' : 'Condition: Must start with 01 and be 11 digits'}
                  </p>
                </div>
              </div>

              {/* Governorate & Markaz */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="group space-y-3 text-right">
                  <label className="text-[11px] font-black text-gray-400 group-focus-within:text-amber-600 uppercase tracking-widest px-1 transition-colors">
                    {language === 'ar' ? 'المحافظة' : 'Governorate'}
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={customerInfo.governorate}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, governorate: e.target.value, area: '' })}
                      className="w-full bg-transparent border-b-2 border-gray-100 rounded-none px-0 py-4 text-gray-900 text-lg font-bold outline-none focus:border-amber-600 transition-all cursor-pointer appearance-none"
                    >
                      <option value="">{t.governorate}</option>
                      {egyptLocations.map(loc => <option key={loc.governorate} value={loc.governorate}>{loc.governorate}</option>)}
                    </select>
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300">
                      <ChevronRight className="rotate-90" size={20} />
                    </div>
                  </div>
                </div>
                <div className="group space-y-3 text-right">
                  <label className="text-[11px] font-black text-gray-400 group-focus-within:text-amber-600 uppercase tracking-widest px-1 transition-colors">
                    {language === 'ar' ? 'المركز / القسم' : 'Center / Markaz'}
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={customerInfo.area}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, area: e.target.value })}
                      className="w-full bg-transparent border-b-2 border-gray-100 rounded-none px-0 py-4 text-gray-900 text-lg font-bold outline-none focus:border-amber-600 transition-all cursor-pointer appearance-none"
                      disabled={!customerInfo.governorate}
                    >
                      <option value="">{language === 'ar' ? 'اختر المركز' : 'Select Center'}</option>
                      {customerInfo.governorate && egyptLocations.find(l => l.governorate === customerInfo.governorate)?.cities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300">
                      <ChevronRight className="rotate-90" size={20} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Address */}
              <div className="group space-y-3 text-right">
                <label className="text-[11px] font-black text-gray-400 group-focus-within:text-amber-600 uppercase tracking-widest px-1 transition-colors">{language === 'ar' ? 'العنوان بالتفصيل' : 'Detailed Address'}</label>
                <input type="text" required placeholder={language === 'ar' ? 'اسم الشارع، رقم العقار، رقم الشقة' : 'Street name, Building No, Apartment No'} value={customerInfo.street} onChange={(e) => setCustomerInfo({ ...customerInfo, street: e.target.value })} className="w-full bg-transparent border-b-2 border-gray-100 rounded-none px-0 py-4 text-gray-900 text-lg font-bold outline-none focus:border-amber-600 transition-all placeholder:text-gray-200" />
              </div>

              {/* Landmark */}
              <div className="group space-y-3 text-right">
                <label className="text-[11px] font-black text-gray-400 group-focus-within:text-amber-600 uppercase tracking-widest px-1 transition-colors">{language === 'ar' ? 'علامة مميزة (اختياري)' : 'Landmark (Optional)'}</label>
                <input type="text" placeholder={language === 'ar' ? 'بجوار صيدلية، محل مشهور...' : 'Next to a pharmacy, shop...'} value={customerInfo.landmark} onChange={(e) => setCustomerInfo({ ...customerInfo, landmark: e.target.value })} className="w-full bg-transparent border-b-2 border-gray-100 rounded-none px-0 py-4 text-gray-900 text-lg font-bold outline-none focus:border-amber-600 transition-all placeholder:text-gray-200" />
              </div>

              {/* Promo Code */}
              <div className="pt-6">
                <div className="group space-y-3 text-right relative">
                  <label className="text-[11px] font-black text-amber-700 uppercase tracking-widest px-1">{language === 'ar' ? 'كود الخصم' : 'PROMO CODE'}</label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder={language === 'ar' ? 'أدخلي الكود هنا' : 'Enter code here'}
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      className="w-full bg-amber-50/30 border-2 border-amber-100 rounded-2xl px-6 py-5 text-gray-900 text-lg font-black outline-none focus:border-amber-500 focus:bg-white transition-all placeholder:text-amber-200/50 uppercase"
                    />
                    <button
                      type="button"
                      className="absolute left-3 px-6 py-2 bg-amber-600 text-white text-[10px] font-black rounded-xl hover:bg-black transition-all active:scale-95"
                    >
                      {language === 'ar' ? 'تفعيل' : 'APPLY'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-12 border-t border-gray-50 flex flex-col gap-4">
              {customerInfo.governorate && (
                <>
                  <div className="flex justify-between items-center text-gray-500 font-bold text-sm">
                    <span>{language === 'ar' ? 'سعر المنتجات' : 'Products Total'}</span>
                    <span>{totalPrice} {t.egp}</span>
                  </div>
                  {((typeof branding?.shippingFees?.[customerInfo.governorate] === 'object' ? branding?.shippingFees?.[customerInfo.governorate].fee : branding?.shippingFees?.[customerInfo.governorate]) || 0) > 0 && (
                    <div className="flex justify-between items-center text-gray-500 font-bold text-sm">
                      <span>{language === 'ar' ? 'مصاريف الشحن' : 'Shipping Fee'}</span>
                      <span>
                        {branding?.flashLimitOffer?.isActive && branding.flashLimitOffer.type === 'free_shipping' && branding.flashLimitOffer.currentCount < branding.flashLimitOffer.totalLimit ? (
                           <span className="text-green-600 line-through mr-2">{(typeof branding?.shippingFees?.[customerInfo.governorate] === 'object' ? branding?.shippingFees?.[customerInfo.governorate].fee : branding?.shippingFees?.[customerInfo.governorate])} {t.egp}</span>
                        ) : (
                           `${(typeof branding?.shippingFees?.[customerInfo.governorate] === 'object' ? branding?.shippingFees?.[customerInfo.governorate].fee : branding?.shippingFees?.[customerInfo.governorate])} ${t.egp}`
                        )}
                        {branding?.flashLimitOffer?.isActive && branding.flashLimitOffer.type === 'free_shipping' && branding.flashLimitOffer.currentCount < branding.flashLimitOffer.totalLimit && (
                           <span className="text-green-600 font-black text-xs mr-2">{language === 'ar' ? 'مجاناً (عرض)' : 'Free'}</span>
                        )}
                      </span>
                    </div>
                  )}

                  {/* Discout Summary */}
                  {(appliedPromo || (branding?.flashLimitOffer?.isActive && branding.flashLimitOffer.type !== 'free_shipping' && branding.flashLimitOffer.currentCount < branding.flashLimitOffer.totalLimit)) && (
                    <div className="flex justify-between items-center text-green-600 font-bold text-sm bg-green-50 p-3 rounded-xl">
                      <span>{language === 'ar' ? 'إجمالي الخصم' : 'Total Discount'}</span>
                      <span>
                        {(() => {
                           let totalDiscount = appliedPromo ? (appliedPromo.discountType === 'percentage' ? Math.round((totalPrice * appliedPromo.discount) / 100) : appliedPromo.discount) : 0;
                           if (branding?.flashLimitOffer?.isActive && branding.flashLimitOffer.type === 'percentage' && branding.flashLimitOffer.currentCount < branding.flashLimitOffer.totalLimit) {
                              totalDiscount += Math.round((totalPrice * branding.flashLimitOffer.value) / 100);
                           } else if (branding?.flashLimitOffer?.isActive && branding.flashLimitOffer.type === 'fixed' && branding.flashLimitOffer.currentCount < branding.flashLimitOffer.totalLimit) {
                              totalDiscount += branding.flashLimitOffer.value;
                           }
                           return totalDiscount;
                        })()} {t.egp}
                      </span>
                    </div>
                  )}

                  {branding?.shippingFees?.[customerInfo.governorate]?.days && (
                    <div className="flex justify-between items-center bg-amber-50 p-4 rounded-2xl text-amber-800 font-black text-xs">
                      <div className="flex items-center gap-2">
                        <Truck size={14} />
                        <span>{language === 'ar' ? 'يصل خلال:' : 'Delivered in:'}</span>
                      </div>
                      <span>{branding?.shippingFees?.[customerInfo.governorate].days} {language === 'ar' ? 'أيام' : 'Days'}</span>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{t.total}</span>
                  <span className="text-4xl font-black text-gray-900 tracking-tighter">
                    {(() => {
                        let finalShip = ((typeof branding?.shippingFees?.[customerInfo.governorate] === 'object' ? branding?.shippingFees?.[customerInfo.governorate].fee : branding?.shippingFees?.[customerInfo.governorate]) || 0);
                        let finalDiscount = appliedPromo ? (appliedPromo.discountType === 'percentage' ? Math.round((totalPrice * appliedPromo.discount) / 100) : appliedPromo.discount) : 0;
                        
                        if (branding?.flashLimitOffer?.isActive && branding.flashLimitOffer.currentCount < branding.flashLimitOffer.totalLimit) {
                           if (branding.flashLimitOffer.type === 'free_shipping') finalShip = 0;
                           if (branding.flashLimitOffer.type === 'percentage') finalDiscount += Math.round((totalPrice * branding.flashLimitOffer.value) / 100);
                           if (branding.flashLimitOffer.type === 'fixed') finalDiscount += branding.flashLimitOffer.value;
                        }
                        
                        return Math.max(0, totalPrice + finalShip - finalDiscount);
                    })()}
                    <span className="text-sm font-bold text-amber-600 ml-1">{t.egp}</span>
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1 text-right">
                  <div className="flex items-center gap-2 text-green-600">
                    <ShieldCheck size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{language === 'ar' ? 'دفع آمن' : 'SECURE PAYMENT'}</span>
                  </div>
                  <p className="text-[8px] text-gray-400 font-bold">{language === 'ar' ? 'الدفع عند الاستلام' : 'Cash on Delivery'}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center items-center w-full pt-6">
              <button
                type="button"
                onClick={submitOrder}
                className={`order ${isOrderAnimating ? 'animate' : ''}`}>
                <span className="default">{language === 'ar' ? 'أتمم استلام طلبك' : 'Complete your order'}</span>
                <span className="success">
                  <svg viewBox="0 0 12 10">
                    <polyline points="1.5 6 4.5 9 10.5 1"></polyline>
                  </svg>
                </span>
                <div className="box"></div>
                <div className="truck">
                  <div className="back"></div>
                  <div className="front">
                    <div className="window"></div>
                  </div>
                  <div className="light top"></div>
                  <div className="light bottom"></div>
                </div>
                <div className="lines"></div>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mobile Menu Drawer */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-[1000] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)} />
          <div className="relative w-[80%] max-w-sm bg-white h-full shadow-2xl p-12 flex flex-col animate-in slide-in-from-right duration-500">
            <button onClick={() => setShowMobileMenu(false)} className="absolute top-8 right-8 p-2 text-gray-400 hover:text-black">
              <X size={24} strokeWidth={1} />
            </button>

            <div className="mt-20 space-y-12 text-right">
              <div className="mb-16">
                <Logo className="scale-110 !items-end" />
              </div>

              <div className="flex flex-col gap-8 text-sm font-black text-gray-900 tracking-[0.3em] uppercase">
                <Link to="/" onClick={() => setShowMobileMenu(false)} className="hover:text-amber-600 transition-colors">{t.home}</Link>
                <button
                  onClick={(e) => { scrollToProducts(e as any); setShowMobileMenu(false); }}
                  className="text-right hover:text-amber-600 transition-colors uppercase"
                >
                  {t.shop}
                </button>
                <Link to="/my-orders" onClick={() => setShowMobileMenu(false)} className="hover:text-amber-600 transition-colors">{t.myOrders}</Link>
                <button
                  onClick={() => { document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' }); setShowMobileMenu(false); }}
                  className="text-right hover:text-amber-600 transition-colors uppercase"
                >
                  {t.categories}
                </button>
              </div>

              <div className="pt-12 border-t border-gray-50 flex flex-col gap-6 text-right">
                <p className="text-[9px] font-bold text-gray-400 tracking-[0.3em] uppercase">تواصل معنا</p>
                <div className="flex justify-end gap-6">
                  {branding?.socialLinks?.instagram && (
                    <a href={branding.socialLinks.instagram.includes('http') ? branding.socialLinks.instagram : `https://instagram.com/${branding.socialLinks.instagram}`} target="_blank" rel="noopener noreferrer" className="p-3 bg-pink-50 text-[#E4405F] rounded-full shadow-[0_0_15px_rgba(228,64,95,0.2)] active:scale-90 transition-all">
                      <Instagram size={20} strokeWidth={2.5} />
                    </a>
                  )}
                  {branding?.socialLinks?.facebook && (
                    <a href={branding.socialLinks.facebook.includes('http') ? branding.socialLinks.facebook : `https://facebook.com/${branding.socialLinks.facebook}`} target="_blank" rel="noopener noreferrer" className="p-3 bg-blue-50 text-[#1877F2] rounded-full shadow-[0_0_15px_rgba(24,119,242,0.2)] active:scale-90 transition-all">
                      <Facebook size={20} strokeWidth={2.5} />
                    </a>
                  )}
                  {branding?.socialLinks?.whatsapp && (
                    <a href={`https://wa.me/${branding.socialLinks.whatsapp.startsWith('0') ? '2' + branding.socialLinks.whatsapp : branding.socialLinks.whatsapp}`} target="_blank" rel="noopener noreferrer" className="p-3 bg-green-50 text-[#25D366] rounded-full shadow-[0_0_15px_rgba(37,211,102,0.2)] active:scale-90 transition-all">
                      <MessageCircle size={20} strokeWidth={2.5} />
                    </a>
                  )}
                  {branding?.socialLinks?.tiktok && (
                    <a href={branding.socialLinks.tiktok.includes('http') ? branding.socialLinks.tiktok : `https://tiktok.com/@${branding.socialLinks.tiktok}`} target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-50 text-black rounded-full shadow-[0_0_15px_rgba(0,0,0,0.1)] active:scale-90 transition-all">
                      <Music2 size={20} strokeWidth={2.5} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBot && (
        <div className="fixed bottom-20 left-4 z-[2000] w-[340px] max-w-[calc(100vw-24px)] rounded-[28px] border border-stone-200 bg-white shadow-[0_30px_80px_rgba(0,0,0,0.2)] overflow-hidden">
          <div className="flex items-center justify-between bg-[#29130b] px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#f5d18b] text-[#29130b] flex items-center justify-center font-black">Q</div>
              <div>
                <p className="text-sm font-black">مساعد قاف</p>
                <p className="text-[10px] text-white/70">خدمة العملاء</p>
              </div>
            </div>
            <button onClick={() => setShowBot(false)} className="text-white/80 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div className="bg-[#faf7f3] px-3 py-3 space-y-2 max-h-[280px] overflow-y-auto">
            {botMessages.map((msg, index) => (
              <div key={`${msg.sender}-${index}`} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-6 ${msg.sender === 'user' ? 'bg-[#29130b] text-white' : 'bg-white text-stone-700 border border-stone-200'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {botStep === 'closed' ? (
            <div className="border-t border-stone-200 bg-white p-3 space-y-3">
              <p className="text-sm text-stone-600">تم إغلاق المحادثة. يمكنك بدء محادثة جديدة.</p>
              <button onClick={() => { setBotStep('welcome'); setBotMessages([{ sender: 'bot', text: 'مرحباً بك في قاف 👋\nأولاً: اكتب اسمك الكامل، ثم رقم التواصل، ثم اشرح طلبك أو أرفق صورة.' }]); setBotName(''); setBotPhone(''); setBotDetails(''); setBotImage(null); setBotTicketId(null); }} className="w-full rounded-2xl bg-[#29130b] text-white py-3 text-sm font-black">ابدأ محادثة جديدة</button>
            </div>
          ) : botStep !== 'active' && botStep !== 'shipping_question' && botStep !== 'paid_question' && botStep !== 'proof' && botStep !== 'details' ? (
            <div className="border-t border-stone-200 bg-white p-3 space-y-3">
              {botStep === 'welcome' && (
                <button onClick={handleBotSubmit} className="w-full rounded-2xl bg-[#29130b] text-white py-3 text-sm font-black">ابدأ المحادثة</button>
              )}
              {botStep === 'name' && (
                <input value={botName} onChange={(e) => setBotName(e.target.value)} placeholder="اكتب اسمك بالكامل" className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-[#29130b]" />
              )}
              {botStep === 'phone' && (
                <input value={botPhone} onChange={(e) => setBotPhone(e.target.value)} placeholder="اكتب رقم التواصل" className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-[#29130b]" />
              )}

              {(botStep === 'name' || botStep === 'phone') && (
                <button disabled={botSubmitting} onClick={handleBotSubmit} className="w-full rounded-2xl bg-[#c5a059] text-[#29130b] py-3 text-sm font-black disabled:opacity-60">
                  {botSubmitting ? 'جاري الإرسال...' : 'إرسال'}
                </button>
              )}
            </div>
          ) : (
            <div className="border-t border-stone-200 bg-white p-3 space-y-3">
              {(botStep === 'shipping_question' || botStep === 'paid_question' || botStep === 'proof') && (
                <>
                  <textarea
                    value={botDetails}
                    onChange={(e) => setBotDetails(e.target.value)}
                    rows={3}
                    placeholder={
                      botStep === 'shipping_question'
                        ? 'اكتب: توصيل / دفع / غير ذلك'
                        : botStep === 'paid_question'
                          ? 'اكتب نعم أو لا'
                          : 'اكتب بيانات الطلب أو ارفق صورة التحويل'
                    }
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-[#29130b] resize-none"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2 rounded-xl border border-dashed border-stone-300 px-3 py-2 text-xs font-bold text-stone-600 cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" onChange={handleBotImageUpload} />
                      <span>{botStep === 'proof' ? 'إرفاق صورة التحويل' : 'إرفاق صورة'}</span>
                    </label>
                    <button disabled={botSubmitting} onClick={handleBotSubmit} className="flex-1 rounded-2xl bg-[#c5a059] text-[#29130b] py-2.5 text-sm font-black disabled:opacity-60">
                      {botSubmitting ? 'جاري الإرسال...' : 'إرسال'}
                    </button>
                  </div>
                  {botImage && <img src={botImage} alt="Bot attachment" className="max-h-28 rounded-xl object-contain border border-stone-200" />}
                </>
              )}

              {botStep === 'active' && (
                <>
                  <textarea value={botDetails} onChange={(e) => setBotDetails(e.target.value)} rows={2} placeholder="اكتب رسالتك هنا..." className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-[#29130b] resize-none" />
                  <div className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2 rounded-xl border border-dashed border-stone-300 px-3 py-2 text-xs font-bold text-stone-600 cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" onChange={handleBotImageUpload} />
                      <span>إضافة صورة</span>
                    </label>
                    <button disabled={botSubmitting} onClick={handleBotSubmit} className="flex-1 rounded-2xl bg-[#29130b] text-white py-2.5 text-sm font-black disabled:opacity-60">
                      {botSubmitting ? 'جاري الإرسال...' : 'إرسال'}
                    </button>
                  </div>
                  <button onClick={handleCloseBotChat} className="w-full rounded-xl border border-red-200 bg-red-50 text-red-700 py-2 text-xs font-black">إغلاق المحادثة</button>
                  {botImage && <img src={botImage} alt="Bot attachment" className="max-h-28 rounded-xl object-contain border border-stone-200" />}
                </>
              )}
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => {
          setShowBot(true);
          if (botStep === 'welcome') {
            setBotMessages([{ sender: 'bot', text: 'مرحباً بك في قاف 👋\nأرسل اسمه الكامل ثم رقم التواصل، وسنقلك لخدمة العملاء في الحال.' }]);
          }
        }}
        className="fixed bottom-5 left-5 z-[1500] h-16 w-16 rounded-full bg-[#29130b] shadow-[0_20px_40px_rgba(0,0,0,0.25)] text-white flex items-center justify-center hover:scale-105 transition-all"
        aria-label="Open support bot"
      >
        <MessageCircle size={26} />
      </button>

      {showPolicyModal.show && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowPolicyModal({ ...showPolicyModal, show: false })} />
          <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-12 overflow-hidden animate-in zoom-in duration-500 max-h-[85vh] flex flex-col">
            <button
              onClick={() => setShowPolicyModal({ ...showPolicyModal, show: false })}
              className="absolute top-8 right-8 p-2 text-gray-400 hover:text-black transition-colors"
            >
              <X size={24} strokeWidth={1} />
            </button>

            <div className="text-center mb-10">
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.4em] mb-2 block">
                {showPolicyModal.type === 'about' ? (language === 'ar' ? 'قصتنا' : 'OUR STORY') :
                  showPolicyModal.type === 'shipping' ? (language === 'ar' ? 'التوصيل' : 'SHIPPING') :
                    (language === 'ar' ? 'الاسترجاع' : 'RETURNS')}
              </span>
              <h3 className="text-3xl md:text-4xl font-bold serif text-gray-900">
                {showPolicyModal.type === 'about' ? (branding?.aboutTitle || (language === 'ar' ? 'عن قاف' : 'About QAAF')) :
                  showPolicyModal.type === 'shipping' ? (language === 'ar' ? 'سياسة الشحن' : 'Shipping Policy') :
                    (language === 'ar' ? 'سياسة الاسترجاع' : 'Refund Policy')}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar text-right space-y-6">
              {showPolicyModal.type === 'about' ? (
                <div className="space-y-6 text-gray-600 leading-relaxed whitespace-pre-line">
                  {branding?.aboutImage && (
                    <div className="w-full aspect-[16/9] rounded-3xl overflow-hidden mb-6 shadow-lg border border-gray-100">
                       <img src={branding.aboutImage} className="w-full h-full object-cover" alt={branding?.aboutTitle || "About QAAF"} />
                    </div>
                  )}
                  <p>
                    {branding?.aboutDescription || (language === 'ar' 
                      ? 'قاف هي علامة تجارية مصرية رائدة في مجال العناية بالبشرة، نؤمن بأن الجمال يبدأ من الطبيعة والوعي. منتجاتنا مصممة بأعلى معايير الجودة لتناسب احتياجات بشرتك الفريدة، مع التركيز على المكونات الآمنة والنتائج الحقيقية.' 
                      : 'QAAF is a leading Egyptian skincare brand, believing that beauty begins with nature and awareness. Our products are designed with the highest quality standards to suit your unique skin needs.')}
                  </p>
                  {!branding?.aboutImage && (
                    <div className="pt-8 border-t border-gray-50 flex justify-center">
                      <Logo className="opacity-20 grayscale" />
                    </div>
                  )}
                </div>
              ) : showPolicyModal.type === 'shipping' ? (
                <div className="space-y-4 text-gray-600">
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <h4 className="font-bold text-gray-900 mb-2">{language === 'ar' ? 'مدة التوصيل' : 'Delivery Time'}</h4>
                    <p className="text-sm">{language === 'ar' ? 'يتم التوصيل خلال 2-5 أيام عمل لجميع المحافظات.' : 'Delivery takes 2-5 business days to all governorates.'}</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <h4 className="font-bold text-gray-900 mb-2">{language === 'ar' ? 'تكلفة الشحن' : 'Shipping Cost'}</h4>
                    <p className="text-sm">{language === 'ar' ? 'يتم حساب تكلفة الشحن عند إتمام الطلب بناءً على المحافظة.' : 'Shipping cost is calculated at checkout based on your governorate.'}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-gray-600">
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <h4 className="font-bold text-gray-900 mb-2">{language === 'ar' ? 'شروط الاسترجاع' : 'Return Conditions'}</h4>
                    <p className="text-sm">{language === 'ar' ? 'يمكن استبدال أو استرجاع المنتج في حال وجود عيب صناعة أو خطأ في الطلب خلال 14 يوماً.' : 'Products can be exchanged or returned in case of manufacturing defects or order errors within 14 days.'}</p>
                  </div>
                  <p className="text-xs italic text-amber-600/60 text-center pt-4">
                    {language === 'ar' ? '* يجب أن يكون المنتج في حالته الأصلية وبتغليفه الأصلي.' : '* Product must be in original condition and packaging.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {lastPlacedOrder && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setLastPlacedOrder(null)} />
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] p-10 space-y-8 animate-in zoom-in duration-500 text-center border border-white/20" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500">
                <CheckCircle2 size={48} />
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl serif italic font-light text-gray-900">
                {language === 'ar' ? 'تم استلام طلبك بنجاح! 🎉' : 'Order Placed Successfully! 🎉'}
              </h3>
              <p className="text-sm text-gray-500 font-bold">
                {language === 'ar' 
                  ? `شكراً لتسوقك معنا. رقم طلبك هو #${lastPlacedOrder.id.slice(-6).toUpperCase()}` 
                  : `Thank you for shopping with us. Order ID is #${lastPlacedOrder.id.slice(-6).toUpperCase()}`}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-right space-y-3 text-sm text-amber-900">
              <p className="font-black text-xs uppercase tracking-[0.2em] text-amber-700">{language === 'ar' ? 'دفع مبلغ التوصيل' : 'Shipping payment required'}</p>
              <p className="font-bold">{language === 'ar' ? 'يجب تحويل مبلغ التوصيل أولاً قبل تنفيذ الطلب' : 'Shipping amount must be transferred before execution'}</p>
              <div className="flex items-center justify-between gap-3 bg-white/80 rounded-xl px-3 py-2 border border-amber-100">
                <span className="font-black text-lg">{(Number(lastPlacedOrder.shippingFee || 0))} {language === 'ar' ? 'ج.م' : 'EGP'}</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(String(lastPlacedOrder.shippingFee || 0))}
                  className="px-3 py-2 bg-amber-600 text-white text-[10px] font-black rounded-lg tracking-widest uppercase"
                >
                  {language === 'ar' ? 'نسخ' : 'Copy'}
                </button>
              </div>
              <div className="flex items-center justify-between gap-3 bg-white/80 rounded-xl px-3 py-2 border border-amber-100">
                <span className="font-black text-sm">{branding?.contactNumber || '01000000000'}</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(String(branding?.contactNumber || '01000000000'))}
                  className="px-3 py-2 bg-slate-900 text-white text-[10px] font-black rounded-lg tracking-widest uppercase"
                >
                  {language === 'ar' ? 'نسخ الرقم' : 'Copy Number'}
                </button>
              </div>
              <p className="text-[11px] text-amber-700 font-bold">
                {language === 'ar' ? 'بعد التحويل، سيتم تأكيد الطلب تلقائياً عبر قسم إثبات الدفع.' : 'After transfer, the order will be confirmed through the payment proof section.'}
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <Link
                to={`/my-orders?phone=${lastPlacedOrder.phoneNumber}`}
                onClick={() => setLastPlacedOrder(null)}
                className="w-full py-4 bg-amber-600 hover:bg-black text-white text-xs font-black rounded-2xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                style={{ backgroundColor: branding?.primaryColor || theme?.primaryColor || '#c5a059' }}
              >
                <span>{language === 'ar' ? '📦 تتبع طلبك' : '📦 Track Your Order'}</span>
              </Link>
              <Link
                to={`/my-orders?phone=${lastPlacedOrder.phoneNumber}&cancel=${lastPlacedOrder.id}`}
                onClick={() => setLastPlacedOrder(null)}
                className="w-full py-4 border-2 border-red-100 hover:bg-red-50 text-red-600 text-xs font-black rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span>{language === 'ar' ? '❌ إلغاء طلبك' : '❌ Cancel Your Order'}</span>
              </Link>
            </div>

            <button
              onClick={() => setLastPlacedOrder(null)}
              className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-black transition"
            >
              {language === 'ar' ? 'العودة للتسوق' : 'Back to Shopping'}
            </button>
          </div>
        </div>
      )}

      {/* Temporary Invoice rendering element for generating invoice image screenshot */}
      {activeInvoiceOrder && (
        <div id="temp-invoice-container" style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '320px', zIndex: -1000 }}>
          <Invoice order={activeInvoiceOrder} />
        </div>
      )}
    </div>
  );
};

export default Home;
