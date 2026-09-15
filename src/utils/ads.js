import { Platform } from 'react-native';
import { TestIds } from './adsWrapper';

// Gerçek ID'lerinizi buraya ekleyin
const ANDROID_IDS = {
  BANNER: 'ca-app-pub-9741784434528117/8168716352',
};

const IOS_IDS = {
  BANNER: 'ca-app-pub-9741784434528117/1428260216',
};

// Platforma göre doğru ID grubunu seçer
const REAL_IDS = Platform.select({
  android: ANDROID_IDS,
  ios: IOS_IDS,
  default: ANDROID_IDS,
});

export const AD_UNIT_IDS = {
  BANNER: __DEV__ ? TestIds.ADAPTIVE_BANNER : REAL_IDS.BANNER,
};
