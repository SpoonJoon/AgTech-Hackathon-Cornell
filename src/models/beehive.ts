export interface Beehive {
  id: string;
  name: string;
  location: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  status: 'healthy' | 'warning' | 'critical';
  lastUpdated: string;
  metrics: {
    temperature: number;      // in Celsius
    humidity: number;         // in percentage
    weight: number;           // in kg
    populationEstimate: number; // estimated bee population
    varroaMiteLevel: number;  // detected varroa mite level (0-100)
    queenActivity: number;    // queen activity score (0-100)
    entranceActivity: number; // bee activity at entrance (0-100)
  };
  history: {
    date: string;
    temperature: number;
    humidity: number;
    weight: number;
    entranceActivity: number;
  }[];
  alerts: {
    id: string;
    type: 'temperature' | 'humidity' | 'weight' | 'population' | 'activity' | 'varroa' | 'other';
    severity: 'low' | 'medium' | 'high';
    message: string;
    timestamp: string;
    resolved: boolean;
  }[];
}

export interface ApiaryData {
  apiaryName: string;
  location: string;
  beehives: Beehive[];
  statistics: {
    totalBeehives: number;
    healthyBeehives: number;
    warningBeehives: number;
    criticalBeehives: number;
    averageTemperature: number;
    averageHumidity: number;
    averageVarroaMiteLevel: number;
  };
} 