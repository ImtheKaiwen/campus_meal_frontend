import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import 'dayjs/locale/en';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);
dayjs.locale('tr');

const BASE_URL = 'https://imthek4iwen-campus-meal-api.hf.space';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

export const fetchMenuData = async (university, forceRefresh = false) => {
  try {
    const currentMonth = dayjs().format('YYYY-MM');
    const cacheKey = `menu_${university}_${currentMonth}`;

    if (!forceRefresh) {
      const cachedData = await AsyncStorage.getItem(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    }

    const response = await api.get(`/menu?university=${university}`);
    const data = response.data;

    if (data && (Array.isArray(data) || Object.keys(data).length > 0)) {
      await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
      return data;
    } else {
      return null;
    }

  } catch (error) {
    return null;
  }
};

export const getTodayKey = () => {
  return dayjs().format('DD MMMM YYYY')
    .replace('i', 'İ')
    .toLocaleUpperCase('tr-TR');
};

export const fetchDormMenuData = async (city, forceRefresh = false) => {
  try {
    const currentMonth = dayjs().format('YYYY-MM');
    const cacheKey = `dorm_menu_${city}_${currentMonth}`;

    if (!forceRefresh) {
      const cachedData = await AsyncStorage.getItem(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    }

    const response = await api.get(`/kyk-menu?city=${city.toLowerCase()}`);
    const data = response.data;

    if (data && (Array.isArray(data) || Object.keys(data).length > 0)) {
      await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
      return data;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
};