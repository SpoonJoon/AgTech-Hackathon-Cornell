import React from 'react';
import { Beehive } from '../models/beehive';
import { formatDistanceToNow } from 'date-fns';

interface BeehiveGridProps {
  beehives: Beehive[];
  onSelectBeehive: (beehive: Beehive) => void;
}

export default function BeehiveGrid({ beehives, onSelectBeehive }: BeehiveGridProps) {
  // Function to determine status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Function to format last updated time
  const formatLastUpdated = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
      {beehives.map((beehive) => (
        <div 
          key={beehive.id}
          onClick={() => onSelectBeehive(beehive)}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 cursor-pointer"
        >
          <div className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center">
                  <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(beehive.status)} mr-2`}></div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{beehive.name}</h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Updated {formatLastUpdated(beehive.lastUpdated)}
                </p>
              </div>
              
              {beehive.alerts.filter(a => !a.resolved).length > 0 && (
                <div className="flex items-center px-2 py-1 bg-red-50 dark:bg-red-900/20 rounded-full">
                  <span className="text-xs font-medium text-red-700 dark:text-red-400">
                    {beehive.alerts.filter(a => !a.resolved).length} {beehive.alerts.filter(a => !a.resolved).length === 1 ? 'alert' : 'alerts'}
                  </span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="rounded-lg bg-gray-50 dark:bg-gray-700/40 p-3">
                <div className="flex items-center text-gray-500 dark:text-gray-400 mb-1">
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v1m0 6v1m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-medium">Temperature</span>
                </div>
                <span className="text-lg font-semibold text-gray-800 dark:text-white">
                  {beehive.metrics.temperature.toFixed(1)}°C
                </span>
              </div>
              
              <div className="rounded-lg bg-gray-50 dark:bg-gray-700/40 p-3">
                <div className="flex items-center text-gray-500 dark:text-gray-400 mb-1">
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                  <span className="text-xs font-medium">Humidity</span>
                </div>
                <span className="text-lg font-semibold text-gray-800 dark:text-white">
                  {Math.round(beehive.metrics.humidity)}%
                </span>
              </div>
              
              <div className="rounded-lg bg-gray-50 dark:bg-gray-700/40 p-3">
                <div className="flex items-center text-gray-500 dark:text-gray-400 mb-1">
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                  <span className="text-xs font-medium">Weight</span>
                </div>
                <span className="text-lg font-semibold text-gray-800 dark:text-white">
                  {beehive.metrics.weight.toFixed(1)} kg
                </span>
              </div>
              
              <div className="rounded-lg bg-gray-50 dark:bg-gray-700/40 p-3">
                <div className="flex items-center text-gray-500 dark:text-gray-400 mb-1">
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                  <span className="text-xs font-medium">Entrance Activity</span>
                </div>
                <span className="text-lg font-semibold text-gray-800 dark:text-white">
                  {Math.round(beehive.metrics.entranceActivity)} bees/min
                </span>
              </div>
            </div>
            
            {/* Conditionally render Varroa infestation if property exists */}
            {(beehive as any).varroaInfestation && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Varroa infestation</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    (beehive as any).varroaInfestation === 'low' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                    (beehive as any).varroaInfestation === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {(beehive as any).varroaInfestation?.charAt(0).toUpperCase() + (beehive as any).varroaInfestation?.slice(1)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1.5">
                  <div className={`h-1.5 rounded-full ${
                    (beehive as any).varroaInfestation === 'low' ? 'bg-green-500' :
                    (beehive as any).varroaInfestation === 'medium' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`} style={{ 
                    width: (beehive as any).varroaInfestation === 'low' ? '33%' :
                           (beehive as any).varroaInfestation === 'medium' ? '66%' : '100%' 
                  }}></div>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 