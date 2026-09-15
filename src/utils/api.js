import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import 'dayjs/locale/en';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);
dayjs.locale('tr');

export const API_BASE_URL = 'https://campusmeal.kaiwen.com.tr';
const CACHE_VERSION = 'v2';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

export const fetchMenuData = async (university, forceRefresh = false) => {
  const source = university.toUpperCase().replace('Ü', 'U');
  const currentMonth = dayjs().format('YYYY-MM');
  const cacheKey = `${CACHE_VERSION}_menu_${source}_${currentMonth}`;

  try {
    if (!forceRefresh) {
      const cachedData = await AsyncStorage.getItem(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    }

    const response = await api.get('/api/v1/menu', {
      params: { university: source },
    });
    const data = response.data?.data?.days;

    if (Array.isArray(data) && data.length > 0) {
      if (__DEV__) {
        console.log(`[CampusMeal] ${source}: ${data.length} days (${data[0]?.date} - ${data[data.length - 1]?.date})`);
      }
      await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
      return data;
    }
    if (__DEV__) console.warn(`[CampusMeal] ${source}: response contains no menu days`);
    return null;
  } catch (error) {
    if (__DEV__) console.warn('University menu request failed:', error.message);
    const cachedData = await AsyncStorage.getItem(cacheKey);
    return cachedData ? JSON.parse(cachedData) : null;
  }
};

export const getTodayKey = () => {
  return dayjs().format('DD MMMM YYYY')
    .replace('i', 'İ')
    .toLocaleUpperCase('tr-TR');
};

export const fetchDormMenuData = async (city, forceRefresh = false) => {
  const currentMonth = dayjs().format('YYYY-MM');
  const cacheKey = `${CACHE_VERSION}_dorm_menu_${city}_${currentMonth}`;

  try {
    if (!forceRefresh) {
      const cachedData = await AsyncStorage.getItem(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    }

    const response = await api.get('/kyk-menu', { params: { city } });
    const data = response.data;

    if (data && (Array.isArray(data) || Object.keys(data).length > 0)) {
      if (__DEV__) {
        console.log(`[CampusMeal] KYK ${city}: ${data.kahvalti?.length || 0} breakfast, ${data.aksam?.length || 0} dinner days`);
      }
      await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
      return data;
    } else {
      return null;
    }
  } catch (error) {
    if (__DEV__) console.warn('Dorm menu request failed:', error.message);
    if (error.response?.status === 404) return null;
    const cachedData = await AsyncStorage.getItem(cacheKey);
    return cachedData ? JSON.parse(cachedData) : null;
  }
};
