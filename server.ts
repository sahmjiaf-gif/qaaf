import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import pkgWweb from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkgWweb;
import qrcodeTerm from 'qrcode-terminal';
import { db } from "./firebase.js";
import { doc, onSnapshot, setDoc, updateDoc, collection, query, where, getDoc, getDocs } from "firebase/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Guard against asynchronous process crashes (e.g. Windows file locking EBUSY on WhatsApp logout)
process.on('uncaughtException', (err: any) => {
  if (err?.code === 'EBUSY' || err?.message?.includes('.wwebjs_auth') || err?.message?.includes('unlink')) {
    console.warn('⚠️ Handled async file lock error (wwebjs_auth/EBUSY):', err.message);
    return;
  }
  console.error('⚠️ Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason: any) => {
  console.error('⚠️ Unhandled Promise Rejection:', reason);
});

const DB_FILE = path.join(__dirname, "db.json");

// Initial state
let state = {
  branding: {
    primaryColor: '#171717',
    secondaryColor: '#fafafa',
    fontFamily: 'Amiri', // Updated to a better Arabic font
    heroTitle: 'أناقة تتحدث عنك | أزياء QAAF الحصرية',
    heroSubtitle: 'اكتشفي تشكيلتنا الفاخرة المصنوعة يدوياً من أجود خامات القطن المصري والكتان الطبيعي لتناسب ذوقك الرفيع.',
    heroImage: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2000',
    logoImage: '', 
    aboutTitle: 'حكاية QAAF للأزياء الفاخرة',
    aboutDescription: 'قاف (QAAF) ليست مجرد علامة تجارية للملابس، بل هي رؤية مصرية تجمع بين الفخامة المعاصرة والأصالة. نحن نؤمن بأن ملابسك هي مرآة لشخصيتك، لذا نحرص على استخدام أفضل الأقمشة والقطن الطبيعي وتصميم قطع حصرية تمنحك الثقة والأناقة في كل مناسبة. كل قطعة صُممت وصُنعت بشغف وحب لتكون جزءاً من قصتك وتدوم معكِ للأبد.',
    aboutImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200',
    slider: [
      { id: '1', title: 'مجموعة الصيف الراقية', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200' },
      { id: '2', title: 'تصاميم كلاسيكية خالدة', image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1200' }
    ],
    socialLinks: {
      facebook: '',
      instagram: '',
      whatsapp: '',
      tiktok: '',
    },
    templateId: 'qaaf-classic'
  },
  products: [],
  orders: [],
  promoCodes: [],
  staff: []
};

// Load state from file if exists
if (fs.existsSync(DB_FILE)) {
  try {
    const saved = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    state = { ...state, ...saved };
    console.log("State loaded from db.json");
  } catch (e) {
    console.error("Failed to load db.json", e);
  }
} else {
  // Save initial default state
  fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2));
  console.log("Initial state saved to db.json");
}

const saveState = () => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2));
    console.log("State saved to db.json. Products count:", state.products.length);
  } catch (e) {
    console.error("Failed to save state to db.json", e);
  }
};

import puppeteer from 'puppeteer';
// Allow disabling WhatsApp auto-init in development to avoid Puppeteer/Chrome issues
const DISABLE_WHATSAPP = process.env.DISABLE_WHATSAPP === 'true';

let whatsappStatus = 'DISCONNECTED'; // DISCONNECTED, INITIALIZING, QR_RECEIVED, CONNECTED
let whatsappQrCode = '';
let whatsappClient: any = null;
let ordersListenerUnsubscribe: (() => void) | null = null;
let pendingOrders: Set<string> = new Set(); // Track orders that need WA retry

// Mapping from English OrderStatus to Arabic beautiful badge
const STATUS_BADGES: Record<string, string> = {
  pending: 'قيد الانتظار ⏳',
  approved: 'مقبول وجاري تجهيزه 🛒',
  shipped: 'تم تسليمه لشركة الشحن 🚚',
  delivered: 'تم التوصيل بنجاح 🎁',
  cancelled: 'تم الإلغاء ❌'
};

// --- Helper: sync status to Firebase ---
async function syncStatusToFirebase(status: string, qr: string = '') {
  try {
    await setDoc(doc(db, 'whatsapp', 'status'), { status, qr, updatedAt: Date.now() });
  } catch (e) {
    console.error('Failed to sync WhatsApp status to Firebase:', e);
  }
}

// --- Helper: format phone to WhatsApp chatId ---
function formatPhoneToChatId(raw: string): string {
  let phone = raw.replace(/\D/g, '');
  if (phone.startsWith('00')) phone = phone.slice(2);
  if (phone.startsWith('20') && phone.length === 12) { /* ok */ }
  else if (phone.startsWith('0') && phone.length === 11) phone = '2' + phone;
  else if (phone.length === 10 && ['10','11','12','15'].some(p => phone.startsWith(p))) phone = '20' + phone;
  return phone + '@c.us';
}

function normalizePhone(raw: string): string {
  if (!raw) return '';
  let phone = raw.replace(/\D/g, '');
  if (phone.startsWith('00')) phone = phone.slice(2);
  if (phone.startsWith('966')) phone = phone.slice(3);
  if (phone.startsWith('2') && phone.length === 12) phone = phone.slice(1);
  if (phone.startsWith('0') && phone.length === 11) return phone;
  if (phone.length === 10) return `0${phone}`;
  return phone;
}

function extractNumericAmountFromSms(text: string): number | null {
  if (!text) return null;
  const raw = text
    .replace(/[،]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const patterns = [
    /(?:مبلغ|amount|total|القيمة|قيمة|المبلغ|تحويل)[^\d]{0,15}(\d+(?:[.,]\d+)?)/gi,
    /(\d+(?:[.,]\d+)?)[^\d]{0,8}(?:ج\.م|جنيه|EGP|egp|جنيهات|ج.م)/gi,
    /(\d+(?:[.,]\d+)?)/g
  ];

  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (!match) continue;
    const found = match[0] || match[1] || match[match.length - 1];
    const cleaned = found.replace(/[^0-9.]/g, '');
    if (!cleaned) continue;
    const numeric = Number(cleaned);
    if (!Number.isFinite(numeric) || numeric <= 0) continue;
    return numeric;
  }

  return null;
}

async function processWalletSmsMessage(input: { senderPhone: string; text: string; amount?: number; timestamp?: number | string; source?: string; }): Promise<{ matched: boolean; reason: string; orderId?: string; orderStatus?: string; amount?: number; requiredFee?: number; updated?: boolean; }> {
  const senderPhone = normalizePhone(input.senderPhone || '');
  const text = input.text || '';
  const declaredAmount = typeof input.amount === 'number' ? input.amount : extractNumericAmountFromSms(text);
  const amount = Number(declaredAmount || 0);

  if (!senderPhone) {
    return { matched: false, reason: 'sender phone missing' };
  }

  if (!amount || amount <= 0) {
    return { matched: false, reason: 'amount not found in SMS' };
  }

  const ordersSnap = await getDocs(query(collection(db, 'orders')));
  const pendingCandidates = ordersSnap.docs
    .map(docSnap => ({ id: docSnap.id, ...docSnap.data() as any }))
    .filter(order => {
      const orderPhone = normalizePhone(String(order.phoneNumber || ''));
      const paymentPhone = normalizePhone(String(order.paymentSenderPhone || ''));
      const isPending = String(order.status || '').toLowerCase() === 'pending';
      return isPending && (orderPhone === senderPhone || paymentPhone === senderPhone || orderPhone.endsWith(senderPhone.slice(-8)) || paymentPhone.endsWith(senderPhone.slice(-8)));
    })
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

  if (pendingCandidates.length === 0) {
    return { matched: false, reason: 'no pending order matched sender phone', amount };
  }

  const targetOrder = pendingCandidates[0];
  const requiredFee = Number(targetOrder.shippingFee || 0);

  if (amount < requiredFee) {
    await updateDoc(doc(db, 'orders', targetOrder.id), {
      paymentStatus: 'pending',
      paymentSenderPhone: senderPhone,
      shippingFeePaid: false,
      shippingPaymentNote: text,
      lastSmsCheckAt: new Date().toISOString()
    });
    return {
      matched: true,
      reason: 'amount below required shipping fee',
      orderId: targetOrder.id,
      orderStatus: targetOrder.status,
      amount,
      requiredFee,
      updated: true
    };
  }

  await updateDoc(doc(db, 'orders', targetOrder.id), {
    status: 'approved',
    paymentStatus: 'confirmed',
    paymentSenderPhone: senderPhone,
    shippingFeePaid: true,
    shippingPaymentNote: text,
    lastSmsCheckAt: new Date().toISOString(),
    lastWaStatusNotified: 'approved'
  });

  return {
    matched: true,
    reason: 'shipping fee matched or exceeded; order unlocked',
    orderId: targetOrder.id,
    orderStatus: 'approved',
    amount,
    requiredFee,
    updated: true
  };
}

function resolveWhatsAppServiceType(branding: any): 'local_free' | 'green_api' {
  // Always check if local WhatsApp client is actually connected
  if (whatsappClient && whatsappStatus === 'CONNECTED') {
    console.log('✅ Local WhatsApp client is connected - using local_free');
    return 'local_free';
  }
  
  // If local client is not connected, always fall back to Green API
  console.log('🟢 Local WhatsApp client not connected - falling back to Green API');
  return 'green_api';
}

// --- Background Orders Listener: watches Firebase for new orders and sends WA ---
const processingOrders = new Set<string>();

async function sendWhatsAppStatusUpdate(order: any) {
  console.log(`🚀 sendWhatsAppStatusUpdate() started for order ${order.id}, status: ${order.status}, WhatsApp status: ${whatsappStatus}`);
  // Fetch branding from Firebase to get service type and credentials
  const brandSnap = await getDoc(doc(db, 'branding', 'main'));
  const branding: any = brandSnap.exists() ? brandSnap.data() : {};

  const serviceType = resolveWhatsAppServiceType(branding);
  const instanceId = branding?.greenApiInstanceId || '7107624225';
  const apiToken  = branding?.greenApiToken  || '15161302552e4373ad63cbeac1ec54d680c34b8d5bc644b1b1';

  if (serviceType === 'local_free') {
    if (!whatsappClient || whatsappStatus !== 'CONNECTED') {
      throw new Error('Local WhatsApp client is not connected. Message delayed.');
    }
  }

  const customerChatId = formatPhoneToChatId(order.phoneNumber);

  const statusBadge = STATUS_BADGES[order.status] || order.status;

  const staff = (state.staff || []).find((s: any) => s.id === order.assignedTo);
  const staffName = staff ? staff.name : '';
  const staffPhone = (branding?.whatsappNumbersWithStaff?.[order.assignedTo] || staff?.phone || '01284821014').trim();

  const employeeMessage = order.assignedTo
    ? `🙋‍♂️ *الموظف المسؤول:* ${staffName || 'ممثل خدمة العملاء'}\n📱 *رقم تواصل الموظف:* ${staffPhone}`
    : `📱 *رقم التواصل:* 01284821014`;

  const statusChanged = order.status !== order.lastWaStatusNotified;
  const assignmentChanged = (order.assignedTo || '') !== (order.lastWaAssignedTo || '');

  let title = `تم تحديث حالة طلبك #${order.id?.substring(0, 8)}`;
  if (assignmentChanged && !statusChanged) {
    title = `تم تعيين الموظف المسؤول لمتابعة طلبك #${order.id?.substring(0, 8)}`;
  }

  const baseOrigin = (branding?.storeUrl || 'https://qaaf-1301b.com').replace(/\/$/, '');

  // Build message in Arabic
  const messageLines = [
    `السلام عليكم يا ${order.customerName || 'العميل العزيز'} 👋`,
    title,
    ``,
    `📞 *رقم العميل:* ${order.phoneNumber}`,
    `⏳ *حالة الطلب:* *${statusBadge}*`,
    employeeMessage,
    ``,
    `🔗 *تتبع طلباتك من هنا:* ${baseOrigin}/#/my-orders?phone=${order.phoneNumber}`,
    ``,
    `شكراً لك على تعاملك معنا 🙏`
  ].filter(line => line !== '').join('\n');

  console.log(`[Status Update] Sending status update to ${order.phoneNumber} (Status: ${order.status})`);

  if (serviceType === 'local_free') {
    // Local WhatsApp Web client - send directly
    try {
      await whatsappClient.sendMessage(customerChatId, messageLines);
      console.log(`[Status Update] ✓ Message sent to customer ${order.phoneNumber}`);
    } catch (err) {
      console.error(`[Status Update] ✗ Failed to send to ${order.phoneNumber}:`, err);
      throw err;
    }
  } else {
    // Green API - send via HTTP endpoint
    try {
      const response = await fetch(
        `https://api.green-api.com/waInstance${instanceId}/sendMessage/${apiToken}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: customerChatId,
            message: messageLines
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Green API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log(`[Status Update] ✓ Message sent via Green API to ${order.phoneNumber}`);
    } catch (err) {
      console.error(`[Status Update] ✗ Green API failed for ${order.phoneNumber}:`, err);
      throw err;
    }
  }
}

// --- Retry pending orders ---
async function retryPendingOrders() {
  const ordersToRetry = Array.from(pendingOrders);
  pendingOrders.clear();
  
  for (const orderId of ordersToRetry) {
    try {
      const docSnap = await getDoc(doc(db, 'orders', orderId));
      if (docSnap.exists()) {
        const order = { id: docSnap.id, ...docSnap.data() } as any;
        console.log(`🔄 Retrying order ${orderId}...`);
        await sendWhatsAppForOrder(order);
        console.log(`✅ Retry successful for order ${orderId}`);
      }
    } catch (err) {
      console.error(`❌ Retry failed for order ${orderId}:`, err);
      pendingOrders.add(orderId); // Re-add if still failed
    }
  }
}

function startOrdersListener() {
  if (ordersListenerUnsubscribe) return;
  console.log('📡 Starting Firebase orders listener...');
  console.log(`📡 WhatsApp Status on listener start: ${whatsappStatus}`);
  
  // Listen to the entire orders collection to capture status changes (modified documents)
  const q = query(collection(db, 'orders'));
  ordersListenerUnsubscribe = onSnapshot(q, async (snapshot: any) => {
    console.log(`📡 Firebase snapshot received - ${snapshot.docChanges().length} document changes`);
    for (const change of snapshot.docChanges()) {
      if (change.type !== 'added' && change.type !== 'modified') continue;
      const order = { id: change.doc.id, ...change.doc.data() } as any;
      console.log(`📋 Processing ${change.type} order: ${order.id}, waNotified: ${order.waNotified}, status: ${order.status}`);
      
      // Case 1: Brand new order that hasn't received the initial notification
      if (!order.waNotified) {
        if (processingOrders.has(order.id + '_new')) continue;
        processingOrders.add(order.id + '_new');
        
        console.log(`📩 New order detected: ${order.id}, sending WhatsApp...`);
        try {
          await sendWhatsAppForOrder(order);
          // Set waNotified to true, and lastWaStatusNotified to the current order status
          await updateDoc(doc(db, 'orders', order.id), { 
            waNotified: true,
            lastWaStatusNotified: order.status
          });
          console.log(`✅ WhatsApp sent for new order ${order.id}`);
        } catch (err) {
          console.error(`❌ Failed to send WhatsApp for order ${order.id}:`, err);
          processingOrders.delete(order.id + '_new');
          
          // Track order as pending for retry when WhatsApp connects
          if (err instanceof Error && err.message.includes('not connected')) {
            pendingOrders.add(order.id);
            console.log(`⏳ Added order ${order.id} to pending queue for retry when WhatsApp connects`);
          }
          
          // Retry after 15 seconds if it failed because the client was not connected
          if (err instanceof Error && err.message.includes('not connected')) {
            setTimeout(async () => {
              if (processingOrders.has(order.id + '_new')) return;
              processingOrders.add(order.id + '_new');
              console.log(`🔄 Retrying WhatsApp for order ${order.id}...`);
              try {
                const docSnap = await getDoc(doc(db, 'orders', order.id));
                if (docSnap.exists()) {
                  const latestOrder = { id: docSnap.id, ...docSnap.data() } as any;
                  if (!latestOrder.waNotified) {
                    await sendWhatsAppForOrder(latestOrder);
                    await updateDoc(doc(db, 'orders', order.id), { 
                      waNotified: true,
                      lastWaStatusNotified: latestOrder.status
                    });
                    console.log(`✅ WhatsApp sent successfully on retry for order ${order.id}`);
                  } else {
                    processingOrders.delete(order.id + '_new');
                  }
                } else {
                  processingOrders.delete(order.id + '_new');
                }
              } catch (retryErr) {
                console.error(`❌ Retry failed for order ${order.id}:`, retryErr);
                processingOrders.delete(order.id + '_new');
              }
            }, 15000);
          }
        }
      } 
      // Case 2: Existing order where status or assignment has changed
      else if (order.waNotified) {
        // If lastWaStatusNotified doesn't exist yet, we save it as current status to avoid spamming old orders
        if (order.lastWaStatusNotified === undefined) {
          console.log(`ℹ️ Initializing lastWaStatusNotified for existing order ${order.id} to ${order.status}`);
          await updateDoc(doc(db, 'orders', order.id), {
            lastWaStatusNotified: order.status,
            lastWaAssignedTo: order.assignedTo || ''
          });
          continue;
        }

        const statusChanged = order.status !== order.lastWaStatusNotified;
        const assignmentChanged = (order.assignedTo || '') !== (order.lastWaAssignedTo ?? '__UNSET__');

        // If status changed OR employee assignment changed!
        if (statusChanged || assignmentChanged) {
          const procKey = `${order.id}_status_${order.status}_assign_${order.assignedTo || 'none'}`;
          if (processingOrders.has(procKey)) continue;
          processingOrders.add(procKey);

          if (statusChanged) {
            console.log(`🔄 Order status changed for ${order.id}: ${order.lastWaStatusNotified} -> ${order.status}. Sending WA...`);
          }
          if (assignmentChanged) {
            console.log(`👤 Order assignment changed for ${order.id}: "${order.lastWaAssignedTo}" -> "${order.assignedTo}". Sending WA...`);
          }

          try {
            await sendWhatsAppStatusUpdate(order);
            await updateDoc(doc(db, 'orders', order.id), {
              lastWaStatusNotified: order.status,
              lastWaAssignedTo: order.assignedTo || ''
            });
            console.log(`✅ WhatsApp update sent for order ${order.id} (status: ${order.status}, assignedTo: ${order.assignedTo})`);
          } catch (err) {
            console.error(`❌ Failed to send WhatsApp update for order ${order.id}:`, err);
            processingOrders.delete(procKey);

            // Track order as pending for retry when WhatsApp connects
            if (err instanceof Error && err.message.includes('not connected')) {
              pendingOrders.add(order.id);
              console.log(`⏳ Added order ${order.id} to pending queue for retry when WhatsApp connects`);
            }

            // Retry after 15 seconds if client not connected
            if (err instanceof Error && err.message.includes('not connected')) {
              setTimeout(async () => {
                if (processingOrders.has(procKey)) return;
                processingOrders.add(procKey);
                console.log(`🔄 Retrying status/assignment update WhatsApp for order ${order.id}...`);
                try {
                  const docSnap = await getDoc(doc(db, 'orders', order.id));
                  if (docSnap.exists()) {
                    const latestOrder = { id: docSnap.id, ...docSnap.data() } as any;
                    const stillStatusChanged = latestOrder.status !== latestOrder.lastWaStatusNotified;
                    const stillAssignChanged = (latestOrder.assignedTo || '') !== (latestOrder.lastWaAssignedTo || '');
                    if (stillStatusChanged || stillAssignChanged) {
                      await sendWhatsAppStatusUpdate(latestOrder);
                      await updateDoc(doc(db, 'orders', order.id), {
                        lastWaStatusNotified: latestOrder.status,
                        lastWaAssignedTo: latestOrder.assignedTo || ''
                      });
                      console.log(`✅ Update WhatsApp sent successfully on retry for order ${order.id}`);
                    } else {
                      processingOrders.delete(procKey);
                    }
                  } else {
                    processingOrders.delete(procKey);
                  }
                } catch (retryErr) {
                  console.error(`❌ Update retry failed for order ${order.id}:`, retryErr);
                  processingOrders.delete(procKey);
                }
              }, 15000);
            }
          }
        }
      }
    }
  }, (err: any) => {
    if (err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')) {
      console.warn('Firestore access is blocked by security rules or project permissions. Order listener paused to avoid repeated permission failures.');
      if (ordersListenerUnsubscribe) {
        ordersListenerUnsubscribe();
        ordersListenerUnsubscribe = null;
      }
      return;
    }

    console.error('Orders listener error:', err);
  });
}

// --- Send WhatsApp messages for an order ---
async function sendWhatsAppForOrder(order: any) {
  console.log(`🚀 sendWhatsAppForOrder() started for order ${order.id}, WhatsApp status: ${whatsappStatus}`);
  // Wait 4 seconds for the client to generate and upload the invoice image
  let currentOrder = order;
  if (!currentOrder.invoiceBase64) {
    console.log(`⏳ Invoice not ready for order ${order.id}, waiting 4 seconds...`);
    await new Promise(resolve => setTimeout(resolve, 4000));
    try {
      const docSnap = await getDoc(doc(db, 'orders', order.id));
      if (docSnap.exists()) {
        currentOrder = { id: docSnap.id, ...docSnap.data() } as any;
        console.log(`✅ Order fetched after delay. Invoice status: ${currentOrder.invoiceBase64 ? 'Available' : 'NOT Available'}`);
      }
    } catch (err) {
      console.error('❌ Failed to fetch order after delay:', err);
    }
  }

  // Fetch branding from Firebase to get service type and credentials
  const brandSnap = await getDoc(doc(db, 'branding', 'main'));
  const branding: any = brandSnap.exists() ? brandSnap.data() : {};

  const serviceType = resolveWhatsAppServiceType(branding);
  const instanceId = branding?.greenApiInstanceId || '7107624225';
  const apiToken  = branding?.greenApiToken  || '15161302552e4373ad63cbeac1ec54d680c34b8d5bc644b1b1';
  const storeName = branding?.storeName || branding?.heroTitle?.split('|')?.[0]?.trim() || 'متجرنا';

  // Resolve assigned staff info (after branding is available)
  const assignedStaff = (state.staff || []).find((s: any) => s.id === currentOrder.assignedTo);
  const assignedStaffPhone = (branding?.whatsappNumbersWithStaff?.[currentOrder.assignedTo] || assignedStaff?.phone || '01284821014').toString().trim();
  const assignedStaffName = assignedStaff ? assignedStaff.name : 'خدمة العملاء';

  if (serviceType === 'local_free') {
    if (!whatsappClient || whatsappStatus !== 'CONNECTED') {
      throw new Error('Local WhatsApp client is not connected. Message delayed.');
    }
  }

  const productsList = (currentOrder.products || [])
    .map((item: any) => {
      const price = item.product.isOnSale && item.product.salePrice ? item.product.salePrice : item.product.price;
      return `• ${item.product.name} × ${item.quantity} (${price} ج.م)`;
    })
    .join('\n');
  const flashNote = currentOrder.flashOfferApplied ? '\n⚡ تم تطبيق عرض خاص على طلبك!' : '';
  const finalShip = currentOrder.flashOfferApplied && branding?.flashLimitOffer?.type === 'free_shipping' ? 0 : (currentOrder.shippingFee || 0);
  const discountAmount = currentOrder.discountAmount || 0;
  const subtotal = currentOrder.finalTotal || 0;
  const totalLine = Math.max(0, subtotal - discountAmount + finalShip);

  const baseOrigin = (branding?.storeUrl || 'https://qaaf-1301b.com').replace(/\/$/, '');

  // Ensure baseOrigin is valid
  if (!baseOrigin.startsWith('https://')) {
    throw new Error('Invalid baseOrigin. Please check your Firebase Hosting settings.');
  }

  const trackingLink = `${baseOrigin}/#/my-orders?phone=${currentOrder.phoneNumber}&status=${STATUS_BADGES[currentOrder.status] || 'غير معروف'}`;
  const cancelLink = `${baseOrigin}/#/my-orders?phone=${currentOrder.phoneNumber}&cancel=${currentOrder.id}`;
  const fullAddress = [currentOrder.governorate, currentOrder.city, currentOrder.address, currentOrder.landmark ? `بجوار ${currentOrder.landmark}` : ''].filter(Boolean).join('، ');

  const customerChatId = formatPhoneToChatId(currentOrder.phoneNumber);

  // 1. Load the customized template from branding or use the default
  const rawCustomerTemplate = (serviceType === 'green_api')
    ? (branding?.whatsAppCustomerTemplateGreen || 
        `مرحباً {customer_name} 👋\n\n` +
        `شكراً لطلبك من *{store_name}*!\n\n` +
        `📦 *تفاصيل المنتجات:*\n` +
        `{products_list}\n\n` +
        `💵 *مصاريف الشحن:* {shipping_fee}\n` +
        `💸 *قيمة الخصم:* {discount_amount}\n` +
        `💰 *الإجمالي الكلي:* {final_total}\n\n` +
        `💡 يرجى استخدام الأزرار بالأسفل لتتبع أو إلغاء طلبك! 🌿`)
    : (branding?.whatsAppCustomerTemplate || 
        `مرحباً {customer_name} 👋\n\n` +
        `شكراً لطلبك من *{store_name}*!\n\n` +
        `📦 *تفاصيل المنتجات:*\n` +
        `{products_list}\n\n` +
        `💵 *مصاريف الشحن:* {shipping_fee}\n` +
        `💸 *قيمة الخصم:* {discount_amount}\n` +
        `💰 *الإجمالي الكلي:* {final_total}\n\n` +
        `👇 *خيارات التحكم بالطلب:*\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `[ 📦 تتبع طلبك ]\n` +
        `🔗 {tracking_link}\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `[ ❌ إلغاء طلبك ]\n` +
        `🔗 {cancel_link}\n` +
        `━━━━━━━━━━━━━━━━━━━\n\n` +
        `💡 *تفعيل الروابط:* يرجى حفظ رقمنا في جهات الاتصال أو الرد بأي كلمة لتفعيل الروابط تلقائياً! 🌿`);

  const parsedCustomerMsg = rawCustomerTemplate
    .replace(/{customer_name}/g, (currentOrder.customerName || '').trim())
    .replace(/{store_name}/g, storeName)
    .replace(/{products_list}/g, productsList + flashNote)
    .replace(/{shipping_fee}/g, `${finalShip === 0 ? 'مجاناً 🎁' : finalShip + ' ج.م'}`)
    .replace(/{discount_amount}/g, `${discountAmount} ج.م`)
    .replace(/{final_total}/g, `${totalLine} ج.م`)
    .replace(/{tracking_link}/g, trackingLink)
    .replace(/{cancel_link}/g, cancelLink);

  // Send confirmation message to customer, with invoice image if available
  console.log(`[Order Message] Sending order confirmation to ${currentOrder.phoneNumber}`);
  const invoiceBase64 = currentOrder.invoiceBase64 ? (currentOrder.invoiceBase64.split(',')[1] || currentOrder.invoiceBase64) : null;
  const captionWithInvoice = `${parsedCustomerMsg}\n\n📄 فاتورة طلبك — شكراً لتسوقك معنا! 🌿`;

  if (serviceType === 'local_free') {
    console.log(`📤 Attempting to send via local_free (WhatsApp Web). Client exists: ${!!whatsappClient}, Client status: ${whatsappStatus}`);
    try {
      if (invoiceBase64) {
        const fileName = `invoice_${currentOrder.id.slice(-6)}.jpg`;
        const media = new MessageMedia('image/jpeg', invoiceBase64, fileName);
        await whatsappClient.sendMessage(customerChatId, media, { caption: captionWithInvoice });
      } else {
        await whatsappClient.sendMessage(customerChatId, parsedCustomerMsg);
      }
      console.log(`[Order Message] ✓ Order confirmation sent to customer ${currentOrder.phoneNumber}`);
    } catch (err) {
      console.error(`[Order Message] ✗ Failed to send to customer ${currentOrder.phoneNumber}:`, err);
      throw err;
    }
  } else {
    console.log(`📤 Attempting to send via Green API`);
    if (invoiceBase64) {
      try {
        const fileName = `invoice_${currentOrder.id.slice(-6)}.jpg`;
        await fetch(`https://api.green-api.com/waInstance${instanceId}/sendFileByBase64/${apiToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId: customerChatId, base64File: invoiceBase64, fileName, caption: captionWithInvoice })
        });
        console.log('✅ WhatsApp invoice image sent via Green API.');
      } catch (err) {
        console.error('⚠️ Failed to send invoice image via Green API, falling back to text/buttons:', err);
        await sendCustomerTextMessage();
      }
    } else {
      await sendCustomerTextMessage();
    }
  }

  async function sendCustomerTextMessage() {
    // For Green API, strip the plain links from the body since we send native buttons
    const greenBodyLines = parsedCustomerMsg.split('\n').filter(line => {
      const lower = line.toLowerCase();
      return !lower.includes('tracking_link') &&
             !lower.includes('cancel_link') &&
             !lower.includes('/my-orders') &&
             !lower.includes('تتبع طلبك') &&
             !lower.includes('إلغاء طلبك') &&
             !lower.includes('خيارات التحكم بالطلب') &&
             !lower.includes('━━━━━━━━━━━━━━━━━━━') &&
             !lower.includes('[ 📦 ]') &&
             !lower.includes('[ ❌ ]');
    });

    let bodyForGreen = greenBodyLines.join('\n').trim();
    if (!bodyForGreen.includes('الأزرار بالأسفل')) {
      bodyForGreen += '\n\n💡 يرجى استخدام الأزرار بالأسفل لتتبع أو إلغاء طلبك! 🌿';
    }

    try {
      const response = await fetch(`https://api.green-api.com/waInstance${instanceId}/sendInteractiveButtons/${apiToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: customerChatId,
          body: bodyForGreen,
          footer: `متجر ${storeName} 🌿`,
          buttons: [
            {
              type: 'url',
              buttonId: 'btn_track',
              buttonText: '📦 تتبع طلبك',
              url: trackingLink
            },
            {
              type: 'url',
              buttonId: 'btn_cancel',
              buttonText: '❌ إلغاء طلبك',
              url: cancelLink
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Green API sendInteractiveButtons failed with status ${response.status}`);
      }
      console.log('✅ WhatsApp interactive buttons sent successfully via Green API.');
    } catch (btnErr) {
      console.warn('⚠️ sendInteractiveButtons failed, falling back to standard message:', btnErr);
      await fetch(`https://api.green-api.com/waInstance${instanceId}/sendMessage/${apiToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: customerChatId, message: parsedCustomerMsg })
      });
    }
  }

  // 3. Notify admins
  try {
    const adminPhonesList: string[] = branding?.adminWhatsappNumbers?.length > 0
      ? branding.adminWhatsappNumbers
      : [branding?.adminWhatsappNumber || branding?.contactNumber].filter(Boolean);

    for (const rawPhone of adminPhonesList) {
      const adminChatId = formatPhoneToChatId(rawPhone);
      const adminMsg =
        `🔔 *طلب جديد!*\n\n` +
        `👤 *الاسم:* ${(currentOrder.customerName || '').trim()}\n` +
        `📞 *الهاتف:* ${currentOrder.phoneNumber}\n` +
        `🏠 *العنوان:* ${fullAddress}\n\n` +
        `📦 *المنتجات:*\n${productsList}${flashNote}\n\n` +
        `💰 *سعر المنتجات:* ${currentOrder.finalTotal || 0} ج.م\n` +
        `🚚 *سعر التوصيل:* ${finalShip === 0 ? 'مجاناً 🎁' : finalShip + ' ج.م'}\n` +
        (discountAmount > 0 ? `🏷️ *الخصم:* - ${discountAmount} ج.م\n` : '') +
        `💵 *المجموع الكلي:* ${totalLine} ج.م`;

      try {
        if (serviceType === 'local_free') {
          await whatsappClient.sendMessage(adminChatId, adminMsg);
        } else {
          await fetch(`https://api.green-api.com/waInstance${instanceId}/sendMessage/${apiToken}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatId: adminChatId, message: adminMsg })
          });
        }
      } catch (adminMsgErr) {
        console.error(`⚠️ Failed to send text notification to admin ${rawPhone}:`, adminMsgErr);
      }

      if (currentOrder.invoiceBase64) {
        try {
          const base64File = currentOrder.invoiceBase64.split(',')[1] || currentOrder.invoiceBase64;
          const fileName = `invoice_${currentOrder.id.slice(-6)}.jpg`;
          const caption = `🧾 فاتورة طلب #${currentOrder.id.slice(-6).toUpperCase()}`;

          if (serviceType === 'local_free') {
            const media = new MessageMedia('image/jpeg', base64File, fileName);
            await whatsappClient.sendMessage(adminChatId, media, { caption });
          } else {
            await fetch(`https://api.green-api.com/waInstance${instanceId}/sendFileByBase64/${apiToken}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chatId: adminChatId, base64File, fileName, caption })
            });
          }
        } catch (adminMediaErr) {
          console.error(`⚠️ Failed to send invoice image to admin ${rawPhone}:`, adminMediaErr);
        }
      }
    }
  } catch (adminNotifyErr) {
    console.error('⚠️ Failed admin notification process:', adminNotifyErr);
  }
}

async function resolvePuppeteerExecutablePath(): Promise<string | undefined> {
  const configuredCandidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.CHROME_BIN,
    process.env.GOOGLE_CHROME_BIN,
    process.env.CHROMIUM_BIN,
    process.env.PUPPETEER_SKIP_DOWNLOAD === 'true' ? undefined : undefined
  ].filter((value): value is string => Boolean(value));

  for (const candidate of configuredCandidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  const platformCandidates = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Users/' + process.env.USERNAME + '/AppData/Local/Google/Chrome/Application/chrome.exe',
    'C:/Users/' + process.env.USERNAME + '/AppData/Local/Chromium/Application/chrome.exe',
    'C:/Users/' + process.env.USERNAME + '/AppData/Local/Google/Chrome SxS/Application/chrome.exe',
    'C:/Program Files/Chromium/Application/chrome.exe',
    'C:/Program Files (x86)/Chromium/Application/chrome.exe'
  ];

  for (const candidate of platformCandidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  try {
    const resolved = await puppeteer.executablePath();
    if (resolved && fs.existsSync(resolved)) {
      return resolved;
    }
  } catch (err: any) {
    console.warn('Puppeteer executable path could not be resolved automatically:', err?.message || err);
  }

  return undefined;
}

async function initWhatsApp() {
  if (DISABLE_WHATSAPP) {
    console.log('DISABLE_WHATSAPP=true — skipping WhatsApp client initialization.');
    whatsappStatus = 'DISABLED';
    whatsappQrCode = '';
    return;
  }

  if (whatsappClient) {
    console.log("WhatsApp client already exists, skipping initialization.");
    return;
  }
  console.log("Initializing WhatsApp Client...");
  whatsappStatus = 'INITIALIZING';
  whatsappQrCode = '';
  await syncStatusToFirebase('INITIALIZING', '');

  const executablePath = await resolvePuppeteerExecutablePath();

  if (!executablePath) {
    console.warn('No Chrome/Chromium executable was found for WhatsApp Web. Disabling local WhatsApp client until a browser is available.');
    whatsappStatus = 'DISABLED';
    whatsappClient = null;
    await syncStatusToFirebase('DISABLED', '');
    return;
  }

  whatsappClient = new Client({
    authStrategy: new LocalAuth({
      dataPath: path.join(__dirname, '.wwebjs_auth')
    }),
    puppeteer: {
      headless: true,
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });

  whatsappClient.on('qr', (qr: string) => {
    console.log('WhatsApp QR Code generated. Scan it to authenticate!');
    whatsappQrCode = qr;
    whatsappStatus = 'QR_RECEIVED';
    qrcodeTerm.generate(qr, { small: true });
    syncStatusToFirebase('QR_RECEIVED', qr);
  });

  whatsappClient.on('ready', () => {
    console.log('✅ WhatsApp client is READY!');
    whatsappStatus = 'CONNECTED';
    whatsappQrCode = '';
    syncStatusToFirebase('CONNECTED', '');
    startOrdersListener();
    
    // Retry pending orders that failed to send
    if (pendingOrders.size > 0) {
      console.log(`🔄 Retrying ${pendingOrders.size} pending orders...`);
      retryPendingOrders();
    }
  });

  whatsappClient.on('authenticated', () => {
    console.log('WhatsApp client authenticated successfully');
  });

  whatsappClient.on('auth_failure', (msg: any) => {
    console.error('WhatsApp authentication failure:', msg);
    whatsappStatus = 'DISCONNECTED';
    whatsappQrCode = '';
    whatsappClient = null;
    syncStatusToFirebase('DISCONNECTED', '');
  });

  whatsappClient.on('disconnected', (reason: any) => {
    console.warn('WhatsApp client was disconnected:', reason);
    whatsappStatus = 'DISCONNECTED';
    whatsappQrCode = '';
    whatsappClient = null;
    syncStatusToFirebase('DISCONNECTED', '');
  });

  whatsappClient.initialize().catch((err: any) => {
    console.error('Failed to initialize WhatsApp client:', err);
    whatsappStatus = 'DISCONNECTED';
    whatsappClient = null;
    syncStatusToFirebase('DISCONNECTED', '');
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '150mb' }));
  app.use(express.urlencoded({ limit: '150mb', extended: true }));

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = Number(process.env.PORT) || 3000;
  const socketToStaff = new Map<string, string>(); // socket.id -> staff.id

  // Health check for Render
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.post("/api/sms-wallet/ingest", async (req, res) => {
    try {
      const payload = req.body || {};
      const result = await processWalletSmsMessage({
        senderPhone: payload.senderPhone || payload.from || payload.phone || '',
        text: payload.text || payload.message || '',
        amount: typeof payload.amount === 'number' ? payload.amount : undefined,
        timestamp: payload.timestamp,
        source: payload.source || 'api'
      });

      return res.json({ success: true, ...result });
    } catch (error: any) {
      console.error('SMS wallet ingest failed:', error);
      return res.status(500).json({ success: false, error: error.message || 'unknown error' });
    }
  });

  app.get("/api/sms-wallet/test", async (req, res) => {
    const senderPhone = String(req.query.senderPhone || '');
    const text = String(req.query.text || '');
    const amount = req.query.amount ? Number(req.query.amount) : undefined;

    if (!senderPhone || !text) {
      return res.status(400).json({ success: false, error: 'senderPhone and text are required' });
    }

    const result = await processWalletSmsMessage({ senderPhone, text, amount });
    return res.json({ success: true, result });
  });

  // WhatsApp Self-Hosted API endpoints
  app.get("/api/whatsapp/status", (req, res) => {
    res.json({ status: whatsappStatus, qr: whatsappQrCode });
  });

  app.post("/api/whatsapp/connect", (req, res) => {
    if (whatsappStatus === 'DISCONNECTED') {
      initWhatsApp();
      res.json({ message: "WhatsApp client initialization started." });
    } else {
      res.json({ message: `WhatsApp client is already: ${whatsappStatus}` });
    }
  });

  app.post("/api/whatsapp/disconnect", async (req, res) => {
    if (whatsappClient) {
      try {
        await whatsappClient.destroy();
        whatsappClient = null;
        whatsappStatus = 'DISCONNECTED';
        whatsappQrCode = '';
        console.log("WhatsApp client destroyed successfully.");
        res.json({ message: "WhatsApp client disconnected." });
      } catch (err: any) {
        console.error("Error destroying WhatsApp client:", err);
        res.status(500).json({ error: "Failed to destroy WhatsApp client." });
      }
    } else {
      res.json({ message: "WhatsApp client is not running." });
    }
  });

  app.post("/api/send-whatsapp", async (req, res) => {
    const { chatId, message } = req.body;
    if (!chatId || !message) {
      return res.status(400).json({ error: "Missing chatId or message" });
    }
    if (whatsappStatus !== 'CONNECTED' || !whatsappClient) {
      return res.status(503).json({ error: "WhatsApp client is not connected" });
    }
    try {
      await whatsappClient.sendMessage(chatId, message);
      console.log(`WhatsApp message sent successfully to: ${chatId}`);
      res.json({ success: true });
    } catch (err: any) {
      console.error(`Failed to send WhatsApp message to ${chatId}:`, err);
      res.status(500).json({ error: err.message || "Failed to send message" });
    }
  });

  app.post("/api/send-whatsapp-media", async (req, res) => {
    const { chatId, base64Data, filename, caption } = req.body;
    if (!chatId || !base64Data) {
      return res.status(400).json({ error: "Missing chatId or base64Data" });
    }
    if (whatsappStatus !== 'CONNECTED' || !whatsappClient) {
      return res.status(503).json({ error: "WhatsApp client is not connected" });
    }
    try {
      const matches = base64Data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: "Invalid base64 data format" });
      }
      const mimeType = matches[1];
      const data = matches[2];

      const media = new MessageMedia(mimeType, data, filename || "invoice.png");
      await whatsappClient.sendMessage(chatId, media, { caption: caption || "" });
      console.log(`WhatsApp media sent successfully to: ${chatId}`);
      res.json({ success: true });
    } catch (err: any) {
      console.error(`Failed to send WhatsApp media to ${chatId}:`, err);
      res.status(500).json({ error: err.message || "Failed to send media" });
    }
  });

  // Bulk Messages Endpoint
  app.post("/api/send-bulk-messages", async (req, res) => {
    // Set JSON response header
    res.setHeader('Content-Type', 'application/json');

    try {
      const { customerPhones, messageText, images, staffId } = req.body;
      const imageList = Array.isArray(images) ? images : [];
      const textMessage = typeof messageText === 'string' ? messageText : '';
      
      // Validation checks
      if (!customerPhones || !Array.isArray(customerPhones) || customerPhones.length === 0) {
        return res.status(400).json({ error: "Missing or invalid customerPhones array", success: false });
      }

      if (!textMessage && imageList.length === 0) {
        return res.status(400).json({ error: "Message text or images required", success: false });
      }

      console.log(`[Bulk Messages] Starting: ${customerPhones.length} customers, text=${!!messageText}, images=${images?.length || 0}`);

      const brandSnap = await getDoc(doc(db, 'branding', 'main'));
      const branding: any = brandSnap.exists() ? brandSnap.data() : {};
      const serviceType = resolveWhatsAppServiceType(branding);
      console.log(`[Bulk Messages] serviceType=${serviceType}, whatsappStatus=${whatsappStatus}`);
      const instanceId = branding?.greenApiInstanceId || '7107624225';
      const apiToken = branding?.greenApiToken || '15161302552e4373ad63cbeac1ec54d680c34b8d5bc644b1b1';

      // Select the phone to send from
      let sendFromPhone = branding?.adminWhatsappNumber || branding?.adminWhatsappNumbers?.[0] || '01284821014';
      
      if (staffId && branding?.whatsappNumbersWithStaff?.[staffId]) {
        sendFromPhone = branding.whatsappNumbersWithStaff[staffId];
        console.log(`[Bulk Messages] Using staff phone: ${sendFromPhone}`);
      }

      if (!sendFromPhone) {
        return res.status(400).json({ error: "No WhatsApp number configured", success: false });
      }

      let sentCount = 0;
      let failedCount = 0;
      const failedPhones: string[] = [];

      // Send to each customer
      for (const phone of customerPhones) {
        try {
          const customerChatId = formatPhoneToChatId(phone);
          console.log(`[Bulk Messages] Processing ${phone}`);

          if (serviceType === 'local_free') {
            if (!whatsappClient || whatsappStatus !== 'CONNECTED') {
              throw new Error('WhatsApp not connected');
            }

            // Send text
            if (textMessage) {
              await whatsappClient.sendMessage(customerChatId, textMessage);
              console.log(`[Bulk Messages] ✓ Text sent to ${phone}`);
            }

            // Send images
            if (imageList.length > 0) {
              for (const imageUrl of imageList) {
                try {
                  const base64 = imageUrl.split(',')[1] || imageUrl;
                  const media = new MessageMedia('image/jpeg', base64, 'bulk_message.jpg');
                  await whatsappClient.sendMessage(customerChatId, media);
                  console.log(`[Bulk Messages] ✓ Image sent to ${phone}`);
                } catch (imgErr) {
                  console.warn(`[Bulk Messages] ✗ Image failed for ${phone}`, imgErr);
                  throw imgErr;
                }
              }
            }
          } else {
            // Green API
            if (textMessage) {
              const textResponse = await fetch(`https://api.green-api.com/waInstance${instanceId}/sendMessage/${apiToken}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatId: customerChatId, message: textMessage })
              });
              if (!textResponse.ok) {
                const errorText = await textResponse.text();
                throw new Error(`Green API text failed: ${textResponse.status} ${errorText}`);
              }
              console.log(`[Bulk Messages] ✓ Green API text sent to ${phone}`);
            }

            if (imageList.length > 0) {
              for (const imageUrl of imageList) {
                try {
                  const base64 = imageUrl.split(',')[1] || imageUrl;
                  const imageResponse = await fetch(`https://api.green-api.com/waInstance${instanceId}/sendFileByBase64/${apiToken}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chatId: customerChatId,
                      base64File: base64,
                      fileName: 'bulk_message.jpg'
                    })
                  });
                  if (!imageResponse.ok) {
                    const errorText = await imageResponse.text();
                    throw new Error(`Green API image failed: ${imageResponse.status} ${errorText}`);
                  }
                  console.log(`[Bulk Messages] ✓ Green API image sent to ${phone}`);
                } catch (imgErr) {
                  console.warn(`[Bulk Messages] ✗ Green API image failed for ${phone}`, imgErr);
                  throw imgErr;
                }
              }
            }
          }

          sentCount++;
        } catch (phoneErr: any) {
          console.error(`[Bulk Messages] Failed for ${phone}:`, phoneErr.message);
          failedCount++;
          failedPhones.push(phone);
        }
      }

      console.log(`[Bulk Messages] Complete: ${sentCount} sent, ${failedCount} failed`);
      
      res.status(200).json({
        success: true,
        sentCount,
        failedCount,
        failedPhones,
        message: `تم إرسال الرسالة بنجاح إلى ${sentCount} عملاء`
      });

    } catch (err: any) {
      console.error('[Bulk Messages] Fatal error:', err);
      res.status(500).json({ 
        error: err.message || "Server error",
        success: false,
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  });

  // OAuth Endpoints
  app.get("/api/auth/url/:platform", (req, res) => {
    const { platform } = req.params;
    const redirectUri = `${req.protocol}://${req.get('host')}/auth/callback`;
    const state = crypto.randomBytes(16).toString('hex');
    
    let authUrl = '';
    const clientId = process.env[`${platform.toUpperCase()}_CLIENT_ID`] || 'placeholder_id';

    switch (platform) {
      case 'facebook':
        authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=public_profile,email,pages_manage_posts`;
        break;
      case 'instagram':
        authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user_profile,user_media&response_type=code&state=${state}`;
        break;
      case 'whatsapp':
        // WhatsApp doesn't have a standard OAuth for "linking" in the same way, 
        // but we can use the Business API login flow or a simple verification.
        authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=whatsapp_business_management`;
        break;
      default:
        return res.status(400).json({ error: 'Unsupported platform' });
    }

    res.json({ url: authUrl });
  });

  app.get("/auth/callback", (req, res) => {
    const { code, state } = req.query;
    
    // In a real app, you would exchange the code for an access token here.
    // For this demo, we'll just send a success message.
    
    res.send(`
      <html>
        <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #f8fafc; color: #0f172a;">
          <div style="background: white; padding: 2rem; border-radius: 1.5rem; shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); text-align: center;">
            <div style="background: #22c55e; color: white; width: 3rem; height: 3rem; border-radius: 50%; display: flex; items-center; justify-content: center; margin: 0 auto 1rem; font-size: 1.5rem;">✓</div>
            <h1 style="font-size: 1.25rem; font-weight: bold; margin-bottom: 0.5rem;">تم الربط بنجاح!</h1>
            <p style="color: #64748b; font-size: 0.875rem; margin-bottom: 1.5rem;">يمكنك الآن إغلاق هذه النافذة والعودة للتطبيق.</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', platform: 'facebook' }, '*');
                setTimeout(() => window.close(), 2000);
              }
            </script>
          </div>
        </body>
      </html>
    `);
  });

  // WebSocket logic
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Send initial state to the new client
    console.log("Sending initial state to client:", socket.id);
    socket.emit("init", state);

    // Handle state updates from clients
    socket.on("update_branding", (newBranding) => {
      console.log("Branding updated by client:", socket.id);
      state.branding = newBranding;
      saveState();
      socket.broadcast.emit("branding_updated", newBranding);
    });

    socket.on("update_products", (newProducts) => {
      console.log("Products updated by client:", socket.id);
      state.products = newProducts;
      saveState();
      socket.broadcast.emit("products_updated", newProducts);
    });

    socket.on("update_orders", (newOrders) => {
      console.log("Orders updated by client:", socket.id);
      state.orders = newOrders;
      saveState();
      socket.broadcast.emit("orders_updated", newOrders);
    });

    socket.on("update_promo_codes", (newPromoCodes) => {
      console.log("Promo codes updated by client:", socket.id);
      state.promoCodes = newPromoCodes;
      saveState();
      socket.broadcast.emit("promo_codes_updated", newPromoCodes);
    });

    socket.on("update_staff", (newStaff) => {
      console.log("Staff list updated by client:", socket.id);
      state.staff = newStaff;
      saveState();
      socket.broadcast.emit("staff_updated", newStaff);
    });

    socket.on("staff_login", (staffId) => {
      console.log("Staff logged in:", staffId, "Socket:", socket.id);
      socketToStaff.set(socket.id, staffId);
      const staffIdx = state.staff.findIndex((s: any) => s.id === staffId);
      if (staffIdx !== -1) {
        state.staff[staffIdx].isOnline = true;
        state.staff[staffIdx].lastActive = new Date().toISOString();
        io.emit("staff_updated", state.staff);
      }
    });

    socket.on("request_sync", () => {
      console.log("Client requested manual sync:", socket.id);
      socket.emit("init", state);
    });

    socket.on("disconnect", (reason) => {
      console.log("User disconnected:", socket.id, "Reason:", reason);
      const staffId = socketToStaff.get(socket.id);
      if (staffId) {
        const staffIdx = state.staff.findIndex((s: any) => s.id === staffId);
        if (staffIdx !== -1) {
          state.staff[staffIdx].isOnline = false;
          state.staff[staffIdx].lastActive = new Date().toISOString();
          io.emit("staff_updated", state.staff);
        }
        socketToStaff.delete(socket.id);
      }
    });
  });

  // ❌ JSON 404 for any unmatched /api/** route (prevents HTML being returned)
  app.use('/api', (req: any, res: any) => {
    res.status(404).json({
      success: false,
      error: `لم يتم العثور على المسار ${req.path} - تأكد من تشغيل السيرفر محلياً`
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files from dist in production
    app.use(express.static(path.join(__dirname, "dist")));
    
    // Handle SPA routing
    app.get("*", (req, res, next) => {
      // Skip API routes and socket.io
      if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
        return next();
      }
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  // ✅ Unified JSON error handler — must be AFTER all routes
  app.use((err: any, req: any, res: any, next: any) => {
    if (res.headersSent) return next(err);
    console.error('Express API error:', err);
    if (req.path.startsWith('/api')) {
      res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Server error',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      });
    } else {
      next(err);
    }
  });

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    
    // 🔥 Listen for connect/disconnect commands from Firebase (sent by the web UI)
    let lastCommandTimestamp = 0;
    onSnapshot(doc(db, 'whatsapp', 'command'), (snap: any) => {
      if (!snap.exists()) return;
      const data = snap.data();
      if (!data || data.timestamp <= lastCommandTimestamp) return;
      lastCommandTimestamp = data.timestamp;
      
      if (data.action === 'CONNECT') {
        console.log('🔌 Received CONNECT command from Firebase');
        initWhatsApp();
      } else if (data.action === 'DISCONNECT') {
        console.log('🔌 Received DISCONNECT command from Firebase');
        if (whatsappClient) {
          whatsappClient.destroy().catch(() => {});
          whatsappClient = null;
          whatsappStatus = 'DISCONNECTED';
          whatsappQrCode = '';
          syncStatusToFirebase('DISCONNECTED', '');
        }
      }
    });

    // Auto-start local WhatsApp client at server startup FIRST (can be disabled via env)
    if (!DISABLE_WHATSAPP) {
      console.log('🔌 Auto-starting local WhatsApp client at server startup...');
      initWhatsApp();
    } else {
      console.log('🔌 WhatsApp auto-start disabled by DISABLE_WHATSAPP=true');
    }
    // Note: startOrdersListener() will be called automatically when WhatsApp 'ready' event fires
    // OR if WhatsApp client never connects, it will be called from Firebase command listener
    
    // Start the orders listener immediately regardless of WhatsApp status
    // This ensures orders are monitored even if WhatsApp isn't connected yet
    startOrdersListener();
  });
}

startServer();
