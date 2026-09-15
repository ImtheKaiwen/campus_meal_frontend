import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';
import { normalizeDormData, parseMenuDate } from './helpers';
import dayjs from 'dayjs';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const DAILY_NOTIFICATION_HORIZON_DAYS = 14;
const DAILY_NOTIFICATION_KEYS = {
  university: 'daily_menu_notifications_university_v1',
  dormitory: 'daily_menu_notifications_dormitory_v1',
};

const ensureNotificationAccess = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  const status = existingStatus === 'granted'
    ? existingStatus
    : (await Notifications.requestPermissionsAsync()).status;

  if (status !== 'granted') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily-menu', {
      name: 'Günlük yemek menüsü',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 200],
      lightColor: '#4391f7',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
  return true;
};

const cleanDishName = (dish) => {
  const name = typeof dish === 'string' ? dish : (dish?.name || '');
  return name
    .replace(/\s+\d+\s*kcal\b/gi, '')
    .replace(/\s*\(\s*\d+(?:\s*,\s*\d+)*\s*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const summarizeDishes = (dishes) => {
  const names = (dishes || []).map(cleanDishName).filter(Boolean);
  const summary = names.length <= 2
    ? names.join(', ')
    : `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
  return summary.length > 140 ? `${summary.slice(0, 137).trim()}...` : summary;
};

const replaceDailyNotifications = async (storageKey, entries) => {
  const previousRaw = await AsyncStorage.getItem(storageKey);
  const previousIds = previousRaw ? JSON.parse(previousRaw) : [];
  await Promise.all(previousIds.map(id => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));

  if (!entries.length || !(await ensureNotificationAccess())) {
    await AsyncStorage.removeItem(storageKey);
    return 0;
  }

  const now = dayjs();
  const horizon = now.add(DAILY_NOTIFICATION_HORIZON_DAYS, 'day').endOf('day');
  const notificationIds = [];

  for (const entry of entries) {
    const triggerTime = entry.dateObj.hour(entry.hour).minute(0).second(0).millisecond(0);
    if (!triggerTime.isAfter(now) || triggerTime.isAfter(horizon)) continue;

    const dishes = summarizeDishes(entry.dishes);
    if (!dishes) continue;

    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: i18n.t(entry.titleKey),
          body: i18n.t('dailyMenuNotificationBody', { dishes }),
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
          data: entry.data,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.max(1, triggerTime.diff(dayjs(), 'second')),
          repeats: false,
          channelId: 'daily-menu',
        },
      });
      notificationIds.push(id);
    } catch (error) {
      if (__DEV__) console.warn('Daily menu notification could not be scheduled:', error.message);
    }
  }

  await AsyncStorage.setItem(storageKey, JSON.stringify(notificationIds));
  return notificationIds.length;
};

export const syncUniversityMenuNotifications = async (menuData, university) => {
  const entries = normalizeDormData(menuData).map(item => ({
    ...item,
    hour: 9,
    titleKey: 'universityMenuNotificationTitle',
    data: { type: 'university', university, date: item.date },
  }));
  const count = await replaceDailyNotifications(DAILY_NOTIFICATION_KEYS.university, entries);
  if (__DEV__) console.log(`[CampusMeal] Scheduled ${count} university menu notifications`);
};

export const syncDormMenuNotifications = async (menuData, city) => {
  const breakfast = normalizeDormData(menuData?.kahvalti).map(item => ({
    ...item,
    hour: 8,
    titleKey: 'dormBreakfastNotificationTitle',
    data: { type: 'dorm_breakfast', city, date: item.date },
  }));
  const dinner = normalizeDormData(menuData?.aksam).map(item => ({
    ...item,
    hour: 17,
    titleKey: 'dormDinnerNotificationTitle',
    data: { type: 'dorm_dinner', city, date: item.date },
  }));
  const count = await replaceDailyNotifications(DAILY_NOTIFICATION_KEYS.dormitory, [...breakfast, ...dinner]);
  if (__DEV__) console.log(`[CampusMeal] Scheduled ${count} dorm menu notifications for ${city}`);
};

export const toggleMenuNotification = async (dateString, dayString, dishes, setReminderMap, categoryKey = "university", silent = false) => {

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    if (!silent) alert(i18n.t('notificationError', { error: "İzin verilmedi" }));
    return;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('menu-channel', {
      name: 'Yemek Menüsü Hatırlatıcı',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 200],
      lightColor: '#4391f7',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

  try {
    const storageKey = `reminders_${categoryKey}`;
    const remindersRaw = await AsyncStorage.getItem(storageKey);
    const reminders = remindersRaw ? JSON.parse(remindersRaw) : {};

    if (reminders[dateString]) {
      await Notifications.cancelScheduledNotificationAsync(reminders[dateString]);
      delete reminders[dateString];
      if (setReminderMap) setReminderMap((prev) => ({ ...prev, [dateString]: false }));
      if (!silent) alert(`${dateString} tarihi için otomatik bildirim İPTAL edildi.`);

    } else {
      const dateObj = parseMenuDate(dateString);
      if (!dateObj.isValid()) return;

      const notificationHour = categoryKey === 'dorm_kahvalti'
        ? 8
        : categoryKey === 'dorm_aksam'
          ? 17
          : 9;
      const triggerTime = dateObj.hour(notificationHour).minute(0).second(0);
      const now = dayjs();
      const secondsToWait = triggerTime.diff(now, 'second');

      if (secondsToWait <= 0) {
        if (!silent) alert(i18n.t('pastDateError'));
        return;
      }

      const getDishName = (d) => typeof d === 'string' ? d : (d?.name || 'Günün Menüsü');
      const secondDishRaw = dishes && dishes.length > 1 ? getDishName(dishes[1]) : getDishName(dishes?.[0]);
      const secondDish = secondDishRaw.replace(/\(\s*\d+\s*\)/g, '').trim();

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "🍴 Bugün Menüde Ne Var?",
          body: `${secondDish} ve diğer lezzetler seni bekliyor!`,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsToWait,
          repeats: false,
          channelId: 'menu-channel',
        },
      });

      reminders[dateString] = notificationId;
      if (setReminderMap) setReminderMap((prev) => ({ ...prev, [dateString]: true }));

      if (!silent) {
        alert(i18n.t('notificationSuccess', {
          date: dateString,
          time: `${String(notificationHour).padStart(2, '0')}:00`,
        }));
      }

    }

    await AsyncStorage.setItem(storageKey, JSON.stringify(reminders));

  } catch (error) {
    console.error('Bildirim işleminde hata:', error);
    if (!silent) alert(i18n.t('notificationError', { error: error.message }));

  }
};

export const scheduleDishReminders = async (menuData, favoriteDishes) => {
  if (!menuData || !favoriteDishes || favoriteDishes.length === 0) return;

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  try {
    const storedDishesRaw = await AsyncStorage.getItem("dishReminders");
    const storedDishes = storedDishesRaw ? JSON.parse(storedDishesRaw) : {};

    for (const dishName in storedDishes) {
      for (const id of storedDishes[dishName]) {
        try {
          await Notifications.cancelScheduledNotificationAsync(id);
        } catch (e) {}
      }
    }

    const newReminders = {};
    const now = dayjs();

    for (const dateStr in menuData) {
      const dateObj = parseMenuDate(dateStr);
      if (!dateObj.isValid() || dateObj.isBefore(now.startOf('day'))) continue;

      const dishes = menuData[dateStr].dishes;
      if (!dishes || !Array.isArray(dishes)) continue;

      for (const dish of dishes) {
        const cleanName = dish.replace(/\(\s*\d+\s*\)/g, '').trim();

        if (favoriteDishes.includes(cleanName)) {
          if (!newReminders[cleanName]) newReminders[cleanName] = [];

          const triggerTime = dateObj.hour(9).minute(0).second(0);
          const secondsToWait = triggerTime.diff(dayjs(), 'second');
          
          if (secondsToWait > 0) {
            const id = await Notifications.scheduleNotificationAsync({
              content: {
                title: `⭐ Favori Yemeğin Çıktı!`,
                body: `Bugün menüde çok sevdiğin ${cleanName} var. Sakın kaçırma!`,
                sound: 'default',
                priority: Notifications.AndroidNotificationPriority.DEFAULT,
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: secondsToWait,
                repeats: false,
                channelId: 'menu-channel',
              },
            });
            newReminders[cleanName].push(id);
          }
        }
      }
    }

    await AsyncStorage.setItem("dishReminders", JSON.stringify(newReminders));
  } catch (e) {
    console.error("Dish reminder schedule error:", e);
  }
};

export const getReminders = async (categoryKey = "university") => {
  try {
    const storageKey = `reminders_${categoryKey}`;
    const remindersRaw = await AsyncStorage.getItem(storageKey);
    if (!remindersRaw) return [];
    
    const reminders = JSON.parse(remindersRaw);
    // Convert the object mapping { dateKey: notificationId } to an array of objects with dateKey
    return Object.keys(reminders).map(dateKey => ({
      dateKey,
      notificationId: reminders[dateKey]
    }));
  } catch (e) {
    console.error("getReminders error:", e);
    return [];
  }
};
