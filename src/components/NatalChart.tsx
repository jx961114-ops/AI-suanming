import React from 'react';
import { AstrologyData } from '../types';
import { motion } from 'motion/react';

interface NatalChartProps {
  data: AstrologyData;
}

export default function NatalChart({ data }: NatalChartProps) {
  return (
    <div className="space-y-8">
      {/* Planets List */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {data.planets.map((p, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col items-center"
          >
            <span className="text-xs font-medium text-gray-400 mb-1">{p.name}</span>
            <span className="text-lg font-bold text-indigo-600">{p.sign}</span>
            <span className="text-xs text-gray-500 mt-1">{p.house} 宫 | {p.degree}°</span>
          </motion.div>
        ))}
      </div>

      {/* Ascendant */}
      <div className="bg-gradient-to-br from-indigo-50 to-violet-50 p-6 rounded-3xl border border-indigo-100 shadow-sm text-center">
        <h3 className="text-sm font-medium text-indigo-400 mb-2 uppercase tracking-wider">上升点 (ASC)</h3>
        <p className="text-3xl font-bold text-indigo-900">{data.ascendant}</p>
      </div>

      {/* Simplified Aspects (Placeholder) */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4">主要相位</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
            <span className="text-sm font-medium">太阳 合 月亮</span>
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-bold">和谐</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
            <span className="text-sm font-medium">金星 冲 火星</span>
            <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full font-bold">挑战</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
            <span className="text-sm font-medium">木星 拱 土星</span>
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-bold">机遇</span>
          </div>
        </div>
      </div>
    </div>
  );
}
