import React from 'react';
import { View } from 'react-native';

// Reklam modüllerini güvenli bir şekilde içe aktarmayı deneyen yardımcı
let mobileAdsOrig, BannerAdOrig, BannerAdSizeOrig, AdsConsentOrig, TestIdsOrig;

let isAdsSupported = false;

try {
  const Ads = require('react-native-google-mobile-ads');
  mobileAdsOrig = Ads.default;
  BannerAdOrig = Ads.BannerAd;
  BannerAdSizeOrig = Ads.BannerAdSize;
  AdsConsentOrig = Ads.AdsConsent;
  TestIdsOrig = Ads.TestIds;
  
  isAdsSupported = true;
} catch (e) {
  console.log('AdMob is not supported in this environment (likely Expo Go).');
  isAdsSupported = false;
}

// Boş bileşenler (Expo Go'da çökmemesi için)
const Dummy = ({ children }) => <View>{children || null}</View>;

// Export edilecek güvenli değerler
export const mobileAds = mobileAdsOrig || (() => ({ initialize: () => Promise.resolve() }));
export const BannerAd = isAdsSupported ? BannerAdOrig : Dummy;
export const BannerAdSize = isAdsSupported ? BannerAdSizeOrig : { ANCHORED_ADAPTIVE_BANNER: 'BANNER' };
export const AdsConsent = AdsConsentOrig || {
  gatherConsent: () => Promise.resolve({ canRequestAds: false }),
  showPrivacyOptionsForm: () => Promise.resolve(),
};
export const TestIds = TestIdsOrig || {
  ADAPTIVE_BANNER: 'test',
};

export { isAdsSupported };
