
import React, { useState, useMemo, useRef } from 'react';
import { 
  Layout, 
  FileText, 
  Image as ImageIcon, 
  Lightbulb, 
  Plus, 
  Search, 
  Download, 
  Trash2, 
  Edit3, 
  Sparkles, 
  ChevronRight,
  Share2,
  BookOpen,
  Info,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GuidanceMaterial, TeacherData } from '../types';
import Markdown from 'react-markdown';
import { GoogleGenAI } from "@google/genai";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface GuidanceBoardProps {
  materials: GuidanceMaterial[];
  onSave: (material: GuidanceMaterial) => void;
  onDelete: (id: string) => void;
  teacherData: TeacherData;
}

const CATEGORIES = [
  'Artikel Ilmiah', 
  'Bimbingan Siswa', 
  'Tips Belajar', 
  'Pengetahuan Populer', 
  'Psikologi', 
  'Lainnya'
];

const TYPES = ['Artikel', 'Brosur', 'Poster', 'Tips & Trik', 'Powerpoint', 'Gambar', 'Foto'];

const GuidanceBoard: React.FC<GuidanceBoardProps> = ({ materials, onSave, onDelete, teacherData }) => {
  const [activeTab, setActiveTab] = useState<'gallery' | 'generator'>('gallery');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState<GuidanceMaterial | null>(null);
  
  const [formData, setFormData] = useState<Partial<GuidanceMaterial>>({
    type: 'Artikel',
    category: 'Bimbingan Siswa',
    content: '',
    title: '',
    author: teacherData.name || 'Guru BK',
    date: new Date().toISOString().split('T')[0],
    layout: 'modern'
  });

  const previewRef = useRef<HTMLDivElement>(null);

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        m.title.toLowerCase().includes(query) || 
        m.content.toLowerCase().includes(query) ||
        m.author.toLowerCase().includes(query) ||
        m.category.toLowerCase().includes(query) ||
        m.tags?.some(t => t.toLowerCase().includes(query));
      
      const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [materials, searchQuery, selectedCategory]);

  const handleGenerateAI = async () => {
    if (!formData.title) {
      alert('Tolong masukkan judul atau topik terlebih dahulu.');
      return;
    }

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const model = ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Buatlah konten untuk ${formData.type} papan bimbingan sekolah dengan topik: "${formData.title}". 
        Kategori: ${formData.category}. 
        Format output: Markdown. 
        Berikan isi yang edukatif, menarik, dan sesuai untuk siswa sekolah. 
        Jika formatnya Tips & Trik, buat dalam bentuk poin-poin. 
        Jika Poster, buat kalimat-kalimat singkat dan padat.
        Jika Brosur, bagi menjadi beberapa bagian (Pendahuluan, Isi, Penutup/Tips).
        Jika Powerpoint, buat konten untuk 5-7 slide dengan poin-poin utama.
        Jika Gambar atau Foto, buat caption edukatif yang mendalam dan deskripsi visual yang disarankan.
        Jangan sertakan judul lagi di dalam konten, cukup isinya saja.`
      });

      const response = await model;
      const text = response.text;
      setFormData(prev => ({ ...prev, content: text }));
    } catch (error) {
      console.error('AI Generation Error:', error);
      alert('Gagal menghasilkan konten dengan AI. Silakan coba lagi.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!formData.title || !formData.content) {
      alert('Judul dan Konten harus diisi.');
      return;
    }

    const material: GuidanceMaterial = {
      id: formData.id || Math.random().toString(36).substr(2, 9),
      title: formData.title || '',
      type: formData.type as any,
      category: formData.category as any,
      content: formData.content || '',
      author: formData.author || teacherData.name || 'Guru BK',
      date: formData.date || new Date().toISOString().split('T')[0],
      layout: formData.layout,
      tags: formData.tags,
      imageUrl: formData.imageUrl
    };

    onSave(material);
    setActiveTab('gallery');
    setFormData({
      type: 'Artikel',
      category: 'Bimbingan Siswa',
      content: '',
      title: '',
      author: teacherData.name || 'Guru BK',
      date: new Date().toISOString().split('T')[0],
      layout: 'modern'
    });
  };

  const handleExportImage = async () => {
    if (previewRef.current) {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        onclone: (document: Document) => {
          const styles = document.querySelectorAll('style');
          styles.forEach(s => {
            if (s.innerHTML.includes('oklch')) {
              s.innerHTML = s.innerHTML.replace(/oklch\([^)]+\)/g, 'inherit');
            }
          });
          const allElements = document.querySelectorAll('*');
          allElements.forEach(el => {
            const style = el.getAttribute('style');
            if (style && style.includes('oklch')) {
              el.setAttribute('style', style.replace(/oklch\([^)]+\)/g, 'inherit'));
            }
          });
        }
      });
      const link = document.createElement('a');
      link.download = `PapanBimbingan_${formData.title?.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  const handleExportPDF = async () => {
    if (previewRef.current) {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        onclone: (document: Document) => {
          const styles = document.querySelectorAll('style');
          styles.forEach(s => {
            if (s.innerHTML.includes('oklch')) {
              s.innerHTML = s.innerHTML.replace(/oklch\([^)]+\)/g, 'inherit');
            }
          });
          const allElements = document.querySelectorAll('*');
          allElements.forEach(el => {
            const style = el.getAttribute('style');
            if (style && style.includes('oklch')) {
              el.setAttribute('style', style.replace(/oklch\([^)]+\)/g, 'inherit'));
            }
          });
        }
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`PapanBimbingan_${formData.title?.replace(/\s+/g, '_')}.pdf`);
    }
  };

  const renderPreview = (material: Partial<GuidanceMaterial>) => {
    const { type, title, content, author, date, category } = material;

    switch (type) {
      case 'Poster':
        return (
          <div className="w-full aspect-[3/4] bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-12 flex flex-col items-center justify-center text-center shadow-2xl rounded-lg overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-yellow-400"></div>
            <div className="mb-8 p-4 bg-white/20 rounded-full">
              <Sparkles size={48} className="text-yellow-300" />
            </div>
            <h1 className="text-5xl font-black mb-8 leading-tight tracking-tighter uppercase">{title}</h1>
            <div className="w-24 h-1 bg-yellow-400 mb-8"></div>
            <div className="text-xl font-medium max-w-md opacity-90 leading-relaxed">
              <Markdown>{content}</Markdown>
            </div>
            <div className="mt-auto pt-8 border-t border-white/20 w-full flex justify-between items-end text-sm opacity-75">
              <div>
                <p className="font-bold">{teacherData.school || 'Sekolah Kita'}</p>
                <p>Bimbingan & Konseling</p>
              </div>
              <div className="text-right">
                <p>{author}</p>
                <p>{date}</p>
              </div>
            </div>
          </div>
        );
      case 'Brosur':
        return (
          <div className="w-full min-h-[600px] bg-white text-slate-800 p-8 shadow-xl rounded-lg border-t-8 border-emerald-500">
            <div className="flex justify-between items-start mb-8">
              <div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full uppercase tracking-wider">{category}</span>
                <h1 className="text-3xl font-bold mt-2 text-slate-900">{title}</h1>
              </div>
              <div className="text-right text-xs text-slate-400">
                <p>{author}</p>
                <p>{date}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-3 md:col-span-2 prose prose-slate max-w-none">
                <Markdown>{content}</Markdown>
              </div>
              <div className="col-span-3 md:col-span-1 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <h3 className="font-bold text-emerald-700 mb-3 flex items-center gap-2">
                  <Info size={16} /> Informasi Penting
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Materi ini disusun untuk membantu siswa dalam pengembangan diri dan prestasi akademik.
                </p>
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Kontak BK</p>
                  <p className="text-sm font-medium">{teacherData.name}</p>
                  <p className="text-xs text-slate-500">{teacherData.school}</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'Tips & Trik':
        return (
          <div className="w-full bg-amber-50 p-8 shadow-lg rounded-2xl border-2 border-amber-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-200">
                <Lightbulb size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-amber-900 leading-none">{title}</h1>
                <p className="text-amber-700 text-sm font-medium mt-1 uppercase tracking-widest">{category}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-inner border border-amber-100">
              <div className="prose prose-amber max-w-none">
                <Markdown>{content}</Markdown>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between text-xs text-amber-600 font-medium">
              <span>Disusun oleh: {author}</span>
              <span>{date}</span>
            </div>
          </div>
        );
      case 'Powerpoint':
        return (
          <div className="w-full aspect-video bg-orange-600 text-white p-12 flex flex-col shadow-2xl rounded-lg overflow-hidden relative">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-white/20 rounded-lg">
                <Layout size={32} />
              </div>
              <h2 className="text-2xl font-bold uppercase tracking-tight">Slide Presentasi</h2>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <h1 className="text-4xl font-black mb-6 leading-tight">{title}</h1>
              <div className="w-20 h-1 bg-white mb-6"></div>
              <div className="text-lg opacity-90 line-clamp-4">
                <Markdown>{content}</Markdown>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-white/20 flex justify-between items-center text-sm">
              <span className="font-bold">{teacherData.school}</span>
              <span>{author} • {date}</span>
            </div>
          </div>
        );
      case 'Gambar':
      case 'Foto':
        return (
          <div className="w-full bg-white shadow-xl rounded-xl overflow-hidden border border-slate-200">
            <div className="aspect-video bg-slate-100 flex items-center justify-center relative group">
              {material.imageUrl ? (
                <img src={material.imageUrl} alt={title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="flex flex-col items-center text-slate-400">
                  <ImageIcon size={64} strokeWidth={1} />
                  <p className="text-sm font-medium mt-2">Visual Media</p>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                <h2 className="text-white font-bold text-xl">{title}</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded uppercase tracking-wider">{type}</span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase tracking-wider">{category}</span>
              </div>
              <div className="prose prose-slate prose-sm max-w-none">
                <Markdown>{content}</Markdown>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <span>{author}</span>
                <span>{date}</span>
              </div>
            </div>
          </div>
        );
      default: // Artikel
        return (
          <div className="w-full bg-white p-10 shadow-lg rounded-lg border border-slate-200 max-w-4xl mx-auto">
            <header className="mb-8 pb-8 border-bottom border-slate-100 text-center">
              <p className="text-indigo-600 font-bold text-sm uppercase tracking-widest mb-2">{category}</p>
              <h1 className="text-4xl font-serif font-bold text-slate-900 mb-4">{title}</h1>
              <div className="flex justify-center items-center gap-4 text-slate-500 text-sm italic">
                <span>Oleh: {author}</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                <span>{date}</span>
              </div>
            </header>
            <div className="prose prose-indigo prose-lg max-w-none font-serif leading-relaxed text-slate-700">
              <Markdown>{content}</Markdown>
            </div>
            <footer className="mt-12 pt-8 border-t border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <BookOpen size={16} />
                <span>Bimbingan & Konseling {teacherData.school}</span>
              </div>
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-100"></div>
                <div className="w-8 h-8 rounded-full bg-slate-100"></div>
              </div>
            </footer>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Layout className="text-indigo-600 w-6 h-6" /> Papan Bimbingan
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Buat dan kelola materi edukasi untuk siswa.</p>
          </div>
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg shadow-sm border border-slate-200">
            <button 
              onClick={() => setActiveTab('gallery')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'gallery' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              Galeri Materi
            </button>
            <button 
              onClick={() => setActiveTab('generator')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'generator' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              Generator Materi
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'gallery' ? (
            <motion.div 
              key="gallery"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-slate-200">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Cari materi..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-xs"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                  <button 
                    onClick={() => setSelectedCategory('All')}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all ${selectedCategory === 'All' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    Semua
                  </button>
                  {CATEGORIES.map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {filteredMaterials.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="text-slate-300" size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Belum ada materi</h3>
                  <p className="text-slate-500 mt-2 max-w-xs mx-auto">Mulai buat materi pertama Anda menggunakan Generator Materi.</p>
                  <button 
                    onClick={() => setActiveTab('generator')}
                    className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-indigo-200 transition-all flex items-center gap-2 mx-auto"
                  >
                    <Plus size={20} /> Buat Materi Baru
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMaterials.map((material) => (
                    <motion.div 
                      key={material.id}
                      layoutId={material.id}
                      className="group bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => setPreviewMaterial(material)}
                    >
                      <div className={`h-24 flex items-center justify-center ${
                        material.type === 'Poster' ? 'bg-indigo-600' : 
                        material.type === 'Brosur' ? 'bg-emerald-500' : 
                        material.type === 'Tips & Trik' ? 'bg-amber-500' : 'bg-slate-800'
                      }`}>
                        {material.type === 'Poster' && <ImageIcon size={32} className="text-white/30" />}
                        {material.type === 'Brosur' && <Layout size={32} className="text-white/30" />}
                        {material.type === 'Tips & Trik' && <Lightbulb size={32} className="text-white/30" />}
                        {material.type === 'Artikel' && <FileText size={32} className="text-white/30" />}
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-1.5">
                          <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{material.type}</span>
                          <span className="text-[9px] font-medium text-slate-400">{material.date}</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 line-clamp-1 mb-0.5">{material.title}</h3>
                        <p className="text-[10px] text-slate-500 mb-3">{material.category}</p>
                        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                          <span className="text-[10px] font-medium text-slate-600 flex items-center gap-1">
                            <Edit3 size={10} /> {material.author}
                          </span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if(confirm('Hapus materi ini?')) onDelete(material.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="generator"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Form Section */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="text-indigo-600" size={18} /> Konfigurasi Materi
                  </h2>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Judul / Topik Materi</label>
                      <input 
                        type="text" 
                        placeholder="Contoh: Cara Mengatasi Stress Saat Ujian"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-xs"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Format</label>
                        <select 
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-xs"
                          value={formData.type}
                          onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                        >
                          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Kategori</label>
                        <select 
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-xs"
                          value={formData.category}
                          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                        >
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Isi Konten (Markdown)</label>
                        <button 
                          onClick={handleGenerateAI}
                          disabled={isGenerating}
                          className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 transition-all disabled:opacity-50"
                        >
                          {isGenerating ? 'Menghasilkan...' : <><Sparkles size={10} /> AI Generate</>}
                        </button>
                      </div>
                      <textarea 
                        rows={8}
                        placeholder="Tulis konten Anda di sini atau gunakan AI untuk membantu..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none font-mono text-xs"
                        value={formData.content}
                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Penulis</label>
                        <input 
                          type="text" 
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-xs"
                          value={formData.author}
                          onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Tanggal</label>
                        <input 
                          type="date" 
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-xs"
                          value={formData.date}
                          onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button 
                      onClick={handleSave}
                      className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <CheckCircle2 size={18} /> Simpan & Publikasikan
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview Section */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pratinjau Desain</h2>
                  <div className="flex gap-1.5">
                    <button 
                      onClick={handleExportImage}
                      className="p-1.5 bg-white text-slate-600 rounded-md border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
                      title="Download Gambar"
                    >
                      <ImageIcon size={16} />
                    </button>
                    <button 
                      onClick={handleExportPDF}
                      className="p-1.5 bg-white text-slate-600 rounded-md border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
                      title="Download PDF"
                    >
                      <FileText size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="bg-slate-200 p-6 rounded-2xl shadow-inner overflow-auto max-h-[700px] flex justify-center">
                  <div ref={previewRef} className="w-full max-w-[595px] transform origin-top transition-all duration-500">
                    {renderPreview(formData)}
                  </div>
                </div>
                
                <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 flex items-start gap-2.5">
                  <Info className="text-indigo-600 shrink-0 mt-0.5" size={16} />
                  <p className="text-[10px] text-indigo-800 leading-relaxed">
                    <strong>Tips:</strong> Gunakan AI untuk membuat draf konten dengan cepat. Anda bisa mengedit hasilnya secara manual. Desain akan menyesuaikan secara otomatis.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Full Preview Modal */}
      <AnimatePresence>
        {previewMaterial && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
            onClick={() => setPreviewMaterial(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setPreviewMaterial(null)}
                    className="p-1.5 hover:bg-slate-200 rounded-full transition-all text-slate-600"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <h3 className="text-sm font-bold text-slate-900">{previewMaterial.title}</h3>
                </div>
                <div className="flex gap-1.5">
                  <button 
                    onClick={handleExportImage}
                    className="px-2.5 py-1.5 bg-white text-slate-700 rounded-lg border border-slate-200 text-[10px] font-bold flex items-center gap-1.5 hover:bg-slate-50 transition-all"
                  >
                    <ImageIcon size={12} /> Gambar
                  </button>
                  <button 
                    onClick={handleExportPDF}
                    className="px-2.5 py-1.5 bg-white text-slate-700 rounded-lg border border-slate-200 text-[10px] font-bold flex items-center gap-1.5 hover:bg-slate-50 transition-all"
                  >
                    <FileText size={12} /> PDF
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-8 bg-slate-100 flex justify-center">
                <div className="w-full max-w-[800px]">
                  {renderPreview(previewMaterial)}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GuidanceBoard;
