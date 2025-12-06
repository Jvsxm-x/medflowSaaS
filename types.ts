

// src/types.ts → VERSION MISE À JOUR AVEC TOUS LES MODÈLES
export type UserRole = 'patient' | 'doctor' | 'clinic_staff' | 'clinic_admin' | 'admin';


export interface Clinic {
  id: string;
  _id?: string;
  name: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  address: string;
  phone?: string;
  latitude: number;
  longitude: number;
  rating: number;
  review_count: number;
  is_active: boolean;
  created_at: string;
}

export interface ClinicStaff {
  id: string;
  clinic_id: string;
  user_username: string;
  role: 'admin' | 'receptionist' | 'billing';
}







export interface Plan {
  id: string;
  name: 'free' | 'pro' | 'enterprise';
  price_monthly: number;
  price_yearly: number;
  storage_limit: number;
  features: string[];
  max_users: number;
  is_active: boolean;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'cancelled';
  start_date: string;
  end_date: string;
}

export interface LogEntry {
  id: number;
  timestamp: string;
  method: string;
  endpoint: string;
  status: number;
  message: string;

}


export interface User {
  name: string;
  logo_url: string;
  primary_color: string;
  secondary_color: any;
  address: string;
  latitude: number;
  longitude: number;
  review_count: number;
  created_at: string;
  id: number;
  _id?: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active?: boolean;
  date_joined?: string;
  patient_profile?: Patient;
  is_staff: boolean ;// Linked profile
  specialty?: string;
  rating?: number;
  reviews?: number;
  location?: { lat: number; lng: number; address: string };
  avatar?: string;
  phone?: string;
  birth_date?: string;
  consultation_price?: number;
}

export interface AuthResponse {
  refresh: string;
  access: string;
  token: string;
  user?: User; 
}

export interface Alert {
  id: number;
  message: string;
  severity: 'low' | 'medium' | 'high';
  is_read: boolean;
  created_at: string;
  acknowledged?: boolean;
}

export interface MedicalRecord {
  _id?: string; // MongoDB ID
  id?: string | number; // Fallback
  systolic: number;
  diastolic: number;
  glucose: number;
  heart_rate: number;
  notes?: string;
  recorded_at: string; // Backend uses recorded_at
  created_at?: string;
  patient: number | string;
}

// Backend Response format for Stats
export interface BackendStatsResponse {
  summary: {
    systolic: { avg: number; min: number; max: number };
    diastolic: { avg: number; min: number; max: number };
    glucose: { avg: number; min: number; max: number };
    heart_rate: { avg: number; min: number; max: number };
  };
  series: {
    timestamps: string[];
    systolic: number[];
    diastolic: number[];
    glucose: number[];
    heart_rate: number[];
  };
}

export interface MedicalStats {
  avg_systolic: number | null;
  avg_diastolic: number | null;
  avg_glucose: number | null;
  avg_heart_rate: number | null;
  total_records: number;
}

export interface Patient {
  id: number;
  _id?: string;
  user?: number;
  username?: string;
  email?: string;
  // Fields used in various components (some might be aliases depending on backend response)
  first_name?: string; 
  last_name?: string;
  birth_date?: string; 
  date_of_birth?: string;
  phone?: string;      
  phone_number?: string;
  
  role?: string;
  address?: string;
  emergency_contact?: string;
  medical_history?: string;
  email_verified?: boolean; // Frontend simulation
  two_factor_enabled?: boolean; // Admin setting
}

export interface PredictionResult {
  prediction: number | string;
  risk: 'Normal' | 'High';
  confidence?: number;
}

export interface Appointment {
  id: number;
  doctor: number;
  patient: number;
  appointment_date: string;
  reason: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface MedicalDocument {
  id: number;
  _id?: string;
  title: string;
  document_type: string;
  uploaded_at: string;
  file?: string;
  file_url?: string;
  file_size: number; // In bytes
  doctor_id?: number;
  doctor_name?: string;
  doctor_username?: string;
  patient_name?: string;
  status: 'pending' | 'approved' | 'rejected';
  ai_summary?: string;
  ai_tips?: string;
  ai_prediction_result?: string; // result from auto-prediction
  ai_prediction?: string;
  shared_with?: string[]; // List of doctor usernames
}

export interface DoctorDashboardStats {
  patient_count: number;
  appointment_count: number;
}

export interface LabOrder {
  id: number;
  patient_id: number;
  patient_name: string;
  doctor_id: number;
  test_name: string;
  status: 'pending' | 'completed';
  requested_at: string;
  result_file?: string;
  ai_summary?: string;
  recommended_clinic_id?: string;
  recommended_clinic_name?: string;
}

export interface SystemSettings {
  systemName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  enforce2FA: boolean;
  sessionTimeout: number;
  aiConfidenceThreshold: number;
  enableBetaFeatures: boolean;
}

export interface AnalysisResult {
  summary: string;
  tags: string[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  fileType: string;
  fileName: string;
  fileData: string;
  uploadDate: string;
  status: 'analyzing' | 'ready' | 'error';
}