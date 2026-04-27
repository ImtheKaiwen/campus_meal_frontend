import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../store/useAppStore';
import { LightTheme, DarkTheme, Typography } from '../utils/theme';
import { fetchMenuData } from '../utils/api';

const DeveloperScreen = () => {
  const navigation = useNavigation();
  const themeMode = useAppStore((state) => state.themeMode);
  const university = useAppStore((state) => state.university);
  const colors = themeMode === 'dark' ? DarkTheme : LightTheme;

  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(false);

  const performNotificationConfig = async (triggerConfig, label) => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        alert('İzin verilmedi!');
        return;
      }
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🛠 Test: ${label}`,
          body: 'Bu bildirim 5 saniye sonrası için ayarlandı.',
          sound: true,
        },
        trigger: triggerConfig,
      });
      alert(`[${label}] başarılı! 5 saniye bekleyin.`);
    } catch (e) {
      alert(`Hata [${label}]: ` + e.message);
    }
  };

  const timerDate = new Date(Date.now() + 5000);
  const handleTest1 = () => performNotificationConfig({ type: 'timeInterval', seconds: 5, channelId: 'menu-channel' }, "timeInterval");
  const handleTest2 = () => performNotificationConfig({ type: 'calendar', year: timerDate.getFullYear(), month: timerDate.getMonth() + 1, day: timerDate.getDate(), hour: timerDate.getHours(), minute: timerDate.getMinutes(), second: timerDate.getSeconds(), channelId: 'menu-channel' }, "calendar (5s)");
  const handleTest3 = () => performNotificationConfig({ date: timerDate, channelId: 'menu-channel' }, "Native Wrap");

  const handleFetchData = async () => {
    setLoading(true);
    const data = await fetchMenuData(university);
    setApiData(data);
    setLoading(false);
  };

  const handleCheckScheduled = async () => {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    alert(`Bekleyen bildirim sayısı: ${scheduled.length}`);
  };

  const handleCancelAll = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    alert('Tüm bekleyen bildirimler iptal edildi!');
  };

  const handleClearCache = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const menuKeys = keys.filter(k => k.startsWith('menu_') && k !== 'menu-app-storage');
      await AsyncStorage.multiRemove(menuKeys);
      alert('Tüm kaydedilmiş menü verileri temizlendi!');
    } catch (e) {
      alert('Hata: ' + e.message);
    }
  };

  const DevCard = ({ icon, label, onPress, color = colors.primary, sublabel }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[styles.card, { backgroundColor: colors.cardBackground }]}
      onPress={onPress}
    >
      <View style={[styles.iconBox, { backgroundColor: colors.iconBg }]}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.cardLabel, { color: colors.text }]}>{label}</Text>
        {sublabel && <Text style={[styles.cardSublabel, { color: colors.textSecondary }]}>{sublabel}</Text>}
      </View>
      <Feather name="chevron-right" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} />

      <View style={styles.header}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.cardBackground }]} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Geliştirici Araçları</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Bildirim Testleri</Text>
          <DevCard icon="clock" label="Test 1 (5 Saniye)" sublabel="timeInterval tetikleyicisi" onPress={handleTest1} />
          <DevCard icon="calendar" label="Test 2 (Takvim)" sublabel="calendar tetikleyicisi" onPress={handleTest2} />
          <DevCard icon="zap" label="Test 3 (Native)" sublabel="date objesi" onPress={handleTest3} />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Yönetim</Text>
          <DevCard icon="search" label="Planlananları Gör" onPress={handleCheckScheduled} />
          <DevCard icon="trash-2" label="Tümünü İptal Et" color="#FF3B30" onPress={handleCancelAll} />
          <DevCard icon="database" label="Önbelleği Temizle" onPress={handleClearCache} />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>API Testi ({university.toUpperCase()})</Text>
          <TouchableOpacity
            style={[styles.apiBtn, { backgroundColor: colors.primary }]}
            onPress={handleFetchData}
          >
            <Feather name={loading ? "loader" : "cloud-lightning"} size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.apiBtnText}>Veriyi Çek & Göster</Text>
          </TouchableOpacity>

          {loading && <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />}

          {apiData && !loading && (
            <View style={[styles.jsonContainer, { backgroundColor: colors.cardBackground }]}>
              <Text style={[styles.jsonTitle, { color: colors.textSecondary }]}>API Response (İlk 10):</Text>
              <Text style={[styles.jsonText, { color: colors.text }]}>
                {JSON.stringify(
                  Object.entries(apiData).slice(0, 10).reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}),
                  null, 2
                )}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000'
  },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    marginBottom: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#1C1C1E',
    marginBottom: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2
  },
  cardSublabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    opacity: 0.8
  },
  apiBtn: {
    flexDirection: 'row',
    height: 58,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  apiBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700'
  },
  jsonContainer: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#1C1C1E',
    marginTop: 20,
  },
  jsonTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase'
  },
  jsonText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
  }
});

export default DeveloperScreen;