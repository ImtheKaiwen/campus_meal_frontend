import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';
import { getTheme } from '../utils/theme';
import { fetchMenuData, fetchDormMenuData } from '../utils/api';

export const useAppStore = create(
  persist(
    (set, get) => ({
      university: null,
      dormCity: 'KARABÜK',
      themeMode: 'light',
      language: i18n.language,
      isFirstLaunch: true,
      primaryColor: '#3A86FF',
      mainTab: 'university',
      subTab: 'daily',
      dormMealType: 'aksam',
      
      // Ad stats
      lastAdTimestamp: 0,
      pageVisitCount: 0,
      isBannerLoaded: false,
      
      // Initial colors
      colors: getTheme('light', '#3A86FF'),


      universityMenu: null,
      dormMenu: null,
      loading: false,
      refreshing: false,

      favorites: {
        university: [],
        dorm_kahvalti: [],
        dorm_aksam: []
      },

      setUniversity: (uni) => {
        set({ university: uni });
      },
      setDormCity: (city) => {
        set({ dormCity: city });
      },
      setThemeMode: (mode) => {
        set({ 
          themeMode: mode,
          colors: getTheme(mode, get().primaryColor)
        });
      },
      setLanguage: (lang) => {
        i18n.changeLanguage(lang);
        set({ language: lang });
      },
      setFirstLaunch: (status) => set({ isFirstLaunch: status }),
      setPrimaryColor: (color) => {
        set({ 
          primaryColor: color,
          colors: getTheme(get().themeMode, color)
        });
      },
      setMainTab: (tab) => set({ mainTab: tab }),
      setSubTab: (tab) => set({ subTab: tab }),
      setDormMealType: (type) => set({ dormMealType: type }),
      setRefreshing: (val) => set({ refreshing: val }),

      incrementPageVisit: () => set((state) => ({ pageVisitCount: state.pageVisitCount + 1 })),
      setIsBannerLoaded: (val) => set({ isBannerLoaded: val }),
      resetAdStats: () => set({ lastAdTimestamp: Date.now(), pageVisitCount: 0 }),

      fetchData: async (refresh = false) => {
        const { university, dormCity, mainTab } = get();
        if (refresh) set({ refreshing: true });
        else set({ loading: true });

        try {
          if (mainTab === 'university' && university) {
            const data = await fetchMenuData(university, refresh);
            set({ universityMenu: data });
          } else if (mainTab === 'dormitory' && dormCity) {
            const data = await fetchDormMenuData(dormCity, refresh);
            set({ dormMenu: data });
          }
        } catch (e) {
          // Fetch data error handled silently
        } finally {
          set({ loading: false, refreshing: false });
        }
      },

      toggleFavorite: (type, dishName) => set((state) => {
        const category = state.favorites[type] || [];
        const isFav = category.includes(dishName);
        const updated = isFav ? category.filter(d => d !== dishName) : [...category, dishName];
        return {
          favorites: {
            ...state.favorites,
            [type]: updated
          }
        };
      }),

      resetAll: async () => {
        set({
          university: null,
          dormCity: 'KARABÜK',
          themeMode: 'light',
          language: 'tr',
          isFirstLaunch: true,
          universityMenu: null,
          dormMenu: null,
          primaryColor: '#FA4A0C',
          colors: getTheme('light', '#FA4A0C'),
          favorites: {
            university: [],
            dorm_kahvalti: [],
            dorm_aksam: []
          }
        });
      },
    }),
    {
      name: 'menu-app-storage-v7', // Versiyonu artırarak temizlik yapıyoruz
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        university: state.university,
        dormCity: state.dormCity,
        themeMode: state.themeMode,
        language: state.language,
        isFirstLaunch: state.isFirstLaunch,
        primaryColor: state.primaryColor,
        favorites: state.favorites,
        lastAdTimestamp: state.lastAdTimestamp,
        pageVisitCount: state.pageVisitCount,
        // isBannerLoaded buraya EKLENMEDİ, yani her açılışta false başlayacak
      }),
      // On rehydrate, ensure colors are recalculated from persisted state
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.colors = getTheme(state.themeMode, state.primaryColor);
        }
      }
    }
  )
);