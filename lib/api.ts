const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface SensorData {
  temperature: number;
  humidity: number;
  rainfall: number;
  soil_moisture: number;
  ph: number;
  water_flow: number;
  water_level?: number;  // Ultrasonic sensor - water level in cm
  light_intensity: number;
  npk?: { N: number; P: number; K: number };
}

export interface PredictionData {
  crop: string;
  yield_forecast: string;
  confidence: number;
  uncertainty: number;
  risk_level: string;
}

export interface SHAPValues {
  [key: string]: number;
}

export interface Advisory {
  title: string;
  message: string;
  priority: string;
  action: string;
  language: string;
}

export interface DashboardData {
  sensors: SensorData;
  prediction: PredictionData;
  shap_values: SHAPValues;
  advisories: Advisory[];
  weather: any;
}

export interface HistoricalData {
  timestamp: string;
  temperature: number;
  humidity: number;
  soil_moisture: number;
  ph: number;
  rainfall: number;
  water_flow?: number;
  yield_prediction: string;
  confidence: number;
}

export interface ModelComparison {
  name: string;
  accuracy: number;
  f1_score: number;
  uncertainty: string;
  shap_ready: boolean;
}

// Get auth token from sessionStorage
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  const user = sessionStorage.getItem('user');
  if (user) {
    try {
      const userData = JSON.parse(user);
      return userData.token || null;
    } catch {
      return null;
    }
  }
  return null;
}

// API request helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    sessionStorage.removeItem('user');
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Auth APIs
export const authAPI = {
  signup: async (
    email: string,
    password: string,
    name: string,
    role: string = 'farmer',
    phone?: string,
    location?: {
      lat: number;
      lng: number;
      accuracy?: number;
      source?: string;
    }
  ) => {
    return apiRequest('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        name,
        role,
        phone,
        location_lat: location?.lat,
        location_lng: location?.lng,
        location_accuracy: location?.accuracy,
        location_source: location?.source || 'signup',
      }),
    });
  },

  login: async (email: string, password: string) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(error.detail || 'Login failed');
    }

    const data = await response.json();
    return data;
  },

  getCurrentUser: async (token?: string) => {
    // If token provided, use it directly
    if (token) {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to get user info');
      }
      
      return response.json();
    }
    
    // Otherwise use apiRequest which gets token from sessionStorage
    return apiRequest('/api/auth/me');
  },

  updateLocation: async (
    lat: number,
    lng: number,
    accuracy?: number,
    source: string = 'login',
    token?: string
  ) => {
    if (token) {
      const response = await fetch(`${API_BASE_URL}/api/auth/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          location_lat: lat,
          location_lng: lng,
          location_accuracy: accuracy,
          location_source: source,
        }),
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }))
        throw new Error(error.detail || `HTTP error! status: ${response.status}`)
      }
      return response.json()
    }

    return apiRequest('/api/auth/location', {
      method: 'POST',
      body: JSON.stringify({
        location_lat: lat,
        location_lng: lng,
        location_accuracy: accuracy,
        location_source: source,
      }),
    })
  },
};

// Sensor APIs
export const sensorAPI = {
  getLatest: async (farmId: string) => {
    return apiRequest<SensorData>(`/api/sensors/latest?farm_id=${farmId}`);
  },

  submit: async (data: any) => {
    return apiRequest('/api/sensors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Prediction APIs
export const predictionAPI = {
  predict: async (sensorData: any) => {
    return apiRequest('/api/predictions', {
      method: 'POST',
      body: JSON.stringify(sensorData),
    });
  },

  getLatest: async (farmId: string) => {
    return apiRequest(`/api/predictions/latest?farm_id=${farmId}`);
  },
};

// Dashboard API
export const dashboardAPI = {
  getDashboard: async (farmId: string, crop?: string): Promise<DashboardData> => {
    const cropParam = crop ? `&crop=${encodeURIComponent(crop)}` : '';
    return apiRequest<DashboardData>(`/api/dashboard?farm_id=${farmId}${cropParam}`);
  },
};

// SHAP API
export const shapAPI = {
  getExplanation: async (sensorData: any) => {
    return apiRequest('/api/shap', {
      method: 'POST',
      body: JSON.stringify(sensorData),
    });
  },
};

// Historical Data API
export const historyAPI = {
  getHistory: async (farmId: string, days: number = 7): Promise<{ data: HistoricalData[]; days: number }> => {
    return apiRequest(`/api/history?farm_id=${farmId}&days=${days}`);
  },
};

// Model Comparison API
export const modelAPI = {
  getComparison: async (): Promise<{ models: ModelComparison[] }> => {
    return apiRequest('/api/models/comparison');
  },
};

// Advisories API
export const advisoryAPI = {
  getAdvisories: async (farmId: string, language: string = 'en'): Promise<Advisory[]> => {
    return apiRequest(`/api/advisories?farm_id=${farmId}&language=${language}`);
  },
};

// Weather API
export const weatherAPI = {
  getWeather: async (farmId: string) => {
    return apiRequest(`/api/weather?farm_id=${farmId}`);
  },
};

// Camera API
export interface CameraData {
  id?: number;
  farm_id: string;
  image_url?: string;
  thermal_image_url?: string;
  timestamp?: string;
  temperature_zones?: {
    min_temp: number;
    max_temp: number;
    avg_temp: number;
    hot_spots: number;
  };
  fallback?: boolean;
  message?: string;
}

export interface PlantDiagnosis {
  diagnosis: string;
  confidence: number;
  details: Record<string, any>;
  recommendations: string;
  thermal_image_url?: string;
}

export const cameraAPI = {
  getLatest: async (farmId: string): Promise<CameraData> => {
    return apiRequest<CameraData>(`/api/camera/latest?farm_id=${farmId}`);
  },

  diagnose: async (farmId: string, imageId?: number, imageBase64?: string): Promise<PlantDiagnosis> => {
    return apiRequest<PlantDiagnosis>('/api/camera/diagnose', {
      method: 'POST',
      body: JSON.stringify({
        farm_id: farmId,
        image_id: imageId,
        image_base64: imageBase64,
      }),
    });
  },

  getHistory: async (farmId: string, limit: number = 10) => {
    return apiRequest(`/api/camera/history?farm_id=${farmId}&limit=${limit}`);
  },
};

