import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  RefreshControl,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from '../hooks/useTranslation';
import {
  groupMenusByWeek,
  calculateTotalCalories,
  extractDishPool,
  normalizeDormData,
  syncDayjsLocale,
  syncDayjsLocale as syncLocale
} from '../utils/helpers';
import { toggleMenuNotification, getReminders } from '../utils/notifications';
import BannerAdComponent from '../components/ads/BannerAdComponent';
import NativeAdComponent from '../components/ads/NativeAdComponent';
import MRECAdComponent from '../components/ads/MRECAdComponent';
import { useInterstitial } from '../hooks/useInterstitial';
import { isAdsSupported } from '../utils/adsWrapper';

const { width } = Dimensions.get('window');

const UNIVERSITIES = [
  { id: 'kbü', name: 'Karabük Üniversitesi' },
  { id: 'ktü', name: 'Karadeniz Teknik Üniversitesi' }
];

const CITIES = ["Adana", "Ankara", "Antalya", "Çanakkale", "Erzurum", "Eskişehir", "Gaziantep", "Isparta", "İstanbul", "İzmir", "Kahramanmaraş", "Karabük", "Kırklareli", "Konya", "Muş", "Sakarya", "Sivas", "Trabzon"];

const HomeScreen = ({ navigation }) => {
  const { t, language } = useTranslation();
  const {
    themeMode,
    colors,
    mainTab,
    setMainTab,
    subTab,
    setSubTab,
    university,
    setUniversity,
    dormCity,
    setDormCity,
    dormMealType,
    setDormMealType,
    universityMenu,
    dormMenu,
    favorites,
    toggleFavorite,
    loading: storeLoading,
    refreshing,
    setRefreshing,
    fetchData,
    incrementPageVisit,
    lastAdTimestamp,
    pageVisitCount
  } = useAppStore();
  const isBannerLoaded = useAppStore(state => state.isBannerLoaded);


  const { showAdIfReady } = useInterstitial();

  const [reminderMap, setReminderMap] = useState({});
  const [uniSearch, setUniSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [poolSearch, setPoolSearch] = useState('');
  const [poolSubTab, setPoolSubTab] = useState('dishes');
  const weeklyListRef = useRef(null);

  const dayjsToday = dayjs().startOf('day');
  const processedFavsRef = useRef({
    university: [],
    dorm_kahvalti: [],
    dorm_aksam: []
  });


  // Correct data selection
  const currentMenuData = useMemo(() => {
    if (mainTab === 'university') return universityMenu;
    return dormMenu?.[dormMealType] || [];
  }, [mainTab, universityMenu, dormMenu, dormMealType]);

  const currentType = mainTab === 'university' ? 'university' : `dorm_${dormMealType}`;

  const weeklyData = useMemo(() => groupMenusByWeek(currentMenuData), [currentMenuData, language]);
  const currentWeekIndex = useMemo(() => {
    if (!weeklyData || weeklyData.length === 0) return 0;
    const index = weeklyData.findIndex(week => 
      week.data.some(day => day.dateObj && (day.dateObj.isSame(dayjsToday, 'day') || day.dateObj.isAfter(dayjsToday, 'day')))
    );
    return index >= 0 ? index : 0;
  }, [weeklyData, dayjsToday]);

  const dishPool = useMemo(() => extractDishPool(currentMenuData, mainTab === 'dormitory' ? dormMealType : 'dinner'), [currentMenuData, mainTab, dormMealType]);
  const currentFavorites = useMemo(() => favorites[currentType] || [], [favorites, currentType]);

  useEffect(() => {
    syncDayjsLocale(language);
  }, [language]);

  useEffect(() => {
    loadReminders();
  }, [currentType]);

  useEffect(() => {
    if ((mainTab === 'university' && university) || (mainTab === 'dormitory' && dormCity)) {
      fetchData();
    }
  }, [mainTab, university, dormCity]);

  // AUTO-NOTIFICATION Side Effect: When menu data changes or a new favorite is added,
  // ensure all favorite dishes in the current menu have notifications scheduled.
  useEffect(() => {
    const handleAutoNotifications = async () => {
      if (!currentMenuData || storeLoading) return;

      const normalized = normalizeDormData(currentMenuData);
      
      // We sync all current favorites whenever the menu data is fresh or favorites change
      for (const dishName of currentFavorites) {
        const occurrences = normalized.filter(item => {
          if (!Array.isArray(item.dishes)) return false;
          // Only future dates
          if (item.dateObj && item.dateObj.isBefore(dayjsToday, 'day')) return false;
          
          return item.dishes.some(d => {
            const s = typeof d === 'string' ? d : (d.name || "");
            return s.replace(/\(\s*\d+\s*\)/g, '').trim() === dishName;
          });
        });

        for (const item of occurrences) {
          const dateKey = item.date || (item.dateObj ? item.dateObj.format('D MMMM YYYY') : "");
          if (dateKey && !reminderMap[dateKey]) {
            // SILENTLY schedule for all occurrences of favorited dishes
            await toggleMenuNotification(dateKey, item.day, item.dishes, () => {}, currentType, true);
          }
        }
      }
      loadReminders();
    };

    handleAutoNotifications();
  }, [currentFavorites, currentMenuData, currentType, storeLoading]);

  // Handle auto-scroll to current week when switching to weekly tab or data changes
  useEffect(() => {
    if (subTab === 'weekly' && weeklyData.length > 0 && weeklyListRef.current) {
      setTimeout(() => {
        weeklyListRef.current?.scrollToIndex({
          index: currentWeekIndex,
          animated: false,
        });
      }, 100);
    }
  }, [subTab, currentWeekIndex, weeklyData]);



  const loadReminders = async () => {
    try {
      const storedReminders = await getReminders(currentType);
      const map = {};
      storedReminders.forEach(r => {
        if (r && r.dateKey) map[r.dateKey] = true;
      });
      setReminderMap(map);
    } catch (e) {
      // Error loading reminders silently
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData(true);
    setRefreshing(false);
  }, [fetchData]);

  const getTodayMenu = () => {
    if (!currentMenuData) return null;
    const normalized = normalizeDormData(currentMenuData);
    return normalized.find(item => item.dateObj && item.dateObj.isSame(dayjsToday, 'day'));
  };

  const isFavorite = (dishName) => {
    const clean = (typeof dishName === 'string' ? dishName : (dishName.name || "")).replace(/\(\s*\d+\s*\)/g, '').trim();
    return currentFavorites.includes(clean);
  };

  const renderDishItem = (dish, isPoolView = false) => {
    const dishName = typeof dish === 'string' ? dish : (dish.name || "");
    const cleanName = dishName.replace(/\(\s*\d+\s*\)/g, '').trim();
    if (!cleanName) return null;
    const isFav = isFavorite(cleanName);

    if (isPoolView) {
      return (
        <TouchableOpacity
          key={cleanName}
          style={[
            styles.poolDishItem, 
            { 
              backgroundColor: isFav ? colors.primary + '10' : colors.cardBackground, 
              borderColor: isFav ? colors.primary : colors.border + '40' 
            }
          ]}
          onPress={() => toggleFavorite(currentType, cleanName)}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.poolDishText, { color: colors.text }]}>{cleanName}</Text>
          </View>
          <View style={[styles.favIconCircle, { backgroundColor: isFav ? colors.primary : colors.iconBg }]}>
            <Feather name={isFav ? "check-circle" : "plus"} size={16} color={isFav ? '#FFF' : colors.textSecondary} />
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <View
        key={cleanName}
        style={[
          styles.cardDishItem,
          { 
            backgroundColor: isFav ? colors.primary : (themeMode === 'dark' ? '#1A1A1A' : '#FFFFFF'), 
            shadowColor: '#000', 
            shadowOffset: { width: 0, height: 2 }, 
            shadowOpacity: 0.05, 
            shadowRadius: 5, 
            elevation: 2 
          }
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={[styles.dishDot, { backgroundColor: isFav ? '#FFFFFF' : colors.textSecondary + '20' }]} />
          <Text style={[styles.cardDishText, { color: isFav ? '#FFFFFF' : colors.text, fontWeight: '700' }]}>
            {cleanName}
          </Text>
        </View>
      </View>
    );
  };

  const renderDayCard = (dayItem) => {
    if (!dayItem) return null;
    const dateKey = dayItem.date || (dayItem.dateObj ? dayItem.dateObj.format('D MMMM YYYY') : 'unknown');
    const isAlarmActive = !!reminderMap[dateKey];
    const isFuture = dayItem.dateObj ? dayItem.dateObj.isAfter(dayjsToday, 'day') : false;

    return (
      <View key={dateKey} style={[styles.dayCard, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '20' }]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardDateLabel, { color: colors.textSecondary }]}>
              {dayItem.dateObj ? dayItem.dateObj.format('D MMMM YYYY').toUpperCase() : dateKey.toUpperCase()}
            </Text>
            <Text style={[styles.cardDayLabel, { color: colors.text }]}>
              {dayItem.dateObj ? dayItem.dateObj.format('dddd') : (dayItem.day || '---')}
            </Text>
          </View>
          {isFuture && (
            <TouchableOpacity
              onPress={async () => {
                await toggleMenuNotification(dateKey, dayItem.day, dayItem.dishes, () => { }, currentType);
                loadReminders();
              }}
              style={[styles.cardBell, { backgroundColor: isAlarmActive ? colors.primary : '#FFFFFF' }]}
            >
              <Feather name="bell" size={22} color={isAlarmActive ? '#FFFFFF' : colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.cardMenuList}>
          {Array.isArray(dayItem.dishes) && dayItem.dishes.includes("RESMİ TATİL") ? (
            <View style={styles.holidayBox}>
              <Feather name="calendar" size={40} color={colors.primary + '40'} style={{ marginBottom: 12 }} />
              <Text style={{ color: colors.textSecondary, fontWeight: '800', fontSize: 16 }}>{t('holiday') || 'RESMİ TATİL'}</Text>
            </View>
          ) : (
            Array.isArray(dayItem.dishes) && dayItem.dishes.length > 0 ? (
              dayItem.dishes.map((d, i) => renderDishItem(d, false))
            ) : (
              <Text style={{ color: colors.textSecondary, textAlign: 'center', paddingVertical: 20 }}>{t('noMenu')}</Text>
            )
          )}
        </View>

        {Array.isArray(dayItem.dishes) && dayItem.dishes.length > 0 && !dayItem.dishes.includes("RESMİ TATİL") && (
          <View style={[styles.cardFooter, { borderTopColor: colors.border + '15' }]}>
            <View style={[styles.calorieBadge, { backgroundColor: '#FFFFFF' }]}>
              <Feather name="zap" size={14} color={colors.primary} />
              <Text style={[styles.calorieText, { color: colors.primary }]}>
                {dayItem.kalori || dayItem.calorieInfo || `${calculateTotalCalories(dayItem.dishes)} kcal`}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderDaily = () => {
    const today = getTodayMenu();
    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 10, paddingBottom: 150 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
      >
        {today ? (
            <View>
              <MRECAdComponent />
              {renderDayCard(today)}
              <NativeAdComponent />
            </View>
        ) : (
          storeLoading ? (
            <View style={styles.centerContent}>
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          ) : (
            <View style={styles.centerContent}>
              <Feather name="slash" size={50} color={colors.textSecondary + '20'} />
              <Text style={{ color: colors.textSecondary, marginTop: 12, fontWeight: '800' }}>{t('noMenu')}</Text>
              <TouchableOpacity onPress={onRefresh} style={[styles.retryBtn, { backgroundColor: colors.primary }]}>
                <Text style={{ color: '#FFF', fontWeight: '900' }}>{t('retry')}</Text>
              </TouchableOpacity>

            </View>
          )
        )}
      </ScrollView>
    );
  };

  const renderWeekly = () => (
    <FlatList
      ref={weeklyListRef}
      key={`${currentType}-weekly`}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      data={weeklyData}
      keyExtractor={item => item.id}
      initialScrollIndex={currentWeekIndex}
      onScrollToIndexFailed={(info) => {
        const wait = new Promise(resolve => setTimeout(resolve, 500));
        wait.then(() => {
          weeklyListRef.current?.scrollToIndex({ index: info.index, animated: false });
        });
      }}
      getItemLayout={(data, index) => ({
        length: width,
        offset: width * index,
        index,
      })}
      snapToAlignment="start"
      snapToInterval={width}
      decelerationRate="fast"
      renderItem={({ item, index }) => (
        <View style={{ width: width }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 10, paddingBottom: 150 }}
          >
            <View style={styles.weekHeader}>
              <View style={[styles.weekRangeBadge, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
                <Text style={[styles.weekRangeLabel, { color: colors.primary }]}>
                  {item.title}
                </Text>
              </View>
            </View>
            {item.data.map((d, i) => (
              <View key={i}>
                {i === 0 && <MRECAdComponent />}
                {renderDayCard(d)}
                {i === 2 && <NativeAdComponent />}
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    />
  );

  const renderPool = () => {
    const categories = mainTab === 'dormitory' && dormMealType === 'kahvalti'
      ? [{ key: 'cat1', label: 'breakfastMain' }, { key: 'cat2', label: 'breakfastSide' }, { key: 'cat3', label: 'breakfastVeg' }, { key: 'cat4', label: 'breakfastOther' }]
      : [{ key: 'cat1', label: 'soup' }, { key: 'cat2', label: 'mainDish' }, { key: 'cat3', label: 'sideDish' }, { key: 'cat4', label: 'other' }];

    return (
      <View style={{ flex: 1 }}>
        <View style={[styles.poolSubSwitcher, { backgroundColor: colors.iconBg }]}>
          <TouchableOpacity onPress={() => setPoolSubTab('dishes')} style={[styles.poolSubBtn, poolSubTab === 'dishes' && { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.poolSubText, { color: poolSubTab === 'dishes' ? colors.primary : colors.textSecondary }]}>{t('dishes')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setPoolSubTab('favorites')} style={[styles.poolSubBtn, poolSubTab === 'favorites' && { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.poolSubText, { color: poolSubTab === 'favorites' ? colors.primary : colors.textSecondary }]}>{t('notifications')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.poolHeader}>
          <View style={[styles.infoBox, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '20' }]}>
            <Feather name="info" size={14} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.primary }]}>
              {t('poolInfoText')}
            </Text>

          </View>
          <View style={[styles.searchBar, { backgroundColor: '#FFFFFF', borderColor: colors.primary, marginBottom: 20 }]}>
            <Feather name="search" size={18} color={colors.textSecondary} />
            <TextInput
              placeholder={t('searchDish')}
              placeholderTextColor="#999"
              style={[styles.poolSearchInput, { color: '#333' }]}
              value={poolSearch}
              onChangeText={setPoolSearch}
            />
          </View>
        </View>


        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 150 }}>
          {categories.map((cat, idx) => {
            let items = dishPool[cat.key].filter(d => d.toLowerCase().includes(poolSearch.toLowerCase()));
            if (poolSubTab === 'favorites') {
              items = items.filter(d => currentFavorites.includes(d));
            }
            if (!items.length) return null;
            return (
              <View key={cat.key} style={{ marginBottom: 24 }}>
                <Text style={[styles.poolCatTitle, { color: colors.textSecondary }]}>{t(cat.label)}</Text>
                {items.map(d => renderDishItem(d, true))}
                {idx === 0 && <NativeAdComponent />}
                {idx === 1 && <MRECAdComponent />}
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderSelection = (type) => {
    const isUni = type === 'university';
    const data = isUni ? UNIVERSITIES : CITIES;
    const search = isUni ? uniSearch : citySearch;
    const setSearch = isUni ? setUniSearch : setCitySearch;
    const setAction = isUni ? setUniversity : setDormCity;

    return (
      <View style={styles.selectionView}>
        <Text style={[styles.selectionTitle, { color: colors.text }]}>
          {isUni ? t('selectUniversity') : t('selectCity')}
        </Text>
        <View style={[styles.searchBar, { backgroundColor: '#FFFFFF', borderColor: colors.primary, marginBottom: 20 }]}>
          <Feather name="map-pin" size={18} color={colors.primary} />
          <TextInput 
            placeholder={isUni ? t('searchUniversity') : t('searchCity')} 
            placeholderTextColor="#999" 
            style={[styles.poolSearchInput, { color: '#333' }]} 
            value={search} 
            onChangeText={setSearch} 
          />
        </View>

        <FlatList 
          data={data.filter(item => (isUni ? item.name : item).toLowerCase().includes(search.toLowerCase()))} 
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => {
            const label = isUni ? item.name : item;
            const id = isUni ? item.id : item;
            return (
              <TouchableOpacity 
                style={[styles.cityItem, { backgroundColor: colors.cardBackground, borderColor: colors.border + '20' }]} 
                onPress={() => setAction(id)}
              >
                <Text style={[styles.cityItemText, { color: colors.text }]}>{label}</Text>
                <Feather name="chevron-right" size={16} color={colors.primary} />
              </TouchableOpacity>
            );
          }} 
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {mainTab === 'university' ? t('university') : t('dormitory')}
          </Text>

          <TouchableOpacity 
            onPress={() => (mainTab === 'university' ? setUniversity(null) : setDormCity(null))}
            style={styles.headerSubtitleRow}
          >
            <Feather name="map-pin" size={14} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {mainTab === 'university' ? (university ? university.toUpperCase() : '---') : (dormCity ? dormCity.toUpperCase() : '---')}
            </Text>
            <Feather name="edit-2" size={11} color={colors.primary} style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={[styles.settingsBtn, { backgroundColor: colors.cardBackground }]} 
          onPress={() => navigation.navigate('Settings')}
        >
          <Feather name="settings" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        {(mainTab === 'university' && !university) ? renderSelection('university') :
          (mainTab === 'dormitory' && !dormCity) ? renderSelection('dormitory') : (
            <View style={{ flex: 1 }}>
              {mainTab === 'dormitory' && (
                <View style={[styles.tierSwitcher, { backgroundColor: colors.iconBg }]}>
                  <TouchableOpacity onPress={() => setDormMealType('kahvalti')} style={[styles.tierBtn, dormMealType === 'kahvalti' && { backgroundColor: colors.cardBackground }]}>
                    <Text style={[styles.tierText, { color: dormMealType === 'kahvalti' ? colors.primary : colors.textSecondary }]}>{t('breakfast')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setDormMealType('aksam')} style={[styles.tierBtn, dormMealType === 'aksam' && { backgroundColor: colors.cardBackground }]}>
                    <Text style={[styles.tierText, { color: dormMealType === 'aksam' ? colors.primary : colors.textSecondary }]}>{t('dinner')}</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={[styles.subTabSwitcher, { backgroundColor: colors.iconBg }]}>
                {['daily', 'weekly', 'pool'].map(key => (
                  <TouchableOpacity 
                    key={key} 
                    onPress={() => {
                      incrementPageVisit();
                      showAdIfReady();
                      setSubTab(key);
                    }} 
                    style={[styles.subTabBtn, subTab === key && { backgroundColor: colors.primary }]}
                  >
                    <Text style={[styles.subTabText, { color: subTab === key ? '#FFF' : colors.textSecondary }]}>{t(key)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {subTab === 'daily' ? renderDaily() : subTab === 'weekly' ? renderWeekly() : renderPool()}
            </View>
          )}
      </View>

      <View style={[styles.floatingNavContainer, { bottom: isBannerLoaded ? 85 : 35 }]}>
        <View style={[styles.floatingNav, { backgroundColor: themeMode === 'dark' ? '#1C1C1E' : '#FFFFFF', shadowColor: '#000' }]}>


          <TouchableOpacity 
            style={[styles.navItem, mainTab === 'university' && { backgroundColor: colors.primary + '10' }]} 
            onPress={() => {
              incrementPageVisit();
              showAdIfReady();
              setMainTab('university');
            }}
          >
            <Feather name="book-open" size={18} color={mainTab === 'university' ? colors.primary : colors.textSecondary} />
            <Text style={[styles.navLabel, { color: mainTab === 'university' ? colors.primary : colors.textSecondary }]}>{t('university')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.navItem, mainTab === 'dormitory' && { backgroundColor: colors.primary + '10' }]} 
            onPress={() => {
              incrementPageVisit();
              showAdIfReady();
              setMainTab('dormitory');
            }}
          >
            <Feather name="home" size={18} color={mainTab === 'dormitory' ? colors.primary : colors.textSecondary} />
            <Text style={[styles.navLabel, { color: mainTab === 'dormitory' ? colors.primary : colors.textSecondary }]}>{t('dormitory')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.adContainer}>
        <BannerAdComponent />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 15 },
  headerTitle: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  headerSubtitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  headerSubtitle: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  settingsBtn: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },

  tierSwitcher: { flexDirection: 'row', marginHorizontal: 24, padding: 4, borderRadius: 16, marginBottom: 12 },
  tierBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  tierText: { fontSize: 13, fontWeight: '900' },

  subTabSwitcher: { flexDirection: 'row', marginHorizontal: 24, padding: 4, borderRadius: 16, marginBottom: 20 },
  subTabBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  subTabText: { fontSize: 13, fontWeight: '900' },

  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
  retryBtn: { marginTop: 20, paddingHorizontal: 25, paddingVertical: 12, borderRadius: 14 },

  weekHeader: { 
    paddingVertical: 10, 
    alignItems: 'center', 
    marginBottom: 20 
  },
  weekRangeBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1.5,
  },
  weekRangeLabel: { 
    fontSize: 15, 
    fontWeight: '900', 
    letterSpacing: -0.2
  },

  dayCard: { borderRadius: 35, padding: 25, marginBottom: 25, borderWidth: 0 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25 },
  cardDateLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  cardDayLabel: { fontSize: 40, fontWeight: '900', letterSpacing: -1.5, marginTop: 2 },
  cardBell: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },

  cardMenuList: { gap: 10 },
  cardDishItem: { padding: 18, borderRadius: 25, flexDirection: 'row', alignItems: 'center' },
  cardDishText: { fontSize: 16, flex: 1 },
  dishDot: { width: 6, height: 6, borderRadius: 3, marginRight: 12 },

  cardFooter: { borderTopWidth: 1, marginTop: 25, paddingTop: 15 },
  calorieBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, gap: 6 },
  calorieText: { fontSize: 13, fontWeight: '900' },

  poolHeader: { paddingHorizontal: 24, marginBottom: 15 },
  infoBox: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, marginBottom: 15, borderWidth: 1, gap: 10 },
  infoText: { fontSize: 12, fontWeight: '700', flex: 1, lineHeight: 16 },

  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 56, borderRadius: 20, borderWidth: 1.5, gap: 10 },
  poolSearchInput: { flex: 1, fontSize: 15, fontWeight: '800' },
  
  poolSubSwitcher: { flexDirection: 'row', marginHorizontal: 24, padding: 4, borderRadius: 16, marginBottom: 20 },
  poolSubBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  poolSubText: { fontSize: 13, fontWeight: '900' },
  
  poolCatTitle: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12, marginLeft: 5 },
  poolDishItem: { padding: 18, borderRadius: 25, flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1.5 },
  poolDishText: { fontSize: 16, fontWeight: '900' },
  favIconCircle: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },

  selectionView: { flex: 1, paddingHorizontal: 24 },
  selectionTitle: { fontSize: 26, fontWeight: '900', marginBottom: 20, marginLeft: 5 },
  cityItem: { padding: 22, borderRadius: 22, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1 },
  cityItemText: { fontSize: 16, fontWeight: '900' },

  floatingNavContainer: { 
    position: 'absolute', 
    left: 0, 
    right: 0, 
    alignItems: 'center',
    zIndex: 10
  },
  adContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    alignItems: 'center'
  },
  floatingNav: { 
    flexDirection: 'row', 
    width: width * 0.88, 
    padding: 6, 
    borderRadius: 30, 
    elevation: 10, 
    shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 15 
  },
  navItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 25 },
  navLabel: { fontSize: 13, fontWeight: '900', marginLeft: 10 },

  holidayBox: { paddingVertical: 40, alignItems: 'center' }
});

export default HomeScreen;