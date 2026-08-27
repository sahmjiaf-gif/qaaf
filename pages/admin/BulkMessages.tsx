import React, { useState, useMemo } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useApp } from '../../state';
import { apiUrl } from '../../src/lib/api';
import { Send, MessageSquare, Phone, Upload, Trash2, Check, Loader, AlertCircle, Image as ImageIcon, User } from 'lucide-react';

const BulkMessages: React.FC = () => {
  const { orders, branding, currentStaff, staff } = useApp();
  const [messageText, setMessageText] = useState('');
  const [images, setImages] = useState<{ id: string; url: string }[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [sentStatus, setSentStatus] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // في حالة دخول الموظف، عرض طلباته فقط؛ وإلا عرض الكل
  const assignedOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    if (!currentStaff) {
      // إذا دخول مالك المتجر → عرض كل الطلبات
      return orders;
    } else {
      // إذا دخول موظف → عرض الطلبات المسندة له فقط
      return orders.filter(order => order.assignedTo === currentStaff.id);
    }
  }, [orders, currentStaff]);

  // استخراج أرقام العملاء من الطلبات المسندة للموظف
  const customerPhones = useMemo(() => {
    if (!assignedOrders || assignedOrders.length === 0) return [];
    
    // جمع الأرقام المميزة من الطلبات
    const phonesSet = new Set<string>();
    assignedOrders.forEach(order => {
      if (order.phoneNumber && order.phoneNumber.trim()) {
        // تنظيف الرقم (إزالة المسافات والشرطات)
        const cleanPhone = order.phoneNumber.replace(/[\s-]/g, '');
        phonesSet.add(cleanPhone);
      }
    });
    
    return Array.from(phonesSet);
  }, [assignedOrders]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files) {
      const maxImages = 5;
      const maxSize = 5 * 1024 * 1024; // 5 MB per image
      let newImagesCount = images.length;

      Array.from(files).some(file => {
        if (newImagesCount >= maxImages) {
          setSentStatus({ type: 'error', msg: `الحد الأقصى للصور هو ${maxImages} صور فقط` });
          return true;
        }

        if (file.size > maxSize) {
          setSentStatus({ type: 'error', msg: `حجم الصورة لا يجب أن يتجاوز 5 ميجا` });
          return true;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const imageUrl = event.target?.result as string;
          setImages(prev => [...prev, {
            id: Date.now() + Math.random().toString(),
            url: imageUrl
          }]);
        };
        reader.readAsDataURL(file);
        newImagesCount += 1;
        return false;
      });
    }
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleSendMessages = async () => {
    if (!messageText.trim() && images.length === 0) {
      setSentStatus({
        type: 'error',
        msg: 'من فضلك أدخل رسالة أو أضف صور'
      });
      return;
    }

    if (customerPhones.length === 0) {
      setSentStatus({
        type: 'error',
        msg: currentStaff ? 'لا توجد طلبات مسندة لك حتى الآن' : 'لا توجد أرقام عملاء لإرسال الرسالة لهم'
      });
      return;
    }

    setIsSending(true);
    setSentStatus(null);

    try {
      // بناء الرسالة مع توقيع الموظف
      let fullMessage = messageText.trim();
      if (currentStaff) {
        fullMessage += `\n\n📞 *بتوقيع:* ${currentStaff.username}\n📱 *رقم التواصل:* ${currentStaff.phone || 'غير متوفر'}`;
      }

      // إرسال الرسائل عبر الـ API (لا نرسل adminPhone - الـ server سيختار الرقم الصحيح من staffId)
      const payload = {
        customerPhones,
        messageText: fullMessage,
        images: images.map(img => img.url),
        staffId: currentStaff?.id || null,
        timestamp: new Date().toISOString()
      };

      console.log('📤 Sending bulk messages payload:', payload);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout

      const response = await fetch(apiUrl('/api/send-bulk-messages'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      let responseData: any;
      const responseText = await response.text();
      
      console.log('📨 Server response text:', responseText.substring(0, 200));

      if (!responseText) {
        throw new Error('خطأ: لم يرد الـ server بأي بيانات');
      }

      try {
        responseData = JSON.parse(responseText);
      } catch (jsonErr) {
        console.error('Failed to parse JSON response:', responseText.substring(0, 500));
        // If the response starts with HTML tags, it's likely the server is not running
        const isHtml = responseText.trim().startsWith('<');
        if (isHtml) {
          throw new Error('السيرفر المحلي غير متاح. يرجى تشغيل السيرفر أولاً باستخدام: npm run dev');
        }
        throw new Error(`خطأ من السيرفر: ${responseText.substring(0, 100)}`);
      }

      if (!response.ok) {
        throw new Error(responseData.error || `فشل الإرسال (${response.status})`);
      }

      setSentStatus({
        type: 'success',
        msg: `✅ تم إرسال الرسالة بنجاح إلى ${responseData.sentCount || customerPhones.length} عملاء`
      });

      // إعادة تعيين النموذج
      setMessageText('');
      setImages([]);
      setImagePreview(null);

    } catch (error: any) {
      console.error('❌ Error sending bulk messages:', error);
      let errorMsg = error.message;
      
      if (error.name === 'AbortError') {
        errorMsg = 'انتهت مهلة الانتظار - حاول مرة أخرى';
      }
      
      setSentStatus({
        type: 'error',
        msg: `❌ فشل الإرسال: ${errorMsg}`
      });
    } finally {
      setIsSending(false);
      setTimeout(() => setSentStatus(null), 5000);
    }
  };

  return (
    <AdminLayout title="الرسائل الكلية">
      <div className="max-w-6xl mx-auto" dir="rtl">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white mb-8 shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <MessageSquare size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-black">الرسائل الكلية</h1>
                <p className="text-blue-100 text-sm mt-2">
                  {currentStaff 
                    ? `إرسال رسائل وصور لعملائك عبر الواتساب (${currentStaff.username})`
                    : 'إرسال رسائل وصور لجميع العملاء دفعة واحدة عبر الواتساب'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Message Input */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <MessageSquare size={18} className="text-blue-600" />
                نص الرسالة
              </label>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="اكتب الرسالة التي تريد إرسالها لكل العملاء..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 px-4 outline-none focus:border-blue-600 transition min-h-[200px] text-sm leading-relaxed resize-vertical"
              />
              <p className="text-xs text-gray-500 mt-2">
                {messageText.length} حرف
              </p>
            </div>

            {/* Image Upload */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <label className="block text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                <ImageIcon size={18} className="text-blue-600" />
                إضافة صور (اختياري)
              </label>
              
              <div className="mb-6">
                <label className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-600 transition bg-gray-50 hover:bg-blue-50">
                  <div className="text-center">
                    <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                    <span className="text-sm font-bold text-gray-600">
                      اضغط لاختيار صور أو اسحب الصور هنا
                    </span>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF - حد أقصى 5 MB</p>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Images Grid */}
              {images.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-gray-700">
                    الصور المضافة ({images.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {images.map(img => (
                      <div key={img.id} className="relative group">
                        <img
                          src={img.url}
                          alt="preview"
                          className="w-full h-32 object-cover rounded-xl border border-gray-200"
                        />
                        <button
                          onClick={() => removeImage(img.id)}
                          className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Status Messages */}
            {sentStatus && (
              <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold ${
                sentStatus.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
                sentStatus.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                {sentStatus.type === 'success' && <Check size={18} />}
                {sentStatus.type === 'error' && <AlertCircle size={18} />}
                {sentStatus.msg}
              </div>
            )}

            {/* Send Button */}
            <button
              onClick={handleSendMessages}
              disabled={isSending || (messageText.trim().length === 0 && images.length === 0)}
              className={`w-full py-4 rounded-xl font-bold text-white transition shadow-lg flex items-center justify-center gap-2 ${
                isSending || (messageText.trim().length === 0 && images.length === 0)
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSending ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Send size={20} />
                  إرسال للجميع
                </>
              )}
            </button>
          </div>

          {/* Right Sidebar - Customer Stats */}
          <div className="space-y-6">
            
            {/* Customers Summary */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-blue-900 text-sm">عدد العملاء</h3>
                <Phone className="text-blue-600" size={20} />
              </div>
              <p className="text-4xl font-black text-blue-600 mb-2">
                {customerPhones.length}
              </p>
              <p className="text-xs text-blue-700">
                أرقام مميزة من {assignedOrders.length} طلب
                {currentStaff && ` (طلباتك فقط)`}
              </p>
            </div>

            {/* Phone List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2">
                <Phone size={16} className="text-blue-600" />
                أرقام العملاء
              </h3>
              
              {customerPhones.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-6">
                  لا توجد أرقام عملاء حتى الآن
                </p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {customerPhones.map((phone, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs font-bold text-gray-800 flex items-center justify-between hover:bg-blue-50 transition"
                    >
                      <span>{phone}</span>
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Staff Info (if logged in as staff) */}
            {currentStaff && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <User size={18} className="text-green-700" />
                  </div>
                  <div>
                    <h4 className="font-bold text-green-900 text-sm">معلومات الموظف</h4>
                    <p className="text-xs text-green-700">{currentStaff.username}</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs text-green-800">
                  <p>
                    <strong>الاسم:</strong> {currentStaff.username}
                  </p>
                  <p>
                    <strong>الهاتف:</strong> {currentStaff.phone || 'غير متوفر'}
                  </p>
                  <p>
                    <strong>البريد:</strong> {currentStaff.email || 'غير متوفر'}
                  </p>
                  <p className="pt-2 border-t border-green-200 mt-2">
                    ✅ الرسائل ستكون بتوقيعك وتتضمن بيانات التواصل الخاصة بك
                  </p>
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
              <p className="text-xs text-amber-900 leading-relaxed">
                <strong>ℹ️ معلومات مهمة:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-amber-800">
                  {currentStaff ? (
                    <>
                      <li>الأرقام المعروضة من طلباتك فقط</li>
                      <li>كل عميل سيعرف إنه بيتواصل معك مباشرة</li>
                      <li>الرسالة ستتضمن اسمك ورقم هاتفك</li>
                      <li>الرسائل تُرسل من رقم الواتساب المسجل في الإعدادات</li>
                    </>
                  ) : (
                    <>
                      <li>الأرقام المعروضة من جميع الطلبات</li>
                      <li>كل رقم سيتلقى الرسالة والصور</li>
                      <li>الرسائل تُرسل من رقم الواتساب المسجل في الإعدادات</li>
                    </>
                  )}
                </ul>
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default BulkMessages;
