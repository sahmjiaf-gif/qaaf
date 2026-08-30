
import React, { useState, useEffect } from 'react';
import { useApp } from '../state';
import { Printer, Download, Droplet, Loader2, X } from 'lucide-react';
import { Order } from '../types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface InvoiceProps {
  order: Order;
  onClose?: () => void;
  initialAction?: 'print' | 'download';
}

const Invoice: React.FC<InvoiceProps> = ({ order, onClose, initialAction }) => {
  const { branding, language, t } = useApp();
  const [isDownloading, setIsDownloading] = useState(false);

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleDownload = async () => {
    const element = document.getElementById('printable-invoice');
    if (!element) return;

    try {
      setIsDownloading(true);
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`invoice-${order.id}.pdf`);
    } catch (error) {
      console.error('Download failed:', error);
      alert(t.invoice?.failedDownload ?? (language === 'ar' ? 'فشل تحميل الفاتورة' : 'Failed to download invoice'));
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    if (initialAction === 'print') {
      handlePrint();
    } else if (initialAction === 'download') {
      handleDownload();
    }
  }, [initialAction]);

  if (!order) return null;
  const hasProducts = order && order.products && order.products.length > 0;

  const invoiceStyle = branding?.invoiceStyle || 'classic';
  
  // Style variations
  const getContainerClass = () => {
    switch(invoiceStyle) {
      case 'minimal': return "bg-white min-h-[80vh] md:min-h-0 md:rounded-3xl overflow-hidden flex flex-col max-w-[320px] w-full mx-auto my-0 md:my-4 print:my-0 print:rounded-none border border-gray-100";
      case 'modern': return "bg-gradient-to-b from-slate-50 to-white min-h-[80vh] md:min-h-0 md:rounded-2xl overflow-hidden shadow-2xl flex flex-col max-w-[320px] w-full mx-auto my-0 md:my-4 print:my-0 print:shadow-none print:rounded-none border border-slate-200";
      default: return "bg-white min-h-[80vh] md:min-h-0 md:rounded-2xl overflow-hidden shadow-2xl flex flex-col max-w-[320px] w-full mx-auto my-0 md:my-4 print:my-0 print:shadow-none print:rounded-none";
    }
  };

  const getHeaderBorderClass = () => {
    switch(invoiceStyle) {
      case 'minimal': return "border-b border-gray-100 pb-6";
      case 'modern': return "border-b-2 border-slate-800 pb-6";
      default: return "border-b border-gray-900 pb-6";
    }
  };

  const getTableHeadClass = () => {
    switch(invoiceStyle) {
      case 'minimal': return "bg-transparent border-b border-gray-100 text-gray-500";
      case 'modern': return "bg-slate-800 text-white";
      default: return "bg-gray-50 text-gray-400";
    }
  };

  return (
    <div className={getContainerClass()}>
      {/* Header / Actions - Hidden on Print */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 print:hidden">
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition shadow-md active:scale-95"
          >
            <Printer size={16} />
             {t.invoice?.print ?? (language === 'ar' ? 'طباعة' : 'Print')}
          </button>
          <button 
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-50 transition shadow-sm active:scale-95 disabled:opacity-50"
          >
            {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
             {t.invoice?.downloadPdf ?? (language === 'ar' ? 'تحميل PDF' : 'Download PDF')}
          </button>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="flex items-center gap-1 px-3 py-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition font-bold text-xs"
          >
             <span>{t.invoice?.close ?? (language === 'ar' ? 'إغلاق' : 'Close')}</span>
            <X size={18} />
          </button>
        )}
      </div>

      {/* Invoice Content */}
      <div 
        className={`p-4 md:p-5 space-y-5 print:p-0 ${language === 'ar' ? 'text-right' : 'text-left'}`} 
        id="printable-invoice"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Brand Header */}
        <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${getHeaderBorderClass()}`}>
          <div className="space-y-1">
            {branding?.logoImage ? (
              <div className="flex items-center justify-center">
                <div className="flex items-center justify-center rounded-full border border-gray-200 bg-white shadow-[0_10px_20px_rgba(0,0,0,0.08)] p-1.5">
                  <img src={branding.logoImage} alt="Logo" style={{ width: `${Math.max(54, (branding.logoSize || 100) * 0.7)}px`, height: `${Math.max(54, (branding.logoSize || 100) * 0.7)}px` }} className="rounded-full object-cover block" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col leading-none">
                <div className="relative inline-block">
                  <Droplet className="text-yellow-400 fill-yellow-400 absolute -top-3 left-1/2 -translate-x-1/2" size={14} />
                  <h1 className="text-2xl font-playfair font-bold tracking-tight text-black pt-1">QAAF</h1>
                </div>
                <span className={`text-[6px] font-bold text-gray-400 mt-1 uppercase ${language === 'ar' ? 'tracking-normal' : 'tracking-[0.3em]'}`}>{t.evidenceBased}</span>
              </div>
            )}
          </div>
          <div className={`text-right ${language === 'ar' ? 'md:text-left' : 'md:text-right'}`}>
             <h2 className={`text-xl font-playfair font-bold text-gray-900 uppercase ${language === 'ar' ? 'tracking-normal' : 'tracking-tighter'}`}>{t.invoice?.title ?? (language === 'ar' ? 'فاتورة' : 'INVOICE')}</h2>
            <p className="text-gray-400 font-bold text-[9px] mt-1">#{order.id}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <div className="space-y-3">
            <h3 className={`text-[9px] font-bold text-gray-400 uppercase border-b border-gray-100 pb-1 ${language === 'ar' ? 'tracking-normal' : 'tracking-widest'}`}>
               {t.invoice?.customerInfo ?? (language === 'ar' ? 'العميل' : 'Customer')}
            </h3>
            <div className="space-y-1">
              <p className="text-sm font-bold text-gray-900">{order.customerName}</p>
              <p className="text-gray-600 font-bold text-[10px]">
                {order.phoneNumber}
              </p>
              <p className="text-gray-500 text-[9px] font-medium leading-relaxed">
                {order.governorate} - {order.city}
              </p>
              <p className="text-gray-500 text-[11px] font-medium leading-relaxed">
                {order.address}
                {order.landmark && <span className="block text-amber-700 font-bold mt-0.5">({order.landmark})</span>}
              </p>
            </div>
          </div>
          <div className={`space-y-3 ${language === 'ar' ? 'text-left' : 'text-right'}`}>
            <h3 className={`text-[9px] font-bold text-gray-400 uppercase border-b border-gray-100 pb-1 ${language === 'ar' ? 'tracking-normal' : 'tracking-widest'}`}>
               {t.invoice?.details ?? (language === 'ar' ? 'التفاصيل' : 'Details')}
            </h3>
            <div className="space-y-1 text-[10px]">
              <p className="text-gray-500 font-medium">
                 <span className="text-gray-400 text-[8px] uppercase">{t.invoice?.date ?? (language === 'ar' ? 'التاريخ' : 'Date')}:</span> {new Date(order.date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
              </p>
              <p className="text-gray-500 font-medium">
                 <span className="text-gray-400 text-[8px] uppercase">{t.invoice?.status ?? (language === 'ar' ? 'الحالة' : 'Status')}:</span> 
                <span className={`ml-1 uppercase text-[9px] font-bold px-1.5 py-0.5 bg-gray-100 rounded ${language === 'ar' ? 'tracking-normal' : 'tracking-widest'}`}>
                  {order.status}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className={`overflow-hidden ${invoiceStyle === 'minimal' ? '' : 'rounded-xl border border-gray-100'}`}>
          <table className="w-full text-right border-collapse" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <thead>
              <tr className={getTableHeadClass()}>
                <th className={`px-4 py-3 text-[9px] font-bold uppercase ${language === 'ar' ? 'text-right tracking-normal' : 'text-left tracking-widest'}`}>{t.invoice?.productName ?? (language === 'ar' ? 'المنتج' : 'Product')}</th>
                <th className={`px-4 py-3 text-[9px] font-bold uppercase text-center ${language === 'ar' ? 'tracking-normal' : 'tracking-widest'}`}>{t.invoice?.qty ?? (language === 'ar' ? 'الكمية' : 'Qty')}</th>
                <th className={`px-4 py-3 text-[9px] font-bold uppercase ${language === 'ar' ? 'text-left tracking-normal' : 'text-right tracking-widest'}`}>{t.invoice?.price ?? (language === 'ar' ? 'السعر' : 'Price')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {hasProducts ? (
                order.products.map((item, idx) => (
                  <tr key={idx}>
                    <td className={`px-4 py-4 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{item.product.name}</p>
                        <p className={`text-[9px] text-gray-400 uppercase ${language === 'ar' ? 'tracking-normal' : 'tracking-widest'}`}>{item.product.category}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center font-bold text-gray-600 text-xs">{item.quantity}</td>
                    <td className={`px-4 py-4 ${language === 'ar' ? 'text-left' : 'text-right'} font-bold text-gray-900 text-xs`}>
                      {((item.product?.isOnSale && item.product?.salePrice) ? item.product.salePrice : (item.product?.price || 0)) * item.quantity} {t.egp}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-400 text-xs">
                     {t.invoice?.noProducts ?? (language === 'ar' ? 'بيانات المنتج غير متوفرة' : 'Product details not available')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className={`flex ${language === 'ar' ? 'justify-start' : 'justify-end'}`}>
          <div className="w-full max-w-[200px] space-y-2">
            <div className="flex justify-between text-[10px] font-bold">
              <span className={`text-gray-400 uppercase ${language === 'ar' ? 'tracking-normal' : 'tracking-widest'}`}>{t.subtotal}</span>
              <span className="text-gray-900">
                {(order.products || []).reduce((sum, item) => {
                  const currentPrice = (item.product?.isOnSale && item.product?.salePrice) ? item.product.salePrice : (item.product?.price || 0);
                  return sum + (currentPrice * item.quantity);
                }, 0)} {t.egp}
              </span>
            </div>
            {order.discountAmount && order.discountAmount > 0 && (
              <div className="flex justify-between text-[10px] font-bold text-green-600">
                <span className={`uppercase ${language === 'ar' ? 'tracking-normal' : 'tracking-widest'}`}>{t.discount}</span>
                <span>-{order.discountAmount} {t.egp}</span>
              </div>
            )}
            {order.shippingFee && order.shippingFee > 0 && (
              <div className="flex justify-between text-[10px] font-bold text-gray-500">
                <span className={`uppercase ${language === 'ar' ? 'tracking-normal' : 'tracking-widest'}`}>{language === 'ar' ? 'الشحن (شركة التوصيل)' : 'Shipping (Delivery Co.)'}</span>
                <span>{order.shippingFee} {t.egp}</span>
              </div>
            )}
            <div className="pt-3 border-t border-gray-900 flex justify-between items-center">
              <span className={`text-sm font-bold text-gray-900 uppercase ${language === 'ar' ? 'tracking-normal' : 'tracking-tighter'}`}>{t.total}</span>
              <span className="text-xl font-bold text-black">
                {Math.max(0, (order.finalTotal || 0) - (order.discountAmount || 0) + (order.shippingFee || 0))} {t.egp}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="pt-8 border-t border-gray-100 text-center space-y-3">
          <p className={`text-gray-400 text-[9px] font-bold uppercase ${language === 'ar' ? 'tracking-normal' : 'tracking-[0.3em]'}`}>
             {t.invoice?.thankYou ?? (language === 'ar' ? 'شكراً لثقتك في قاف' : 'Thank you for choosing QAAF')}
          </p>
          <div className={`flex justify-center gap-4 text-[8px] font-bold text-gray-300 uppercase ${language === 'ar' ? 'tracking-normal' : 'tracking-widest'}`}>
            <span>Evidence-Based</span>
            <span>•</span>
            <span>Natural</span>
            <span>•</span>
            <span>With Love</span>
          </div>
        </div>

        {/* Close Button at bottom - Hidden on Print */}
        {onClose && (
          <div className="pt-6 flex justify-center print:hidden">
            <button 
              onClick={onClose}
              className="px-8 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition"
            >
              {t.invoice?.closeInvoice || (language === 'ar' ? 'إغلاق الفاتورة' : 'Close Invoice')}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Invoice;
