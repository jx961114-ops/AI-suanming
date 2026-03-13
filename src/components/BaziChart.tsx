import React from 'react';
import { BaziData } from '../types';
import { motion } from 'motion/react';

interface BaziChartProps {
  data: BaziData;
}

export default function BaziChart({ data }: BaziChartProps) {
  const columns = [
    { label: '年柱', ...data.year },
    { label: '月柱', ...data.month },
    { label: '日柱', ...data.day },
    { label: '时柱', ...data.hour },
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
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          {columns.map((col, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="flex flex-col items-center p-3 sm:p-4 rounded-2xl bg-white border border-gray-100 shadow-sm"
            >
              <span className="text-xs font-medium text-gray-400 mb-2">{col.label}</span>
              
              {/* Ten God (Stem) */}
              <span className="text-[10px] sm:text-xs font-bold text-indigo-600 mb-1">{col.tenGod}</span>
              
              {/* Stem */}
              <div className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-lg sm:text-xl font-bold rounded-xl mb-2 border ${elementColors[col.element]}`}>
                {col.stem}
              </div>
              
              {/* Branch */}
              <div className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-lg sm:text-xl font-bold rounded-xl border ${elementColors[col.element]}`}>
                {col.branch}
              </div>

              {/* Hidden Stems & Ten Gods */}
              <div className="mt-3 flex flex-col items-center gap-1 w-full">
                {col.hiddenStems.map((hs, i) => (
                  <div key={i} className="flex items-center justify-center gap-1 text-[9px] sm:text-[10px] leading-tight">
                    <span className="text-gray-600 font-medium">{hs.stem}</span>
                    <span className="text-gray-400">{hs.tenGod}</span>
                  </div>
                ))}
              </div>

              {/* Shen Sha */}
              <div className="mt-3 flex flex-wrap justify-center gap-1 w-full">
                {col.shenSha.map((ss, i) => (
                  <span key={i} className="text-[8px] sm:text-[9px] px-1 py-0.5 bg-indigo-50 text-indigo-500 rounded border border-indigo-100 whitespace-nowrap">
                    {ss}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
        <p className="text-[10px] text-gray-400 text-center">注：八字以立春为岁首，以节令换月。</p>
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

      {/* Da Yun */}
      {data.daYun && (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4">大运</h3>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {data.daYun.items.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center p-2 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-[10px] text-gray-400">{item.age}岁</span>
                <span className="text-sm font-bold text-gray-700">{item.stem}{item.branch}</span>
                <span className="text-[10px] text-gray-400">{item.year}年</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liu Nian */}
      {data.liuNian && (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4">流年</h3>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {data.liuNian.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center p-2 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-[10px] text-gray-400">{item.year}</span>
                <span className="text-sm font-bold text-gray-700">{item.stem}{item.branch}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
