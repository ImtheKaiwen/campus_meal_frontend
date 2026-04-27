import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';
import { parseMenuDate } from './helpers';
import dayjs from 'dayjs';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

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
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4391f7',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
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

      // Hedef zaman ile şu an arasındaki saniyeyi hesapla (Örn: Sabah 08:30)
      const triggerTime = dateObj.hour(8).minute(30).second(0);
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
          priority: Notifications.AndroidNotificationPriority.MAX,
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

      if (!silent) alert(i18n.t('notificationSuccess', { date: dateString }));

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
                priority: Notifications.AndroidNotificationPriority.MAX,
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