import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize, isAdsSupported } from '../../utils/adsWrapper';
import { AD_UNIT_IDS } from '../../utils/ads';
import { useAppStore } from '../../store/useAppStore';

const BannerAdComponent = () => {
  const { isAdsReady, setIsBannerLoaded } = useAppStore();
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    return () => setIsBannerLoaded(false);
  }, [setIsBannerLoaded]);

  if (!isAdsSupported || !isAdsReady) return null;

  return (
    <View style={[styles.container, !loaded && { height: 0 }]}>
      <BannerAd
        unitId={AD_UNIT_IDS.BANNER}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={() => {
          setLoaded(true);
          setIsBannerLoaded(true);
        }}
        onAdFailedToLoad={(error) => {
          if (__DEV__) console.warn('Banner ad failed to load:', error);
          setLoaded(false);
          setIsBannerLoaded(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: 'transparent',
  },
});

export default BannerAdComponent;
