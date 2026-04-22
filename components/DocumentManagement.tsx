import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  Search, 
  File, 
  FileImage, 
  FileArchive, 
  FileCode,
  Plus,
  X,
  ChevronLeft,
  LogOut,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Edit2
} from 'lucide-react';
import { StoredDocument, ViewMode } from '../types';

interface DocumentManagementProps {
  setView: (view: ViewMode) => void;
  showNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

// Simple IndexedDB wrapper for file storage
const DB_NAME = 'GuruBK_DocumentsDB';
const STORE_NAME = 'documents';
const DB_VERSION = 1;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveDocument = async (doc: StoredDocument): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(doc);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const getAllDocuments = async (): Promise<StoredDocument[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const deleteDocument = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    console.log('Deleting document with ID:', id);
    const request = store.delete(id);
    
    transaction.oncomplete = () => {
      console.log('Delete transaction completed');
      resolve();
    };
    
    transaction.onerror = () => {
      console.error('Delete transaction failed:', transaction.error);
      reject(transaction.error);
    };
    
    request.onerror = () => {
      console.error('Delete request failed:', request.error);
    };
  });
};

const DocumentManagement: React.FC<DocumentManagementProps> = ({ setView, showNotification }) => {
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<StoredDocument | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<StoredDocument['category']>('LAINNYA');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const docs = await getAllDocuments();
      setDocuments(docs.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()));
    } catch (error) {
      console.error('Failed to load documents:', error);
      showNotification('Gagal memuat dokumen', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!formName) {
        setFormName(file.name.split('.').slice(0, -1).join('.'));
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !formName) return;

    try {
      setIsUploading(true);
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target?.result as string;
        
        const newDoc: StoredDocument = {
          id: Date.now().toString(),
          name: formName,
          category: formCategory,
          fileName: selectedFile.name,
          fileType: selectedFile.type || 'application/octet-stream',
          fileData: base64Data,
          uploadDate: new Date().toISOString(),
          size: selectedFile.size
        };

        await saveDocument(newDoc);
        showNotification('Dokumen berhasil disimpan', 'success');
        setIsUploadModalOpen(false);
        setFormName('');
        setFormCategory('LAINNYA');
        setSelectedFile(null);
        loadDocuments();
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error('Upload failed:', error);
      showNotification('Gagal menyimpan dokumen', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (doc: StoredDocument) => {
    setEditingDoc(doc);
    setFormName(doc.name);
    setFormCategory(doc.category || 'LAINNYA');
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc || !formName) return;

    try {
      const updatedDoc = { ...editingDoc, name: formName, category: formCategory };
      await saveDocument(updatedDoc);
      showNotification('Nama dokumen berhasil diperbarui', 'success');
      setIsEditModalOpen(false);
      setEditingDoc(null);
      setFormName('');
      setFormCategory('LAINNYA');
      loadDocuments();
    } catch (error) {
      console.error('Update failed:', error);
      showNotification('Gagal memperbarui dokumen', 'error');
    }
  };

  const handleDownload = (doc: StoredDocument) => {
    try {
      const link = document.createElement('a');
      link.href = doc.fileData;
      link.download = doc.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification('Mengunduh dokumen...', 'info');
    } catch (error) {
      console.error('Download failed:', error);
      showNotification('Gagal mengunduh dokumen', 'error');
    }
  };

  const confirmDelete = (id: string) => {
    setDeletingDocId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingDocId) return;
    
    try {
      await deleteDocument(deletingDocId);
      showNotification('Dokumen berhasil dihapus', 'success');
      setIsDeleteModalOpen(false);
      setDeletingDocId(null);
      // Ensure we reload the list after deletion
      await loadDocuments();
    } catch (error) {
      console.error('Delete failed:', error);
      showNotification('Gagal menghapus dokumen', 'error');
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <FileImage className="w-8 h-8 text-emerald-500" />;
    if (type.includes('pdf')) return <FileText className="w-8 h-8 text-rose-500" />;
    if (type.includes('word') || type.includes('officedocument.word')) return <FileText className="w-8 h-8 text-blue-500" />;
    if (type.includes('excel') || type.includes('officedocument.spreadsheet')) return <File className="w-8 h-8 text-emerald-600" />;
    if (type.includes('powerpoint') || type.includes('officedocument.presentation')) return <File className="w-8 h-8 text-orange-500" />;
    if (type.includes('zip') || type.includes('rar') || type.includes('compressed')) return <FileArchive className="w-8 h-8 text-amber-500" />;
    return <File className="w-8 h-8 text-slate-400" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredDocs = documents
    .filter(doc => 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'id'));

  const getFileBadge = (type: string) => {
    if (type.includes('pdf')) return <span className="px-2 py-0.5 bg-rose-100 text-rose-600 rounded text-[8px] font-bold uppercase">PDF</span>;
    if (type.includes('word') || type.includes('officedocument.word')) return <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-[8px] font-bold uppercase">Word</span>;
    if (type.includes('excel') || type.includes('officedocument.spreadsheet')) return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded text-[8px] font-bold uppercase">Excel</span>;
    if (type.includes('powerpoint') || type.includes('officedocument.presentation')) return <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded text-[8px] font-bold uppercase">PPT</span>;
    if (type.includes('image')) return <span className="px-2 py-0.5 bg-purple-100 text-purple-600 rounded text-[8px] font-bold uppercase">Gambar</span>;
    if (type.includes('zip') || type.includes('rar') || type.includes('compressed')) return <span className="px-2 py-0.5 bg-amber-100 text-amber-600 rounded text-[8px] font-bold uppercase">Arsip</span>;
    return <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[8px] font-bold uppercase">File</span>;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-5 animate-fade-in">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setView(ViewMode.SETTINGS_CATEGORY)}
              className="p-1.5 hover:bg-white rounded-lg transition-all text-slate-400 hover:text-slate-600 border border-transparent hover:border-slate-200"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                Simpan <span className="text-sky-500">Dokumen</span>
              </h1>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                Penyimpanan Berkas & Materi Bimbingan
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-sky-600 transition-all shadow-md shadow-sky-500/10"
            >
              <Plus className="w-3.5 h-3.5" /> Upload
            </button>
            <button 
              onClick={() => setView(ViewMode.HOME)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-rose-600 transition-all shadow-md shadow-rose-500/10"
            >
              <LogOut className="w-3.5 h-3.5" /> Keluar
            </button>
          </div>
        </div>
      </div>

      {/* Search & Stats */}
      <div className="max-w-7xl mx-auto mb-5">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-3 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Cari dokumen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-sky-500/20 transition-all shadow-sm"
            />
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Berkas</p>
              <p className="text-lg font-black text-slate-900 leading-none mt-1">{documents.length}</p>
            </div>
            <div className="p-1.5 bg-sky-50 rounded-lg">
              <FileText className="w-4 h-4 text-sky-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Document List Table */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Memuat Dokumen...</p>
          </div>
        ) : filteredDocs.length > 0 ? (
          <div className="space-y-6">
            {['PROGRAM BK', 'RPLBK', 'LKPD', 'MATERI', 'TDA', 'TES PSIKOLOGI', 'SERTIFIKAT', 'SK', 'DOKUMEN KEPEGAWAIAN', 'LAINNYA'].map(category => {
              const categoryDocs = filteredDocs.filter(doc => (doc.category || 'LAINNYA') === category);
              if (categoryDocs.length === 0) return null;
              
              return (
                <div key={category} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{category}</h3>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{categoryDocs.length} Berkas</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest w-12 text-center">No</th>
                          <th className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">Nama Dokumen</th>
                          <th className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">Tanggal Di Upload</th>
                          <th className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">Jenis File</th>
                          <th className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {categoryDocs.map((doc, index) => (
                          <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-4 py-3 text-[10px] font-bold text-slate-400 text-center">{index + 1}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col">
                                <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{doc.name}</span>
                                <span className="text-[9px] text-slate-400 font-medium truncate max-w-[200px]">{doc.fileName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <div className="w-1 h-1 rounded-full bg-sky-500"></div>
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                  {new Date(doc.uploadDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {getFileBadge(doc.fileType)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-1">
                                <button 
                                  onClick={() => handleEdit(doc)}
                                  className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white rounded-lg transition-all text-[9px] font-black uppercase tracking-widest"
                                  title="Edit"
                                >
                                  <Edit2 className="w-3 h-3" /> Edit
                                </button>
                                <button 
                                  onClick={() => handleDownload(doc)}
                                  className="flex items-center gap-1 px-2 py-1 bg-sky-50 text-sky-600 hover:bg-sky-500 hover:text-white rounded-lg transition-all text-[9px] font-black uppercase tracking-widest"
                                  title="Download"
                                >
                                  <Download className="w-3 h-3" /> Download
                                </button>
                                <button 
                                  onClick={() => confirmDelete(doc.id)}
                                  className="flex items-center gap-1 px-2 py-1 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white rounded-lg transition-all text-[9px] font-black uppercase tracking-widest"
                                  title="Hapus"
                                >
                                  <Trash2 className="w-3 h-3" /> Hapus
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-slate-300 rounded-[2rem] py-16 flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1">Belum Ada Dokumen</h3>
            <p className="text-[10px] text-slate-500 max-w-[200px] mx-auto mb-6">
              Simpan program kerja, materi bimbingan, atau dokumen lainnya di sini.
            </p>
            <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-sky-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-sky-600 transition-all shadow-lg shadow-sky-500/20"
            >
              <Plus className="w-3.5 h-3.5" /> Upload Sekarang
            </button>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xs rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 text-center">
              <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-rose-500" />
              </div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2">Hapus Dokumen?</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-relaxed">
                Tindakan ini tidak dapat dibatalkan. Berkas akan dihapus permanen.
              </p>
            </div>
            <div className="flex border-t border-slate-100">
              <button
                onClick={() => { setIsDeleteModalOpen(false); setDeletingDocId(null); }}
                className="flex-1 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-50 transition-all border-r border-slate-100"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 text-[10px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 transition-all"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-amber-500 to-orange-600 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    Edit Nama Dokumen
                  </h3>
                  <p className="text-[8px] opacity-80 font-bold uppercase tracking-wider">
                    Ubah Identitas Berkas
                  </p>
                </div>
              </div>
              <button onClick={() => { setIsEditModalOpen(false); setEditingDoc(null); setFormName(''); }} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Nama Dokumen Baru</label>
                <input 
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Masukkan nama dokumen baru..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mt-2 block">Kategori</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as StoredDocument['category'])}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                >
                  {['PROGRAM BK', 'RPLBK', 'LKPD', 'MATERI', 'TDA', 'TES PSIKOLOGI', 'SERTIFIKAT', 'SK', 'DOKUMEN KEPEGAWAIAN', 'LAINNYA'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest ml-1">File: {editingDoc?.fileName}</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsEditModalOpen(false); setEditingDoc(null); setFormName(''); }}
                  className="flex-1 py-2.5 bg-slate-50 text-slate-500 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!formName}
                  className="flex-[2] py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-3 h-3" /> Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-sky-500 to-blue-600 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    Upload Dokumen
                  </h3>
                  <p className="text-[8px] opacity-80 font-bold uppercase tracking-wider">
                    Simpan Berkas Baru
                  </p>
                </div>
              </div>
              <button onClick={() => setIsUploadModalOpen(false)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Nama Dokumen</label>
                <input 
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Program Kerja BK 2024"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Kategori</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as StoredDocument['category'])}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
                >
                  {['PROGRAM BK', 'RPLBK', 'LKPD', 'MATERI', 'TDA', 'TES PSIKOLOGI', 'SERTIFIKAT', 'SK', 'DOKUMEN KEPEGAWAIAN', 'LAINNYA'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Pilih File</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                    selectedFile ? 'border-sky-500 bg-sky-50/30' : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                  }`}
                >
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf,.jpg,.jpeg,.png,.zip,.rar,.7z"
                  />
                  {selectedFile ? (
                    <>
                      <CheckCircle2 className="w-8 h-8 text-sky-500" />
                      <div className="text-center">
                        <p className="text-[10px] font-black text-slate-900 truncate max-w-[150px]">{selectedFile.name}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{formatSize(selectedFile.size)}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-300" />
                      <div className="text-center">
                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">Klik untuk memilih file</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Word, Excel, PDF, Gambar, Zip</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-50 text-slate-500 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile || !formName || isUploading}
                  className="flex-[2] py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-sky-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Upload className="w-3 h-3" /> Simpan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManagement;
