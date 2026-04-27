import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import AppNavigator from './src/navigation/AppNavigator';
import { AD_UNIT_IDS } from './src/utils/ads';
import { mobileAds, AppOpenAd, AdEventType, isAdsSupported } from './src/utils/adsWrapper';

// i18n dosyamızı en tepede çağırıyoruz ki dil ayarları yüklensin
import './src/i18n';

export default function App() {
  useEffect(() => {
    const initializeAds = async () => {
      try {
        // iOS için ATT izin isteği
        const { status } = await requestTrackingPermissionsAsync();

        // AdMob SDK'yı başlat (Expo Go'da çökmemesi için kontrol ekliyoruz)
        if (mobileAds && typeof mobileAds === 'function') {
          const ads = mobileAds();
          
          // Test cihazlarını buraya ekleyebilirsiniz (Konsoldaki 'Test Device ID'yi buraya yazın)
          await ads.setRequestConfiguration({
            testDeviceIdentifiers: [
              'EMULATOR',
              '8F01B083-7FE1-4374-8DD7-0239AC4FFCF1', // iOS Cihazı
              'd49cf9c8-6551-42c2-9951-6107acfd958a', // Android Cihazı
            ],
          });
          
          await ads.initialize();
        }

        // App Open Ad hazırlığı
        try {
          const appOpenAd = AppOpenAd.createForAdRequest(AD_UNIT_IDS.APP_OPEN, {
            requestNonPersonalizedAdsOnly: true,
          });

          appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
            appOpenAd.show();
          });

          appOpenAd.load();
        } catch (adError) {
          console.log('App Open Ad initialization skipped (likely Expo Go)');
        }
      } catch (error) {
        console.log('Ads initialization skipped or failed:', error.message);
      }
    };

    initializeAds();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// Small change to trigger bundler refresh