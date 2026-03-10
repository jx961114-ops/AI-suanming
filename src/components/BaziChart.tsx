import React from 'react';
import { BaziData } from '../types';
import { motion } from 'motion/react';

interface BaziChartProps {
  data: BaziData;
}

export default function BaziChart({ data }: BaziChartProps) {
  const columns = [
    { label: '年柱', stem: data.year.stem, branch: data.year.branch, element: data.year.element },
    { label: '月柱', stem: data.month.stem, branch: data.month.branch, element: data.month.element },
    { label: '日柱', stem: data.day.stem, branch: data.day.branch, element: data.day.element },
    { label: '时柱', stem: data.hour.stem, branch: data.hour.branch, element: data.hour.element },
  ];

  const elementColors: { [key: string]: string } = {
    '金': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    '木': 'bg-green-100 text-green-800 border-green-200',
    '水': 'bg-blue-100 text-blue-800 border-blue-200',
    '火': 'bg-red-100 text-red-800 border-red-200',
    '土': 'bg-stone-100 text-stone-800 border-stone-200',
  };

  return (
    <div className="space-y-8">
      {/* Bazi Columns */}
      <div className="grid grid-cols-4 gap-4">
        {columns.map((col, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="flex flex-col items-center p-4 rounded-2xl bg-white border border-gray-100 shadow-sm"
          >
            <span className="text-xs font-medium text-gray-400 mb-2">{col.label}</span>
            <div className={`w-12 h-12 flex items-center justify-center text-xl font-bold rounded-xl mb-2 border ${elementColors[col.element]}`}>
              {col.stem}
            </div>
            <div className={`w-12 h-12 flex items-center justify-center text-xl font-bold rounded-xl border ${elementColors[col.element]}`}>
              {col.branch}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Five Elements Distribution */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4">五行分布</h3>
        <div className="space-y-4">
          {Object.entries(data.fiveElements).map(([el, count], idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{el}</span>
                <span className="text-gray-500">{count} / 8</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(count / 8) * 100}%` }}
                  className={`h-full ${
                    el === '金' ? 'bg-yellow-400' :
                    el === '木' ? 'bg-green-400' :
                    el === '水' ? 'bg-blue-400' :
                    el === '火' ? 'bg-red-400' :
                    'bg-stone-400'
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
