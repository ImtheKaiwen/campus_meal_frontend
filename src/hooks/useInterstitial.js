import { useEffect, useState } from 'react';
import { InterstitialAd, AdEventType, isAdsSupported } from '../utils/adsWrapper';
import { AD_UNIT_IDS, shouldShowInterstitial } from '../utils/ads';
import { useAppStore } from '../store/useAppStore';

export const useInterstitial = () => {
  const { lastAdTimestamp, pageVisitCount, resetAdStats } = useAppStore();
  const [interstitial, setInterstitial] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let ad;
    try {
      ad = InterstitialAd.createForAdRequest(AD_UNIT_IDS.INTERSTITIAL, {
        requestNonPersonalizedAdsOnly: true,
      });

      const unsubscribeLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
        setLoaded(true);
      });

      const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
        setLoaded(false);
        resetAdStats();
        // Bir sonraki reklamı önceden yükle
        ad.load();
      });

      ad.load();
      setInterstitial(ad);

      return () => {
        unsubscribeLoaded();
        unsubscribeClosed();
      };
    } catch (e) {
      console.log('Interstitial Ad not supported in this environment');
    }
  }, []);

  const showAdIfReady = () => {
    if (loaded && shouldShowInterstitial(lastAdTimestamp, pageVisitCount)) {
      interstitial.show();
      return true;
    }
    return false;
  };

  return { showAdIfReady, loaded };
};
