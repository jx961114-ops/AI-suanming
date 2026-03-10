import React, { useState } from 'react';
import { BirthInfo } from '../types';
import { Calendar, Clock, MapPin, User, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface BirthFormProps {
  onSubmit: (info: BirthInfo) => void;
}

export default function BirthForm({ onSubmit }: BirthFormProps) {
  const [info, setInfo] = useState<BirthInfo>({
    date: '1990-01-01',
    time: '12:00',
    location: '北京',
    gender: 'male'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(info);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-white/20"
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">探索你的命盘与人生趋势</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Calendar size={16} /> 出生日期
            </label>
            <input
              type="date"
              value={info.date}
              onChange={(e) => setInfo({ ...info, date: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              required
            />
          </div>

          {/* Time */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock size={16} /> 出生时间
            </label>
            <input
              type="time"
              value={info.time}
              onChange={(e) => setInfo({ ...info, time: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              required
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <MapPin size={16} /> 出生地点
            </label>
            <input
              type="text"
              value={info.location}
              onChange={(e) => setInfo({ ...info, location: e.target.value })}
              placeholder="例如：北京"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              required
            />
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <User size={16} /> 性别
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setInfo({ ...info, gender: 'male' })}
                className={`flex-1 py-3 rounded-xl border transition-all ${
                  info.gender === 'male' 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200' 
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                男
              </button>
              <button
                type="button"
                onClick={() => setInfo({ ...info, gender: 'female' })}
                className={`flex-1 py-3 rounded-xl border transition-all ${
                  info.gender === 'female' 
                    ? 'bg-pink-600 text-white border-pink-600 shadow-lg shadow-pink-200' 
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                女
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
        >
          生成命盘分析 <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </form>
    </motion.div>
  );
}
