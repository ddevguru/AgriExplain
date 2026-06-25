// Internationalization (i18n) System
// Supports: English (en), Hindi (hi), Marathi (mr)

export type Language = 'en' | 'hi' | 'mr';

export interface Translations {
  // Common
  common: {
    refresh: string
    loading: string
    error: string
    success: string
    cancel: string
    save: string
    delete: string
    edit: string
    view: string
    close: string
    back: string
    next: string
    search: string
    filter: string
    export: string
    import: string
    download: string
    upload: string
  }
  
  // Dashboard
  dashboard: {
    title: string
    welcome: string
    farmOverview: string
    sensorData: string
    predictions: string
    historicalData: string
    modelComparison: string
    advisories: string
    weather: string
    thermalCamera: string
    plantDiagnosis: string
  }
  
  // Sensors
  sensors: {
    temperature: string
    humidity: string
    soilMoisture: string
    ph: string
    rainfall: string
    waterFlow: string
    lightIntensity: string
    waterLevel: string
    npk: string
    nitrogen: string
    phosphorus: string
    potassium: string
  }
  
  // Predictions
  predictions: {
    yieldForecast: string
    confidence: string
    uncertainty: string
    riskLevel: string
    high: string
    medium: string
    low: string
    modelAccuracy: string
  }
  
  // Crops
  crops: {
    rice: string
    wheat: string
    maize: string
    cotton: string
    tomato: string
    sugarcane: string
    potato: string
    onion: string
    banana: string
    mango: string
    chickpea: string
    soybean: string
    groundnut: string
    turmeric: string
    chili: string
    brinjal: string
    cabbage: string
    cauliflower: string
    okra: string
    cucumber: string
    watermelon: string
    pomegranate: string
    grapes: string
    apple: string
    orange: string
    lemon: string
  }
  
  // Navigation
  nav: {
    dashboard: string
    sensors: string
    predictions: string
    farms: string
    users: string
    reports: string
    settings: string
    logout: string
    login: string
    signup: string
  }
  
  // Actions
  actions: {
    selectCrop: string
    selectTimeRange: string
    refreshData: string
    exportData: string
    viewDetails: string
    scanPlant: string
    captureImage: string
  }
  
  // Status
  status: {
    healthy: string
    monitoring: string
    disease: string
    pest: string
    nutrientDeficiency: string
    optimal: string
    warning: string
    critical: string
  }
  
  // Thermal Camera
  thermal: {
    liveView: string
    staticView: string
    cameraStream: string
    plantDiagnosis: string
    confidence: string
    detectedIssues: string
    recommendations: string
    temperatureZones: string
    minTemp: string
    maxTemp: string
    avgTemp: string
    hotSpots: string
  }
  
  // Time ranges
  timeRange: {
    last7Days: string
    last30Days: string
    last90Days: string
    lastYear: string
  }
  
  // Units
  units: {
    celsius: string
    percent: string
    mm: string
    lpm: string // liters per minute
    lux: string
    cm: string
    kg: string
  }
}

const translations: Record<Language, Translations> = {
  en: {
    common: {
      refresh: 'Refresh',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      search: 'Search',
      filter: 'Filter',
      export: 'Export',
      import: 'Import',
      download: 'Download',
      upload: 'Upload',
    },
    dashboard: {
      title: 'Dashboard',
      welcome: 'Welcome',
      farmOverview: 'Farm Overview',
      sensorData: 'Sensor Data',
      predictions: 'Predictions',
      historicalData: 'Historical Data',
      modelComparison: 'Model Comparison',
      advisories: 'Advisories',
      weather: 'Weather',
      thermalCamera: 'Thermal Camera View',
      plantDiagnosis: 'Plant Diagnosis',
    },
    sensors: {
      temperature: 'Temperature',
      humidity: 'Humidity',
      soilMoisture: 'Soil Moisture',
      ph: 'pH',
      rainfall: 'Rainfall',
      waterFlow: 'Water Flow',
      lightIntensity: 'Light Intensity',
      waterLevel: 'Water Level',
      npk: 'NPK',
      nitrogen: 'Nitrogen',
      phosphorus: 'Phosphorus',
      potassium: 'Potassium',
    },
    predictions: {
      yieldForecast: 'Yield Forecast',
      confidence: 'Confidence',
      uncertainty: 'Uncertainty',
      riskLevel: 'Risk Level',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      modelAccuracy: 'Model Accuracy',
    },
    crops: {
      rice: 'Rice',
      wheat: 'Wheat',
      maize: 'Maize',
      cotton: 'Cotton',
      tomato: 'Tomato',
      sugarcane: 'Sugarcane',
      potato: 'Potato',
      onion: 'Onion',
      banana: 'Banana',
      mango: 'Mango',
      chickpea: 'Chickpea',
      soybean: 'Soybean',
      groundnut: 'Groundnut',
      turmeric: 'Turmeric',
      chili: 'Chili',
      brinjal: 'Brinjal',
      cabbage: 'Cabbage',
      cauliflower: 'Cauliflower',
      okra: 'Okra',
      cucumber: 'Cucumber',
      watermelon: 'Watermelon',
      pomegranate: 'Pomegranate',
      grapes: 'Grapes',
      apple: 'Apple',
      orange: 'Orange',
      lemon: 'Lemon',
    },
    nav: {
      dashboard: 'Dashboard',
      sensors: 'Sensors',
      predictions: 'Predictions',
      farms: 'Farms',
      users: 'Users',
      reports: 'Reports',
      settings: 'Settings',
      logout: 'Sign Out',
      login: 'Login',
      signup: 'Sign Up',
    },
    actions: {
      selectCrop: 'Select Crop',
      selectTimeRange: 'Select Time Range',
      refreshData: 'Refresh Data',
      exportData: 'Export Data',
      viewDetails: 'View Details',
      scanPlant: 'Scan Plant',
      captureImage: 'Capture Image',
    },
    status: {
      healthy: 'Healthy',
      monitoring: 'Monitoring',
      disease: 'Disease',
      pest: 'Pest',
      nutrientDeficiency: 'Nutrient Deficiency',
      optimal: 'Optimal',
      warning: 'Warning',
      critical: 'Critical',
    },
    thermal: {
      liveView: 'Live',
      staticView: 'Static',
      cameraStream: 'Live Camera Stream',
      plantDiagnosis: 'Plant Diagnosis',
      confidence: 'Confidence',
      detectedIssues: 'Detected Issues',
      recommendations: 'Recommendations',
      temperatureZones: 'Temperature Zones',
      minTemp: 'Min',
      maxTemp: 'Max',
      avgTemp: 'Avg',
      hotSpots: 'Hot Spots',
    },
    timeRange: {
      last7Days: 'Last 7 Days',
      last30Days: 'Last 30 Days',
      last90Days: 'Last 90 Days',
      lastYear: 'Last Year',
    },
    units: {
      celsius: '°C',
      percent: '%',
      mm: 'mm',
      lpm: 'L/min',
      lux: 'lux',
      cm: 'cm',
      kg: 'kg',
    },
  },
  hi: {
    common: {
      refresh: 'ताज़ा करें',
      loading: 'लोड हो रहा है...',
      error: 'त्रुटि',
      success: 'सफल',
      cancel: 'रद्द करें',
      save: 'सहेजें',
      delete: 'हटाएं',
      edit: 'संपादित करें',
      view: 'देखें',
      close: 'बंद करें',
      back: 'वापस',
      next: 'अगला',
      search: 'खोजें',
      filter: 'फ़िल्टर',
      export: 'निर्यात',
      import: 'आयात',
      download: 'डाउनलोड',
      upload: 'अपलोड',
    },
    dashboard: {
      title: 'डैशबोर्ड',
      welcome: 'स्वागत है',
      farmOverview: 'फ़ार्म अवलोकन',
      sensorData: 'सेंसर डेटा',
      predictions: 'पूर्वानुमान',
      historicalData: 'ऐतिहासिक डेटा',
      modelComparison: 'मॉडल तुलना',
      advisories: 'सलाह',
      weather: 'मौसम',
      thermalCamera: 'थर्मल कैमरा दृश्य',
      plantDiagnosis: 'पौधे की जांच',
    },
    sensors: {
      temperature: 'तापमान',
      humidity: 'नमी',
      soilMoisture: 'मिट्टी की नमी',
      ph: 'pH',
      rainfall: 'वर्षा',
      waterFlow: 'पानी का प्रवाह',
      lightIntensity: 'प्रकाश की तीव्रता',
      waterLevel: 'पानी का स्तर',
      npk: 'NPK',
      nitrogen: 'नाइट्रोजन',
      phosphorus: 'फ़ॉस्फ़ोरस',
      potassium: 'पोटेशियम',
    },
    predictions: {
      yieldForecast: 'उपज पूर्वानुमान',
      confidence: 'आत्मविश्वास',
      uncertainty: 'अनिश्चितता',
      riskLevel: 'जोखिम स्तर',
      high: 'उच्च',
      medium: 'मध्यम',
      low: 'निम्न',
      modelAccuracy: 'मॉडल सटीकता',
    },
    crops: {
      rice: 'चावल',
      wheat: 'गेहूं',
      maize: 'मक्का',
      cotton: 'कपास',
      tomato: 'टमाटर',
      sugarcane: 'गन्ना',
      potato: 'आलू',
      onion: 'प्याज़',
      banana: 'केला',
      mango: 'आम',
      chickpea: 'चना',
      soybean: 'सोयाबीन',
      groundnut: 'मूंगफली',
      turmeric: 'हल्दी',
      chili: 'मिर्च',
      brinjal: 'बैंगन',
      cabbage: 'पत्तागोभी',
      cauliflower: 'फूलगोभी',
      okra: 'भिंडी',
      cucumber: 'खीरा',
      watermelon: 'तरबूज',
      pomegranate: 'अनार',
      grapes: 'अंगूर',
      apple: 'सेब',
      orange: 'संतरा',
      lemon: 'नींबू',
    },
    nav: {
      dashboard: 'डैशबोर्ड',
      sensors: 'सेंसर',
      predictions: 'पूर्वानुमान',
      farms: 'खेत',
      users: 'उपयोगकर्ता',
      reports: 'रिपोर्ट',
      settings: 'सेटिंग्स',
      logout: 'साइन आउट',
      login: 'लॉगिन',
      signup: 'साइन अप',
    },
    actions: {
      selectCrop: 'फसल चुनें',
      selectTimeRange: 'समय सीमा चुनें',
      refreshData: 'डेटा ताज़ा करें',
      exportData: 'डेटा निर्यात करें',
      viewDetails: 'विवरण देखें',
      scanPlant: 'पौधा स्कैन करें',
      captureImage: 'छवि कैप्चर करें',
    },
    status: {
      healthy: 'स्वस्थ',
      monitoring: 'निगरानी',
      disease: 'रोग',
      pest: 'कीट',
      nutrientDeficiency: 'पोषक तत्व की कमी',
      optimal: 'इष्टतम',
      warning: 'चेतावनी',
      critical: 'गंभीर',
    },
    thermal: {
      liveView: 'लाइव',
      staticView: 'स्थिर',
      cameraStream: 'लाइव कैमरा स्ट्रीम',
      plantDiagnosis: 'पौधे की जांच',
      confidence: 'आत्मविश्वास',
      detectedIssues: 'पता लगाए गए मुद्दे',
      recommendations: 'सिफारिशें',
      temperatureZones: 'तापमान क्षेत्र',
      minTemp: 'न्यूनतम',
      maxTemp: 'अधिकतम',
      avgTemp: 'औसत',
      hotSpots: 'हॉट स्पॉट',
    },
    timeRange: {
      last7Days: 'पिछले 7 दिन',
      last30Days: 'पिछले 30 दिन',
      last90Days: 'पिछले 90 दिन',
      lastYear: 'पिछला वर्ष',
    },
    units: {
      celsius: '°C',
      percent: '%',
      mm: 'mm',
      lpm: 'L/मिनट',
      lux: 'lux',
      cm: 'cm',
      kg: 'kg',
    },
  },
  mr: {
    common: {
      refresh: 'रीफ्रेश करा',
      loading: 'लोड होत आहे...',
      error: 'त्रुटी',
      success: 'यशस्वी',
      cancel: 'रद्द करा',
      save: 'जतन करा',
      delete: 'हटवा',
      edit: 'संपादन करा',
      view: 'पहा',
      close: 'बंद करा',
      back: 'मागे',
      next: 'पुढे',
      search: 'शोधा',
      filter: 'फिल्टर',
      export: 'निर्यात',
      import: 'आयात',
      download: 'डाउनलोड',
      upload: 'अपलोड',
    },
    dashboard: {
      title: 'डॅशबोर्ड',
      welcome: 'स्वागत आहे',
      farmOverview: 'शेत अवलोकन',
      sensorData: 'सेन्सर डेटा',
      predictions: 'अंदाज',
      historicalData: 'ऐतिहासिक डेटा',
      modelComparison: 'मॉडेल तुलना',
      advisories: 'सल्ले',
      weather: 'हवामान',
      thermalCamera: 'थर्मल कॅमेरा दृश्य',
      plantDiagnosis: 'वनस्पती तपासणी',
    },
    sensors: {
      temperature: 'तापमान',
      humidity: 'आर्द्रता',
      soilMoisture: 'मातीची आर्द्रता',
      ph: 'pH',
      rainfall: 'पाऊस',
      waterFlow: 'पाण्याचा प्रवाह',
      lightIntensity: 'प्रकाशाची तीव्रता',
      waterLevel: 'पाण्याची पातळी',
      npk: 'NPK',
      nitrogen: 'नायट्रोजन',
      phosphorus: 'फॉस्फरस',
      potassium: 'पोटॅशियम',
    },
    predictions: {
      yieldForecast: 'उत्पादन अंदाज',
      confidence: 'आत्मविश्वास',
      uncertainty: 'अनिश्चितता',
      riskLevel: 'धोका स्तर',
      high: 'उच्च',
      medium: 'मध्यम',
      low: 'कमी',
      modelAccuracy: 'मॉडेल अचूकता',
    },
    crops: {
      rice: 'तांदूळ',
      wheat: 'गहू',
      maize: 'मका',
      cotton: 'कापूस',
      tomato: 'टोमॅटो',
      sugarcane: 'ऊस',
      potato: 'बटाटा',
      onion: 'कांदा',
      banana: 'केळी',
      mango: 'आंबा',
      chickpea: 'हरभरा',
      soybean: 'सोयाबीन',
      groundnut: 'शेंगदाणे',
      turmeric: 'हळद',
      chili: 'मिरची',
      brinjal: 'वांगी',
      cabbage: 'कोबी',
      cauliflower: 'फुलकोबी',
      okra: 'भेंडी',
      cucumber: 'काकडी',
      watermelon: 'टरबूज',
      pomegranate: 'डाळिंब',
      grapes: 'द्राक्ष',
      apple: 'सफरचंद',
      orange: 'संत्रे',
      lemon: 'लिंबू',
    },
    nav: {
      dashboard: 'डॅशबोर्ड',
      sensors: 'सेन्सर',
      predictions: 'अंदाज',
      farms: 'शेते',
      users: 'वापरकर्ते',
      reports: 'अहवाल',
      settings: 'सेटिंग्ज',
      logout: 'साइन आउट',
      login: 'लॉगिन',
      signup: 'साइन अप',
    },
    actions: {
      selectCrop: 'पिक निवडा',
      selectTimeRange: 'वेळ श्रेणी निवडा',
      refreshData: 'डेटा रीफ्रेश करा',
      exportData: 'डेटा निर्यात करा',
      viewDetails: 'तपशील पहा',
      scanPlant: 'वनस्पती स्कॅन करा',
      captureImage: 'प्रतिमा कॅप्चर करा',
    },
    status: {
      healthy: 'निरोगी',
      monitoring: 'मॉनिटरिंग',
      disease: 'रोग',
      pest: 'कीटक',
      nutrientDeficiency: 'पोषक तत्वांची कमतरता',
      optimal: 'इष्टतम',
      warning: 'चेतावणी',
      critical: 'गंभीर',
    },
    thermal: {
      liveView: 'लाइव्ह',
      staticView: 'स्थिर',
      cameraStream: 'लाइव्ह कॅमेरा स्ट्रीम',
      plantDiagnosis: 'वनस्पती तपासणी',
      confidence: 'आत्मविश्वास',
      detectedIssues: 'आढळलेले समस्या',
      recommendations: 'शिफारसी',
      temperatureZones: 'तापमान क्षेत्रे',
      minTemp: 'किमान',
      maxTemp: 'कमाल',
      avgTemp: 'सरासरी',
      hotSpots: 'हॉट स्पॉट',
    },
    timeRange: {
      last7Days: 'गेल्या 7 दिवस',
      last30Days: 'गेल्या 30 दिवस',
      last90Days: 'गेल्या 90 दिवस',
      lastYear: 'गेले वर्ष',
    },
    units: {
      celsius: '°C',
      percent: '%',
      mm: 'mm',
      lpm: 'L/मिनिट',
      lux: 'lux',
      cm: 'cm',
      kg: 'kg',
    },
  },
}

// Get translation for a given key path (e.g., "dashboard.title")
export function t(lang: Language, key: string): string {
  const keys = key.split('.')
  let value: any = translations[lang]
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k as keyof typeof value]
    } else {
      // Fallback to English if key not found
      value = translations.en
      for (const k2 of keys) {
        if (value && typeof value === 'object' && k2 in value) {
          value = value[k2 as keyof typeof value]
        } else {
          return key // Return key if not found even in English
        }
      }
      break
    }
  }
  
  return typeof value === 'string' ? value : key
}

// Get crop name in selected language
export function getCropName(lang: Language, cropKey: string): string {
  const cropMap: Record<string, keyof Translations['crops']> = {
    'Rice': 'rice',
    'Wheat': 'wheat',
    'Maize': 'maize',
    'Cotton': 'cotton',
    'Tomato': 'tomato',
    'Sugarcane': 'sugarcane',
    'Potato': 'potato',
    'Onion': 'onion',
    'Banana': 'banana',
    'Mango': 'mango',
    'Chickpea': 'chickpea',
    'Soybean': 'soybean',
    'Groundnut': 'groundnut',
    'Turmeric': 'turmeric',
    'Chili': 'chili',
    'Brinjal': 'brinjal',
    'Cabbage': 'cabbage',
    'Cauliflower': 'cauliflower',
    'Okra': 'okra',
    'Cucumber': 'cucumber',
    'Watermelon': 'watermelon',
    'Pomegranate': 'pomegranate',
    'Grapes': 'grapes',
    'Apple': 'apple',
    'Orange': 'orange',
    'Lemon': 'lemon',
  }
  
  const cropKeyLower = cropMap[cropKey] || cropKey.toLowerCase()
  return t(lang, `crops.${cropKeyLower}`)
}

// All available crops
export const ALL_CROPS = [
  'Rice',
  'Wheat',
  'Maize',
  'Cotton',
  'Tomato',
  'Sugarcane',
  'Potato',
  'Onion',
  'Banana',
  'Mango',
  'Chickpea',
  'Soybean',
  'Groundnut',
  'Turmeric',
  'Chili',
  'Brinjal',
  'Cabbage',
  'Cauliflower',
  'Okra',
  'Cucumber',
  'Watermelon',
  'Pomegranate',
  'Grapes',
  'Apple',
  'Orange',
  'Lemon',
] as const

export type CropType = typeof ALL_CROPS[number]

