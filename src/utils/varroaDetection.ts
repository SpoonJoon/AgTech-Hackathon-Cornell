import { VarroaDetection, SpectralData, DetectionFeatures, VarroaInfestation } from '../models/varroa';
import { v4 as uuidv4 } from 'uuid';
import { format, subDays } from 'date-fns';

// Generate random number within a range
const randomInRange = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

// Simulated 2D Fourier Transform analysis
// In a real implementation, this would process actual accelerometer data
const simulate2DFT = (rawSignal: number[]): SpectralData => {
  // Simulate frequency bands - Varroa typically between 500-2000 Hz
  const mainBandMin = randomInRange(500, 800);
  const mainBandMax = randomInRange(1500, 2000);
  
  // Common spectral repetition frequencies for Varroa are between 4-60 Hz
  // With common frequencies of 4, 6, and 14 Hz
  const repetitionFreqs = [];
  const numFreqs = Math.floor(randomInRange(1, 4));
  
  for (let i = 0; i < numFreqs; i++) {
    if (Math.random() > 0.5) {
      // Use one of the common frequencies
      const commonFreqs = [4, 6, 14];
      repetitionFreqs.push(commonFreqs[Math.floor(Math.random() * commonFreqs.length)]);
    } else {
      // Random frequency between 4-60 Hz
      repetitionFreqs.push(Math.floor(randomInRange(4, 60)));
    }
  }
  
  return {
    timeSlice: new Date().toISOString(),
    frequencyBands: [
      {
        minFrequency: mainBandMin,
        maxFrequency: mainBandMax,
        magnitude: randomInRange(0.00001, 0.0005), // Based on paper's magnitude values
        confidence: randomInRange(60, 95)
      },
      {
        minFrequency: 2500,
        maxFrequency: 3500,
        magnitude: randomInRange(0.00001, 0.0001),
        confidence: randomInRange(40, 70)
      }
    ],
    spectralRepetitionFrequencies: repetitionFreqs,
    signalToNoiseRatio: randomInRange(1.5, 5) // SNR is typically poor for Varroa
  };
};

// Analyze detection features based on 2DFT results
const analyzeDetectionFeatures = (spectralData: SpectralData): DetectionFeatures => {
  // Extract primary frequency band from spectral data
  const primaryBand = spectralData.frequencyBands[0];
  
  // Generate detection features based on the paper's findings
  return {
    primaryFrequencyBand: [primaryBand.minFrequency, primaryBand.maxFrequency],
    commonRepetitionFrequencies: spectralData.spectralRepetitionFrequencies,
    pulseDuration: randomInRange(0.04, 0.08), // seconds between pulses
    pulseStrength: randomInRange(0.5, 1.0), // normalized pulse strength
    meanWalkingSpeed: randomInRange(1.5, 4), // mm/s
    discriminantScore: randomInRange(-2, 2),
    beeVsVarroaConfidence: randomInRange(50, 98),
    sampleDuration: 1.0, // 1 second samples as per paper
    accelerometerPosition: Math.random() > 0.5 ? 'brood-comb' : 'bottom-board'
  };
};

// Generate a mock vibration signal (in a real implementation, this would come from sensors)
export const generateMockVibrationSignal = (length: number = 1000): number[] => {
  const signal = [];
  
  // Create a noisy signal
  for (let i = 0; i < length; i++) {
    signal.push(randomInRange(-0.01, 0.01));
  }
  
  // Add some periodic components to simulate Varroa walking
  // If we want to simulate a mite
  if (Math.random() > 0.3) {
    const primaryFreq = randomInRange(500, 2000); // Hz
    const pulseFreq = randomInRange(4, 20); // Repetition frequency
    
    for (let i = 0; i < length; i++) {
      // Add the primary frequency component
      signal[i] += 0.005 * Math.sin(2 * Math.PI * primaryFreq * i / 10000);
      
      // Add the pulse repetition
      if (i % Math.floor(1000 / pulseFreq) < 10) {
        signal[i] += 0.02 * Math.exp(-0.5 * ((i % Math.floor(1000 / pulseFreq)) / 2) ** 2);
      }
    }
  }
  
  return signal;
};

// Generate a mock Varroa detection
export const generateMockVarroaDetection = (beehiveId: string): VarroaDetection => {
  // Generate raw vibration signal
  const rawSignal = generateMockVibrationSignal();
  
  // Perform 2DFT analysis
  const spectralData = simulate2DFT(rawSignal);
  
  // Analyze detection features
  const detectionFeatures = analyzeDetectionFeatures(spectralData);
  
  // Determine detection status and confidence
  let detectionConfidence = 0;
  let detectionStatus: 'none' | 'possible' | 'confirmed' = 'none';
  
  // Logic for determining confidence and status based on detection features
  if (
    // Check if primary frequency band is in Varroa range
    detectionFeatures.primaryFrequencyBand[0] >= 500 && 
    detectionFeatures.primaryFrequencyBand[1] <= 2000 &&
    // Check if common repetition frequencies match Varroa
    detectionFeatures.commonRepetitionFrequencies.some(freq => [4, 6, 14].includes(freq)) &&
    // Check pulse duration is in expected range
    detectionFeatures.pulseDuration >= 0.04 && detectionFeatures.pulseDuration <= 0.08
  ) {
    // Calculate confidence score
    detectionConfidence = detectionFeatures.beeVsVarroaConfidence;
    
    if (detectionConfidence > 85) {
      detectionStatus = 'confirmed';
    } else if (detectionConfidence > 65) {
      detectionStatus = 'possible';
    }
  }
  
  // Generate recommended actions based on detection status
  const recommendedActions = [];
  if (detectionStatus === 'confirmed') {
    recommendedActions.push('Consider treatment options based on infestation level');
    recommendedActions.push('Conduct a physical inspection to confirm infestation');
  } else if (detectionStatus === 'possible') {
    recommendedActions.push('Monitor closely over the next few days');
    recommendedActions.push('Consider a bottom board mite count to confirm');
  }
  
  return {
    id: uuidv4(),
    beehiveId,
    timestamp: new Date().toISOString(),
    detectionConfidence,
    detectionStatus,
    vibrationData: {
      rawSignal,
      spectralData,
      detectionFeatures
    },
    locationInHive: detectionFeatures.accelerometerPosition,
    recommendedActions
  };
};

// Generate detection history for a beehive
const generateDetectionHistory = (days: number) => {
  const history = [];
  
  for (let i = 0; i < days; i++) {
    const detectionCount = Math.floor(randomInRange(0, i > 10 ? 15 : 5));
    
    // Calculate infestation percentage based on detection count
    // Following the same logic used for currentStatus.infestationPercentage
    let infestationPercentage = 0;
    
    if (detectionCount === 0) {
      infestationPercentage = 0;
    } else if (detectionCount < 5) {
      infestationPercentage = randomInRange(0.5, 3);
    } else if (detectionCount < 10) {
      infestationPercentage = randomInRange(3, 8);
    } else if (detectionCount < 20) {
      infestationPercentage = randomInRange(8, 15);
    } else {
      infestationPercentage = randomInRange(15, 30);
    }
    
    history.push({
      date: format(subDays(new Date(), i), 'yyyy-MM-dd'),
      detectionCount,
      averageConfidence: randomInRange(60, 95),
      infestationPercentage
    });
  }
  
  return history;
};

// Generate a mock Varroa infestation status for a beehive
export const generateMockVarroaInfestation = (beehiveId: string): VarroaInfestation => {
  const detectionHistory = generateDetectionHistory(14);
  const recentDetections = detectionHistory.slice(0, 3);
  
  // Calculate trend based on recent detections
  const recentAvg = recentDetections.reduce((sum, day) => sum + day.detectionCount, 0) / recentDetections.length;
  const olderDetections = detectionHistory.slice(3, 7);
  const olderAvg = olderDetections.reduce((sum, day) => sum + day.detectionCount, 0) / olderDetections.length;
  
  let trendDirection: 'increasing' | 'stable' | 'decreasing';
  if (recentAvg > olderAvg * 1.2) {
    trendDirection = 'increasing';
  } else if (recentAvg < olderAvg * 0.8) {
    trendDirection = 'decreasing';
  } else {
    trendDirection = 'stable';
  }
  
  // Determine infestation level based on percentage
  const latestCount = detectionHistory[0].detectionCount;
  
  // Calculate infestation percentage (0-100%)
  // Industry standard: more than 3% is concerning, above 10% requires immediate action
  let infestationPercentage = 0;
  
  if (latestCount === 0) {
    infestationPercentage = 0;
  } else if (latestCount < 5) {
    infestationPercentage = randomInRange(0.5, 3);
  } else if (latestCount < 10) {
    infestationPercentage = randomInRange(3, 8);
  } else if (latestCount < 20) {
    infestationPercentage = randomInRange(8, 15);
  } else {
    infestationPercentage = randomInRange(15, 30);
  }
  
  // Determine infestation level
  let infestationLevel: 'none' | 'low' | 'moderate' | 'high' | 'severe';
  let recommendedAction = '';
  
  if (infestationPercentage === 0) {
    infestationLevel = 'none';
    recommendedAction = 'Continue monitoring';
  } else if (infestationPercentage < 3) {
    infestationLevel = 'low';
    recommendedAction = 'Monitor weekly, no immediate action required';
  } else if (infestationPercentage < 8) {
    infestationLevel = 'moderate';
    recommendedAction = 'Consider treatment within next 2-3 weeks';
  } else if (infestationPercentage < 15) {
    infestationLevel = 'high';
    recommendedAction = 'Treat colony within 7 days';
  } else {
    infestationLevel = 'severe';
    recommendedAction = 'Immediate treatment required, colony at high risk';
  }
  
  return {
    beehiveId,
    lastUpdated: new Date().toISOString(),
    detectionHistory,
    currentStatus: {
      infestationPercentage,
      infestationLevel,
      trendDirection,
      recommendedAction
    }
  };
}; 