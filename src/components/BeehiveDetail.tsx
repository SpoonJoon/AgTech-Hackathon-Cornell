import React from 'react';
import { Beehive } from '../models/beehive';
import { parseISO, format } from 'date-fns';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import VarroaDetectionComponent from './VarroaDetection';
import { useApiaryData } from '../hooks/useApiaryData';
import { TileLayer } from 'react-leaflet';
import { CORNELL_BOTANICAL_GARDENS } from '../utils/constants';
import { CircleMarker, Popup } from 'react-leaflet';

interface BeehiveDetailProps {
  beehive: Beehive;
  onClose: () => void;
}

// Custom tooltip formatter to limit decimals to 2 places
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 rounded shadow-md text-sm">
        <p className="font-medium text-gray-800 dark:text-white">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {`${entry.name}: ${Number(entry.value).toFixed(2)}${entry.unit || ''}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function BeehiveDetail({ beehive, onClose }: BeehiveDetailProps) {
  // Get Varroa data for this beehive
  const { getVarroaDataForBeehive } = useApiaryData();
  const varroaData = getVarroaDataForBeehive(beehive.id);
  
  // Format beehive history data for charts (reverse to show oldest to newest)
  // Using all available history data instead of limiting to 14 points
  const historyData = [...beehive.history].reverse();

  // Format data
  const formatLastUpdated = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy h:mm:ss a');
    } catch (error) {
      return dateString;
    }
  };

  // Get status color
  const getStatusColor = (status: Beehive['status']) => {
    switch (status) {
      case 'healthy': return 'bg-green-500 text-white';
      case 'warning': return 'bg-yellow-500 text-white';
      case 'critical': return 'bg-red-500 text-white';
      default: return 'bg-gray-300 text-black';
    }
  };

  // Get status text
  const getStatusText = (status: Beehive['status']) => {
    switch (status) {
      case 'healthy': return 'Healthy';
      case 'warning': return 'Warning';
      case 'critical': return 'Critical';
      default: return 'Unknown';
    }
  };

  // Get alert severity color
  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFixedPosition = (beehive: Beehive): [number, number] => {
    // Extract the numeric part of the ID (e.g. "hive-5" => 5)
    const hiveNumber = parseInt(beehive.id.replace(/\D/g, '')) || 0;
    
    // Create a deterministic but irregular position using the hive number
    // Use a custom algorithm with prime numbers to avoid grid-like patterns
    const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37];
    const prime1 = primes[hiveNumber % primes.length];
    const prime2 = primes[(hiveNumber + 3) % primes.length];
    
    // Calculate offsets with some trigonometric variation but keep hives closer together
    // Reduced distance factor by 50% to make hives closer together
    const angle = (hiveNumber * 137.5) % 360; // Golden angle to distribute points evenly
    const distance = 0.0008 + (hiveNumber % 5) * 0.00005; // Reduced distances for closer grouping
    
    // Add some prime-based variation for irregularity while keeping it deterministic
    // Reduced divisor to make variation smaller
    const latOffset = (Math.sin(angle * (Math.PI / 180)) * distance) + (prime1 / 20000);
    const lngOffset = (Math.cos(angle * (Math.PI / 180)) * distance) + (prime2 / 20000);
    
    return [CORNELL_BOTANICAL_GARDENS.lat + latOffset, CORNELL_BOTANICAL_GARDENS.lng + lngOffset];
  };

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-gray-900 bg-opacity-70 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div>
            <div className="flex items-center">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{beehive.name}</h2>
              <span className={`ml-3 px-3 py-1 rounded-full text-sm ${getStatusColor(beehive.status)}`}>
                {getStatusText(beehive.status)}
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Last updated: {formatLastUpdated(beehive.lastUpdated)}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Current Metrics */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Current Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
                <p className="text-sm text-gray-500 dark:text-gray-400">Temperature</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{beehive.metrics.temperature.toFixed(2)}°C</p>
              </div>
              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
                <p className="text-sm text-gray-500 dark:text-gray-400">Humidity</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{beehive.metrics.humidity.toFixed(2)}%</p>
              </div>
              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
                <p className="text-sm text-gray-500 dark:text-gray-400">Weight</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{beehive.metrics.weight.toFixed(2)} kg</p>
              </div>
              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
                <p className="text-sm text-gray-500 dark:text-gray-400">Entrance Activity</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{beehive.metrics.entranceActivity.toFixed(2)}/100</p>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Historical Data</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Temperature Chart */}
              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
                <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Temperature (°C)</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={historyData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(75, 85, 99, 0.3)" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fill: '#e5e7eb' }} 
                        stroke="#e5e7eb"
                        tickFormatter={(value) => value.split(' ')[0]}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        domain={['dataMin - 1', 'dataMax + 1']} 
                        tick={{ fill: '#e5e7eb' }} 
                        stroke="#e5e7eb" 
                        tickFormatter={(value) => value.toFixed(2)} 
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#374151', border: 'none', color: '#f3f4f6' }} 
                        itemStyle={{ color: '#f3f4f6' }}
                        labelStyle={{ color: '#f3f4f6', fontWeight: 'bold' }}
                      />
                      <Legend wrapperStyle={{ color: '#e5e7eb' }} />
                      <Line 
                        type="monotone" 
                        dataKey="temperature" 
                        name="Temperature"
                        unit="°C"
                        stroke="#F59E0B" 
                        strokeWidth={2}
                        dot={{ r: 1.5 }}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                        isAnimationActive={true}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Humidity Chart */}
              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
                <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Humidity (%)</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={historyData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(75, 85, 99, 0.3)" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fill: '#e5e7eb' }} 
                        stroke="#e5e7eb"
                        tickFormatter={(value) => value.split(' ')[0]}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        tick={{ fill: '#e5e7eb' }} 
                        stroke="#e5e7eb" 
                        tickFormatter={(value) => value.toFixed(2)} 
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#374151', border: 'none', color: '#f3f4f6' }} 
                        itemStyle={{ color: '#f3f4f6' }}
                        labelStyle={{ color: '#f3f4f6', fontWeight: 'bold' }}
                      />
                      <Legend wrapperStyle={{ color: '#e5e7eb' }} />
                      <Line 
                        type="monotone" 
                        dataKey="humidity" 
                        name="Humidity"
                        unit="%"
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        dot={{ r: 1.5 }}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                        isAnimationActive={true}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Weight Chart */}
              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
                <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Weight (kg)</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={historyData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(75, 85, 99, 0.3)" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fill: '#e5e7eb' }} 
                        stroke="#e5e7eb"
                        tickFormatter={(value) => value.split(' ')[0]}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        domain={['dataMin - 1', 'dataMax + 1']} 
                        tick={{ fill: '#e5e7eb' }} 
                        stroke="#e5e7eb" 
                        tickFormatter={(value) => value.toFixed(2)} 
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#374151', border: 'none', color: '#f3f4f6' }} 
                        itemStyle={{ color: '#f3f4f6' }}
                        labelStyle={{ color: '#f3f4f6', fontWeight: 'bold' }}
                      />
                      <Legend wrapperStyle={{ color: '#e5e7eb' }} />
                      <Line 
                        type="monotone" 
                        dataKey="weight" 
                        name="Weight"
                        unit=" kg"
                        stroke="#10B981" 
                        strokeWidth={2}
                        dot={{ r: 1.5 }}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                        isAnimationActive={true}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Activity Chart */}
              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
                <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Entrance Activity</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={historyData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(75, 85, 99, 0.3)" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fill: '#e5e7eb' }} 
                        stroke="#e5e7eb"
                        tickFormatter={(value) => value.split(' ')[0]}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        tick={{ fill: '#e5e7eb' }} 
                        stroke="#e5e7eb" 
                        tickFormatter={(value) => value.toFixed(2)} 
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#374151', border: 'none', color: '#f3f4f6' }} 
                        itemStyle={{ color: '#f3f4f6' }}
                        labelStyle={{ color: '#f3f4f6', fontWeight: 'bold' }}
                      />
                      <Legend wrapperStyle={{ color: '#e5e7eb' }} />
                      <Area 
                        type="monotone" 
                        dataKey="entranceActivity" 
                        name="Entrance Activity"
                        stroke="#8884d8" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorActivity)"
                        isAnimationActive={true}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
          
          {/* Varroa Mite Detection Section */}
          {varroaData && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Varroa Mite Detection</h3>
              <VarroaDetectionComponent 
                beehiveId={beehive.id}
                varroaDetections={varroaData.detections}
                varroaInfestation={varroaData.infestation}
              />
            </div>
          )}
          
          {/* Active Alerts */}
          {beehive.alerts.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Active Alerts</h3>
              <div className="space-y-3">
                {beehive.alerts
                  .filter(alert => !alert.resolved)
                  .map(alert => (
                    <div key={alert.id} className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow border-l-4 border-red-500">
                      <div className="flex justify-between">
                        <div>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getAlertSeverityColor(alert.severity)}`}>
                            {alert.severity}
                          </span>
                          <p className="mt-1 font-medium text-gray-800 dark:text-white">{alert.message}</p>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatLastUpdated(alert.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 