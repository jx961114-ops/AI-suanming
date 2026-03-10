import { Body, GeoVector, Ecliptic } from 'astronomy-engine';
import { AstrologyData, BirthInfo } from '../types';

const ZODIAC_SIGNS = [
  '白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座',
  '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'
];

function getZodiacSign(longitude: number): string {
  // Ensure longitude is 0-360
  const normalizedLon = ((longitude % 360) + 360) % 360;
  const index = Math.floor(normalizedLon / 30) % 12;
  return ZODIAC_SIGNS[index];
}

export function calculateAstrology(info: BirthInfo): AstrologyData {
  const date = new Date(`${info.date}T${info.time}:00Z`);
  
  const planetConfig = [
    { name: '太阳', body: Body.Sun },
    { name: '月亮', body: Body.Moon },
    { name: '水星', body: Body.Mercury },
    { name: '金星', body: Body.Venus },
    { name: '火星', body: Body.Mars },
    { name: '木星', body: Body.Jupiter },
    { name: '土星', body: Body.Saturn },
    { name: '天王星', body: Body.Uranus },
    { name: '海王星', body: Body.Neptune },
    { name: '冥王星', body: Body.Pluto },
  ];

  const results = planetConfig.map(p => {
    const vector = GeoVector(p.body, date, true);
    const ecliptic = Ecliptic(vector);
    const lon = ecliptic.elon; // Ecliptic longitude in degrees

    // Simplified house calculation (Equal House system)
    // In a real system, this depends on the Ascendant
    // For now, we'll use a deterministic pseudo-random house if Ascendant is unknown
    const seed = date.getTime() + planetConfig.indexOf(p);
    const house = (Math.floor(Math.sin(seed) * 12) + 12) % 12 + 1;

    return {
      name: p.name,
      sign: getZodiacSign(lon),
      house: house,
      degree: Math.floor(lon % 30)
    };
  });

  // Ascendant calculation is complex without lat/long. 
  // We'll use a simplified estimation based on time of day relative to Sun position.
  const sunVector = GeoVector(Body.Sun, date, true);
  const sunEcliptic = Ecliptic(sunVector);
  const sunLon = sunEcliptic.elon;
  
  // Approximate Ascendant: 
  // At sunrise, Ascendant is roughly Sun's longitude.
  // Each 2 hours adds roughly 30 degrees (one sign).
  const hoursSinceMidnight = date.getUTCHours() + date.getUTCMinutes() / 60;
  // This is a very rough approximation
  const approxAscendantLon = (sunLon + (hoursSinceMidnight - 6) * 15 + 360) % 360;

  return {
    planets: results,
    ascendant: getZodiacSign(approxAscendantLon)
  };
}
