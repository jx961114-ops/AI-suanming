import { Solar, Lunar } from 'lunar-javascript';
import { BaziData, BirthInfo } from '../types';

export function calculateBazi(info: BirthInfo): BaziData {
  const [year, month, day] = info.date.split('-').map(Number);
  const [hour, minute] = info.time.split(':').map(Number);

  const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();
  // 使用流派1，以00:00作为日界，符合现代正常时间换日习惯
  eightChar.setSect(1);

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

  // Helper to calculate common Shen Sha
  const calculateShenSha = (pillarStem: string, pillarBranch: string, dayStem: string, dayBranch: string, yearStem: string, yearBranch: string, pillarType: 'year' | 'month' | 'day' | 'hour', pillarGanZhi: string, gender: 'male' | 'female', allBranches: string[]) => {
    const shas: string[] = [];
    
    // 1. 天乙贵人 (Tian Yi) - Based on Day Stem or Year Stem
    const tianYiMap: { [key: string]: string[] } = {
      '甲': ['丑', '未'], '戊': ['丑', '未'], '庚': ['丑', '未'],
      '乙': ['子', '申'], '己': ['子', '申'],
      '丙': ['亥', '酉'], '丁': ['亥', '酉'],
      '壬': ['卯', '巳'], '癸': ['卯', '巳'],
      '辛': ['午', '寅']
    };
    if (tianYiMap[dayStem]?.includes(pillarBranch) || tianYiMap[yearStem]?.includes(pillarBranch)) shas.push('天乙贵人');

    // 2. 太极贵人 (Tai Ji) - Based on Day Stem or Year Stem
    const taiJiMap: { [key: string]: string[] } = {
      '甲': ['子', '午'], '乙': ['子', '午'],
      '丙': ['卯', '酉'], '丁': ['卯', '酉'],
      '戊': ['辰', '戌', '丑', '未'], '己': ['辰', '戌', '丑', '未'],
      '庚': ['寅', '亥'], '辛': ['寅', '亥'],
      '壬': ['巳', '申'], '癸': ['巳', '申']
    };
    if (taiJiMap[dayStem]?.includes(pillarBranch) || taiJiMap[yearStem]?.includes(pillarBranch)) shas.push('太极贵人');

    // 3. 文昌贵人 (Wen Chang) - Based on Day Stem or Year Stem
    const wenChangMap: { [key: string]: string } = {
      '甲': '巳', '乙': '午', '丙': '申', '丁': '酉', '戊': '申', '己': '酉', '庚': '亥', '辛': '子', '壬': '寅', '癸': '卯'
    };
    if (wenChangMap[dayStem] === pillarBranch || wenChangMap[yearStem] === pillarBranch) shas.push('文昌贵人');

    // 4. 国印贵人 (Guo Yin)
    const guoYinMap: { [key: string]: string } = {
      '甲': '戌', '乙': '亥', '丙': '丑', '丁': '寅', '戊': '丑', '己': '寅', '庚': '辰', '辛': '巳', '壬': '未', '癸': '申'
    };
    if (guoYinMap[dayStem] === pillarBranch) shas.push('国印贵人');

    // 5. 禄神 (Lu Shen)
    const luMap: { [key: string]: string } = {
      '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午', '戊': '巳', '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子'
    };
    if (luMap[dayStem] === pillarBranch) shas.push('禄神');

    // 6. 羊刃 (Yang Ren)
    const yangRenMap: { [key: string]: string } = {
      '甲': '卯', '乙': '辰', '丙': '午', '丁': '未', '戊': '午', '己': '未', '庚': '酉', '辛': '戌', '壬': '子', '癸': '丑'
    };
    if (yangRenMap[dayStem] === pillarBranch) shas.push('羊刃');

    // 7. 驿马 (Yi Ma)
    const yiMaMap: { [key: string]: string } = {
      '申': '寅', '子': '寅', '辰': '寅',
      '寅': '申', '午': '申', '戌': '申',
      '巳': '亥', '酉': '亥', '丑': '亥',
      '亥': '巳', '卯': '巳', '未': '巳'
    };
    if (yiMaMap[dayBranch] === pillarBranch || yiMaMap[yearBranch] === pillarBranch) shas.push('驿马');

    // 8. 桃花 (Tao Hua)
    const taoHuaMap: { [key: string]: string } = {
      '申': '酉', '子': '酉', '辰': '酉',
      '寅': '卯', '午': '卯', '戌': '卯',
      '巳': '午', '酉': '午', '丑': '午',
      '亥': '子', '卯': '子', '未': '子'
    };
    if (taoHuaMap[dayBranch] === pillarBranch || taoHuaMap[yearBranch] === pillarBranch) shas.push('桃花');

    // 9. 华盖 (Hua Gai)
    const huaGaiMap: { [key: string]: string } = {
      '申': '辰', '子': '辰', '辰': '辰',
      '寅': '戌', '午': '戌', '戌': '戌',
      '巳': '丑', '酉': '丑', '丑': '丑',
      '亥': '未', '卯': '未', '未': '未'
    };
    if (huaGaiMap[dayBranch] === pillarBranch || huaGaiMap[yearBranch] === pillarBranch) shas.push('华盖');

    // 10. 将星 (Jiang Xing) - Strict Rule: Must have full San He Ju
    const sanHeGroups = [
      ['申', '子', '辰'],
      ['寅', '午', '戌'],
      ['巳', '酉', '丑'],
      ['亥', '卯', '未']
    ];
    const middleBranches: { [key: string]: string } = { '子': '申辰', '午': '寅戌', '酉': '巳丑', '卯': '亥未' };
    
    if (middleBranches[pillarBranch]) {
      const group = sanHeGroups.find(g => g.includes(pillarBranch))!;
      const hasFullGroup = group.every(b => allBranches.includes(b));
      if (hasFullGroup) shas.push('将星');
    }

    // 11. 劫煞 (Jie Sha)
    const jieShaMap: { [key: string]: string } = {
      '申': '巳', '子': '巳', '辰': '巳',
      '寅': '亥', '午': '亥', '戌': '亥',
      '巳': '寅', '酉': '寅', '丑': '寅',
      '亥': '申', '卯': '申', '未': '申'
    };
    if (jieShaMap[dayBranch] === pillarBranch || jieShaMap[yearBranch] === pillarBranch) shas.push('劫煞');

    // 12. 亡神 (Wang Shen)
    const wangShenMap: { [key: string]: string } = {
      '申': '亥', '子': '亥', '辰': '亥',
      '寅': '巳', '午': '巳', '戌': '巳',
      '巳': '申', '酉': '申', '丑': '申',
      '亥': '寅', '卯': '寅', '未': '寅'
    };
    if (wangShenMap[dayBranch] === pillarBranch || wangShenMap[yearBranch] === pillarBranch) shas.push('亡神');

    // 13. 孤辰 (Gu Chen) & 寡宿 (Gua Xiu)
    const guGuaMap: { [key: string]: { gu: string, gua: string } } = {
      '寅': { gu: '巳', gua: '丑' }, '卯': { gu: '巳', gua: '丑' }, '辰': { gu: '巳', gua: '丑' },
      '巳': { gu: '申', gua: '辰' }, '午': { gu: '申', gua: '辰' }, '未': { gu: '申', gua: '辰' },
      '申': { gu: '亥', gua: '未' }, '酉': { gu: '亥', gua: '未' }, '戌': { gu: '亥', gua: '未' },
      '亥': { gu: '寅', gua: '戌' }, '子': { gu: '寅', gua: '戌' }, '丑': { gu: '寅', gua: '戌' }
    };
    if (guGuaMap[yearBranch]?.gu === pillarBranch) shas.push('孤辰');
    if (guGuaMap[yearBranch]?.gua === pillarBranch) shas.push('寡宿');

    // 14. 空亡 (Kong Wang)
    const getKWFromXun = (xun: string) => {
      const xunMap: { [key: string]: string[] } = {
        '甲子': ['戌', '亥'], '甲戌': ['申', '酉'], '甲申': ['午', '未'],
        '甲午': ['辰', '巳'], '甲辰': ['寅', '卯'], '甲寅': ['子', '丑']
      };
      return xunMap[xun] || [];
    };
    const dayKW = getKWFromXun(eightChar.getDayXun());
    const yearKW = getKWFromXun(eightChar.getYearXun());
    if (dayKW.includes(pillarBranch)) shas.push('空亡(日)');
    if (yearKW.includes(pillarBranch)) shas.push('空亡(年)');

    // 15. 红鸾 (Hong Luan) & 天喜 (Tian Xi)
    const hongLuanMap: { [key: string]: string } = {
      '子': '卯', '丑': '寅', '寅': '丑', '卯': '子', '辰': '亥', '巳': '戌',
      '午': '酉', '未': '申', '申': '未', '酉': '午', '戌': '巳', '亥': '辰'
    };
    const tianXiMap: { [key: string]: string } = {
      '子': '酉', '丑': '申', '寅': '未', '卯': '午', '辰': '巳', '巳': '辰',
      '午': '卯', '未': '寅', '申': '丑', '酉': '子', '戌': '亥', '亥': '戌'
    };
    if (hongLuanMap[yearBranch] === pillarBranch) shas.push('红鸾');
    if (tianXiMap[yearBranch] === pillarBranch) shas.push('天喜');

    // 16. 福星贵人 (Fu Xing)
    const fuXingMap: { [key: string]: string[] } = {
      '甲': ['寅', '子'], '乙': ['卯', '丑'], '丙': ['寅', '子'], '丁': ['亥'],
      '戊': ['未'], '己': ['未', '酉'], '庚': ['午'], '辛': ['巳'], '壬': ['辰'], '癸': ['丑', '卯']
    };
    if (fuXingMap[dayStem]?.includes(pillarBranch) || fuXingMap[yearStem]?.includes(pillarBranch)) shas.push('福星贵人');

    // 17. 学堂 (Xue Tang) & 词馆 (Ci Guan)
    const xueTangMap: { [key: string]: string } = {
      '甲': '亥', '乙': '午', '丙': '寅', '丁': '酉', '戊': '寅', '己': '酉', '庚': '巳', '辛': '子', '壬': '申', '癸': '卯'
    };
    const ciGuanMap: { [key: string]: string } = {
      '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午', '戊': '巳', '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子'
    };
    if (xueTangMap[dayStem] === pillarBranch) shas.push('学堂');
    if (ciGuanMap[dayStem] === pillarBranch) shas.push('词馆');

    // 18. 六厄 (Liu E)
    const liuEMap: { [key: string]: string } = {
      '申': '卯', '子': '卯', '辰': '卯',
      '寅': '亥', '午': '亥', '戌': '亥',
      '亥': '午', '卯': '午', '未': '午',
      '巳': '子', '酉': '子', '丑': '子'
    };
    if (liuEMap[yearBranch] === pillarBranch) shas.push('六厄');

    // 19. 勾煞 (Gou Sha) & 绞煞 (Jiao Sha)
    const gouJiaoMap: { [key: string]: { gou: string, jiao: string } } = {
      '子': { gou: '卯', jiao: '酉' }, '丑': { gou: '辰', jiao: '戌' }, '寅': { gou: '巳', jiao: '亥' },
      '卯': { gou: '午', jiao: '子' }, '辰': { gou: '未', jiao: '丑' }, '巳': { gou: '申', jiao: '寅' },
      '午': { gou: '酉', jiao: '卯' }, '未': { gou: '戌', jiao: '辰' }, '申': { gou: '亥', jiao: '巳' },
      '酉': { gou: '子', jiao: '午' }, '戌': { gou: '丑', jiao: '未' }, '亥': { gou: '寅', jiao: '申' }
    };
    if (gouJiaoMap[yearBranch]?.gou === pillarBranch) shas.push('勾煞');
    if (gouJiaoMap[yearBranch]?.jiao === pillarBranch) shas.push('绞煞');

    // 20. 灾煞 (Zai Sha)
    const zaiShaMap: { [key: string]: string } = {
      '寅': '子', '午': '子', '戌': '子',
      '申': '午', '子': '午', '辰': '午',
      '巳': '卯', '酉': '卯', '丑': '卯',
      '亥': '酉', '卯': '酉', '未': '酉'
    };
    if (zaiShaMap[yearBranch] === pillarBranch || zaiShaMap[dayBranch] === pillarBranch) shas.push('灾煞');

    // 21. 元辰 (Yuan Chen)
    const isYang = '甲丙戊庚壬'.includes(yearStem);
    const isMale = gender === 'male';
    const yuanChenMap: { [key: string]: string } = (isYang === isMale) ? {
      '子': '未', '丑': '申', '寅': '酉', '卯': '戌', '辰': '亥', '巳': '子',
      '午': '丑', '未': '寅', '申': '卯', '酉': '辰', '戌': '巳', '亥': '午'
    } : {
      '子': '巳', '丑': '午', '寅': '未', '卯': '申', '辰': '酉', '巳': '戌',
      '午': '亥', '未': '子', '申': '丑', '酉': '寅', '戌': '卯', '亥': '辰'
    };
    if (yuanChenMap[yearBranch] === pillarBranch) shas.push('元辰');

    // 22. 天医 (Tian Yi)
    const branches = '子丑寅卯辰巳午未申酉戌亥';
    const monthBIdx = branches.indexOf(eightChar.getMonth().charAt(1));
    const tianYiBranch = branches[(monthBIdx - 1 + 12) % 12];
    if (tianYiBranch === pillarBranch) shas.push('天医');

    // 23. 金舆 (Jin Yu)
    const jinYuMap: { [key: string]: string } = {
      '甲': '辰', '乙': '巳', '丙': '未', '丁': '申', '戊': '未', '己': '申', '庚': '戌', '辛': '亥', '壬': '丑', '癸': '寅'
    };
    if (jinYuMap[dayStem] === pillarBranch) shas.push('金舆');

    // 24. 天德贵人 (Tian De) & 月德贵人 (Yue De)
    const monthBranch = eightChar.getMonth().charAt(1);
    const tianDeMap: { [key: string]: string } = {
      '寅': '丁', '卯': '申', '辰': '壬', '巳': '辛', '午': '亥', '未': '甲',
      '申': '癸', '酉': '寅', '戌': '丙', '亥': '乙', '子': '巳', '丑': '庚'
    };
    const yueDeMap: { [key: string]: string } = {
      '寅': '丙', '午': '丙', '戌': '丙',
      '亥': '甲', '卯': '甲', '未': '甲',
      '巳': '庚', '酉': '庚', '丑': '庚',
      '申': '壬', '子': '壬', '辰': '壬'
    };
    if (tianDeMap[monthBranch] === pillarStem || tianDeMap[monthBranch] === pillarBranch) shas.push('天德贵人');
    if (yueDeMap[monthBranch] === pillarStem) shas.push('月德贵人');

    // 25. 天德合 (Tian De He) & 月德合 (Yue De He)
    const tianDeHeMap: { [key: string]: string } = {
      '寅': '壬', '卯': '巳', '辰': '丁', '巳': '丙', '午': '寅', '未': '己',
      '申': '戊', '酉': '亥', '戌': '辛', '亥': '庚', '子': '申', '丑': '乙'
    };
    const yueDeHeMap: { [key: string]: string } = {
      '寅': '辛', '午': '辛', '戌': '辛',
      '亥': '己', '卯': '己', '未': '己',
      '巳': '乙', '酉': '乙', '丑': '乙',
      '申': '丁', '子': '丁', '辰': '丁'
    };
    if (tianDeHeMap[monthBranch] === pillarStem) shas.push('天德合');
    if (yueDeHeMap[monthBranch] === pillarStem) shas.push('月德合');

    // 26. 日柱特有神煞
    if (pillarType === 'day') {
      const kg = ['戊戌', '庚戌', '庚辰', '壬辰'];
      if (kg.includes(pillarGanZhi)) shas.push('魁罡');
      const yycc = ['丙子', '丁丑', '戊寅', '辛卯', '壬辰', '癸巳', '丙午', '丁未', '戊申', '辛酉', '壬戌', '癸亥'];
      if (yycc.includes(pillarGanZhi)) shas.push('阴阳差错');
      const gls = ['乙巳', '丁巳', '辛亥', '甲寅', '戊申', '壬子', '癸亥'];
      if (gls.includes(pillarGanZhi)) shas.push('孤鸾煞');
      const sedb = ['甲辰', '乙巳', '丙申', '丁亥', '戊戌', '己丑', '庚辰', '辛巳', '壬申', '癸亥'];
      if (sedb.includes(pillarGanZhi)) shas.push('十恶大败');
      const js = ['乙丑', '己巳', '癸酉'];
      if (js.includes(pillarGanZhi)) shas.push('金神');
    }

    // 过滤凶煞 (Filter out inauspicious stars)
    const badShas = [
      '羊刃', '劫煞', '亡神', '孤辰', '寡宿', '空亡(日)', '空亡(年)', 
      '六厄', '勾煞', '绞煞', '灾煞', '元辰', '阴阳差错', '孤鸾煞', '十恶大败'
    ];
    
    return shas.filter(sha => !badShas.includes(sha));
  };

  const allBranches = [yearBranch, monthBranch, dayBranch, hourBranch];

  return {
    year: { 
      stem: yearStem, 
      branch: yearBranch, 
      element: yearEl.stem,
      tenGod: eightChar.getYearShiShenGan(),
      hiddenStems: getHiddenStems(eightChar.getYearHideGan(), eightChar.getYearShiShenZhi()),
      shenSha: calculateShenSha(yearStem, yearBranch, dayStem, dayBranch, yearStem, yearBranch, 'year', yearStr, info.gender, allBranches)
    },
    month: { 
      stem: monthStem, 
      branch: monthBranch, 
      element: monthEl.stem,
      tenGod: eightChar.getMonthShiShenGan(),
      hiddenStems: getHiddenStems(eightChar.getMonthHideGan(), eightChar.getMonthShiShenZhi()),
      shenSha: calculateShenSha(monthStem, monthBranch, dayStem, dayBranch, yearStem, yearBranch, 'month', monthStr, info.gender, allBranches)
    },
    day: { 
      stem: dayStem, 
      branch: dayBranch, 
      element: dayEl.stem,
      tenGod: '日主',
      hiddenStems: getHiddenStems(eightChar.getDayHideGan(), eightChar.getDayShiShenZhi()),
      shenSha: calculateShenSha(dayStem, dayBranch, dayStem, dayBranch, yearStem, yearBranch, 'day', dayStr, info.gender, allBranches)
    },
    hour: { 
      stem: hourStem, 
      branch: hourBranch, 
      element: hourEl.stem,
      tenGod: eightChar.getTimeShiShenGan(),
      hiddenStems: getHiddenStems(eightChar.getTimeHideGan(), eightChar.getTimeShiShenZhi()),
      shenSha: calculateShenSha(hourStem, hourBranch, dayStem, dayBranch, yearStem, yearBranch, 'hour', hourStr, info.gender, allBranches)
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
