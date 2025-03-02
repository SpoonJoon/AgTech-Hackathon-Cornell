import { Beehive, ApiaryData } from '../models/beehive';
import { format, subDays, subHours } from 'date-fns';

// Define types needed for the second generateAlerts function
type Status = 'healthy' | 'warning' | 'critical';
type AlertType = 'temperature' | 'humidity' | 'weight' | 'population' | 'activity' | 'varroa' | 'other';
type AlertSeverity = 'low' | 'medium' | 'high';
type Alert = {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  timestamp: string;
  resolved: boolean;
};

// Generate random number within a range
const randomInRange = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

// Generate random history data with more detailed data points
const generateHistory = (days: number) => {
  const history = [];
  
  // Generate 3 data points per day for more detailed graphs
  for (let i = 0; i < days; i++) {
    for (let j = 0; j < 3; j++) { // 3 entries per day (morning, afternoon, evening)
      const hourOffset = j * 8; // Spread readings throughout the day (8am, 4pm, 12am)
      
      // Generate base values for this day
      const baseTemperature = randomInRange(32, 36);
      const baseHumidity = randomInRange(40, 70);
      const baseWeight = randomInRange(25, 35);
      const baseActivity = randomInRange(30, 95);
      
      // Add small variations for each time of day
      const timeVariation = randomInRange(-0.5, 0.5);
      
      history.push({
        date: format(subDays(new Date(new Date().setHours(8 + hourOffset, 0, 0, 0)), i), 'yyyy-MM-dd HH:mm'),
        temperature: +(baseTemperature + timeVariation * (j === 0 ? -1 : 1)).toFixed(2),
        humidity: +(baseHumidity + timeVariation * 2).toFixed(2),
        weight: +(baseWeight + timeVariation * 0.1).toFixed(2),
        entranceActivity: +(baseActivity + (j === 1 ? 10 : j === 2 ? -15 : 0) + timeVariation * 5).toFixed(2)
      });
    }
  }
  
  return history;
};

// Generate alerts - only 2 specific alerts
const generateInitialAlerts = (beehiveId: string) => {
  // Only generate alerts for specific hives:
  // - Hive #1 will get a humidity alert
  // - Hive #7 will get a varroa mite alert
  // - All other hives get no alerts
  
  if (beehiveId === 'hive-7') {
    return [{
      id: `alert-${beehiveId}-varroa`,
      type: 'varroa' as AlertType,
      severity: 'medium' as AlertSeverity,
      message: 'Warning: Varroa mite level elevated: 2.8%',
      timestamp: format(subHours(new Date(), Math.floor(Math.random() * 6)), "yyyy-MM-dd'T'HH:mm:ss"),
      resolved: false
    }];
  } 
  else if (beehiveId === 'hive-1') {
    return [{
      id: `alert-${beehiveId}-humidity`,
      type: 'humidity' as AlertType,
      severity: 'high' as AlertSeverity,
      message: 'Humidity level too high: 78.5%',
      timestamp: format(subHours(new Date(), Math.floor(Math.random() * 6)), "yyyy-MM-dd'T'HH:mm:ss"),
      resolved: false
    }];
  }
  
  return []; // No alerts for other hives
};

// Generate a single beehive with mock data
const generateBeehive = (id: string, name: string): Beehive => {
  const statuses: Beehive['status'][] = ['healthy', 'warning', 'critical'];
  const weightBase = randomInRange(25, 35);
  const temperatureBase = randomInRange(32, 36);
  
  // Start with healthy for all hives
  let status: Beehive['status'] = 'healthy';
  
  // Override status for our special hives with alerts
  if (id === 'hive-7') {
    status = 'warning';
  } else if (id === 'hive-1') {
    status = 'warning';
  }
  
  // Generate random coordinates within Cornell Botanical Gardens area (Ithaca, NY)
  // Coordinates for Cornell Botanical Gardens: 42.4509, -76.4693
  const latitudeBase = 42.4509;
  const longitudeBase = -76.4693;
  // Generate coordinates within roughly 500m radius to stay within the gardens
  const latitude = latitudeBase + randomInRange(-0.0025, 0.0025);
  const longitude = longitudeBase + randomInRange(-0.0025, 0.0025);
  
  // Generate varroa mite level based on status (higher for critical hives)
  let varroaMiteLevel = 0;
  if (id === 'hive-7') {
    varroaMiteLevel = 2.8;
  } else {
    varroaMiteLevel = randomInRange(0, 1.5);  // Healthy: < 2%
  }
  
  // Generate humidity level
  let humidity = 0;
  if (id === 'hive-1') {
    humidity = 78.5; // Fixed value for our special humidity hive
  } else {
    humidity = +(randomInRange(55, 65)).toFixed(2); // Normal range
  }
  
  return {
    id,
    name,
    location: 'Cornell Apiary',
    coordinates: {
      latitude,
      longitude
    },
    status,
    lastUpdated: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
    metrics: {
      temperature: +(temperatureBase).toFixed(2),
      humidity,
      weight: +(weightBase).toFixed(2),
      populationEstimate: Math.floor(randomInRange(10000, 50000)),
      varroaMiteLevel: +(varroaMiteLevel).toFixed(2),
      queenActivity: +(randomInRange(0, 100)).toFixed(2),
      entranceActivity: +(randomInRange(30, 95)).toFixed(2)
    },
    history: generateHistory(30),
    alerts: generateInitialAlerts(id)
  };
};

// Generate mock apiary data
export const generateApiaryData = (): ApiaryData => {
  const beehiveCount = 12;
  const beehives: Beehive[] = [];
  
  for (let i = 1; i <= beehiveCount; i++) {
    beehives.push(generateBeehive(`hive-${i}`, `Hive ${i}`));
  }
  
  // Calculate apiary statistics
  const healthyBeehives = beehives.filter(hive => hive.status === 'healthy').length;
  const warningBeehives = beehives.filter(hive => hive.status === 'warning').length;
  const criticalBeehives = beehives.filter(hive => hive.status === 'critical').length;
  
  const averageTemperature = +(beehives.reduce((sum, hive) => sum + hive.metrics.temperature, 0) / beehiveCount).toFixed(2);
  const averageHumidity = +(beehives.reduce((sum, hive) => sum + hive.metrics.humidity, 0) / beehiveCount).toFixed(2);
  const averageVarroaMiteLevel = +(beehives.reduce((sum, hive) => sum + hive.metrics.varroaMiteLevel, 0) / beehiveCount).toFixed(2);
  
  return {
    apiaryName: 'Cornell Apiary',
    location: 'Ithaca, NY',
    beehives,
    statistics: {
      totalBeehives: beehiveCount,
      healthyBeehives,
      warningBeehives,
      criticalBeehives,
      averageTemperature,
      averageHumidity,
      averageVarroaMiteLevel
    }
  };
};

// Update a single beehive's data to simulate real-time changes
export const updateBeehiveData = (beehive: Beehive): Beehive => {
  // Add small random variations to metrics
  const temperature = +(beehive.metrics.temperature + randomInRange(-0.5, 0.5)).toFixed(2);
  
  // For Hive #1, keep humidity high
  let humidity;
  if (beehive.id === 'hive-1') {
    humidity = 78.5; // Keep the high humidity for our humidity alert hive
  } else {
    humidity = +(Math.max(50, Math.min(70, beehive.metrics.humidity + randomInRange(-1, 1)))).toFixed(2);
  }
  
  const weight = +(beehive.metrics.weight + randomInRange(-0.1, 0.1)).toFixed(2);
  const entranceActivity = +(Math.max(0, Math.min(100, beehive.metrics.entranceActivity + randomInRange(-5, 5)))).toFixed(2);
  const queenActivity = +(Math.max(0, Math.min(100, beehive.metrics.queenActivity + randomInRange(-3, 3)))).toFixed(2);
  
  // Update varroa mite level - for Hive #7, keep it elevated but in warning range
  let varroaMiteLevel;
  if (beehive.id === 'hive-7') {
    varroaMiteLevel = 2.8;
  } else {
    varroaMiteLevel = Math.max(0, Math.min(1.5, beehive.metrics.varroaMiteLevel + randomInRange(-0.1, 0.1))).toFixed(2);
  }
  
  // Add very small variations to coordinates to simulate GPS jitter or bee movement
  const latitude = beehive.coordinates.latitude + randomInRange(-0.0001, 0.0001);
  const longitude = beehive.coordinates.longitude + randomInRange(-0.0001, 0.0001);
  
  // Determine status based on metrics and varroa levels
  let status: Beehive['status'] = 'healthy';
  
  // Override status for our special hives
  if (beehive.id === 'hive-7') {
    status = 'warning';
  } else if (beehive.id === 'hive-1') {
    status = 'warning';
  }
  
  // Preserve existing alerts
  let alerts = [...beehive.alerts];
  
  // Ensure hive 7 always has its varroa alert
  if (beehive.id === 'hive-7' && alerts.length === 0) {
    alerts = [{
      id: `alert-${beehive.id}-varroa`,
      type: 'varroa',
      severity: 'medium',
      message: 'Warning: Varroa mite level elevated: 2.8%',
      timestamp: format(subHours(new Date(), Math.floor(Math.random() * 6)), "yyyy-MM-dd'T'HH:mm:ss"),
      resolved: false
    }];
  }
  
  // Ensure hive 1 always has its humidity alert
  if (beehive.id === 'hive-1' && alerts.length === 0) {
    alerts = [{
      id: `alert-${beehive.id}-humidity`,
      type: 'humidity',
      severity: 'high',
      message: 'Humidity level too high: 78.5%',
      timestamp: format(subHours(new Date(), Math.floor(Math.random() * 6)), "yyyy-MM-dd'T'HH:mm:ss"),
      resolved: false
    }];
  }
  
  return {
    ...beehive,
    coordinates: {
      latitude,
      longitude
    },
    status,
    lastUpdated: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
    metrics: {
      ...beehive.metrics,
      temperature,
      humidity,
      weight,
      entranceActivity,
      queenActivity,
      varroaMiteLevel: +varroaMiteLevel
    },
    alerts
  };
};

// Update all beehives in the apiary
export const updateApiaryData = (apiaryData: ApiaryData): ApiaryData => {
  const updatedBeehives = apiaryData.beehives.map(beehive => updateBeehiveData(beehive));
  
  // Recalculate statistics
  const healthyBeehives = updatedBeehives.filter(hive => hive.status === 'healthy').length;
  const warningBeehives = updatedBeehives.filter(hive => hive.status === 'warning').length;
  const criticalBeehives = updatedBeehives.filter(hive => hive.status === 'critical').length;
  
  const averageTemperature = +(updatedBeehives.reduce((sum, hive) => sum + hive.metrics.temperature, 0) / updatedBeehives.length).toFixed(2);
  const averageHumidity = +(updatedBeehives.reduce((sum, hive) => sum + hive.metrics.humidity, 0) / updatedBeehives.length).toFixed(2);
  const averageVarroaMiteLevel = +(updatedBeehives.reduce((sum, hive) => sum + hive.metrics.varroaMiteLevel, 0) / updatedBeehives.length).toFixed(2);
  
  return {
    ...apiaryData,
    beehives: updatedBeehives,
    statistics: {
      ...apiaryData.statistics,
      healthyBeehives,
      warningBeehives,
      criticalBeehives,
      averageTemperature,
      averageHumidity,
      averageVarroaMiteLevel
    }
  };
};

export function generateAlerts(beehive: Beehive, status: Status): Alert[] {
  // We'll only generate alerts for our two specific hives
  // For hive-7: varroa mite alert
  // For hive-1: humidity alert
  // All other hives have no alerts
  
  if (beehive.id === 'hive-7') {
    return [{
      id: `${beehive.id}-varroa-alert`,
      type: 'varroa',
      severity: 'medium',
      message: `Warning: Varroa mite level elevated: 2.8%`,
      timestamp: new Date().toISOString(),
      resolved: false
    }];
  } 
  else if (beehive.id === 'hive-1') {
    return [{
      id: `${beehive.id}-humidity-alert`,
      type: 'humidity',
      severity: 'high',
      message: `Humidity level too high: 78.5%`,
      timestamp: new Date().toISOString(),
      resolved: false
    }];
  }
  
  // Return empty array for all other hives
  return [];
} 