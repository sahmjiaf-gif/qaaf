import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../state';
import { translations } from '../translations';
import { ShoppingCart, ArrowRight, Minus, Plus, CheckCircle2, X, Ban, Droplet, Heart, Share2, Globe, Menu, ShieldCheck, ShoppingBag, Trash2, Truck, Music2, Facebook, Instagram, MessageCircle, ChevronRight } from 'lucide-react';
import { Product, Order } from '../types';
import { egyptLocations } from '../egyptLocations';
import Invoice from '../components/Invoice';

const Logo = ({ className = "" }: { className?: string }) => {
  const { branding, language, theme } = useApp();
  const t = translations[language];
  
  if (branding?.logoImage) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="flex items-center justify-center rounded-full border border-gray-200 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.08)] p-1.5">
          <img
            src={branding.logoImage}
            alt="Logo"
            style={{ width: `clamp(${(branding.logoSize || 100) * 0.7}px, 11vw, ${(branding.logoSize || 100) * 1.1}px)`, height: `clamp(${(branding.logoSize || 100) * 0.7}px, 11vw, ${(branding.logoSize || 100) * 1.1}px)` }}
            className="rounded-full object-cover block"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center leading-none ${className}`} style={{ fontFamily: theme.fontFamily }}>
      <div className="relative">
        <Droplet className="text-yellow-400 fill-yellow-400 absolute -top-4 left-1/2 -translate-x-1/2" size={18} />
        <h1 className="text-3xl font-bold tracking-tight text-black pt-1">{branding?.logoTitle || 'قاف'}</h1>
      </div>
      <span className="text-[7px] font-bold tracking-[0.3em] text-gray-400 mt-1 uppercase">{t.evidenceBased}</span>
    </div>
  );
};

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    products, branding, addToCart, wishlist, setWishlist, language, setLanguage, 
    isTranslating, validatePromoCode, appliedPromo, setAppliedPromo, theme, initialLoading,
    cart, setCart, addOrder, updateCartQuantity, removeFromCart, orders
  } = useApp();
  const t = translations[language];
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [promoInput, setPromoInput] = useState('');
  const [toast, setToast] = useState<{ show: boolean, message: string }>({ show: false, message: '' });
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');

  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    governorate: '',
    area: '',
    city: '',
    street: '',
    landmark: ''
  });
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);
  const [isOrderAnimating, setIsOrderAnimating] = useState(false);
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState<Order | null>(null);
  const [showPolicyModal, setShowPolicyModal] = useState<{ show: boolean, type: 'shipping' | 'refund' | 'about' }>({ show: false, type: 'about' });

  const getBorderRadius = (type: 'card' | 'button' | 'input') => {
    if (theme.borderRadius === 'none') return 'rounded-none';
    if (theme.borderRadius === 'sm') return 'rounded-sm';
    if (theme.borderRadius === 'md') return 'rounded-md';
    if (theme.borderRadius === 'lg') return type === 'card' ? 'rounded-[2.5rem]' : 'rounded-2xl';
    if (theme.borderRadius === 'full') return 'rounded-full';
    return 'rounded-2xl';
  };

  useEffect(() => {
    if (initialLoading) return;
    const foundProduct = products.find(p => p.id === id);
    if (foundProduct) {
      setProduct(foundProduct);
    } else {
      navigate('/');
    }
  }, [id, products, navigate, initialLoading]);

  // Auto-fill customer data if they have previous orders (keyed off phone number to prevent privacy leaks)
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

  if (!product) return null;

  const currentUnitPrice = product.isOnSale && product.salePrice ? product.salePrice : product.price;
  const originalUnitPrice = product.price;

  const totalPrice = currentUnitPrice * quantity;
  const discountAmount = appliedPromo 
    ? (appliedPromo.discountType === 'percentage' ? (totalPrice * appliedPromo.discount) / 100 : appliedPromo.discount)
    : 0;
  const finalPrice = Math.max(0, totalPrice - discountAmount);

  // Cart total price and count calculations
  const cartTotalPrice = cart.reduce((sum, item) => {
    const p = item.product;
    const currentPrice = (p?.isOnSale && p?.salePrice) ? p.salePrice : (p?.price || 0);
    return sum + (currentPrice * (item.quantity || 1));
  }, 0);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleApplyPromo = () => {
    const promo = validatePromoCode(promoInput);
    if (promo) {
      setAppliedPromo(promo);
      setToast({ show: true, message: t.discountApplied });
      setTimeout(() => setToast({ show: false, message: '' }), 3000);
    } else {
      setToast({ show: true, message: t.invalidPromo });
      setTimeout(() => setToast({ show: false, message: '' }), 3000);
    }
  };

  const handleAddToCart = () => {
    // Get latest product from context to ensure real-time stock limits
    const latestProduct = products.find(p => p.id === product.id) || product;
    
    if (!latestProduct.inStock || (latestProduct.stock ?? 0) <= 0) {
      setToast({ show: true, message: language === 'ar' ? 'عذراً، هذا المنتج غير متوفر حالياً' : 'Sorry, this product is out of stock' });
      setTimeout(() => setToast({ show: false, message: '' }), 3000);
      return;
    }

    if (latestProduct.sizes && latestProduct.sizes.length > 0 && !selectedSize) {
      setToast({ show: true, message: language === 'ar' ? 'يرجى اختيار المقاس' : 'Please select a size' });
      setTimeout(() => setToast({ show: false, message: '' }), 3000);
      return;
    }

    if (latestProduct.colors && latestProduct.colors.length > 0 && !selectedColor) {
      setToast({ show: true, message: language === 'ar' ? 'يرجى اختيار اللون' : 'Please select a color' });
      setTimeout(() => setToast({ show: false, message: '' }), 3000);
      return;
    }
    
    addToCart(product, quantity, selectedSize, selectedColor);
    
    // Automatically open the cart drawer so the item appears instantly
    setShowCart(true);
    
    setToast({ show: true, message: t.addedQuantityToCart.replace('{quantity}', quantity.toString()).replace('{name}', product.name) });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  const toggleWishlist = (productId: string) => {
    if (wishlist.includes(productId)) {
      setWishlist(prev => prev.filter(item => item !== productId));
    } else {
      setWishlist(prev => [...prev, productId]);
    }
  };

  const isWishlisted = wishlist.includes(product.id);

  const submitOrder = async () => {
    // Validation
    if (!customerInfo.name || !customerInfo.name.trim()) {
      setToast({ show: true, message: language === 'ar' ? 'يرجى إدخال الاسم' : 'Please enter full name' });
      setTimeout(() => setToast({ show: false, message: '' }), 3000);
      return;
    }
    if (!customerInfo.phone.startsWith('01') || customerInfo.phone.length !== 11) {
      setToast({ show: true, message: language === 'ar' ? 'رقم الهاتف يجب أن يبدأ بـ 01 ويتكون من 11 رقم' : 'Phone number must start with 01 and be 11 digits' });
      setTimeout(() => setToast({ show: false, message: '' }), 3000);
      return;
    }
    if (!customerInfo.governorate) {
      setToast({ show: true, message: language === 'ar' ? 'يرجى اختيار المحافظة' : 'Please select governorate' });
      setTimeout(() => setToast({ show: false, message: '' }), 3000);
      return;
    }
    if (!customerInfo.area) {
      setToast({ show: true, message: language === 'ar' ? 'يرجى اختيار المركز / القسم' : 'Please select area/center' });
      setTimeout(() => setToast({ show: false, message: '' }), 3000);
      return;
    }
    if (!customerInfo.street) {
      setToast({ show: true, message: language === 'ar' ? 'يرجى إدخال العنوان بالتفصيل' : 'Please enter detailed address' });
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
          ? Math.round((cartTotalPrice * appliedPromo.discount) / 100)
          : appliedPromo.discount)
        : 0;

      let usedFlashOffer = false;
      if (branding?.flashLimitOffer?.isActive && branding.flashLimitOffer.currentCount < branding.flashLimitOffer.totalLimit) {
         usedFlashOffer = true;
         if (branding.flashLimitOffer.type === 'free_shipping') {
            shippingFee = 0;
         } else if (branding.flashLimitOffer.type === 'percentage') {
            discountAmount += Math.round((cartTotalPrice * branding.flashLimitOffer.value) / 100);
         } else if (branding.flashLimitOffer.type === 'fixed') {
            discountAmount += branding.flashLimitOffer.value;
         }
      }

      const orderId = Date.now().toString();
      const orderData: Order = {
        id: orderId,
        customerName: customerInfo.name.trim(),
        phoneNumber: customerInfo.phone,
        governorate: customerInfo.governorate || '',
        city: customerInfo.area || '',
        address: customerInfo.street || '',
        landmark: customerInfo.landmark || '',
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
        paymentStatus: 'required',
        date: new Date().toISOString(),
        finalTotal: cartTotalPrice,
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
      
      // Delay success modal display to let order animation run
      setTimeout(() => {
        setShowCheckout(false);
        setIsOrderAnimating(false);
        setLastPlacedOrder(orderData);
      }, 1000);

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

          const { updateDoc } = await import('firebase/firestore');
          await updateDoc(doc(firestoreDb, 'orders', orderData.id), { invoiceBase64: base64File });
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

  return (
    <div style={{ fontFamily: theme.fontFamily, backgroundColor: theme.secondaryColor }} className="min-h-screen flex flex-col" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
      `}</style>

      {toast.show && (
        <div className="fixed top-24 right-4 z-[100] animate-in slide-in-from-right duration-300">
          <div className={`bg-white shadow-2xl border border-green-100 p-4 flex items-center gap-4 min-w-[280px] ${getBorderRadius('card')}`}>
            <div className={`${(toast.message.includes('غير متوفر') || toast.message.toLowerCase().includes('out of stock')) ? 'bg-red-500' : 'bg-green-500'} p-2 rounded-full text-white`}>
              {(toast.message.includes('غير متوفر') || toast.message.toLowerCase().includes('out of stock')) ? <Ban size={18} /> : <CheckCircle2 size={18} />}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-bold text-gray-800 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{toast.message}</p>
            </div>
            <button onClick={() => setToast({ show: false, message: '' })} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="fixed w-full z-50 backdrop-blur-xl border-b border-gray-100" style={{ backgroundColor: `${theme.secondaryColor}CC` }}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="p-2 hover:bg-gray-100 rounded-full transition">
              <ArrowRight size={24} className={`text-gray-700 ${language === 'en' ? 'rotate-180' : ''}`} style={{ color: theme.primaryColor }} />
            </Link>
          </div>
          <Logo className="scale-90 md:scale-100" />
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowMobileMenu(true)}
              className="p-2 hover:bg-gray-100 rounded-full transition md:hidden"
            >
              <Menu size={20} />
            </button>
            <button 
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              disabled={isTranslating}
              className="hidden md:flex items-center gap-1 bg-gray-50 hover:bg-gray-100 transition px-3 py-1.5 rounded-full text-[10px] font-bold text-gray-500 disabled:opacity-50"
            >
              <Globe size={12} className={isTranslating ? "animate-spin" : ""} />
              <span>{isTranslating ? (language === 'ar' ? 'Translating...' : 'جاري الترجمة...') : (language === 'ar' ? 'EN' : 'AR')}</span>
            </button>
            <button 
              onClick={() => setShowCart(true)} 
              className="p-2.5 hover:bg-gray-100 rounded-full transition relative group"
            >
              <ShoppingCart size={22} className="text-gray-700 group-hover:opacity-70 transition" style={{ color: theme.primaryColor }} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black border-2 border-white">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-[60] flex justify-start md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)} />
          <div className={`relative w-full max-w-[280px] bg-white h-full shadow-2xl flex flex-col animate-in ${language === 'ar' ? 'slide-in-from-right' : 'slide-in-from-left'} duration-300`}>
            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
              <Logo className="scale-75 origin-right" />
              <button onClick={() => setShowMobileMenu(false)} className="p-2.5 hover:bg-gray-100 rounded-full transition text-gray-400">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className={`flex flex-col gap-6 text-sm font-bold text-gray-500 tracking-wide uppercase ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                <Link to="/" onClick={() => setShowMobileMenu(false)} className="hover:opacity-70 transition" style={{ color: theme.primaryColor }}>{t.home}</Link>
                <Link to="/" onClick={() => setShowMobileMenu(false)} className="hover:opacity-70 transition">{t.shop}</Link>
                <Link to="/my-orders" onClick={() => setShowMobileMenu(false)} className="hover:opacity-70 transition">{t.myOrders}</Link>
              </div>

              <div className="pt-8 border-t border-gray-50">
                <button 
                  onClick={() => { setLanguage(language === 'ar' ? 'en' : 'ar'); setShowMobileMenu(false); }}
                  className={`flex items-center gap-3 w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold text-gray-600 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <Globe size={16} />
                  <span>{language === 'ar' ? 'English (EN)' : 'العربية (AR)'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-grow pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className={`grid grid-cols-1 gap-12 lg:gap-20 ${
            theme.productDetailLayout === 'stacked' ? 'max-w-3xl mx-auto' : 'lg:grid-cols-2'
          }`}>
            
            {/* Product Image */}
            <div className={`animate-fade-in-up ${
              theme.productDetailLayout === 'reversed' ? 'lg:order-2' : ''
            }`}>
              <div className={`overflow-hidden bg-gray-50 shadow-2xl relative group flex items-center justify-center ${getBorderRadius('card')}`}>
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-auto object-contain transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute top-6 left-6">
                  <span className={`backdrop-blur px-4 py-2 text-xs font-bold uppercase tracking-widest shadow-sm ${getBorderRadius('button')}`} style={{ backgroundColor: `${theme.secondaryColor}CC`, color: theme.primaryColor }}>
                    {product.category}
                  </span>
                </div>
                {(!product.inStock || (product.stock ?? 0) <= 0) && (
                  <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] flex items-center justify-center z-20">
                    <span className="bg-black text-white px-8 py-3 rounded-full text-sm font-bold uppercase tracking-widest shadow-2xl">
                      {language === 'ar' ? 'نفذت الكمية' : 'Out of Stock'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Product Info */}
            <div className={`flex flex-col justify-center space-y-8 animate-fade-in-up ${
              theme.productDetailLayout === 'reversed' ? 'lg:order-1' : ''
            }`} style={{ animationDelay: '0.2s' }}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight" style={{ fontFamily: theme.fontFamily }}>
                    {product.name}
                  </h1>
                  <button 
                    onClick={() => toggleWishlist(product.id)}
                    className={`p-3 transition-all shadow-sm border border-gray-100 ${getBorderRadius('button')} ${isWishlisted ? 'bg-red-50 text-red-500' : 'bg-white text-gray-300 hover:text-red-500'}`}
                  >
                    <Heart size={24} fill={isWishlisted ? "currentColor" : "none"} />
                  </button>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-3xl font-black" style={{ color: theme.primaryColor }}>
                      {finalPrice} {t.egp}
                    </span>
                    {((product.isOnSale && product.salePrice) || appliedPromo) && (
                      <span className="text-sm text-gray-400 line-through font-normal">
                        {originalUnitPrice * quantity} {t.egp}
                      </span>
                    )}
                  </div>
                  {appliedPromo && (
                    <span className="text-xs font-bold text-green-600">
                      {t.discountApplied} ({appliedPromo.discountType === 'percentage' ? `${appliedPromo.discount}%` : `${appliedPromo.discount} ${t.egp}`})
                    </span>
                  )}
                </div>
              </div>

              <div className="h-px bg-gray-100 w-full" />

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">{t.aboutProduct}</h3>
                <p className={`text-gray-600 leading-relaxed text-lg font-medium ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {product.description}
                </p>
              </div>

              <div className="space-y-6 pt-4">
                {/* Size Selection */}
                {product.sizes && product.sizes.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">{language === 'ar' ? 'المقاس' : 'Size'}</h3>
                    <div className="flex flex-wrap gap-3">
                      {product.sizes.map(size => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`w-12 h-12 flex items-center justify-center border font-bold transition-all ${getBorderRadius('button')} ${
                            selectedSize === size
                              ? 'border-black bg-black text-white shadow-lg'
                              : 'border-gray-200 text-gray-600 hover:border-black'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Color Selection */}
                {product.colors && product.colors.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">{language === 'ar' ? 'اللون' : 'Color'}</h3>
                    <div className="flex flex-wrap gap-3">
                      {product.colors.map(color => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`px-6 h-12 flex items-center justify-center border font-bold transition-all ${getBorderRadius('button')} ${
                            selectedColor === color
                              ? 'border-black bg-black text-white shadow-lg'
                              : 'border-gray-200 text-gray-600 hover:border-black'
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Quantity Selector */}
                  <div className={`flex items-center bg-gray-50 p-1 border border-gray-100 w-full sm:w-auto ${getBorderRadius('input')}`}>
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className={`p-4 hover:bg-white hover:shadow-sm transition text-gray-500 ${getBorderRadius('button')}`}
                    >
                      <Minus size={18} />
                    </button>
                    <span className="w-16 text-center font-bold text-xl text-gray-900">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className={`p-4 hover:bg-white hover:shadow-sm transition text-gray-500 ${getBorderRadius('button')}`}
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  {/* Add to Cart Button */}
                  <button 
                    onClick={handleAddToCart}
                    disabled={!product.inStock || (product.stock ?? 0) <= 0}
                    className={`flex-1 w-full py-5 font-bold shadow-xl transition-all transform hover:opacity-90 active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest text-sm ${getBorderRadius('button')} ${
                      product.inStock && (product.stock ?? 0) > 0
                        ? 'text-white' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                    style={{ backgroundColor: (product.inStock && (product.stock ?? 0) > 0) ? (branding?.primaryColor || theme.primaryColor) : undefined }}
                  >
                    <ShoppingCart size={20} />
                    {(product.stock ?? 0) > 0 ? t.addToCart : (language === 'ar' ? 'غير متوفر' : 'Out of Stock')}
                  </button>
                </div>

                {/* Promo Code Input */}
                <div className="pt-4 border-t border-gray-50">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.promoCode}</label>
                  <div className="flex gap-2 mt-2">
                    <input 
                      type="text" 
                      value={promoInput} 
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      className={`flex-1 bg-gray-50 border border-gray-100 py-3 px-4 outline-none focus:border-black transition text-sm ${getBorderRadius('input')}`}
                      placeholder="..."
                    />
                    <button 
                      type="button"
                      onClick={handleApplyPromo}
                      className={`px-6 py-3 font-bold text-xs transition ${getBorderRadius('button')}`}
                      style={{ backgroundColor: theme.primaryColor, color: theme.secondaryColor }}
                    >
                      {t.apply}
                    </button>
                  </div>
                  {appliedPromo && (
                    <p className="text-[10px] font-bold text-green-600 mt-2 flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      {t.discountApplied} ({appliedPromo.discountType === 'percentage' ? `${appliedPromo.discount}%` : `${appliedPromo.discount} ${t.egp}`})
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <button className={`flex-1 py-4 border border-gray-100 flex items-center justify-center gap-2 text-gray-500 font-bold text-xs hover:bg-gray-50 transition uppercase tracking-widest ${getBorderRadius('button')}`}>
                    <Share2 size={16} />
                    {t.shareProduct}
                  </button>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 pt-8">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: `${theme.primaryColor}1A`, color: theme.primaryColor }}>
                    <Droplet size={20} />
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.natural100}</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: `${theme.primaryColor}1A`, color: theme.primaryColor }}>
                    <CheckCircle2 size={20} />
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.clinicallyTested}</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: `${theme.primaryColor}1A`, color: theme.primaryColor }}>
                    <Heart size={20} />
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.madeWithLove}</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Drawer Components */}
      {showCart && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-700 text-right">
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
                  <div key={item.product?.id + '-' + (item.selectedSize || '') + '-' + (item.selectedColor || '')} className="flex gap-6">
                    <img src={item.product?.image} className="w-20 h-24 object-cover bg-gray-50 animate-fade-in-up" alt={item.product?.name} />
                    <div className="flex-1 space-y-2">
                      <h4 className="text-sm font-medium">{item.product?.name}</h4>
                      <div className="flex flex-wrap gap-1">
                        {item.selectedSize && <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold">{item.selectedSize}</span>}
                        {item.selectedColor && <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold">{item.selectedColor}</span>}
                      </div>
                      <div className="text-xs text-gray-400">
                        {item.product?.isOnSale && item.product?.salePrice ? (
                          <div className="flex items-center gap-2 justify-start">
                            <span className="text-amber-600 font-bold">{item.product.salePrice} {t.egp}</span>
                            <span className="line-through opacity-50">{item.product.price} {t.egp}</span>
                          </div>
                        ) : (
                          <span>{item.product?.price} {t.egp}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 justify-start">
                        <button onClick={() => updateCartQuantity(item.product?.id || '', item.quantity - 1, item.selectedSize, item.selectedColor)} className="p-1 border rounded"><Minus size={12} /></button>
                        <span className="text-xs">{item.quantity}</span>
                        <button onClick={() => updateCartQuantity(item.product?.id || '', item.quantity + 1, item.selectedSize, item.selectedColor)} className="p-1 border rounded"><Plus size={12} /></button>
                      </div>
                    </div>
                    <button onClick={() => removeFromCart(item.product?.id || '', item.selectedSize, item.selectedColor)}><Trash2 size={16} className="text-gray-300 hover:text-red-500 transition" /></button>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-8 border-t space-y-6">
                <div className="flex justify-between text-lg font-medium">
                  <span>{t.total}</span>
                  <span>{cartTotalPrice} {t.egp}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCheckout(true)}
                  className="w-full py-5 text-white text-[10px] font-black uppercase tracking-[0.35em] hover:opacity-90 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.08)] rounded-[1.75rem]"
                  style={{ backgroundColor: branding?.primaryColor || theme?.primaryColor || '#000' }}
                >
                  {language === 'ar' ? 'أتمم استلام طلبك' : 'Complete your order'}
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
                  <input type="text" required placeholder={t.fullName} value={customerInfo.name} onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })} className="w-full bg-gray-50/50 border-b-2 border-gray-100 rounded-none px-0 py-4 text-gray-900 text-lg font-bold outline-none focus:border-amber-600 transition-all placeholder:text-gray-200 animate-fade-in-up" />
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
                    className="w-full bg-gray-50/50 border-b-2 border-gray-100 rounded-none px-0 py-4 text-gray-900 text-lg font-bold outline-none focus:border-amber-600 transition-all placeholder:text-gray-200 animate-fade-in-up"
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
                      className="w-full bg-transparent border-b-2 border-gray-100 rounded-none px-0 py-4 text-gray-900 text-lg font-bold outline-none focus:border-amber-600 transition-all cursor-pointer appearance-none animate-fade-in-up"
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
                      className="w-full bg-transparent border-b-2 border-gray-100 rounded-none px-0 py-4 text-gray-900 text-lg font-bold outline-none focus:border-amber-600 transition-all cursor-pointer appearance-none animate-fade-in-up"
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
                <input type="text" required placeholder={language === 'ar' ? 'اسم الشارع، رقم العقار، رقم الشقة' : 'Street name, Building No, Apartment No'} value={customerInfo.street} onChange={(e) => setCustomerInfo({ ...customerInfo, street: e.target.value })} className="w-full bg-transparent border-b-2 border-gray-100 rounded-none px-0 py-4 text-gray-900 text-lg font-bold outline-none focus:border-amber-600 transition-all placeholder:text-gray-200 animate-fade-in-up" />
              </div>

              {/* Landmark */}
              <div className="group space-y-3 text-right">
                <label className="text-[11px] font-black text-gray-400 group-focus-within:text-amber-600 uppercase tracking-widest px-1 transition-colors">{language === 'ar' ? 'علامة مميزة (اختياري)' : 'Landmark (Optional)'}</label>
                <input type="text" placeholder={language === 'ar' ? 'بجوار صيدلية، محل مشهور...' : 'Next to a pharmacy, shop...'} value={customerInfo.landmark} onChange={(e) => setCustomerInfo({ ...customerInfo, landmark: e.target.value })} className="w-full bg-transparent border-b-2 border-gray-100 rounded-none px-0 py-4 text-gray-900 text-lg font-bold outline-none focus:border-amber-600 transition-all placeholder:text-gray-200 animate-fade-in-up" />
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
                      onClick={handleApplyPromo}
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
                    <span>{cartTotalPrice} {t.egp}</span>
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
                    <div className="flex justify-between items-center text-green-600 font-bold text-sm bg-green-50 p-3 rounded-xl animate-fade-in-up">
                      <span>{language === 'ar' ? 'إجمالي الخصم' : 'Total Discount'}</span>
                      <span>
                        {(() => {
                           let totalDiscount = appliedPromo ? (appliedPromo.discountType === 'percentage' ? Math.round((cartTotalPrice * appliedPromo.discount) / 100) : appliedPromo.discount) : 0;
                           if (branding?.flashLimitOffer?.isActive && branding.flashLimitOffer.type === 'percentage' && branding.flashLimitOffer.currentCount < branding.flashLimitOffer.totalLimit) {
                              totalDiscount += Math.round((cartTotalPrice * branding.flashLimitOffer.value) / 100);
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
                        let finalDiscount = appliedPromo ? (appliedPromo.discountType === 'percentage' ? Math.round((cartTotalPrice * appliedPromo.discount) / 100) : appliedPromo.discount) : 0;
                        
                        if (branding?.flashLimitOffer?.isActive && branding.flashLimitOffer.currentCount < branding.flashLimitOffer.totalLimit) {
                           if (branding.flashLimitOffer.type === 'free_shipping') finalShip = 0;
                           if (branding.flashLimitOffer.type === 'percentage') finalDiscount += Math.round((cartTotalPrice * branding.flashLimitOffer.value) / 100);
                           if (branding.flashLimitOffer.type === 'fixed') finalDiscount += branding.flashLimitOffer.value;
                        }
                        
                        return Math.max(0, cartTotalPrice + finalShip - finalDiscount);
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
                className="w-full max-w-[430px] py-5 text-white text-[10px] font-black uppercase tracking-[0.35em] hover:opacity-90 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.08)] rounded-[1.75rem]"
                style={{ backgroundColor: branding?.primaryColor || theme?.primaryColor || '#000' }}
              >
                {language === 'ar' ? 'أتمم استلام طلبك' : 'Complete your order'}
              </button>
            </div>
          </form>
        </div>
      )}

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

      {/* Hidden Invoice Container for capturing */}
      {activeInvoiceOrder && (
        <div id="temp-invoice-container" style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '320px', direction: language === 'ar' ? 'rtl' : 'ltr' }}>
          <Invoice order={activeInvoiceOrder} />
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
