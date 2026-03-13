import { Solar, Lunar } from 'lunar-javascript';
import { BaziData, BirthInfo } from '../types';

export function calculateBazi(info: BirthInfo): BaziData {
  const [year, month, day] = info.date.split('-').map(Number);
  const [hour, minute] = info.time.split(':').map(Number);

  const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();
  // 使用流派2，以晚子时（23:00）作为日界，这是八字命理的通用标准
  eightChar.setSect(2);

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

  // Calculate Da Yun
  const gender = info.gender === 'male' ? 1 : 0;
  const yun = eightChar.getYun(gender);
  const daYunList = yun.getDaYun();
  
  const daYunItems = daYunList.map(dy => {
    const ganZhi = dy.getGanZhi();
    return {
      age: dy.getStartAge(),
      year: dy.getStartYear(),
      stem: ganZhi.charAt(0),
      branch: ganZhi.charAt(1)
    };
  }).slice(1, 9); // Get 8 cycles, skip the first "0 age" one if it's just a placeholder

  // Calculate Liu Nian (Current year and next 9 years)
  const currentYear = new Date().getFullYear();
  const liuNianItems = [];
  for (let i = 0; i < 10; i++) {
    const year = currentYear + i;
    // 使用该年6月1日的日期来获取该年的干支，确保在立春之后且在下一年立春之前
    const gz = Lunar.fromYmd(year, 6, 1).getYearInGanZhi();
    liuNianItems.push({
      year,
      stem: gz.charAt(0),
      branch: gz.charAt(1)
    });
  }

  const getHiddenStems = (hides: string[], shiShens: string[]) => {
    return hides.map((stem, i) => ({ stem, tenGod: shiShens[i] }));
  };

  return {
    year: { 
      stem: yearStem, 
      branch: yearBranch, 
      element: yearEl.stem,
      tenGod: eightChar.getYearShiShenGan(),
      hiddenStems: getHiddenStems(eightChar.getYearHideGan(), eightChar.getYearShiShenZhi()),
      shenSha: []
    },
    month: { 
      stem: monthStem, 
      branch: monthBranch, 
      element: monthEl.stem,
      tenGod: eightChar.getMonthShiShenGan(),
      hiddenStems: getHiddenStems(eightChar.getMonthHideGan(), eightChar.getMonthShiShenZhi()),
      shenSha: []
    },
    day: { 
      stem: dayStem, 
      branch: dayBranch, 
      element: dayEl.stem,
      tenGod: '日主',
      hiddenStems: getHiddenStems(eightChar.getDayHideGan(), eightChar.getDayShiShenZhi()),
      shenSha: []
    },
    hour: { 
      stem: hourStem, 
      branch: hourBranch, 
      element: hourEl.stem,
      tenGod: eightChar.getTimeShiShenGan(),
      hiddenStems: getHiddenStems(eightChar.getTimeHideGan(), eightChar.getTimeShiShenZhi()),
      shenSha: []
    },
    fiveElements,
    dayMaster: dayStem,
    daYun: {
      startAge: yun.getStartYear(),
      startYear: yun.getStartSolar().getYear(),
      items: daYunItems
    },
    liuNian: liuNianItems
  };
}
