import React from 'react';
import { AKPDQuestion } from '../types';

interface AkpdQuestionEditorProps {
  questions: AKPDQuestion[];
  onUpdateAkpdQuestions: (questions: AKPDQuestion[]) => void;
  setIsEditing: (isEditing: boolean) => void;
  AKPD_QUESTIONS: AKPDQuestion[];
}

const AkpdQuestionEditor: React.FC<AkpdQuestionEditorProps> = ({ questions, onUpdateAkpdQuestions, setIsEditing, AKPD_QUESTIONS }) => {
  return (
    <div className="space-y-8 mx-4">
      <div className="glass-card p-8 rounded-[2.5rem] border border-primary/10">
        <h3 className="text-lg font-black text-slate-900 uppercase mb-6">Edit Pertanyaan AKPD</h3>
        <div className="space-y-6">
          {['Pribadi', 'Sosial', 'Belajar', 'Karier'].map(aspect => (
            <div key={aspect}>
              <h4 className="font-bold text-primary mb-2">Bidang {aspect}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {questions.filter(q => q.aspect === aspect).map(q => (
                  <div key={q.id} className="flex items-start gap-2">
                    <span className="font-bold text-slate-500">{q.id}.</span>
                    <textarea 
                      value={q.text}
                      onChange={e => {
                        const newQuestions = questions.map(qn => qn.id === q.id ? {...qn, text: e.target.value} : qn);
                        onUpdateAkpdQuestions(newQuestions);
                      }}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-sm"
                      rows={3}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-4 mt-8">
          <button onClick={() => {
            onUpdateAkpdQuestions(AKPD_QUESTIONS); // Reset to default
            setIsEditing(false);
          }} className="px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-lg transition-all">
            Batal
          </button>
          <button onClick={() => {
            // Here you would typically save the questions to a persistent state (e.g., localStorage or a backend)
            setIsEditing(false);
            alert('Pertanyaan berhasil disimpan!');
          }} className="px-8 py-3 text-sm font-bold text-white bg-primary rounded-lg shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  );
};

export default AkpdQuestionEditor;
