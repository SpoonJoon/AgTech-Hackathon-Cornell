'use client';

import React from 'react';
import Header from '../components/Header';
import DashboardSummary from '../components/DashboardSummary';
import BeehiveGrid from '../components/BeehiveGrid';
import BeehiveDetail from '../components/BeehiveDetail';
import AlertsList from '../components/AlertsList';
import { useApiaryData } from '../hooks/useApiaryData';
import dynamic from 'next/dynamic';

// Dynamically import the BeehiveMap component with no SSR and loading fallback
const DynamicBeehiveMap = dynamic(
  () => import('../components/BeehiveMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center" 
           style={{ height: '300px', width: '100%' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    )
  }
);

export default function Home() {
  const { apiaryData, selectedBeehive, loading, error, selectBeehive, clearSelectedBeehive } = useApiaryData();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header apiaryName="Buzzed Apiary" location="Loading..." />
        <main className="container mx-auto px-3 md:px-4 py-4 md:py-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !apiaryData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header apiaryName="Buzzed Apiary" location="Error State" />
        <main className="container mx-auto px-3 md:px-4 py-4 md:py-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-800 dark:text-red-400">
            <h2 className="text-lg font-medium mb-2">Error Loading Dashboard</h2>
            <p>{error || 'Failed to load apiary data. Please try refreshing the page.'}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header apiaryName={apiaryData.apiaryName} location={apiaryData.location} />
      
      <main className="container mx-auto px-3 md:px-4 py-4 md:py-6">
        {/* Dashboard Summary */}
        {/* <DashboardSummary statistics={apiaryData.statistics} /> */}
        
        {/* Main Content Area */}
        {selectedBeehive ? (
          <div className="mt-4 md:mt-6">
            <BeehiveDetail 
              beehive={selectedBeehive} 
              onClose={clearSelectedBeehive} 
            />
          </div>
        ) : (
          <>
            {/* Alerts section - Display first on all screen sizes */}
            <div className="mt-4 md:mt-6">
              <AlertsList 
                beehives={apiaryData.beehives}
                onSelectBeehive={selectBeehive}
              />
            </div>
            
            {/* Beehive Map */}
            <div className="mt-6">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white mb-3 md:mb-5 flex items-center">
                <svg className="w-4 h-4 md:w-5 md:h-5 mr-2 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Apiary Map
              </h2>
              <DynamicBeehiveMap 
                beehives={apiaryData.beehives}
                onSelectBeehive={selectBeehive}
              />
            </div>
          
            {/* Main Content - Beehives Grid */}
            <div className="mt-6">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white mb-3 md:mb-5 flex items-center">
                <svg className="w-4 h-4 md:w-5 md:h-5 mr-2 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                All Beehives
                <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-medium rounded-full">
                  {apiaryData.beehives.length}
                </span>
              </h2>
              
              <BeehiveGrid 
                beehives={apiaryData.beehives}
                onSelectBeehive={selectBeehive}
              />
            </div>
          </>
        )}
      </main>
      
      <footer className="bg-white dark:bg-gray-800 py-4 border-t dark:border-gray-700">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>© {new Date().getFullYear()} Cornell University Apiary. All rights reserved.</p>
          <p className="mt-1">Real-time beehive monitoring system</p>
        </div>
      </footer>
    </div>
  );
}
