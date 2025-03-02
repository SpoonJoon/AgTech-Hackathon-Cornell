// Varroa mite detection model based on vibrational measurements
// Implementation based on the paper: "Automated, non‐invasive Varroa mite detection by vibrational measurements of gait combined with machine learning"

export interface VarroaDetection {
  id: string;
  beehiveId: string;
  timestamp: string;
  detectionConfidence: number; // 0-100%
  detectionStatus: 'none' | 'possible' | 'confirmed';
  vibrationData: {
    rawSignal: number[]; // Raw accelerometer data
    spectralData: SpectralData;
    detectionFeatures: DetectionFeatures;
  };
  locationInHive?: string; // Where in the hive the detection occurred
  recommendedActions?: string[];
}

// Data from Two-Dimensional Fourier Transform analysis
export interface SpectralData {
  timeSlice: string; // Timestamp of the analyzed vibration sample
  frequencyBands: FrequencyBand[];
  spectralRepetitionFrequencies: number[]; // Typically between 4-60 Hz for Varroa
  signalToNoiseRatio: number;
}

export interface FrequencyBand {
  minFrequency: number;
  maxFrequency: number;
  magnitude: number;
  confidence: number;
}

// Specific detection features based on the paper
export interface DetectionFeatures {
  // Varroa mites typically have frequency bands between 500-2000 Hz
  primaryFrequencyBand: [number, number]; 
  
  // Specific spectral repetition features
  commonRepetitionFrequencies: number[]; // Between 4-60 Hz
  
  // Pulse features
  pulseDuration: number; // Typical time between consecutive pulses (0.04-0.08s)
  pulseStrength: number; // normalized 0-1
  meanWalkingSpeed: number; // mm/s
  
  // Discrimination features 
  discriminantScore: number; // Score from principal component analysis
  beeVsVarroaConfidence: number; // Confidence in discrimination between bee and mite (0-100%)
  
  // Additional metadata
  sampleDuration: number; // in seconds
  accelerometerPosition: string; // Where the accelerometer was placed
  varroaSignatureRegions?: Array<{
    frequency: {
      min: number;
      max: number;
    };
    repetitionFreq: {
      min: number;
      max: number;
    };
  }>;
}

// Summary statistics for a beehive
export interface VarroaInfestation {
  beehiveId: string;
  lastUpdated: string;
  detectionHistory: {
    date: string;
    detectionCount: number;
    averageConfidence: number;
    infestationPercentage: number; // Added field to track percentage of bees with mites
  }[];
  currentStatus: {
    infestationPercentage: number; // Percentage of bees affected by mites (0-100%)
    infestationLevel: 'none' | 'low' | 'moderate' | 'high' | 'severe';
    trendDirection: 'increasing' | 'stable' | 'decreasing';
    recommendedAction: string;
  };
} 