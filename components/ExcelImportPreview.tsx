import React from 'react';
import { Student } from '../types';
import { Check, X } from 'lucide-react';

interface ExcelImportPreviewProps {
  students: Student[];
  onConfirm: () => void;
  onCancel: () => void;
}

const ExcelImportPreview: React.FC<ExcelImportPreviewProps> = ({ students, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Konfirmasi Impor Data Siswa</h2>
        <p className="mb-4 text-gray-600">Berikut adalah data siswa yang akan diimpor. Periksa kembali data sebelum melanjutkan.</p>
        <div className="overflow-auto flex-grow border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIS</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelas</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.nis}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.className}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <X className="w-4 h-4 mr-2" />
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Check className="w-4 h-4 mr-2" />
            Simpan dan Impor
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExcelImportPreview;
