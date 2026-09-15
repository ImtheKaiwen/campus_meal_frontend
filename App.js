import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { mobileAds, AdsConsent, isAdsSupported } from './src/utils/adsWrapper';
import { useAppStore } from './src/store/useAppStore';
import { fetchDormMenuData, fetchMenuData } from './src/utils/api';
import { syncDormMenuNotifications, syncUniversityMenuNotifications } from './src/utils/notifications';

// i18n dosyamızı en tepede çağırıyoruz ki dil ayarları yüklensin
import './src/i18n';

export default function App() {
  const setIsAdsReady = useAppStore(state => state.setIsAdsReady);
  const setIsPrivacyOptionsRequired = useAppStore(state => state.setIsPrivacyOptionsRequired);
  const university = useAppStore(state => state.university);
  const dormCity = useAppStore(state => state.dormCity);
  const isFirstLaunch = useAppStore(state => state.isFirstLaunch);

  useEffect(() => {
    const initializeAds = async () => {
      if (!isAdsSupported) return;

      try {
        const consent = await AdsConsent.gatherConsent({
          tagForUnderAgeOfConsent: false,
        });
        setIsPrivacyOptionsRequired(consent.privacyOptionsRequirementStatus === 'REQUIRED');
        if (!consent.canRequestAds) return;

        const ads = mobileAds();
        if (__DEV__) {
          await ads.setRequestConfiguration({
            testDeviceIdentifiers: ['EMULATOR'],
          });
        }
        await ads.initialize();
        setIsAdsReady(true);
      } catch (error) {
        if (__DEV__) console.warn('Ads initialization failed:', error.message);
      }
    };

    initializeAds();
  }, [setIsAdsReady, setIsPrivacyOptionsRequired]);

  useEffect(() => {
    if (isFirstLaunch) return;

    const syncNotifications = async () => {
      const jobs = university
        ? [fetchMenuData(university).then(data => syncUniversityMenuNotifications(data, university))]
        : [syncUniversityMenuNotifications(null, null)];

      jobs.push(
        dormCity
          ? fetchDormMenuData(dormCity).then(data => syncDormMenuNotifications(data, dormCity))
          : syncDormMenuNotifications(null, null)
      );

      const results = await Promise.allSettled(jobs);
      if (__DEV__) {
        results.filter(result => result.status === 'rejected').forEach(result => {
          console.warn('Notification sync failed:', result.reason?.message || result.reason);
        });
      }
    };

    syncNotifications();
  }, [dormCity, isFirstLaunch, university]);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
