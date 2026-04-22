import React from 'react';
import { TeacherData } from '../types';
import { User } from 'lucide-react';

interface TeacherProfileProps {
  data: TeacherData;
}

const TeacherProfile: React.FC<TeacherProfileProps> = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-6 border border-gray-100">
      <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border-2 border-gray-200">
        {data.photo ? (
          <img src={data.photo} alt={data.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <User className="w-12 h-12 text-gray-400" />
        )}
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-800">{data.name || 'Nama Guru'}</h2>
        <p className="text-gray-600">NIP: {data.nip || '-'}</p>
        <p className="text-gray-600 font-medium">{data.school || '-'}</p>
      </div>
    </div>
  );
};

export default TeacherProfile;
