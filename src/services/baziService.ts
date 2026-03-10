import { Solar, Lunar } from 'lunar-javascript';
import { BaziData, BirthInfo } from '../types';

export function calculateBazi(info: BirthInfo): BaziData {
  const [year, month, day] = info.date.split('-').map(Number);
  const [hour, minute] = info.time.split(':').map(Number);

  const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();

  // Get stems and branches
  const yearStr = eightChar.getYear();
  const monthStr = eightChar.getMonth();
  const dayStr = eightChar.getDay();
  const hourStr = eightChar.getTime();

  const yearStem = yearStr.charAt(0);
  const yearBranch = yearStr.charAt(1);
  const monthStem = monthStr.charAt(0);
  const monthBranch = monthStr.charAt(1);
  const dayStem = dayStr.charAt(0);
  const dayBranch = dayStr.charAt(1);
  const hourStem = hourStr.charAt(0);
  const hourBranch = hourStr.charAt(1);

  // Get elements
  const getElement = (stem: string, branch: string) => {
    // Simplified element mapping for stems and branches
    const stemElements: { [key: string]: string } = {
      '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
    };
    const branchElements: { [key: string]: string } = {
      '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'
    };
    return { stem: stemElements[stem], branch: branchElements[branch] };
  };

  const yearEl = getElement(yearStem, yearBranch);
  const monthEl = getElement(monthStem, monthBranch);
  const dayEl = getElement(dayStem, dayBranch);
  const hourEl = getElement(hourStem, hourBranch);

  // Count five elements
  const elements = [yearEl.stem, yearEl.branch, monthEl.stem, monthEl.branch, dayEl.stem, dayEl.branch, hourEl.stem, hourEl.branch];
  const fiveElements: { [key: string]: number } = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };
  elements.forEach(el => {
    if (fiveElements[el] !== undefined) fiveElements[el]++;
  });

  return {
    year: { stem: yearStem, branch: yearBranch, element: yearEl.stem },
    month: { stem: monthStem, branch: monthBranch, element: monthEl.stem },
    day: { stem: dayStem, branch: dayBranch, element: dayEl.stem },
    hour: { stem: hourStem, branch: hourBranch, element: hourEl.stem },
    fiveElements,
    tenGods: [
      eightChar.getYearShiShenGan(),
      eightChar.getMonthShiShenGan(),
      eightChar.getDayShiShenGan(),
      eightChar.getTimeShiShenGan()
    ],
    dayMaster: dayStem
  };
}
