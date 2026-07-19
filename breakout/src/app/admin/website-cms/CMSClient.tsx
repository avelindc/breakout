"use client";

import { useState } from "react";
import { CMSData, saveLandingPageCMS } from "@/app/actions/cms";
import { uploadCMSImageAction } from "@/app/actions/cmsUpload";
import { 
  Save, Loader2, Image as ImageIcon, Plus, Trash2, 
  Settings, LayoutTemplate, Info, Star, CreditCard, MessageCircle, Link as LinkIcon, Phone
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";

type TabType = "seo" | "hero" | "about" | "features" | "pricing" | "faq" | "testimonials" | "partners" | "contact" | "footer";

export default function CMSClient({ initialData }: { initialData: CMSData }) {
  const [data, setData] = useState<CMSData>(initialData);
  const [activeTab, setActiveTab] = useState<TabType>("hero");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await saveLandingPageCMS(data);
      setIsSaving(false);
      
      if (res.error) {
        setMessage({ text: res.error, type: 'error' });
      } else {
        setMessage({ text: 'CMS Data saved successfully! Landing page is updated.', type: 'success' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error: any) {
      console.error("Client Save Error:", error);
      setIsSaving(false);
      setMessage({ text: error.message || 'An unexpected error occurred while saving.', type: 'error' });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, path: string[], fieldId?: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setUploadingField(fieldId || path.join("."));
    
    const formData = new FormData();
    formData.append("file", file);
    
    const res = await uploadCMSImageAction(formData);
    setUploadingField(null);
    
    if (res.error) {
      alert("Upload failed: " + res.error);
      return;
    }
    
    if (res.url) {
      updateNestedField(path, res.url);
    }
  };

  const updateNestedField = (path: string[], value: any) => {
    setData((prev: any) => {
      const newData = { ...prev };
      let current = newData;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return newData as CMSData;
    });
  };

  const addArrayItem = (key: keyof CMSData, defaultItem: any) => {
    setData((prev: any) => ({
      ...prev,
      [key]: [...prev[key], { ...defaultItem, id: uuidv4() }]
    }));
  };

  const updateArrayItem = (key: keyof CMSData, id: string, field: string, value: any) => {
    setData((prev: any) => ({
      ...prev,
      [key]: prev[key].map((item: any) => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const removeArrayItem = (key: keyof CMSData, id: string) => {
    setData((prev: any) => ({
      ...prev,
      [key]: prev[key].filter((item: any) => item.id !== id)
    }));
  };

  const tabs: { id: TabType, name: string, icon: any }[] = [
    { id: "seo", name: "SEO", icon: Settings },
    { id: "hero", name: "Hero", icon: LayoutTemplate },
    { id: "about", name: "About Us", icon: Info },
    { id: "features", name: "Features", icon: Star },
    { id: "pricing", name: "Pricing", icon: CreditCard },
    { id: "faq", name: "FAQ", icon: MessageCircle },
    { id: "testimonials", name: "Testimonials", icon: Star },
    { id: "partners", name: "Partners", icon: LinkIcon },
    { id: "contact", name: "Contact", icon: Phone },
    { id: "footer", name: "Footer", icon: LayoutTemplate },
  ];

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row min-h-[700px]">
      
      {/* Sidebar Tabs */}
      <div className="w-full md:w-64 bg-gray-50 border-r border-gray-100 p-4 flex flex-col gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === tab.id 
                  ? "bg-blue-600 text-white shadow-md" 
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.name}
            </button>
          )
        })}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-8 flex flex-col h-full">
        
        {message && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-2 pb-20">
          
          {/* SEO TAB */}
          {activeTab === "seo" && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold text-gray-900">SEO Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                  <input type="text" value={data.seo.title} onChange={(e) => updateNestedField(['seo', 'title'], e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                  <textarea rows={3} value={data.seo.description} onChange={(e) => updateNestedField(['seo', 'description'], e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
                  <input type="text" value={data.seo.keywords} onChange={(e) => updateNestedField(['seo', 'keywords'], e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500" />
                </div>
              </div>
            </div>
          )}

          {/* HERO TAB */}
          {activeTab === "hero" && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold text-gray-900">Hero Section</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Badge Text</label>
                  <input type="text" value={data.hero.badge} onChange={(e) => updateNestedField(['hero', 'badge'], e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title Line 1</label>
                  <input type="text" value={data.hero.title1} onChange={(e) => updateNestedField(['hero', 'title1'], e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title Line 2 (Gradient)</label>
                  <input type="text" value={data.hero.title2} onChange={(e) => updateNestedField(['hero', 'title2'], e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                  <textarea rows={3} value={data.hero.subtitle} onChange={(e) => updateNestedField(['hero', 'subtitle'], e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary CTA Text</label>
                  <input type="text" value={data.hero.ctaText} onChange={(e) => updateNestedField(['hero', 'ctaText'], e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary CTA Link</label>
                  <input type="text" value={data.hero.ctaLink} onChange={(e) => updateNestedField(['hero', 'ctaLink'], e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Background Image URL</label>
                  <div className="flex gap-4 items-center">
                    <input type="text" value={data.hero.backgroundUrl} onChange={(e) => updateNestedField(['hero', 'backgroundUrl'], e.target.value)} className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500" placeholder="https://..." />
                    <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2">
                      {uploadingField === 'hero.bg' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                      Upload
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, ['hero', 'backgroundUrl'], 'hero.bg')} />
                    </label>
                  </div>
                  {data.hero.backgroundUrl && <img src={data.hero.backgroundUrl} alt="Hero BG" className="mt-4 h-32 w-auto object-cover rounded-xl" />}
                </div>
              </div>
            </div>
          )}

          {/* ABOUT TAB */}
          {activeTab === "about" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Tentang Kami</h2>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={data.about.isActive} onChange={(e) => updateNestedField(['about', 'isActive'], e.target.checked)} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm font-medium text-gray-700">Tampilkan Seksi Ini</span>
                </label>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Judul</label>
                  <input type="text" value={data.about.title} onChange={(e) => updateNestedField(['about', 'title'], e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                  <textarea rows={6} value={data.about.description} onChange={(e) => updateNestedField(['about', 'description'], e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gambar Ilustrasi</label>
                  <div className="flex gap-4 items-center">
                    <input type="text" value={data.about.imageUrl} onChange={(e) => updateNestedField(['about', 'imageUrl'], e.target.value)} className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500" placeholder="https://..." />
                    <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2">
                      {uploadingField === 'about.img' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                      Upload
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, ['about', 'imageUrl'], 'about.img')} />
                    </label>
                  </div>
                  {data.about.imageUrl && <img src={data.about.imageUrl} alt="About" className="mt-4 h-32 w-auto object-cover rounded-xl" />}
                </div>
              </div>
            </div>
          )}

          {/* FEATURES TAB */}
          {activeTab === "features" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Fitur / Keunggulan</h2>
                <button onClick={() => addArrayItem('features', { title: 'New Feature', description: 'Description here', icon: 'Star' })} className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-xl text-sm font-bold transition">
                  <Plus className="w-4 h-4" /> Tambah Fitur
                </button>
              </div>
              
              <div className="space-y-4">
                {data.features.map((feature, i) => (
                  <div key={feature.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl relative group">
                    <button onClick={() => removeArrayItem('features', feature.id)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="grid md:grid-cols-2 gap-4 pr-12">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Judul Fitur</label>
                        <input type="text" value={feature.title} onChange={(e) => updateArrayItem('features', feature.id, 'title', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Icon (Lucide React name)</label>
                        <input type="text" value={feature.icon} onChange={(e) => updateArrayItem('features', feature.id, 'icon', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Deskripsi</label>
                        <textarea rows={2} value={feature.description} onChange={(e) => updateArrayItem('features', feature.id, 'description', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PRICING TAB */}
          {activeTab === "pricing" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Paket Harga</h2>
                <button onClick={() => addArrayItem('pricing', { name: 'Pro Plan', price: 'Rp 100k', period: '/tahun', features: ['Feature 1'], isPopular: false, ctaText: 'Daftar', ctaLink: '/register' })} className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-xl text-sm font-bold transition">
                  <Plus className="w-4 h-4" /> Tambah Paket
                </button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                {data.pricing.map((plan, i) => (
                  <div key={plan.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl relative">
                    <button onClick={() => removeArrayItem('pricing', plan.id)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="space-y-3 pr-12">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={plan.isPopular} onChange={(e) => updateArrayItem('pricing', plan.id, 'isPopular', e.target.checked)} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                          <span className="text-xs font-bold text-gray-700">Tandai Populer</span>
                        </label>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Nama Paket</label>
                        <input type="text" value={plan.name} onChange={(e) => updateArrayItem('pricing', plan.id, 'name', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500" />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Harga</label>
                          <input type="text" value={plan.price} onChange={(e) => updateArrayItem('pricing', plan.id, 'price', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500" />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Periode</label>
                          <input type="text" value={plan.period} onChange={(e) => updateArrayItem('pricing', plan.id, 'period', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Keunggulan (Pisahkan dengan koma)</label>
                        <textarea rows={3} value={plan.features.join(", ")} onChange={(e) => updateArrayItem('pricing', plan.id, 'features', e.target.value.split(',').map(s=>s.trim()))} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm" />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-500 mb-1">CTA Teks</label>
                          <input type="text" value={plan.ctaText} onChange={(e) => updateArrayItem('pricing', plan.id, 'ctaText', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500" />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-500 mb-1">CTA Link</label>
                          <input type="text" value={plan.ctaLink} onChange={(e) => updateArrayItem('pricing', plan.id, 'ctaLink', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQ TAB */}
          {activeTab === "faq" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">FAQ</h2>
                <button onClick={() => addArrayItem('faq', { question: 'Pertanyaan baru?', answer: 'Jawaban' })} className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-xl text-sm font-bold transition">
                  <Plus className="w-4 h-4" /> Tambah FAQ
                </button>
              </div>
              
              <div className="space-y-4">
                {data.faq.map((item, i) => (
                  <div key={item.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl relative group">
                    <button onClick={() => removeArrayItem('faq', item.id)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="space-y-3 pr-12">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Pertanyaan</label>
                        <input type="text" value={item.question} onChange={(e) => updateArrayItem('faq', item.id, 'question', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Jawaban</label>
                        <textarea rows={2} value={item.answer} onChange={(e) => updateArrayItem('faq', item.id, 'answer', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TESTIMONIALS TAB */}
          {activeTab === "testimonials" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Testimoni</h2>
                <button onClick={() => addArrayItem('testimonials', { name: 'Nama', role: 'Peran', content: 'Komentar', avatarUrl: '' })} className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-xl text-sm font-bold transition">
                  <Plus className="w-4 h-4" /> Tambah Testimoni
                </button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                {data.testimonials.map((item) => (
                  <div key={item.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl relative">
                    <button onClick={() => removeArrayItem('testimonials', item.id)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="space-y-3 pr-12">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Nama</label>
                          <input type="text" value={item.name} onChange={(e) => updateArrayItem('testimonials', item.id, 'name', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500" />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Peran / Profesi</label>
                          <input type="text" value={item.role} onChange={(e) => updateArrayItem('testimonials', item.id, 'role', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Isi Pesan</label>
                        <textarea rows={3} value={item.content} onChange={(e) => updateArrayItem('testimonials', item.id, 'content', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Avatar URL</label>
                        <div className="flex gap-2 items-center">
                          <input type="text" value={item.avatarUrl} onChange={(e) => updateArrayItem('testimonials', item.id, 'avatarUrl', e.target.value)} className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm" />
                          <label className="cursor-pointer bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center">
                            {uploadingField === `testimoni-${item.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                              setUploadingField(`testimoni-${item.id}`);
                              const formData = new FormData();
                              formData.append("file", e.target.files![0]);
                              uploadCMSImageAction(formData).then(res => {
                                setUploadingField(null);
                                if(res.url) updateArrayItem('testimonials', item.id, 'avatarUrl', res.url);
                              });
                            }} />
                          </label>
                        </div>
                        {item.avatarUrl && <img src={item.avatarUrl} alt="Avatar" className="mt-2 w-10 h-10 rounded-full object-cover" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PARTNERS TAB */}
          {activeTab === "partners" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Partner Logos</h2>
                <button onClick={() => addArrayItem('partners', { name: 'Partner', logoUrl: '' })} className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-xl text-sm font-bold transition">
                  <Plus className="w-4 h-4" /> Tambah Logo
                </button>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                {data.partners.map((item) => (
                  <div key={item.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl relative">
                    <button onClick={() => removeArrayItem('partners', item.id)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="space-y-3 pr-10">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Nama Partner</label>
                        <input type="text" value={item.name} onChange={(e) => updateArrayItem('partners', item.id, 'name', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Logo URL</label>
                        <div className="flex gap-2 items-center">
                          <input type="text" value={item.logoUrl} onChange={(e) => updateArrayItem('partners', item.id, 'logoUrl', e.target.value)} className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm" />
                          <label className="cursor-pointer bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center">
                            {uploadingField === `partner-${item.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                              setUploadingField(`partner-${item.id}`);
                              const formData = new FormData();
                              formData.append("file", e.target.files![0]);
                              uploadCMSImageAction(formData).then(res => {
                                setUploadingField(null);
                                if(res.url) updateArrayItem('partners', item.id, 'logoUrl', res.url);
                              });
                            }} />
                          </label>
                        </div>
                        {item.logoUrl && <div className="mt-2 bg-gray-200 rounded p-2"><img src={item.logoUrl} alt="Logo" className="h-10 w-auto object-contain" /></div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CONTACT TAB */}
          {activeTab === "contact" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Kontak</h2>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={data.contact.isActive} onChange={(e) => updateNestedField(['contact', 'isActive'], e.target.checked)} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm font-medium text-gray-700">Tampilkan Seksi Ini</span>
                </label>
              </div>
              
              <div className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Dukungan</label>
                  <input type="text" value={data.contact.email} onChange={(e) => updateNestedField(['contact', 'email'], e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nomor WhatsApp</label>
                  <input type="text" value={data.contact.whatsapp} onChange={(e) => updateNestedField(['contact', 'whatsapp'], e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Kantor</label>
                  <textarea rows={3} value={data.contact.address} onChange={(e) => updateNestedField(['contact', 'address'], e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500" />
                </div>
              </div>
            </div>
          )}

          {/* FOOTER TAB */}
          {activeTab === "footer" && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold text-gray-900">Footer Settings</h2>
              
              <div className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teks Singkat Footer</label>
                  <textarea rows={3} value={data.footer.aboutText} onChange={(e) => updateNestedField(['footer', 'aboutText'], e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Copyright Text</label>
                  <input type="text" value={data.footer.copyright} onChange={(e) => updateNestedField(['footer', 'copyright'], e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500" />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Action Footer */}
        <div className="mt-auto pt-6 border-t border-gray-100 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-full transition shadow-lg shadow-blue-600/30"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </div>
    </div>
  );
}
