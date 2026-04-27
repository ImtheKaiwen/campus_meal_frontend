import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions,
  Platform, StatusBar, FlatList, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../store/useAppStore';
import { getTheme } from '../utils/theme';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const CITIES = [
  "Adana", "Ankara", "Antalya", "Çanakkale", "Erzurum", "Eskişehir",
  "Gaziantep", "Isparta", "İstanbul", "İzmir", "Kahramanmaraş",
  "Karabük", "Kırklareli", "Konya", "Muş", "Sakarya", "Sivas", "Trabzon"
];

const UNIVERSITIES = [
  { id: 'kbü', name: 'Karabük Üniversitesi' },
  { id: 'ktü', name: 'Karadeniz Teknik Üniversitesi' }
];

const OnboardingScreen = () => {
  const { t, i18n } = useTranslation();
  const {
    setUniversity,
    setLanguage,
    setDormCity,
    setFirstLaunch,
    themeMode,
    primaryColor
  } = useAppStore();

  const colors = getTheme(themeMode, primaryColor);

  const [step, setStep] = useState(1);
  const [selectedUni, setSelectedUni] = useState(null);
  const [selectedLang, setSelectedLang] = useState(i18n.language || 'tr');
  const [selectedCity, setSelectedCity] = useState(null);
  const [search, setSearch] = useState('');

  const handleNext = () => {
    if (step < 3) {
      setSearch('');
      setStep(step + 1);
    } else {
      finish();
    }
  };

  const handleSkip = () => {
    if (step === 2) setSelectedUni(null);
    if (step === 3) setSelectedCity(null);
    handleNext();
  };

  const finish = () => {
    setLanguage(selectedLang);
    setUniversity(selectedUni);
    setDormCity(selectedCity);
    setFirstLaunch(false);
  };

  const handleBack = () => {
    if (step > 1) {
      setSearch('');
      setStep(step - 1);
    }
  };

  const renderLanguageStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.header}>
        <Text style={[styles.stepIndicator, { color: colors.primary }]}>{t('selectLanguage')}</Text>
        <Text style={[styles.title, { color: colors.text }]}>{t('chooseLanguage')}</Text>

      </View>

      <View style={styles.cardContainer}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.selectionCard, { backgroundColor: colors.iconBg, borderColor: selectedLang === 'tr' ? colors.primary : 'rgba(255,255,255,0.05)' }]}
          onPress={() => {
            setSelectedLang('tr');
            i18n.changeLanguage('tr');
          }}
        >
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: colors.text }, selectedLang === 'tr' && { color: colors.primary }]}>Türkçe</Text>
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>{selectedLang === 'tr' ? 'Uygulamayı Türkçe kullan' : 'Use application in Turkish'}</Text>

          </View>
          {selectedLang === 'tr' && <Feather name="check-circle" size={20} color={colors.primary} />}
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.selectionCard, { backgroundColor: colors.iconBg, borderColor: selectedLang === 'en' ? colors.primary : 'rgba(255,255,255,0.05)' }]}
          onPress={() => {
            setSelectedLang('en');
            i18n.changeLanguage('en');
          }}
        >
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: colors.text }, selectedLang === 'en' && { color: colors.primary }]}>English</Text>
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>{selectedLang === 'en' ? 'Use application in English' : 'Uygulamayı İngilizce kullan'}</Text>

          </View>
          {selectedLang === 'en' && <Feather name="check-circle" size={20} color={colors.primary} />}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderUniversityStep = () => {
    const filtered = UNIVERSITIES.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));

    return (
      <View style={styles.stepContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Feather name="chevron-left" size={24} color={colors.text} />
            <Text style={[styles.backText, { color: colors.text }]}>{t('back')}</Text>
          </TouchableOpacity>
          <Text style={[styles.stepIndicator, { color: colors.primary }]}>{t('selectUniversity')}</Text>
          <Text style={[styles.title, { color: colors.text }]}>{t('selectUniversity')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('universityOptional')}</Text>
        </View>

        <View style={[styles.searchBar, { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: colors.primary }]}>
          <Feather name="search" size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
          <TextInput
            placeholder={t('searchUniversity')}
            placeholderTextColor="#999"
            style={[styles.searchInput, { color: '#333' }]}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <FlatList
          data={filtered}
          showsVerticalScrollIndicator={false}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.selectionCard, { backgroundColor: colors.iconBg, borderColor: selectedUni === item.id ? colors.primary : 'rgba(255,255,255,0.05)' }]}
              onPress={() => setSelectedUni(item.id)}
            >
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: colors.text }, selectedUni === item.id && { color: colors.primary }]}>{item.name}</Text>
              </View>
              {selectedUni === item.id && <Feather name="check-circle" size={20} color={colors.primary} />}
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  const renderCityStep = () => {
    const filtered = CITIES.filter(c => c.toLowerCase().includes(search.toLowerCase()));

    return (
      <View style={styles.stepContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Feather name="chevron-left" size={24} color={colors.text} />
            <Text style={[styles.backText, { color: colors.text }]}>{t('back')}</Text>
          </TouchableOpacity>
          <Text style={[styles.stepIndicator, { color: colors.primary }]}>{t('selectCity')}</Text>
          <Text style={[styles.title, { color: colors.text }]}>{t('selectDormCity')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('cityOptional')}</Text>
        </View>

        <View style={[styles.searchBar, { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: colors.primary }]}>
          <Feather name="search" size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
          <TextInput
            placeholder={t('searchCity')}
            placeholderTextColor="#999"
            style={[styles.searchInput, { color: '#333' }]}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <FlatList
          data={filtered}
          showsVerticalScrollIndicator={false}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.selectionCard, { backgroundColor: colors.iconBg, borderColor: selectedCity === item ? colors.primary : 'rgba(255,255,255,0.05)' }]}
              onPress={() => setSelectedCity(item)}
            >
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: colors.text }, selectedCity === item && { color: colors.primary }]}>{item}</Text>
              </View>
              {selectedCity === item && <Feather name="check-circle" size={20} color={colors.primary} />}
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  const isContinueDisabled = (step === 2 && !selectedUni) || (step === 3 && !selectedCity);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} />
      <View style={styles.content}>
        <View style={styles.progressContainer}>
          <View style={[styles.dot, { backgroundColor: step >= 1 ? colors.primary : colors.iconBg, width: step === 1 ? 30 : 16 }]} />
          <View style={[styles.dot, { backgroundColor: step >= 2 ? colors.primary : colors.iconBg, width: step === 2 ? 30 : 16 }]} />
          <View style={[styles.dot, { backgroundColor: step >= 3 ? colors.primary : colors.iconBg, width: step === 3 ? 30 : 16 }]} />
        </View>

        {step === 1 && renderLanguageStep()}
        {step === 2 && renderUniversityStep()}
        {step === 3 && renderCityStep()}

        <View style={styles.footer}>
          {step > 1 && (
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={[styles.skipText, { color: colors.textSecondary }]}>{t('skip')}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            disabled={isContinueDisabled}
            style={[
              styles.mainButton, 
              { backgroundColor: isContinueDisabled ? '#D1D1D6' : colors.primary }
            ]}
            onPress={handleNext}
          >
            <Text style={[styles.mainButtonText, { color: '#FFFFFF' }]}>{step === 3 ? t('finish') : t('next')}</Text>
            <Feather name="arrow-right" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  progressContainer: { flexDirection: 'row', marginBottom: 40, justifyContent: 'center' },
  dot: { height: 6, borderRadius: 3, marginHorizontal: 4 },
  stepContainer: { flex: 1 },
  header: { marginBottom: 24 },
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginLeft: -4 },
  backText: { fontSize: 16, marginLeft: 4 },
  stepIndicator: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', lineHeight: 32, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 8, fontWeight: '600' },
  cardContainer: { marginTop: 8 },
  selectionCard: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 22, marginBottom: 12, borderWidth: 1.5 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  cardSubtitle: { fontSize: 13 },
  searchBar: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 18, marginBottom: 20 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '700' },
  footer: { 
    paddingTop: 20, 
    paddingBottom: Platform.OS === 'ios' ? 10 : 25, 
    flexDirection: 'row', 
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)'
  },
  skipButton: { paddingHorizontal: 20, paddingVertical: 10, marginRight: 10 },
  skipText: { fontSize: 15, fontWeight: '800' },
  mainButton: { flex: 1, flexDirection: 'row', height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  mainButtonText: { fontSize: 17, fontWeight: '800' }
});

export default OnboardingScreen;