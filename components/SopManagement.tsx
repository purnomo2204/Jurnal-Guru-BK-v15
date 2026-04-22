
import React, { useState, useEffect } from 'react';
import { SOP } from '../types';
import { EXAMPLE_SOPS } from '../constants';
import { Plus, Edit2, Trash2, Search, Download, FileText, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { toast } from 'sonner';

const SopManagement: React.FC = () => {
  const [sops, setSops] = useState<SOP[]>(() => {
    const saved = localStorage.getItem('guru_bk_sops');
    return saved ? JSON.parse(saved) : EXAMPLE_SOPS;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSop, setEditingSop] = useState<SOP | null>(null);
  const [formData, setFormData] = useState({ title: '', category: '', description: '', content: '' });

  useEffect(() => {
    localStorage.setItem('guru_bk_sops', JSON.stringify(sops));
  }, [sops]);

  const filteredSops = sops.filter(sop => 
    sop.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    sop.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = () => {
    if (editingSop) {
      setSops(sops.map(s => s.id === editingSop.id ? { ...editingSop, ...formData } : s));
      toast.success('SOP berhasil diperbarui');
    } else {
      setSops([...sops, { id: Date.now().toString(), ...formData }]);
      toast.success('SOP berhasil ditambahkan');
    }
    setIsModalOpen(false);
    setEditingSop(null);
    setFormData({ title: '', category: '', description: '', content: '' });
  };

  const deleteSop = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus SOP ini?')) {
      setSops(sops.filter(s => s.id !== id));
      toast.success('SOP berhasil dihapus');
    }
  };

  const downloadPdf = (sop: SOP) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(sop.title, 14, 20);
    doc.setFontSize(12);
    doc.text(`Kategori: ${sop.category}`, 14, 30);
    doc.text(`Deskripsi: ${sop.description}`, 14, 40);
    doc.text('Konten:', 14, 50);
    doc.text(sop.content, 14, 60, { maxWidth: 180 });
    doc.save(`${sop.title}.pdf`);
    toast.success('PDF berhasil diunduh');
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Manajemen SOP BK</h2>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Tambah SOP
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
        <input 
          type="text" 
          placeholder="Cari SOP berdasarkan judul atau kategori..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredSops.map(sop => (
          <div key={sop.id} className="p-3 border rounded-lg hover:shadow-sm transition-shadow bg-white">
            <h3 className="font-bold text-sm mb-1">{sop.title}</h3>
            <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">{sop.category}</span>
            <p className="text-xs text-slate-600 mt-1.5 mb-3 line-clamp-2">{sop.description}</p>
            <div className="flex gap-1.5">
              <button onClick={() => { setEditingSop(sop); setFormData(sop); setIsModalOpen(true); }} className="p-1.5 text-slate-500 hover:text-primary border rounded"><Edit2 className="w-3.5 h-3.5" /></button>
              <button onClick={() => deleteSop(sop.id)} className="p-1.5 text-slate-500 hover:text-red-600 border rounded"><Trash2 className="w-3.5 h-3.5" /></button>
              <button onClick={() => downloadPdf(sop)} className="p-1.5 text-slate-500 hover:text-green-600 border rounded"><Download className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded-lg w-full max-w-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold">{editingSop ? 'Edit SOP' : 'Tambah SOP'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Judul</label>
                <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-1.5 text-xs border rounded" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Kategori</label>
                <input type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-1.5 text-xs border rounded" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Deskripsi</label>
                <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-1.5 text-xs border rounded" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Konten Detail</label>
                <textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="w-full p-1.5 text-xs border rounded h-24" />
              </div>
            </div>
            <button onClick={handleSave} className="w-full mt-4 py-1.5 text-xs bg-primary text-white rounded hover:bg-primary/90">Simpan</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SopManagement;
