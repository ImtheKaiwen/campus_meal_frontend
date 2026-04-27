import React from 'react';
import { View } from 'react-native';

// Reklam modüllerini güvenli bir şekilde içe aktarmayı deneyen yardımcı
let mobileAdsOrig, BannerAdOrig, BannerAdSizeOrig, AppOpenAdOrig, InterstitialAdOrig, AdEventTypeOrig, TestIdsOrig;
let NativeAdViewOrig, HeadlineViewOrig, TaglineViewOrig, AdvertiserViewOrig, AdBadgeOrig, CallToActionViewOrig, IconViewOrig;

let isAdsSupported = false;

try {
  const Ads = require('react-native-google-mobile-ads');
  mobileAdsOrig = Ads.default;
  BannerAdOrig = Ads.BannerAd;
  BannerAdSizeOrig = Ads.BannerAdSize;
  AppOpenAdOrig = Ads.AppOpenAd;
  InterstitialAdOrig = Ads.InterstitialAd;
  AdEventTypeOrig = Ads.AdEventType;
  TestIdsOrig = Ads.TestIds;
  
  // Native bileşenleri (Named exports oldukları için isimle alıyoruz)
  NativeAdViewOrig = Ads.NativeAdView; 
  HeadlineViewOrig = Ads.HeadlineView;
  TaglineViewOrig = Ads.TaglineView;
  AdvertiserViewOrig = Ads.AdvertiserView;
  AdBadgeOrig = Ads.AdBadge;
  CallToActionViewOrig = Ads.CallToActionView;
  IconViewOrig = Ads.IconView;
  
  isAdsSupported = true;
} catch (e) {
  console.log('AdMob is not supported in this environment (likely Expo Go).');
  isAdsSupported = false;
}

// Boş bileşenler (Expo Go'da çökmemesi için)
const Dummy = ({ children }) => <View>{children || null}</View>;

// Sahte Reklam Sınıfı
const DummyAd = {
  createForAdRequest: () => ({
    load: () => {},
    addAdEventListener: () => () => {},
    show: () => {},
  }),
};

// Export edilecek güvenli değerler
export const mobileAds = mobileAdsOrig || (() => ({ initialize: () => Promise.resolve() }));
export const BannerAd = isAdsSupported ? BannerAdOrig : Dummy;
export const BannerAdSize = isAdsSupported ? BannerAdSizeOrig : { ANCHORED_ADAPTIVE_BANNER: 'BANNER', MEDIUM_RECTANGLE: 'MEDIUM_RECTANGLE' };
export const AppOpenAd = isAdsSupported ? AppOpenAdOrig : DummyAd;
export const InterstitialAd = isAdsSupported ? InterstitialAdOrig : DummyAd;
export const AdEventType = AdEventTypeOrig || { LOADED: 'loaded', CLOSED: 'closed' };
export const TestIds = TestIdsOrig || {
  ADAPTIVE_BANNER: 'test',
  INTERSTITIAL: 'test',
  APP_OPEN: 'test',
};

export const NativeAdView = isAdsSupported ? NativeAdViewOrig : Dummy;
export const HeadlineView = isAdsSupported ? HeadlineViewOrig : Dummy;
export const TaglineView = isAdsSupported ? TaglineViewOrig : Dummy;
export const AdvertiserView = isAdsSupported ? AdvertiserViewOrig : Dummy;
export const AdBadge = isAdsSupported ? AdBadge : Dummy;
export const CallToActionView = isAdsSupported ? CallToActionViewOrig : Dummy;
export const IconView = isAdsSupported ? IconViewOrig : Dummy;

export { isAdsSupported };
