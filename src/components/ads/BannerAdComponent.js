import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize, isAdsSupported } from '../../utils/adsWrapper';
import { AD_UNIT_IDS } from '../../utils/ads';
import { useAppStore } from '../../store/useAppStore';

const BannerAdComponent = () => {
  const { setIsBannerLoaded } = useAppStore();
  const [loaded, setLoaded] = React.useState(false);

  if (!isAdsSupported) return null;

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
