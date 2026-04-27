import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Platform, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useAppStore } from '../store/useAppStore';
import { getTheme } from '../utils/theme';
import MRECAdComponent from '../components/ads/MRECAdComponent';
import { useInterstitial } from '../hooks/useInterstitial';

const SettingsScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const {
    themeMode,
    primaryColor, setPrimaryColor,
    setFirstLaunch,
    incrementPageVisit,
    language,
    setLanguage,
    setThemeMode
  } = useAppStore();

  const { showAdIfReady } = useInterstitial();

  const colors = getTheme(themeMode, primaryColor);

  const toggleLanguage = () => {
    setLanguage(language === 'tr' ? 'en' : 'tr');
  };

  const toggleTheme = () => {
    setThemeMode(themeMode === 'light' ? 'dark' : 'light');
  };

  const handleResetApp = async () => {
    Alert.alert(
      t('resetApp'),
      t('resetAppDetails') || "Uygulama tamamen sıfırlanacaktır ve bildirimler iptal edilecektir. Emin misiniz?",
      [
        { text: t('back'), style: 'cancel' },
        {
          text: t('resetApp'),
          style: 'destructive',
          onPress: async () => {
            try {
              // 1. Cancel all notifications
              await Notifications.cancelAllScheduledNotificationsAsync();
              // 2. Clear all local storage
              await AsyncStorage.clear();
              // 3. Mark for fresh start
              setFirstLaunch(true);
            } catch (error) {
              console.error("Reset error:", error);
            }
          }
        }
      ]
    );
  };



  const SettingItem = ({ icon, label, value, onPress, isSwitch, switchValue, onSwitchChange, rightElement, color = null }) => (
    <TouchableOpacity
      activeOpacity={isSwitch ? 1 : 0.7}
      style={[styles.settingCard, { backgroundColor: colors.cardBackground }]}
      onPress={isSwitch ? null : onPress}
    >
      <View style={styles.settingMain}>
        <View style={[styles.iconBox, { backgroundColor: colors.iconBg }]}>
          <Feather name={icon} size={20} color={color || (themeMode === 'dark' ? '#FFF' : '#333')} />
        </View>
        <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
      </View>

      {isSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: '#D1D1D6', true: colors.primary }}
          thumbColor={Platform.OS === 'ios' ? undefined : '#FFF'}
        />
      ) : rightElement ? (
        rightElement
      ) : (
        <View style={styles.rightContainer}>
          <Text style={[styles.settingValue, { color: colors.primary }]}>{value}</Text>
          <Feather name="chevron-right" size={20} color={colors.textSecondary} />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: colors.cardBackground }]} 
            onPress={() => {
              incrementPageVisit();
              showAdIfReady();
              navigation.goBack();
            }}
          >
            <Feather name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{t('settings')}</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Kategoriler */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Genel</Text>
          <SettingItem
            icon="globe"
            label={t('language')}
            value={language.toUpperCase() === 'TR' ? 'Türkçe' : 'English'}
            onPress={toggleLanguage}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Görünüm</Text>
          <SettingItem
            icon={themeMode === 'dark' ? "moon" : "sun"}
            label={t('theme')}
            isSwitch
            switchValue={themeMode === 'dark'}
            onSwitchChange={toggleTheme}
          />

          <View style={[styles.colorSection, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.colorTitle, { color: colors.text }]}>Tema Rengi</Text>
            <View style={styles.colorGrid}>
              {['#3A86FF', '#4EA8DE', '#5390D9', '#5E60CE', '#64DFDF', '#7209B7', '#B5179E', '#F72585', '#FFCC80', '#A5D6A7'].map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[styles.colorCircle, { backgroundColor: color }, primaryColor === color && styles.selectedColorCircle]}
                  onPress={() => setPrimaryColor(color)}
                >
                  {primaryColor === color && <Feather name="check" size={16} color="#FFF" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Uygulama</Text>
          <SettingItem
            icon="refresh-ccw"
            label={t('resetApp')}
            onPress={handleResetApp}
            color={colors.text}
          />
        </View>

        <MRECAdComponent />

        <View style={styles.footer}>
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>Versiyon 1.4.2 • Premium Edition</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20, marginBottom: 10 },
  backButton: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12, marginLeft: 4 },
  settingCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 12 },
  settingMain: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  settingLabel: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  rightContainer: { flexDirection: 'row', alignItems: 'center' },
  settingValue: { fontSize: 15, fontWeight: '700', marginRight: 8 },
  footer: { marginTop: 20, alignItems: 'center' },
  colorSection: { padding: 24, borderRadius: 24, marginTop: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  colorTitle: { fontSize: 15, fontWeight: '700', marginBottom: 16 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorCircle: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  selectedColorCircle: { borderColor: '#FFF', transform: [{ scale: 1.1 }] },
  versionText: { fontSize: 13, fontWeight: '600', opacity: 0.6 }
});

export default SettingsScreen;