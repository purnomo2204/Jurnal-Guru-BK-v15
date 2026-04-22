import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Download, Trash2, Users, FileSpreadsheet, Calendar, BookOpen, Network, Star, UserMinus, Share2, X } from 'lucide-react';
import { Student, Sociometry, TeacherData } from '../types';
import { formatAcademicTitle } from '../src/lib/nameFormatter';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as d3 from 'd3';
import { domToPng, domToBlob } from 'modern-screenshot';
import { saveAs } from 'file-saver';

interface SociometryManagementProps {
  students: Student[];
  sociometryData: Sociometry[];
  academicYear: string;
  teacherData: TeacherData;
  onAdd: (s: Sociometry) => void;
  onDelete: (id: string) => void;
}

const SociometryManagement: React.FC<SociometryManagementProps> = ({ students, sociometryData, academicYear, teacherData, onAdd, onDelete }) => {
  const [className, setClassName] = useState('');
  const [surveyDate, setSurveyDate] = useState('');
  const [criteria, setCriteria] = useState('');
  const [chooserStudentId, setChooserStudentId] = useState('');
  const [choices, setChoices] = useState<Sociometry['choices']>([]);
  const [selectedSociometry, setSelectedSociometry] = useState<Sociometry | null>(null);
  const [showStudentReport, setShowStudentReport] = useState(false);
  const [showClassReport, setShowClassReport] = useState(false);
  const [reportClass, setReportClass] = useState('');
  const [reportStudentId, setReportStudentId] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  const classes = useMemo(() => Array.from(new Set(students.map(s => s.className))), [students]);
  const studentsInClass = useMemo(() => students.filter(s => s.className === className), [students, className]);
  
  const sociometryByClass = useMemo(() => {
    const grouped: Record<string, Sociometry[]> = {};
    sociometryData.forEach(data => {
      if (!grouped[data.className]) grouped[data.className] = [];
      grouped[data.className].push(data);
    });
    return grouped;
  }, [sociometryData]);

  const sociometryChartData = useMemo(() => {
    const data: Record<string, { name: string, positive: number, negative: number }> = {};
    studentsInClass.forEach(s => {
      data[s.id] = { name: s.name, positive: 0, negative: 0 };
    });
    
    // Aggregate saved data
    sociometryData.filter(d => d.className === className).forEach(d => {
      d.choices.forEach(c => {
        if (data[c.studentId]) {
          if (c.choiceType === 'positive') data[c.studentId].positive++;
          else data[c.studentId].negative++;
        }
      });
    });

    // Include current unsaved choices for real-time feedback
    choices.forEach(c => {
      if (data[c.studentId]) {
        if (c.choiceType === 'positive') data[c.studentId].positive++;
        else data[c.studentId].negative++;
      }
    });

    return Object.values(data);
  }, [sociometryData, studentsInClass, className, choices]);

  const downloadAnalysisCSV = () => {
    if (!className || sociometryChartData.length === 0) {
      alert('Pilih kelas terlebih dahulu dan pastikan ada data');
      return;
    }

    const totalStudents = studentsInClass.length;
    const headers = ['Nama Siswa', 'Jumlah Disukai (+)', 'Jumlah Tidak Disukai (-)', 'Persentase'];
    
    const rows = sociometryChartData.map(item => [
      `"${item.name}"`,
      item.positive,
      item.negative,
      `"${((item.positive / totalStudents) * 100).toFixed(1)}%"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `Analisis_Sosiometri_${className}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleAddChoice = (chosenStudentId: string, choiceType: 'positive' | 'negative', reason: string) => {
    if (!chooserStudentId) {
      alert('Pilih siswa yang memilih terlebih dahulu');
      return;
    }
    
    setChoices(prev => {
      const existingIndex = prev.findIndex(c => c.studentId === chosenStudentId && c.chooserStudentId === chooserStudentId);
      const chooserChoices = prev.filter(c => c.chooserStudentId === chooserStudentId);
      const typeCount = chooserChoices.filter(c => c.choiceType === choiceType).length;

      if (existingIndex >= 0) {
        const existing = prev[existingIndex];
        if (existing.choiceType === choiceType) {
          return prev.filter((_, i) => i !== existingIndex);
        } else {
          // Check limit for the other type before switching
          if (typeCount >= 3) {
            alert(`Maksimal 3 pilihan ${choiceType === 'positive' ? 'disukai' : 'tidak disukai'}`);
            return prev;
          }
          const newChoices = [...prev];
          newChoices[existingIndex] = { ...existing, choiceType, reason };
          return newChoices;
        }
      }

      if (typeCount >= 3) {
        alert(`Maksimal 3 pilihan ${choiceType === 'positive' ? 'disukai' : 'tidak disukai'}`);
        return prev;
      }

      return [...prev, { chooserStudentId, studentId: chosenStudentId, choiceType, reason }];
    });
  };

  const handleSave = () => {
    if (!className || !surveyDate || !criteria || choices.length === 0) {
      alert('Lengkapi semua data dan tambahkan setidaknya satu pilihan');
      return;
    }
    onAdd({
      id: Date.now().toString(),
      className,
      surveyDate,
      criteria,
      choices
    });
    setChoices([]);
    setChooserStudentId('');
    setClassName('');
    setSurveyDate('');
    setCriteria('');
    alert('Data Sosiometri berhasil disimpan');
  };

  const downloadTemplate = () => {
    const headers = [
      'Nama Siswa', 'Kelas', 
      'Disukai 1', 'Alasan Suka 1', 
      'Disukai 2', 'Alasan Suka 2', 
      'Disukai 3', 'Alasan Suka 3',
      'Tidak Disukai 1', 'Alasan Tidak Suka 1',
      'Tidak Disukai 2', 'Alasan Tidak Suka 2',
      'Tidak Disukai 3', 'Alasan Tidak Suka 3'
    ];
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Sosiometri');
    XLSX.writeFile(workbook, 'Template_Sosiometri.xlsx');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws) as any[];

      if (data.length === 0) {
        alert('File Excel kosong atau format tidak sesuai');
        return;
      }

      // Process each row
      const newSociometries: Sociometry[] = [];
      const groupedByClass: Record<string, any[]> = {};

      data.forEach(row => {
        const className = row['Kelas'];
        if (!className) return;
        if (!groupedByClass[className]) groupedByClass[className] = [];
        groupedByClass[className].push(row);
      });

      Object.entries(groupedByClass).forEach(([cls, rows]) => {
        const choices: Sociometry['choices'] = [];
        rows.forEach(row => {
          const chooser = students.find(s => s.name.toLowerCase() === row['Nama Siswa']?.toLowerCase() && s.className === cls);
          if (!chooser) return;

          // Process Positive Choices
          for (let i = 1; i <= 3; i++) {
            const chosenName = row[`Disukai ${i}`];
            const reason = row[`Alasan Suka ${i}`] || 'Dipilih dari Excel';
            if (chosenName) {
              const chosen = students.find(s => s.name.toLowerCase() === chosenName.toLowerCase() && s.className === cls);
              if (chosen) {
                choices.push({ chooserStudentId: chooser.id, studentId: chosen.id, choiceType: 'positive', reason });
              }
            }
          }

          // Process Negative Choices
          for (let i = 1; i <= 3; i++) {
            const chosenName = row[`Tidak Disukai ${i}`];
            const reason = row[`Alasan Tidak Suka ${i}`] || 'Dipilih dari Excel';
            if (chosenName) {
              const chosen = students.find(s => s.name.toLowerCase() === chosenName.toLowerCase() && s.className === cls);
              if (chosen) {
                choices.push({ chooserStudentId: chooser.id, studentId: chosen.id, choiceType: 'negative', reason });
              }
            }
          }
        });

        if (choices.length > 0) {
          onAdd({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            className: cls,
            surveyDate: new Date().toISOString().split('T')[0],
            criteria: 'Imported from Excel',
            choices
          });
        }
      });

      alert('Data Sosiometri berhasil diimport dari Excel');
    };
    reader.readAsBinaryString(file);
  };

  const exportToExcel = (data: Sociometry) => {
    const reportData = data.choices.map(c => ({
      'Nama Pemilih': students.find(s => s.id === c.chooserStudentId)?.name || 'Unknown',
      'Nama yang Dipilih': students.find(s => s.id === c.studentId)?.name || 'Unknown',
      'Jenis Pilihan': c.choiceType === 'positive' ? 'Disukai (+)' : 'Tidak Disukai (-)',
      'Alasan': c.reason
    }));

    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekapitulasi Responden');
    
    // Add Analysis Sheet
    const studentsInClass = students.filter(s => s.className === data.className);
    const analysisData = studentsInClass.map(s => {
      const posCount = data.choices.filter(c => c.studentId === s.id && c.choiceType === 'positive').length;
      const negCount = data.choices.filter(c => c.studentId === s.id && c.choiceType === 'negative').length;
      return {
        'Nama Siswa': s.name,
        'Jumlah Disukai (+)': posCount,
        'Jumlah Tidak Disukai (-)': negCount,
        'Persentase Disukai (%)': ((posCount / studentsInClass.length) * 100).toFixed(1) + '%',
        'Persentase Tidak Disukai (%)': ((negCount / studentsInClass.length) * 100).toFixed(1) + '%'
      };
    });
    const analysisSheet = XLSX.utils.json_to_sheet(analysisData);
    XLSX.utils.book_append_sheet(workbook, analysisSheet, 'Analisis Pilihan');

    XLSX.writeFile(workbook, `Sosiometri_${data.className}_${data.surveyDate}.xlsx`);
  };

  const Sociogram: React.FC<{ students: Student[], choices: Sociometry['choices'], width: number, height: number }> = ({ students, choices, width, height }) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
      if (!svgRef.current) return;

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      const nodes = students.map(s => ({ id: s.id, name: s.name }));
      const links = choices
        .filter(c => students.some(s => s.id === c.chooserStudentId) && students.some(s => s.id === c.studentId))
        .map(c => ({ 
          source: c.chooserStudentId, 
          target: c.studentId,
          type: c.choiceType 
        }));

      const simulation = d3.forceSimulation(nodes as any)
        .force("link", d3.forceLink(links).id((d: any) => d.id).distance(150))
        .force("charge", d3.forceManyBody().strength(-500))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(40));

      const defs = svg.append("defs");

      // Markers for arrows
      defs.append("marker")
        .attr("id", "arrowhead-positive")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 25)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#3b82f6");

      defs.append("marker")
        .attr("id", "arrowhead-negative")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 25)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#ef4444");

      const link = svg.append("g")
        .selectAll("line")
        .data(links)
        .enter()
        .append("line")
        .attr("stroke", d => d.type === 'positive' ? "#3b82f6" : "#ef4444")
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", 2)
        .attr("marker-end", d => d.type === 'positive' ? "url(#arrowhead-positive)" : "url(#arrowhead-negative)");

      const node = svg.append("g")
        .selectAll("circle")
        .data(nodes)
        .enter()
        .append("circle")
        .attr("r", 15)
        .attr("fill", "#f8fafc")
        .attr("stroke", "#64748b")
        .attr("stroke-width", 2)
        .call(d3.drag<SVGCircleElement, any>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
        );

      const label = svg.append("g")
        .selectAll("text")
        .data(nodes)
        .enter()
        .append("text")
        .text(d => formatAcademicTitle(d.name))
        .attr("font-family", "Arial, sans-serif")
        .attr("font-size", "10px")
        .attr("font-weight", "bold")
        .attr("text-anchor", "middle")
        .attr("dy", 30)
        .attr("fill", "#1e293b");

      simulation.on("tick", () => {
        link
          .attr("x1", (d: any) => d.source.x)
          .attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x)
          .attr("y2", (d: any) => d.target.y);

        node
          .attr("cx", (d: any) => d.x = Math.max(30, Math.min(width - 30, d.x)))
          .attr("cy", (d: any) => d.y = Math.max(30, Math.min(height - 30, d.y)));

        label
          .attr("x", (d: any) => d.x)
          .attr("y", (d: any) => d.y);
      });

      return () => simulation.stop();
    }, [students, choices, width, height]);

    return (
      <svg 
        ref={svgRef} 
        width="100%" 
        height={height} 
        viewBox={`0 0 ${width} ${height}`}
        className="cursor-move"
      />
    );
  };

  const downloadSociogram = async (id: string, prefix: string = 'Sosiogram') => {
    const element = document.getElementById(id);
    if (!element) return;
    try {
      // Use domToBlob for better reliability
      const blob = await domToBlob(element, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
      });
      if (blob) {
        saveAs(blob, `${prefix}_${reportClass}_${new Date().toISOString().split('T')[0]}.png`);
      }
    } catch (err) {
      console.error('Failed to download sociogram', err);
      alert('Gagal mengunduh laporan. Silakan coba lagi.');
    }
  };

  return (
    <div className="p-2 space-y-3 text-[11px]">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-blue-950">Sosiometri</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowGuide(true)} 
            className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded border border-amber-200 text-[10px] font-black"
          >
            <BookOpen size={12} strokeWidth={3} /> PANDUAN GOOGLE FORM
          </button>
          <button onClick={downloadTemplate} className="flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded border text-[10px] font-black">
            <FileSpreadsheet size={12} strokeWidth={3} /> Template
          </button>
          <label className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200 cursor-pointer text-[10px] font-black">
            <Plus size={12} strokeWidth={3} /> Upload Excel
            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
          </label>
          <button onClick={downloadAnalysisCSV} className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded border border-green-200 text-[10px] font-black">
            <Download size={12} strokeWidth={3} /> DOWNLOAD ANALISIS
          </button>
          <button 
            onClick={() => setShowStudentReport(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200 text-[10px] font-black hover:bg-indigo-100 transition-colors"
          >
            <Users size={12} strokeWidth={3} /> LAPORAN PERSISWA
          </button>
          <button 
            onClick={() => setShowClassReport(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 text-[10px] font-black hover:bg-purple-100 transition-colors"
          >
            <Network size={12} strokeWidth={3} /> LAPORAN PERKELAS
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <select className="p-2 border border-slate-300 rounded-lg bg-white text-xs" value={className} onChange={(e) => setClassName(e.target.value)}>
          <option value="">Pilih Kelas</option>
          {classes.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="date" className="p-2 border border-slate-300 rounded-lg bg-white text-xs" value={surveyDate} onChange={(e) => setSurveyDate(e.target.value)} />
        <input type="text" placeholder="Kriteria (contoh: Teman Belajar)" className="p-2 border border-slate-300 rounded-lg bg-white text-xs" value={criteria} onChange={(e) => setCriteria(e.target.value)} />
      </div>

      {className && (
        <div className="space-y-2">
          <h3 className="font-bold">Pilih Siswa yang Memilih (Chooser)</h3>
          <select className="p-1.5 border rounded-lg w-full" value={chooserStudentId} onChange={(e) => setChooserStudentId(e.target.value)}>
            <option value="">Pilih Siswa</option>
            {studentsInClass.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          {chooserStudentId && (
            <>
              <h3 className="font-bold">Pilih Siswa yang Dipilih (Chosen)</h3>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-2 border-b text-[10px] font-bold w-12 text-center">No. Absen</th>
                      <th className="p-2 border-b text-[10px] font-bold">Nama Siswa</th>
                      <th className="p-2 border-b text-[10px] font-bold w-12 text-center">+</th>
                      <th className="p-2 border-b text-[10px] font-bold w-12 text-center">-</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsInClass.filter(s => s.id !== chooserStudentId).map(student => {
                      const choice = choices.find(c => c.studentId === student.id && c.chooserStudentId === chooserStudentId);
                      const isPositive = choice?.choiceType === 'positive';
                      const isNegative = choice?.choiceType === 'negative';
                      
                      return (
                        <tr key={student.id} className="hover:bg-slate-50">
                          <td className="p-2 border-b text-center text-[10px]">{student.attendanceNumber || '-'}</td>
                          <td className={`p-2 border-b text-[10px] font-medium ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : ''}`}>
                            <span className="font-arial">{formatAcademicTitle(student.name)}</span>
                          </td>
                          <td className="p-2 border-b text-center">
                            <button 
                              onClick={() => handleAddChoice(student.id, 'positive', 'Dipilih sebagai teman')}
                              className={`w-6 h-6 rounded flex items-center justify-center text-xs transition-colors font-black ${isPositive ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                            >
                              +
                            </button>
                          </td>
                          <td className="p-2 border-b text-center">
                            <button 
                              onClick={() => handleAddChoice(student.id, 'negative', 'Kurang cocok')}
                              className={`w-6 h-6 rounded flex items-center justify-center text-xs transition-colors font-black ${isNegative ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                            >
                              -
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-gray-500 mt-1 italic">
                Keterangan: (+) Disukai, (-) Tidak Disukai. Klik tombol untuk memilih/membatalkan.
              </p>
            </>
          )}

          {choices.length > 0 && (
            <div className="mt-2 text-xs">
              <h3 className="font-bold">Pilihan yang Dibuat:</h3>
              <ul className="list-disc pl-4">
                {choices.map((c, idx) => (
                  <li key={idx}>
                    {students.find(s => s.id === chooserStudentId)?.name} 
                    {c.choiceType === 'positive' ? ' memilih ' : ' tidak memilih '} 
                    {students.find(s => s.id === c.studentId)?.name} 
                    ({c.reason})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <button onClick={handleSave} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-black shadow-md">Simpan Sosiometri</button>
      <p className="mt-1 text-[10px] text-gray-500 italic">
        Keterangan: maksimal siswa memilih 3 siswa disukai (+) dan 3 siswa yang tidak disukai (-)
      </p>

      {className && sociometryChartData.length > 0 && (
        <div className="mt-4 h-48 border rounded-lg p-2 bg-white shadow-sm">
          <h3 className="font-bold mb-1 text-[10px] text-slate-600 flex justify-between">
            <span>Grafik Sosiometri (Ringkasan Seluruh Data)</span>
            <span className="text-blue-600">Kelas: {className}</span>
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sociometryChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={8} tick={{ fill: '#64748b' }} />
              <YAxis fontSize={8} tick={{ fill: '#64748b' }} />
              <Tooltip contentStyle={{ fontSize: '10px' }} />
              <Legend wrapperStyle={{ fontSize: '9px', paddingTop: '5px' }} />
              <Bar dataKey="positive" name="Disukai" fill="#22c55e" radius={[2, 2, 0, 0]} />
              <Bar dataKey="negative" name="Tidak Disukai" fill="#ef4444" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-4">
        <h3 className="text-sm font-bold text-blue-950 mb-2">Laporan Sosiometri</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {Object.entries(sociometryByClass as Record<string, Sociometry[]>).map(([className, dataList]) => (
            <div key={className} className="border rounded-lg p-2 bg-white shadow-sm">
              <h4 className="font-bold text-[10px] mb-1 border-b pb-1 flex items-center gap-1">
                <Users size={10} /> {className}
              </h4>
              <div className="space-y-1">
                {dataList.map(data => (
                  <div key={data.id} className="p-1.5 border rounded flex justify-between items-center bg-slate-50 text-[9px]">
                    <div className="truncate flex-1 mr-2">
                      <p className="font-semibold text-slate-700">{data.surveyDate}</p>
                      <p className="text-slate-500 truncate">{data.criteria}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => setSelectedSociometry(data)} className="px-1.5 py-0.5 bg-white border border-slate-200 text-slate-700 rounded hover:bg-slate-100 font-black">Detail</button>
                      <button onClick={() => exportToExcel(data)} className="p-1 bg-blue-50 text-blue-600 rounded border border-blue-100 hover:bg-blue-100"><Download size={10} strokeWidth={3} /></button>
                      <button 
                        onClick={() => setDeleteConfirmId(data.id)} 
                        className="p-1 bg-red-50 text-red-600 rounded border border-red-100 hover:bg-red-100"
                      >
                        <Trash2 size={10} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedSociometry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white py-2 border-b z-10">
              <h3 className="text-lg font-black">Detail Sosiometri: {selectedSociometry.className} ({selectedSociometry.surveyDate})</h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setSelectedSociometry(null)} 
                  className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg font-black text-xs hover:bg-slate-200 transition-colors"
                >
                  Tutup Laporan
                </button>
                <button 
                  onClick={() => setDeleteConfirmId(selectedSociometry.id)} 
                  className="p-2 hover:bg-red-50 rounded-full transition-colors group"
                >
                  <Trash2 size={20} className="text-gray-400 group-hover:text-red-500" strokeWidth={3} />
                </button>
                <button 
                  onClick={() => exportToExcel(selectedSociometry)} 
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg font-black text-xs flex items-center gap-1 hover:bg-blue-700 transition-colors"
                >
                  <Download size={14} strokeWidth={3} /> Export Excel
                </button>
              </div>
            </div>

            <div className="space-y-8">
              {/* Chart for this specific survey */}
              <div className="h-48 border rounded-lg p-2 bg-slate-50">
                <h4 className="font-bold text-[10px] mb-1 text-slate-600">Grafik Hasil Survey ({selectedSociometry.surveyDate})</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(() => {
                    const studentsInClass = students.filter(s => s.className === selectedSociometry.className);
                    return studentsInClass.map(s => ({
                      name: s.name,
                      positive: selectedSociometry.choices.filter(c => c.studentId === s.id && c.choiceType === 'positive').length,
                      negative: selectedSociometry.choices.filter(c => c.studentId === s.id && c.choiceType === 'negative').length
                    }));
                  })()} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={8} tick={{ fill: '#64748b' }} />
                    <YAxis fontSize={8} tick={{ fill: '#64748b' }} />
                    <Tooltip contentStyle={{ fontSize: '10px' }} />
                    <Legend wrapperStyle={{ fontSize: '9px', paddingTop: '5px' }} />
                    <Bar dataKey="positive" name="Disukai" fill="#22c55e" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="negative" name="Tidak Disukai" fill="#ef4444" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Analysis Tables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Liked Students Table */}
                <div>
                  <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                    <Users size={16} /> Siswa Disukai (Positive)
                  </h4>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-[10px] text-left border-collapse">
                      <thead className="bg-green-50">
                        <tr>
                          <th className="p-2 border-b">Nama Siswa</th>
                          <th className="p-2 border-b text-center">Jumlah (+)</th>
                          <th className="p-2 border-b text-center">Persentase (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const studentsInClass = students.filter(s => s.className === selectedSociometry.className);
                          const totalRespondents = studentsInClass.length;
                          const data = studentsInClass.map(s => {
                            const count = selectedSociometry.choices.filter(c => c.studentId === s.id && c.choiceType === 'positive').length;
                            return { name: s.name, count, percent: (count / totalRespondents) * 100 };
                          }).sort((a, b) => b.percent - a.percent);
                          
                          return data.map((item, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="p-2 border-b font-medium">{item.name}</td>
                              <td className="p-2 border-b text-center">{item.count}</td>
                              <td className="p-2 border-b text-center">{item.percent.toFixed(1)}%</td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Disliked Students Table */}
                <div>
                  <h4 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                    <Users size={16} /> Siswa Tidak Disukai (Negative)
                  </h4>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-[10px] text-left border-collapse">
                      <thead className="bg-red-50">
                        <tr>
                          <th className="p-2 border-b">Nama Siswa</th>
                          <th className="p-2 border-b text-center">Jumlah (-)</th>
                          <th className="p-2 border-b text-center">Persentase (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const studentsInClass = students.filter(s => s.className === selectedSociometry.className);
                          const totalRespondents = studentsInClass.length;
                          const data = studentsInClass.map(s => {
                            const count = selectedSociometry.choices.filter(c => c.studentId === s.id && c.choiceType === 'negative').length;
                            return { name: s.name, count, percent: (count / totalRespondents) * 100 };
                          }).sort((a, b) => b.percent - a.percent);
                          
                          return data.map((item, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="p-2 border-b font-medium">{item.name}</td>
                              <td className="p-2 border-b text-center">{item.count}</td>
                              <td className="p-2 border-b text-center">{item.percent.toFixed(1)}%</td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2 border-b pb-1">
                    <Users size={16} /> Analisis Per Siswa (Diterima)
                  </h4>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-[9px] text-left border-collapse">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="p-1.5 border-b font-bold">Nama Siswa</th>
                          <th className="p-1.5 border-b font-bold bg-blue-50 text-blue-800">Disukai Oleh</th>
                          <th className="p-1.5 border-b font-bold bg-blue-50 text-blue-800">Alasan Suka</th>
                          <th className="p-1.5 border-b font-bold bg-red-50 text-red-800">Tidak Disukai Oleh</th>
                          <th className="p-1.5 border-b font-bold bg-red-50 text-red-800">Alasan Tidak Suka</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const studentsInClass = students.filter(s => s.className === selectedSociometry.className);
                          return studentsInClass.map(s => {
                            const likedBy = selectedSociometry.choices.filter(c => c.studentId === s.id && c.choiceType === 'positive');
                            const dislikedBy = selectedSociometry.choices.filter(c => c.studentId === s.id && c.choiceType === 'negative');
                            
                            return (
                              <tr key={s.id} className="hover:bg-slate-50 align-top">
                                <td className="p-1.5 border-b font-medium">{s.name}</td>
                                <td className="p-1.5 border-b bg-blue-50/30">
                                  {likedBy.map(c => students.find(st => st.id === c.chooserStudentId)?.name).join(', ') || '-'}
                                </td>
                                <td className="p-1.5 border-b bg-blue-50/30 italic text-gray-600">
                                  {likedBy.map(c => c.reason).filter(r => r).join('; ') || '-'}
                                </td>
                                <td className="p-1.5 border-b bg-red-50/30">
                                  {dislikedBy.map(c => students.find(st => st.id === c.chooserStudentId)?.name).join(', ') || '-'}
                                </td>
                                <td className="p-1.5 border-b bg-red-50/30 italic text-gray-600">
                                  {dislikedBy.map(c => c.reason).filter(r => r).join('; ') || '-'}
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
            </div>
          </div>
        </div>
      )}
      {showClassReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl max-w-5xl w-full max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white py-2 border-b z-10">
              <h3 className="text-lg font-black">Laporan Sosiometri Per Kelas</h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setShowClassReport(false); setReportClass(''); }} 
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-black text-[10px] hover:bg-slate-200 transition-colors uppercase tracking-wider"
                >
                  Tutup Laporan
                </button>
                <button onClick={() => { setShowClassReport(false); setReportClass(''); }} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={20} className="text-gray-400" strokeWidth={3} />
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Kelas</label>
              <select 
                className="w-full p-2 border rounded-lg text-xs bg-slate-50"
                value={reportClass}
                onChange={(e) => setReportClass(e.target.value)}
              >
                <option value="">-- Pilih Kelas --</option>
                {classes.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {reportClass && (
              <div className="space-y-8">
                {(() => {
                  const classSociometry = sociometryData.filter(d => d.className === reportClass);
                  const studentsInClass = students.filter(s => s.className === reportClass);
                  
                  if (classSociometry.length === 0) {
                    return <div className="p-8 text-center text-slate-500 italic">Belum ada data sosiometri untuk kelas ini.</div>;
                  }

                  // Use the latest survey for the sociogram and analysis
                  const latestSurvey = classSociometry[0];
                  const allChoices = latestSurvey.choices;
                  
                  const positiveCounts: Record<string, number> = {};
                  const negativeCounts: Record<string, number> = {};
                  const mutualChoices: [string, string][] = [];
                  
                  studentsInClass.forEach(s => {
                    positiveCounts[s.id] = 0;
                    negativeCounts[s.id] = 0;
                  });

                  allChoices.forEach(c => {
                    if (c.choiceType === 'positive') {
                      positiveCounts[c.studentId]++;
                      const isMutual = allChoices.find(other => 
                        other.chooserStudentId === c.studentId && 
                        other.studentId === c.chooserStudentId && 
                        other.choiceType === 'positive'
                      );
                      if (isMutual && !mutualChoices.some(m => (m[0] === c.studentId && m[1] === c.chooserStudentId) || (m[0] === c.chooserStudentId && m[1] === c.studentId))) {
                        mutualChoices.push([c.chooserStudentId, c.studentId]);
                      }
                    } else {
                      negativeCounts[c.studentId]++;
                    }
                  });

                  const stars = studentsInClass
                    .filter(s => positiveCounts[s.id] >= 3)
                    .sort((a, b) => positiveCounts[b.id] - positiveCounts[a.id]);

                  const isolated = studentsInClass
                    .filter(s => positiveCounts[s.id] === 0 && negativeCounts[s.id] === 0);

                  return (
                    <>
                      {/* Summary Chart */}
                      <div className="h-64 border rounded-xl p-4 bg-white shadow-sm">
                        <h4 className="font-bold text-sm mb-4 text-slate-800 flex items-center gap-2">
                          <BookOpen size={18} className="text-blue-600" /> Grafik Hasil Survey ({latestSurvey.surveyDate})
                        </h4>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={studentsInClass.map(s => ({
                            name: s.name,
                            positive: positiveCounts[s.id],
                            negative: negativeCounts[s.id]
                          }))}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" fontSize={8} />
                            <YAxis fontSize={8} />
                            <Tooltip contentStyle={{ fontSize: '10px' }} />
                            <Legend wrapperStyle={{ fontSize: '10px' }} />
                            <Bar dataKey="positive" name="Disukai" fill="#22c55e" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="negative" name="Tidak Disukai" fill="#ef4444" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Sociogram Gabungan */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                            <Network size={18} className="text-purple-600" /> Sosiogram Kelas (Gabungan)
                          </h4>
                          <button 
                            onClick={() => downloadSociogram('sociogram-gabungan', 'Sosiogram_Gabungan')}
                            className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-black shadow-sm hover:bg-purple-700 transition-colors"
                          >
                            <Download size={14} strokeWidth={3} /> Download Sosiogram
                          </button>
                        </div>
                        <div id="sociogram-gabungan" className="p-8 bg-white rounded-xl border border-slate-200">
                          <div className="text-center mb-6">
                            <h1 className="text-2xl font-black uppercase mb-1">{teacherData.school || 'NAMA SEKOLAH'}</h1>
                            <h2 className="text-xl font-bold uppercase">SOSIOGRAM KELAS : {reportClass}</h2>
                            <h3 className="text-md font-semibold uppercase">TAHUN AJARAN : {academicYear || '-'}</h3>
                          </div>
                          <Sociogram students={studentsInClass} choices={allChoices} width={1000} height={700} />
                        </div>
                      </div>

                      {/* Sociogram Disukai */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                            <Network size={18} className="text-blue-600" /> Sosiogram Disukai
                          </h4>
                          <button 
                            onClick={() => downloadSociogram('sociogram-disukai', 'Sosiogram_Disukai')}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-black shadow-sm hover:bg-blue-700 transition-colors"
                          >
                            <Download size={14} strokeWidth={3} /> Download Sosiogram
                          </button>
                        </div>
                        <div id="sociogram-disukai" className="p-8 bg-white rounded-xl border border-slate-200">
                          <div className="text-center mb-6">
                            <h1 className="text-2xl font-black uppercase mb-1">{teacherData.school || 'NAMA SEKOLAH'}</h1>
                            <h2 className="text-xl font-bold uppercase">SOSIOGRAM KELAS : {reportClass} (DISUKAI)</h2>
                            <h3 className="text-md font-semibold uppercase">TAHUN AJARAN : {academicYear || '-'}</h3>
                          </div>
                          <Sociogram students={studentsInClass} choices={allChoices.filter(c => c.choiceType === 'positive')} width={1000} height={700} />
                        </div>
                      </div>

                      {/* Sociogram Tidak Disukai */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                            <Network size={18} className="text-red-600" /> Sosiogram Tidak Disukai
                          </h4>
                          <button 
                            onClick={() => downloadSociogram('sociogram-tidak-disukai', 'Sosiogram_Tidak_Disukai')}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-black shadow-sm hover:bg-red-700 transition-colors"
                          >
                            <Download size={14} strokeWidth={3} /> Download Sosiogram
                          </button>
                        </div>
                        <div id="sociogram-tidak-disukai" className="p-8 bg-white rounded-xl border border-slate-200">
                          <div className="text-center mb-6">
                            <h1 className="text-2xl font-black uppercase mb-1">{teacherData.school || 'NAMA SEKOLAH'}</h1>
                            <h2 className="text-xl font-bold uppercase">SOSIOGRAM KELAS : {reportClass} (TIDAK DISUKAI)</h2>
                            <h3 className="text-md font-semibold uppercase">TAHUN AJARAN : {academicYear || '-'}</h3>
                          </div>
                          <Sociogram students={studentsInClass} choices={allChoices.filter(c => c.choiceType === 'negative')} width={1000} height={700} />
                        </div>
                      </div>

                      {/* Analysis Section Header */}
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                          <Star size={18} className="text-yellow-600" /> Analisa Sosiogram
                        </h4>
                        <button 
                          onClick={() => downloadSociogram('analysis-report-table', 'Analisa_Sosiogram')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-black shadow-sm hover:bg-emerald-700 transition-colors"
                        >
                          <Download size={14} strokeWidth={3} /> Download Laporan Analisa
                        </button>
                      </div>

                      {/* Hidden/Printable Table for Download */}
                      <div className="absolute -left-[9999px] top-0 pointer-events-none">
                        <div id="analysis-report-table" className="p-10 bg-white w-[1000px]">
                          <div className="text-center mb-8 border-b-2 border-slate-800 pb-4">
                            <h1 className="text-2xl font-black uppercase mb-1">{teacherData.school || 'NAMA SEKOLAH'}</h1>
                            <h2 className="text-xl font-bold uppercase">LAPORAN ANALISA SOSIOGRAM</h2>
                            <p className="text-sm font-semibold">KELAS: {reportClass} | TAHUN AJARAN: {academicYear}</p>
                          </div>
                          
                          <table className="w-full border-collapse border border-slate-400">
                            <thead>
                              <tr className="bg-slate-100">
                                <th className="border border-slate-400 p-3 text-left font-bold text-sm w-1/4">KATEGORI</th>
                                <th className="border border-slate-400 p-3 text-left font-bold text-sm w-1/2">NAMA SISWA</th>
                                <th className="border border-slate-400 p-3 text-left font-bold text-sm w-1/4">KETERANGAN</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="border border-slate-400 p-3 font-bold text-sm bg-yellow-50">STAR (Populer)</td>
                                <td className="border border-slate-400 p-3 text-sm">
                                  {stars.length > 0 ? stars.map(s => s.name).join(', ') : 'Tidak ada'}
                                </td>
                                <td className="border border-slate-400 p-3 text-xs italic text-slate-600">
                                  Siswa yang paling banyak dipilih sebagai teman disukai.
                                </td>
                              </tr>
                              <tr>
                                <td className="border border-slate-400 p-3 font-bold text-sm bg-red-50">TERISOLIR</td>
                                <td className="border border-slate-400 p-3 text-sm">
                                  {isolated.length > 0 ? isolated.map(s => s.name).join(', ') : 'Tidak ada'}
                                </td>
                                <td className="border border-slate-400 p-3 text-xs italic text-slate-600">
                                  Siswa yang tidak dipilih oleh siapapun (baik positif maupun negatif).
                                </td>
                              </tr>
                              <tr>
                                <td className="border border-slate-400 p-3 font-bold text-sm bg-blue-50">KLIK (Kelompok)</td>
                                <td className="border border-slate-400 p-3 text-sm">
                                  {mutualChoices.length > 0 ? mutualChoices.map(m => {
                                    const s1 = studentsInClass.find(s => s.id === m[0])?.name;
                                    const s2 = studentsInClass.find(s => s.id === m[1])?.name;
                                    return `${s1} ↔ ${s2}`;
                                  }).join(', ') : 'Tidak ada'}
                                </td>
                                <td className="border border-slate-400 p-3 text-xs italic text-slate-600">
                                  Siswa yang saling memilih satu sama lain secara positif.
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          
                          <div className="mt-12 flex justify-end">
                            <div className="text-center">
                              <p className="text-sm mb-16">Guru BK,</p>
                              <p className="text-sm font-bold underline">{teacherData.name || 'Nama Guru'}</p>
                              <p className="text-xs text-slate-500">NIP. {teacherData.nip || '-'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Analysis Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* STAR */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 shadow-sm">
                          <h5 className="font-bold text-yellow-800 flex items-center gap-2 mb-3">
                            <Star size={18} fill="currentColor" /> STAR (Populer)
                          </h5>
                          <div className="space-y-2">
                            {stars.length > 0 ? stars.map(s => (
                              <div key={s.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-yellow-100 text-xs">
                                <span className="font-medium">{s.name}</span>
                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full font-bold">{positiveCounts[s.id]} Pilihan</span>
                              </div>
                            )) : <p className="text-xs text-yellow-600 italic">Tidak ada siswa yang memenuhi kriteria.</p>}
                          </div>
                          <p className="mt-4 text-[10px] text-yellow-700 italic">Siswa yang paling banyak dipilih sebagai teman disukai.</p>
                        </div>

                        {/* TERISOLIR */}
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
                          <h5 className="font-bold text-red-800 flex items-center gap-2 mb-3">
                            <UserMinus size={18} /> TERISOLIR
                          </h5>
                          <div className="space-y-2">
                            {isolated.length > 0 ? isolated.map(s => (
                              <div key={s.id} className="bg-white p-2 rounded-lg border border-red-100 text-xs font-medium">
                                {s.name}
                              </div>
                            )) : <p className="text-xs text-red-600 italic">Tidak ada siswa yang terisolir.</p>}
                          </div>
                          <p className="mt-4 text-[10px] text-red-700 italic">Siswa yang tidak dipilih oleh siapapun (baik positif maupun negatif).</p>
                        </div>

                        {/* KLIK */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm">
                          <h5 className="font-bold text-blue-800 flex items-center gap-2 mb-3">
                            <Share2 size={18} /> KLIK (Kelompok Kecil)
                          </h5>
                          <div className="space-y-2">
                            {mutualChoices.length > 0 ? mutualChoices.map((m, i) => {
                              const s1 = studentsInClass.find(s => s.id === m[0])?.name;
                              const s2 = studentsInClass.find(s => s.id === m[1])?.name;
                              return (
                                <div key={i} className="bg-white p-2 rounded-lg border border-blue-100 text-xs font-medium flex items-center justify-center gap-2">
                                  <span>{s1}</span>
                                  <span className="text-blue-400">↔</span>
                                  <span>{s2}</span>
                                </div>
                              );
                            }) : <p className="text-xs text-blue-600 italic">Tidak ada klik yang terdeteksi.</p>}
                          </div>
                          <p className="mt-4 text-[10px] text-blue-700 italic">Siswa yang saling memilih satu sama lain secara positif.</p>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            <div className="mt-8 border-t pt-4 flex justify-end">
              <p className="text-[10px] text-slate-400 italic">Laporan Sosiometri Digital - Jurnal Guru BK</p>
            </div>
          </div>
        </div>
      )}
      {showStudentReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white py-2 border-b">
              <h3 className="text-lg font-black">Laporan Sosiometri Per Siswa</h3>
              <button onClick={() => { setShowStudentReport(false); setReportClass(''); setReportStudentId(''); }} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} className="text-gray-400" strokeWidth={3} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1">Pilih Kelas</label>
                <select 
                  className="w-full p-2 border rounded-lg text-xs" 
                  value={reportClass} 
                  onChange={(e) => { setReportClass(e.target.value); setReportStudentId(''); }}
                >
                  <option value="">Pilih Kelas</option>
                  {classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1">Pilih Siswa</label>
                <select 
                  className="w-full p-2 border rounded-lg text-xs" 
                  value={reportStudentId} 
                  onChange={(e) => setReportStudentId(e.target.value)}
                  disabled={!reportClass}
                >
                  <option value="">Pilih Siswa</option>
                  {students.filter(s => s.className === reportClass).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {reportStudentId && (
              <div className="space-y-6">
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                  <h4 className="font-bold text-indigo-900 mb-1">Profil Siswa</h4>
                  <p className="text-xs text-indigo-700">Nama: {students.find(s => s.id === reportStudentId)?.name}</p>
                  <p className="text-xs text-indigo-700">Kelas: {reportClass}</p>
                </div>

                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="p-2 border-b font-bold bg-blue-50 text-blue-800">Disukai Oleh</th>
                        <th className="p-2 border-b font-bold bg-blue-50 text-blue-800 text-center">%</th>
                        <th className="p-2 border-b font-bold bg-blue-50 text-blue-800">Alasan Suka</th>
                        <th className="p-2 border-b font-bold bg-red-50 text-red-800">Tidak Disukai Oleh</th>
                        <th className="p-2 border-b font-bold bg-red-50 text-red-800 text-center">%</th>
                        <th className="p-2 border-b font-bold bg-red-50 text-red-800">Alasan Tidak Suka</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const classSociometry = sociometryData.filter(d => d.className === reportClass);
                        const studentsInClass = students.filter(s => s.className === reportClass);
                        const totalRespondents = studentsInClass.length;

                        // Aggregate choices for this student across all surveys in this class
                        const likedBy: { name: string, reason: string }[] = [];
                        const dislikedBy: { name: string, reason: string }[] = [];

                        classSociometry.forEach(survey => {
                          survey.choices.forEach(choice => {
                            if (choice.studentId === reportStudentId) {
                              const chooser = students.find(s => s.id === choice.chooserStudentId);
                              if (choice.choiceType === 'positive') {
                                likedBy.push({ name: chooser?.name || 'Unknown', reason: choice.reason });
                              } else {
                                dislikedBy.push({ name: chooser?.name || 'Unknown', reason: choice.reason });
                              }
                            }
                          });
                        });

                        const maxRows = Math.max(likedBy.length, dislikedBy.length, 1);
                        const rows = [];
                        for (let i = 0; i < maxRows; i++) {
                          rows.push(
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="p-2 border-b">{likedBy[i]?.name || '-'}</td>
                              <td className="p-2 border-b text-center">
                                {i === 0 && likedBy.length > 0 ? ((likedBy.length / totalRespondents) * 100).toFixed(1) + '%' : ''}
                              </td>
                              <td className="p-2 border-b italic text-gray-500">{likedBy[i]?.reason || '-'}</td>
                              <td className="p-2 border-b">{dislikedBy[i]?.name || '-'}</td>
                              <td className="p-2 border-b text-center">
                                {i === 0 && dislikedBy.length > 0 ? ((dislikedBy.length / totalRespondents) * 100).toFixed(1) + '%' : ''}
                              </td>
                              <td className="p-2 border-b italic text-gray-500">{dislikedBy[i]?.reason || '-'}</td>
                            </tr>
                          );
                        }
                        return rows;
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="mt-8">
              <button 
                onClick={() => { setShowStudentReport(false); setReportClass(''); setReportStudentId(''); }} 
                className="w-full px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-black text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white p-6 rounded-xl max-w-sm w-full shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus Data Sosiometri?</h3>
              <p className="text-sm text-slate-500 mb-6">Tindakan ini tidak dapat dibatalkan. Semua data survey ini akan dihapus permanen.</p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-black text-xs hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={() => {
                    onDelete(deleteConfirmId);
                    setDeleteConfirmId(null);
                    if (selectedSociometry?.id === deleteConfirmId) {
                      setSelectedSociometry(null);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-black text-xs hover:bg-red-700 transition-colors"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Google Form Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[70]">
          <div className="bg-white p-6 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b pb-3">
              <div className="flex items-center gap-2 text-amber-600">
                <BookOpen size={24} strokeWidth={3} />
                <h3 className="text-xl font-black">Panduan Sosiometri Google Form</h3>
              </div>
              <button onClick={() => setShowGuide(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={24} className="text-gray-400" strokeWidth={3} />
              </button>
            </div>

            <div className="space-y-6 text-sm text-slate-700">
              <section>
                <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs">1</span>
                  Buat Google Form Baru
                </h4>
                <p className="ml-8">Buka <a href="https://forms.google.com" target="_blank" rel="noreferrer" className="text-blue-600 underline">forms.google.com</a> dan buat formulir baru. Beri judul misalnya "Survey Hubungan Sosial Kelas X".</p>
              </section>

              <section>
                <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs">2</span>
                  Susun Pertanyaan (WAJIB SESUAI URUTAN)
                </h4>
                <div className="ml-8 p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <p>Buat pertanyaan dengan urutan kolom sebagai berikut:</p>
                  <ol className="list-decimal ml-5 space-y-1 font-medium">
                    <li>Nama Lengkap Anda (Jawaban Singkat/Dropdown)</li>
                    <li>Kelas (Jawaban Singkat/Dropdown)</li>
                    <li>Siapa teman yang paling ingin kamu ajak bekerja sama? (Dropdown/Jawaban Singkat)</li>
                    <li>Apa alasan kamu memilih dia? (Paragraf/Jawaban Singkat)</li>
                    <li>Siapa teman yang paling tidak ingin kamu ajak bekerja sama? (Dropdown/Jawaban Singkat)</li>
                    <li>Apa alasan kamu memilih dia? (Paragraf/Jawaban Singkat)</li>
                    <li>Maksimal setiap siswa memilih 3 siswa beserta alasannya.</li>
                    <li>Buat masing-masing 3 pertanyaan yang sama dengan kriteria: pilihan pertama adalah siswa yang paling disukai atau paling tidak sukai, pilihan kedua adalah rangking kedua, pilihan ketiga adalah rangking ketiga.</li>
                  </ol>
                </div>
              </section>

              <section>
                <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs">3</span>
                  Bagikan Link ke Siswa
                </h4>
                <p className="ml-8">Klik tombol <strong>Kirim</strong> di pojok kanan atas, pilih ikon tautan (link), perpendek URL, dan bagikan ke grup kelas atau siswa.</p>
              </section>

              <section>
                <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs">4</span>
                  Download Hasil Respon (Excel)
                </h4>
                <ul className="ml-8 list-disc space-y-1">
                  <li>Setelah siswa mengisi, buka tab <strong>Jawaban (Responses)</strong> di Google Form Anda.</li>
                  <li>Klik tombol hijau <strong>Lihat di Spreadsheet</strong>.</li>
                  <li>Di Google Sheets, klik menu <strong>File</strong> &gt; <strong>Download</strong> &gt; <strong>Microsoft Excel (.xlsx)</strong>.</li>
                </ul>
              </section>

              <section>
                <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs">5</span>
                  Upload ke Aplikasi
                </h4>
                <p className="ml-8">Kembali ke aplikasi ini, lalu klik tombol <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-bold inline-flex items-center gap-1"><Plus size={10} /> Upload Excel</span> dan pilih file yang baru saja Anda download.</p>
              </section>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
                <div className="text-blue-500 mt-1"><Star size={20} fill="currentColor" /></div>
                <div>
                  <p className="font-bold text-blue-900 text-xs">Tips Profesional:</p>
                  <p className="text-xs text-blue-700">Gunakan pertanyaan tipe <strong>Dropdown</strong> untuk daftar nama siswa agar data yang masuk konsisten dan tidak ada salah ketik nama.</p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button 
                onClick={() => setShowGuide(false)}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-black hover:bg-slate-800 transition-all shadow-lg"
              >
                Saya Mengerti, Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SociometryManagement;
