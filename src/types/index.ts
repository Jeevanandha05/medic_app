export type AppRole = 'patient' | 'doctor' | 'admin';

export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  created_at: string;
  updated_at: string;
}

export interface Provider {
  id: string;
  user_id: string;
  specialization: string;
  bio: string | null;
  years_experience: number | null;
  consultation_fee: number | null;
  rating_avg: number | null;
  total_reviews: number | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
  profiles?: UserProfile;
}

export interface Appointment {
  id: string;
  patient_id: string;
  provider_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  type: string | null;
  notes: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  providers?: Provider;
  patient_profile?: UserProfile;
}

export interface Review {
  id: string;
  appointment_id: string;
  patient_id: string;
  provider_id: string;
  rating: number;
  comment: string | null;
  sentiment_score: number | null;
  is_flagged: boolean | null;
  created_at: string;
}

export interface AIPrediction {
  id: string;
  patient_id: string;
  provider_id: string | null;
  prediction_type: string;
  prediction_data: Record<string, any>;
  confidence_score: number | null;
  is_actioned: boolean | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string | null;
  is_read: boolean | null;
  action_url: string | null;
  created_at: string;
  read_at: string | null;
}
