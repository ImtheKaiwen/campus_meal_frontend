import { Platform } from 'react-native';
import { TestIds } from './adsWrapper';

// Gerçek ID'lerinizi buraya ekleyin
const ANDROID_IDS = {
  BANNER: 'ca-app-pub-9741784434528117/8168716352',
  INTERSTITIAL: 'ca-app-pub-9741784434528117/7346589278',
  APP_OPEN: 'ca-app-pub-9741784434528117/8002774400',
  NATIVE: 'ca-app-pub-9741784434528117/1552916125',
};

const IOS_IDS = {
  BANNER: 'ca-app-pub-9741784434528117/1428260216',
  INTERSTITIAL: 'ca-app-pub-9741784434528117/4712154246',
  APP_OPEN: 'ca-app-pub-9741784434528117/3239809993',
  NATIVE: 'ca-app-pub-9741784434528117/7179055004',
};

// Platforma göre doğru ID grubunu seçer
const REAL_IDS = Platform.select({
  android: ANDROID_IDS,
  ios: IOS_IDS,
  default: ANDROID_IDS,
});

export const AD_UNIT_IDS = {
  BANNER: __DEV__ ? TestIds.ADAPTIVE_BANNER : REAL_IDS.BANNER,
  INTERSTITIAL: __DEV__ ? TestIds.INTERSTITIAL : REAL_IDS.INTERSTITIAL,
  APP_OPEN: __DEV__ ? TestIds.APP_OPEN : REAL_IDS.APP_OPEN,
  NATIVE: __DEV__ ? 'ca-app-pub-3940256099942544/2247696110' : REAL_IDS.NATIVE,
};

/**
 * Reklamın gösterilip gösterilmeyeceğini kontrol eden yardımcı fonksiyon.
 * @param {number} lastAdTimestamp - Son reklamın gösterildiği zaman (ms)
 * @param {number} pageVisitCount - Son reklamdan beri gezilen sayfa sayısı
 * @returns {boolean}
 */
export const shouldShowInterstitial = (lastAdTimestamp, pageVisitCount) => {
  const COOLDOWN_MS = 3 * 60 * 1000; // 3 dakika
  const MIN_PAGE_VISITS = 3;

  const now = Date.now();
  const timePassed = now - lastAdTimestamp;

  return timePassed >= COOLDOWN_MS && pageVisitCount >= MIN_PAGE_VISITS;
};
