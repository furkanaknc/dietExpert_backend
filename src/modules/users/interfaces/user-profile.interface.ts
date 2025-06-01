export interface UserProfile {
  id: string;
  user_id: string;
  weight?: number;
  height?: number;
  age?: number;
  sex?: 'MALE' | 'FEMALE' | 'OTHER';
  created_at: Date;
  updated_at: Date;
}

export interface UserHealth {
  id: string;
  user_id: string;
  activity_level?: 'SEDENTARY' | 'LIGHTLY_ACTIVE' | 'MODERATELY_ACTIVE' | 'VERY_ACTIVE' | 'EXTRA_ACTIVE';
  goal?:
    | 'WEIGHT_LOSS'
    | 'WEIGHT_GAIN'
    | 'MAINTENANCE'
    | 'MUSCLE_GAIN'
    | 'HEALTH_IMPROVEMENT'
    | 'SPORTS_PERFORMANCE'
    | 'GENERAL_WELLNESS';
  dietary_restrictions: string[];
  medical_conditions: string[];
  allergies: string[];
  created_at: Date;
  updated_at: Date;
}

export interface UserProfileResponse {
  profile: UserProfile | null;
  health: UserHealth | null;
}
