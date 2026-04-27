import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(customParseFormat);
dayjs.extend(isoWeek);
dayjs.locale('tr');

export const syncDayjsLocale = (lang) => {
  dayjs.locale(lang === 'tr' ? 'tr' : 'en');
};

/**
 * Parses a Turkish date string like "21 NİSAN 2026" or "1 Nisan 2026 Çarşamba"
 */
export const parseMenuDate = (dateStr) => {
  if (!dateStr) return dayjs();

  // Normalize Turkish characters for robust parsing
  let raw = dateStr.replace(/İ/g, 'i').replace(/I/g, 'ı').replace(/Ş/g, 'ş').replace(/Ç/g, 'ç').replace(/Ö/g, 'ö').replace(/Ü/g, 'ü').replace(/Ğ/g, 'ğ');
  raw = raw.toLowerCase().trim();

  // Mapping that handles both 'mayis' and 'mayıs' etc.
  const monthMap = {
    'ocak': '01', 'subat': '02', 'mart': '03', 'nisan': '04', 'mayis': '05', 'mayıs': '05', 'haziran': '06',
    'temmuz': '07', 'agustos': '08', 'eylul': '09', 'ekim': '10', 'kasim': '11', 'aralik': '12',
    'january': '01', 'february': '02', 'march': '03', 'april': '04', 'may': '05', 'june': '06',
    'july': '07', 'august': '08', 'september': '09', 'october': '10', 'november': '11', 'december': '12'
  };


  let dayNum = '01';
  let monthNum = '01';
  let year = dayjs().year().toString();

  // Extract year
  const yearMatch = raw.match(/\b20\d{2}\b/);
  if (yearMatch) year = yearMatch[0];

  // Extract day
  const dayMatch = raw.match(/\b\d{1,2}\b/);
  if (dayMatch) dayNum = dayMatch[0].padStart(2, '0');

  // Find month by checking each word against the map
  const words = raw.split(/[\s,.-]+/);
  for (const word of words) {
    // Also normalize the word for lookup (replace 'ı' with 'i' etc. to be extra safe)
    const normalizedWord = word.replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ğ/g, 'g');
    if (monthMap[word] || monthMap[normalizedWord]) {
      monthNum = monthMap[word] || monthMap[normalizedWord];
      break;
    }
  }

  const formattedStr = `${year}-${monthNum}-${dayNum}`;
  const parsed = dayjs(formattedStr, 'YYYY-MM-DD');

  // If parsing failed or result is strange, return today as fallback
  return parsed.isValid() ? parsed : dayjs();
};

export const normalizeDormData = (data) => {
  if (!data) return [];

  if (Array.isArray(data)) {
    return data.map(item => {
      const dishes = Array.isArray(item.yemekler) ? item.yemekler : (item.dishes || []);
      return {
        date: item.tarih || item.date || '',
        dateObj: parseMenuDate(item.tarih || item.date),
        day: item.day || '',
        dishes: dishes,
        kalori: item.kalori || item.calorieInfo || null
      };
    });
  }

  const keys = Object.keys(data);
  if (keys.length > 0 && /^\d/.test(keys[0])) {
    return keys.map(key => {
      const item = data[key];
      const dishes = Array.isArray(item) ? item : (item.dishes || []);
      return {
        date: key,
        dateObj: parseMenuDate(key),
        day: item.day || '',
        dishes: dishes,
        kalori: item.kalori || item.calorieInfo || null
      };
    });
  }

  return [];
};

/**
 * Groups menus by week of the month, with titles reflecting the actual date range present.
 */
export const groupMenusByWeek = (menuData) => {
  const normalized = normalizeDormData(menuData);
  if (!normalized.length) return [];

  const items = normalized.map(item => ({
    ...item,
    dateObj: item.dateObj || parseMenuDate(item.date),
  })).sort((a, b) => a.dateObj.isBefore(b.dateObj) ? -1 : 1);

  const groups = [];
  items.forEach(item => {
    const firstDayOfMonth = item.dateObj.startOf('month');
    const weekOfMonth = item.dateObj.isoWeek() - firstDayOfMonth.isoWeek() + 1;
    const displayWeek = weekOfMonth <= 0 ? 1 : weekOfMonth;

    const monthYearKey = item.dateObj.format('MMMM-YYYY');
    const groupKey = `${monthYearKey}-W${displayWeek}`;

    let group = groups.find(g => g.id === groupKey);
    if (!group) {
      group = {
        id: groupKey,
        weekNum: displayWeek,
        title: "", // Will be calculated after grouping
        data: []
      };
      groups.push(group);
    }
    group.data.push(item);
  });

  // Post-process groups to set the correct title based on actual data range
  groups.forEach(group => {
    if (group.data.length > 0) {
      const sortedData = [...group.data].sort((a, b) => a.dateObj.isBefore(b.dateObj) ? -1 : 1);
      const firstDay = sortedData[0].dateObj;
      const lastDay = sortedData[sortedData.length - 1].dateObj;

      if (firstDay.isSame(lastDay, 'day')) {
        group.title = firstDay.format('D MMMM');
      } else {
        group.title = `${firstDay.format('D MMMM')} - ${lastDay.format('D MMMM')}`;
      }
    }
  });

  return groups;
};

export const extractDishPool = (menuData, mealType = 'dinner') => {
  const pool = {
    cat1: [],
    cat2: [],
    cat3: [],
    cat4: []
  };

  const normalized = normalizeDormData(menuData);
  normalized.forEach(item => {
    const dishes = item.dishes || [];
    if (!Array.isArray(dishes)) return;

    dishes.forEach((dish, index) => {
      const s = typeof dish === 'string' ? dish : (dish.name || "");
      const clean = s.replace(/\(\s*\d+\s*\)/g, '').trim();
      if (!clean || clean === "RESMİ TATİL") return;

      if (index === 0) {
        if (!pool.cat1.includes(clean)) pool.cat1.push(clean);
      } else if (index === 1) {
        if (!pool.cat2.includes(clean)) pool.cat2.push(clean);
      } else if (index === 2) {
        if (!pool.cat3.includes(clean)) pool.cat3.push(clean);
      } else {
        if (!pool.cat4.includes(clean)) pool.cat4.push(clean);
      }
    });
  });

  return pool;
};

export const calculateTotalCalories = (dishes) => {
  if (!dishes || !Array.isArray(dishes)) return 0;
  let total = 0;
  dishes.forEach(d => {
    const s = typeof d === 'string' ? d : (d.name || "");
    const match = s.match(/\(\s*(\d+)\s*\)/);
    if (match) {
      total += parseInt(match[1]);
    }
  });
  return total;
};