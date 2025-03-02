import React from 'react';
import { ApiaryData } from '../models/beehive';

interface DashboardSummaryProps {
  statistics: ApiaryData['statistics'];
}

export default function DashboardSummary({ statistics }: DashboardSummaryProps) {
  // Calculate percentage of healthy beehives
  const healthyPercentage = Math.round((statistics.healthyBeehives / statistics.totalBeehives) * 100);
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {/* Beehive Status Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Beehive Status</h3>
          <div className="p-2 rounded-full bg-amber-50 dark:bg-amber-900/20">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
        <div className="flex items-baseline">
          <div className="text-3xl font-bold text-gray-800 dark:text-white">
            {statistics.totalBeehives}
          </div>
          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">total beehives</span>
        </div>
        
        <div className="flex justify-between mt-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
            <span className="text-xs text-gray-600 dark:text-gray-300">{statistics.healthyBeehives} healthy</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>
            <span className="text-xs text-gray-600 dark:text-gray-300">{statistics.warningBeehives} warning</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
            <span className="text-xs text-gray-600 dark:text-gray-300">{statistics.criticalBeehives} critical</span>
          </div>
        </div>
      </div>
      
      {/* Average Temperature Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg. Temperature</h3>
          <div className="p-2 rounded-full bg-red-50 dark:bg-red-900/20">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v1m0 6v1m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="flex items-baseline">
          <div className="text-3xl font-bold text-gray-800 dark:text-white">
            {statistics.averageTemperature.toFixed(1)}°C
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div className="bg-green-500 h-2.5 rounded-full" style={{ 
              width: `${Math.min(100, Math.max(0, ((statistics.averageTemperature - 30) / (36 - 30)) * 100))}%` 
            }}></div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Optimal range: 32-36°C
          </p>
        </div>
      </div>
      
      {/* Average Humidity Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg. Humidity</h3>
          <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-900/20">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </div>
        </div>
        <div className="flex items-baseline">
          <div className="text-3xl font-bold text-gray-800 dark:text-white">
            {Math.round(statistics.averageHumidity)}%
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div className="bg-blue-500 h-2.5 rounded-full" style={{ 
              width: `${Math.min(100, Math.max(0, ((statistics.averageHumidity - 30) / (70 - 30)) * 100))}%` 
            }}></div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Optimal range: 40-60%
          </p>
        </div>
      </div>
      
      {/* Bee Health & Varroa Detection Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Colony Health</h3>
          <div className="p-2 rounded-full bg-purple-50 dark:bg-purple-900/20">
            <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>
        <div className="flex items-baseline">
          <div className="text-3xl font-bold text-gray-800 dark:text-white">
            {healthyPercentage}%
          </div>
          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">healthy colonies</span>
        </div>
        <div className="mt-4">
          <div className="flex items-center mb-1.5">
            <span className="text-xs text-gray-500 dark:text-gray-400 w-32">Varroa detection</span>
            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full ml-2">
              <div className="h-1.5 bg-amber-500 rounded-full" style={{ width: '35%' }}></div>
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 ml-2">Low</span>
          </div>
          <div className="flex items-center">
            <span className="text-xs text-gray-500 dark:text-gray-400 w-32">Mite treatment</span>
            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full ml-2">
              <div className="h-1.5 bg-green-500 rounded-full" style={{ width: '80%' }}></div>
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 ml-2">Good</span>
          </div>
        </div>
      </div>
    </div>
  );
} 