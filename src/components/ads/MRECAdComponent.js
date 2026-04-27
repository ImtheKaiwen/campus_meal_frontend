import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize, isAdsSupported } from '../../utils/adsWrapper';
import { AD_UNIT_IDS } from '../../utils/ads';

const MRECAdComponent = () => {
  const [loaded, setLoaded] = React.useState(false);

  if (!isAdsSupported) return null;

  return (
    <View style={[styles.container, !loaded && { height: 0, paddingVertical: 0, overflow: 'hidden' }]}>
      <BannerAd
        unitId={AD_UNIT_IDS.BANNER} 
        size={BannerAdSize.MEDIUM_RECTANGLE}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={() => setLoaded(true)}
        onAdFailedToLoad={(error) => {
          setLoaded(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    width: '100%',
  },
});

export default MRECAdComponent;
