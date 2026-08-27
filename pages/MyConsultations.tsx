
import React, { useState } from 'react';
import { useApp } from '../state';
import { Search, Phone, User, MessageCircle, Clock, CheckCircle, ArrowRight, ShieldCheck, Sparkles, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

const MyConsultations: React.FC = () => {
  const { consultations, addConsultation, t, language } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  
  // New Consultation Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    concern: '',
    age: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    const results = consultations.filter(c => 
      c.customerPhone.includes(searchQuery) || 
      c.customerName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResults(results);
    setHasSearched(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newCons = {
        id: Date.now().toString(),
        customerName: formData.name,
        customerPhone: formData.phone,
        concern: formData.concern,
        age: Number(formData.age) || undefined,
        status: 'pending' as const,
        createdAt: new Date().toISOString()
      };
      await addConsultation(newCons);
      setSubmitSuccess(true);
      setFormData({ name: '', phone: '', concern: '', age: '' });
      setTimeout(() => {
        setShowRequestForm(false);
        setSubmitSuccess(false);
      }, 3000);
    } catch (e) {
      alert("Error sending request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] pb-20" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header Area */}
      <div className="bg-white border-b border-stone-100 sticky top-0 z-50">
        <div className="max-w-xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="p-2 hover:bg-stone-50 rounded-full transition-colors">
            <ArrowRight size={20} className={language === 'en' ? 'rotate-180' : ''} />
          </Link>
          <h1 className="text-lg font-bold text-stone-900">{t.myConsultations}</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 py-10 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
            <Sparkles className="text-amber-600" size={32} />
          </div>
          <h2 className="text-2xl font-black text-stone-900">{t.searchConsultation}</h2>
          <p className="text-sm text-stone-400 leading-relaxed">
            {t.reviewingConsultation}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <div className={`absolute inset-y-0 ${language === 'ar' ? 'right-4' : 'left-4'} flex items-center pointer-events-none text-stone-400 group-focus-within:text-amber-600 transition-colors`}>
            <Search size={20} />
          </div>
          <input 
            type="text" 
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className={`w-full h-16 bg-white border border-stone-100 rounded-3xl ${language === 'ar' ? 'pr-12 pl-6 text-right' : 'pl-12 pr-6 text-left'} text-sm font-bold shadow-sm focus:border-amber-200 focus:ring-4 focus:ring-amber-50 outline-none transition-all`}
          />
          <button 
            onClick={handleSearch}
            className={`absolute ${language === 'ar' ? 'left-2' : 'right-2'} top-2 bottom-2 bg-black text-white px-6 rounded-2xl text-xs font-bold hover:bg-stone-800 transition-all active:scale-95`}
          >
            {t.searchBtn}
          </button>
        </div>

        {/* Results */}
        {hasSearched && (
          <div className="space-y-4">
            {searchResults.length > 0 ? (
              searchResults.map((c) => (
                <div key={c.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-stone-100 space-y-6 relative overflow-hidden group">
                  {c.status === 'replied' && (
                    <div className={`absolute top-0 ${language === 'ar' ? 'left-0 rounded-br-2xl' : 'right-0 rounded-bl-2xl'} bg-green-500 text-white px-4 py-1.5 text-[10px] font-bold flex items-center gap-1.5 z-10`}>
                      <CheckCircle size={12} />
                      {t.repliedStatus}
                    </div>
                  )}

                  <div className={`flex items-start justify-between ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                    <div className="w-full">
                      <div className={`flex items-center gap-2 ${language === 'ar' ? 'justify-end' : 'justify-start'} text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-1`}>
                         <Clock size={12} />
                         {new Date(c.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'long' })}
                      </div>
                      <h3 className="text-xl font-bold text-stone-900">{c.customerName}</h3>
                    </div>
                  </div>

                  <div className={`bg-stone-50 rounded-3xl p-6 ${language === 'ar' ? 'text-right' : 'text-left'} space-y-2 border border-stone-100/50`}>
                    <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest block">{t.yourQuestion}</span>
                    <p className="text-sm text-stone-600 leading-relaxed font-bold">{c.concern}</p>
                  </div>

                  {c.status === 'replied' ? (
                    <div className={`bg-amber-50/50 rounded-3xl p-6 ${language === 'ar' ? 'text-right' : 'text-left'} space-y-3 border border-amber-100 relative`}>
                      <div className={`flex items-center gap-2 ${language === 'ar' ? 'justify-end' : 'justify-start'} mb-1`}>
                        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">{t.medicallyApproved}</span>
                        <ShieldCheck size={14} className="text-amber-600" />
                      </div>
                      <span className="text-xs font-bold text-stone-900 block">{t.expertReply}</span>
                      <p className="text-sm text-stone-800 leading-relaxed font-bold whitespace-pre-wrap">{c.reply}</p>
                    </div>
                  ) : (
                    <div className="py-8 text-center space-y-4">
                       <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
                         <Clock className="text-amber-600" size={20} />
                       </div>
                       <p className="text-sm text-stone-500 font-bold max-w-[250px] mx-auto">{t.replySoon}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white rounded-[2.5rem] p-12 text-center border border-stone-100 shadow-sm space-y-4">
                 <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center mx-auto">
                    <MessageCircle className="text-stone-200" size={24} />
                 </div>
                 <p className="text-sm text-stone-400 font-bold">{t.noConsultations}</p>
              </div>
            )}
          </div>
        )}

        {!showRequestForm ? (
          <button 
            onClick={() => setShowRequestForm(true)}
            className="w-full h-20 bg-amber-600 text-white rounded-[2rem] font-bold shadow-xl shadow-amber-900/10 flex items-center justify-center gap-3 hover:bg-amber-700 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Sparkles size={20} />
            {t.requestFreeConsultation}
          </button>
        ) : (
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-amber-100 space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <button onClick={() => setShowRequestForm(false)} className="text-stone-300 hover:text-stone-500"><ArrowRight size={20} className={language === 'en' ? 'rotate-180' : ''} /></button>
              <h3 className="text-lg font-bold text-stone-900">{t.requestForm}</h3>
            </div>

            {submitSuccess ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle size={32} />
                </div>
                <p className="font-bold text-green-600">{t.consultationSent}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className={`space-y-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  <label className={`text-[10px] font-bold text-stone-400 uppercase ${language === 'ar' ? 'mr-2' : 'ml-2'}`}>{t.fullName}</label>
                  <div className="relative">
                    <User className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-stone-300`} size={18} />
                    <input 
                      required
                      type="text" 
                      placeholder={t.name}
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className={`w-full h-14 bg-stone-50 border-none rounded-2xl ${language === 'ar' ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left'} text-sm font-bold focus:ring-2 focus:ring-amber-200 outline-none`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className={`space-y-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                    <label className={`text-[10px] font-bold text-stone-400 uppercase ${language === 'ar' ? 'mr-2' : 'ml-2'}`}>{t.age}</label>
                    <input 
                      type="number" 
                      placeholder="25"
                      value={formData.age}
                      onChange={(e) => setFormData({...formData, age: e.target.value})}
                      className={`w-full h-14 bg-stone-50 border-none rounded-2xl px-4 text-sm font-bold focus:ring-2 focus:ring-amber-200 outline-none ${language === 'ar' ? 'text-right' : 'text-left'}`}
                    />
                  </div>
                  <div className={`space-y-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                    <label className={`text-[10px] font-bold text-stone-400 uppercase ${language === 'ar' ? 'mr-2' : 'ml-2'}`}>{t.phone}</label>
                    <div className="relative">
                      <Phone className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-stone-300`} size={18} />
                      <input 
                        required
                        type="tel" 
                        placeholder="010..."
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className={`w-full h-14 bg-stone-50 border-none rounded-2xl ${language === 'ar' ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left'} text-sm font-bold focus:ring-2 focus:ring-amber-200 outline-none`}
                      />
                    </div>
                  </div>
                </div>

                <div className={`space-y-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  <label className={`text-[10px] font-bold text-stone-400 uppercase ${language === 'ar' ? 'mr-2' : 'ml-2'}`}>{t.concern}</label>
                  <textarea 
                    required
                    placeholder="..."
                    value={formData.concern}
                    onChange={(e) => setFormData({...formData, concern: e.target.value})}
                    className={`w-full h-32 bg-stone-50 border-none rounded-2xl p-6 text-sm font-bold focus:ring-2 focus:ring-amber-200 outline-none resize-none ${language === 'ar' ? 'text-right' : 'text-left'}`}
                  />
                </div>

                <button 
                  disabled={isSubmitting}
                  className="w-full h-16 bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-stone-800 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? t.sending : (
                    <>
                      <Send size={18} />
                      {t.requestForm}
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyConsultations;
