import { useState, useEffect } from 'react';
import { ApiaryData, Beehive } from '../models/beehive';
import { VarroaDetection, VarroaInfestation } from '../models/varroa';
import { generateApiaryData, updateApiaryData } from '../utils/mockData';
import { processAlerts } from '../utils/alertNotifications';
import { generateMockVarroaDetection, generateMockVarroaInfestation } from '../utils/varroaDetection';

// Type for combining beehive and Varroa data
interface VarroaData {
  detections: VarroaDetection[];
  infestation: VarroaInfestation;
}

// Custom hook to manage apiary data with real-time updates
export const useApiaryData = (updateInterval = 5000) => {
  const [apiaryData, setApiaryData] = useState<ApiaryData | null>(null);
  const [selectedBeehive, setSelectedBeehive] = useState<Beehive | null>(null);
  const [varroaData, setVarroaData] = useState<Record<string, VarroaData>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize data
  useEffect(() => {
    try {
      const initialData = generateApiaryData();
      setApiaryData(initialData);
      
      // Generate initial Varroa data for each beehive
      const initialVarroaData: Record<string, VarroaData> = {};
      
      initialData.beehives.forEach(beehive => {
        // Generate 5-10 random detections for each beehive
        const detections: VarroaDetection[] = [];
        const numDetections = Math.floor(Math.random() * 6) + 5; // 5-10 detections
        
        for (let i = 0; i < numDetections; i++) {
          detections.push(generateMockVarroaDetection(beehive.id));
        }
        
        // Generate infestation status
        const infestation = generateMockVarroaInfestation(beehive.id);
        
        initialVarroaData[beehive.id] = {
          detections,
          infestation
        };
      });
      
      setVarroaData(initialVarroaData);
      setLoading(false);
    } catch (err) {
      setError('Failed to generate initial apiary data');
      setLoading(false);
    }
  }, []);

  // Set up real-time updates
  useEffect(() => {
    if (!apiaryData) return;

    const intervalId = setInterval(() => {
      try {
        // Update all data
        const updatedData = updateApiaryData(apiaryData);
        setApiaryData(updatedData);
        
        // Occasionally update Varroa data with new detections
        const updatedVarroaData = { ...varroaData };
        
        updatedData.beehives.forEach(beehive => {
          // 20% chance to add a new detection
          if (Math.random() < 0.2) {
            const newDetection = generateMockVarroaDetection(beehive.id);
            
            if (updatedVarroaData[beehive.id]) {
              // Add the new detection
              updatedVarroaData[beehive.id].detections.push(newDetection);
              
              // Keep only the 20 most recent detections
              if (updatedVarroaData[beehive.id].detections.length > 20) {
                updatedVarroaData[beehive.id].detections.sort((a, b) => 
                  new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                );
                updatedVarroaData[beehive.id].detections = updatedVarroaData[beehive.id].detections.slice(0, 20);
              }
              
              // Regenerate infestation status with updated data
              updatedVarroaData[beehive.id].infestation = generateMockVarroaInfestation(beehive.id);
            }
          }
        });
        
        setVarroaData(updatedVarroaData);

        // If a beehive is selected, update it as well
        if (selectedBeehive) {
          const updatedSelectedBeehive = updatedData.beehives.find(
            hive => hive.id === selectedBeehive.id
          );
          
          if (updatedSelectedBeehive) {
            setSelectedBeehive(updatedSelectedBeehive);
            
            // Process alerts for the selected beehive
            processAlerts(updatedSelectedBeehive).catch(console.error);
          }
        }
      } catch (err) {
        console.error('Error updating apiary data:', err);
        // Don't set error state here to avoid disrupting the UI
        // Just log the error and continue
      }
    }, updateInterval);

    return () => clearInterval(intervalId);
  }, [apiaryData, selectedBeehive, updateInterval, varroaData]);

  // Function to select a beehive
  const selectBeehive = (beehive: Beehive) => {
    setSelectedBeehive(beehive);
    
    // Process alerts for newly selected beehive
    processAlerts(beehive).catch(console.error);
  };

  // Function to clear beehive selection
  const clearSelectedBeehive = () => {
    setSelectedBeehive(null);
  };

  // Get Varroa data for a specific beehive
  const getVarroaDataForBeehive = (beehiveId: string) => {
    return varroaData[beehiveId] || null;
  };

  return {
    apiaryData,
    selectedBeehive,
    loading,
    error,
    selectBeehive,
    clearSelectedBeehive,
    varroaData,
    getVarroaDataForBeehive
  };
}; 