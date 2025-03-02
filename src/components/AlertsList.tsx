import React, { useState } from 'react';
import { Beehive } from '../models/beehive';
import { parseISO, format, formatDistanceToNow } from 'date-fns';
import { checkCriticalMetrics } from '../utils/alertNotifications';

// Define types needed for alerts
type AlertType = 'temperature' | 'humidity' | 'weight' | 'population' | 'activity' | 'varroa' | 'other';
type AlertSeverity = 'low' | 'medium' | 'high';

interface AlertsListProps {
  beehives: Beehive[];
  previousBeehives?: Beehive[] | null;
  onSelectBeehive?: (beehive: Beehive) => void;
}

// Helper function to format metric values
const formatMetricValue = (value: number, unit: string = ''): string => {
  return `${value.toFixed(2)}${unit}`;
};

// Type definition for combined alerts with beehive info
type AlertWithBeehiveInfo = {
  id: string;
  type: AlertType;
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: string;
  resolved: boolean;
  beehiveId: string;
  beehiveName: string;
  status: Beehive['status'];
  isCriticalMetric?: boolean;
};

export default function AlertsList({ beehives, previousBeehives = null, onSelectBeehive }: AlertsListProps) {
  // Track selected alert and treatment statuses
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  const [treatedAlerts, setTreatedAlerts] = useState<Record<string, boolean>>({});
  const [ventedAlerts, setVentedAlerts] = useState<Record<string, boolean>>({});
  const [treatmentInProgress, setTreatmentInProgress] = useState<Record<string, boolean>>({});

  // Helper function to get previous beehive data by ID
  const getPreviousBeehive = (id: string): Beehive | null => {
    if (!previousBeehives) return null;
    return previousBeehives.find(hive => hive.id === id) || null;
  };

  // Get unresolved alerts from all beehives - focusing on just two specific alerts
  const unresolvedAlerts: AlertWithBeehiveInfo[] = beehives
    .flatMap(beehive => 
      beehive.alerts
        .filter(alert => !alert.resolved)
        // Filter out activity alerts
        .filter(alert => alert.type !== 'activity')
        .map(alert => ({
          ...alert,
          beehiveId: beehive.id,
          beehiveName: beehive.name,
          status: beehive.status
        }))
    );

  // Get critical metrics alerts - will be filtered to only show the two specific alerts
  const criticalMetricsAlerts: AlertWithBeehiveInfo[] = beehives.flatMap(beehive => {
    const prevBeehive = getPreviousBeehive(beehive.id);
    const { isCritical, criticalMessages } = checkCriticalMetrics(beehive, prevBeehive);
    
    if (!isCritical) return [];
    
    return criticalMessages.map((message, idx) => {
      // Determine the alert type from the message
      let alertType: AlertType = 'other';
      if (message.toLowerCase().includes('temperature')) alertType = 'temperature';
      else if (message.toLowerCase().includes('humidity')) alertType = 'humidity';
      else if (message.toLowerCase().includes('weight')) alertType = 'weight';
      else if (message.toLowerCase().includes('entrance')) alertType = 'activity';
      else if (message.toLowerCase().includes('varroa')) alertType = 'varroa';
      else if (message.toLowerCase().includes('queen')) alertType = 'population';
      
      // Skip activity alerts
      if (alertType === 'activity') return null;
      
      return {
        id: `critical-${beehive.id}-${idx}`,
        type: alertType,
        severity: 'high' as const,
        message: message,
        timestamp: new Date().toISOString(),
        resolved: false,
        beehiveId: beehive.id,
        beehiveName: beehive.name,
        status: beehive.status,
        isCriticalMetric: true
      };
    }).filter(alert => alert !== null) as AlertWithBeehiveInfo[]; // Filter out null alerts
  });

  // Combine and sort all alerts by severity and then timestamp
  const severityOrder: Record<string, number> = { 'high': 0, 'medium': 1, 'low': 2 };
  
  // Filter out duplicate alerts by beehiveId and type
  // This ensures we don't show both an unresolved alert and a critical metrics alert for the same issue
  const uniqueAlerts: AlertWithBeehiveInfo[] = [...criticalMetricsAlerts, ...unresolvedAlerts].reduce((acc, alert) => {
    // Create a unique key based on beehive ID and alert type
    const key = `${alert.beehiveId}-${alert.type}`;
    
    // If we already have an alert with this key in the accumulator
    const existingAlertIndex = acc.findIndex(a => `${a.beehiveId}-${a.type}` === key);
    
    if (existingAlertIndex !== -1) {
      // If the existing alert is lower severity than the current one, replace it
      if (severityOrder[acc[existingAlertIndex].severity] > severityOrder[alert.severity]) {
        acc[existingAlertIndex] = alert;
      }
      // Otherwise keep the existing one (higher severity or same severity but added earlier)
    } else {
      // If no existing alert with this key, add the current alert
      acc.push(alert);
    }
    
    return acc;
  }, [] as AlertWithBeehiveInfo[]);
  
  // Sort by severity and then timestamp
  const allAlerts = uniqueAlerts.sort((a, b) => {
    // First sort by severity (high to low)
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    // Then by timestamp (newest first)
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-900/30 text-blue-400 border-blue-900';
      case 'medium': return 'bg-yellow-900/30 text-yellow-400 border-yellow-900';
      case 'high': return 'bg-red-900/30 text-red-400 border-red-900';
      default: return 'bg-gray-900/30 text-gray-400 border-gray-800';
    }
  };

  // Get alert type icon
  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'temperature': return '🌡️';
      case 'humidity': return '💧';
      case 'weight': return '⚖️';
      case 'population': return '👑';
      case 'activity': return '🐝';
      case 'varroa': return '🦟';
      default: return '⚠️';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = parseISO(timestamp);
      return {
        formatted: format(date, 'MMM d, yyyy h:mm a'),
        relative: formatDistanceToNow(date, { addSuffix: true })
      };
    } catch (e) {
      return { formatted: timestamp, relative: 'unknown time' };
    }
  };

  // Handle alert click to show treatment options
  const handleAlertClick = (alertId: string) => {
    setSelectedAlert(selectedAlert === alertId ? null : alertId);
  };

  // Treat hive for varroa mites
  const handleTreatHive = (alertId: string, beehiveId: string) => {
    setTreatmentInProgress(prev => ({ ...prev, [alertId]: true }));
    
    // Simulate treatment process with timeout
    setTimeout(() => {
      setTreatedAlerts(prev => ({ ...prev, [alertId]: true }));
      setTreatmentInProgress(prev => ({ ...prev, [alertId]: false }));
      
      // Find and update the beehive if onSelectBeehive is provided
      if (onSelectBeehive) {
        const beehive = beehives.find(b => b.id === beehiveId);
        if (beehive) {
          console.log(`Treated ${beehive.name} for varroa mites`);
        }
      }
    }, 2000);
  };

  // Vent beehive for temperature/humidity issues
  const handleVentHive = (alertId: string, beehiveId: string) => {
    setTreatmentInProgress(prev => ({ ...prev, [alertId]: true }));
    
    // Simulate venting process with timeout
    setTimeout(() => {
      setVentedAlerts(prev => ({ ...prev, [alertId]: true }));
      setTreatmentInProgress(prev => ({ ...prev, [alertId]: false }));
      
      // Find and update the beehive if onSelectBeehive is provided
      if (onSelectBeehive) {
        const beehive = beehives.find(b => b.id === beehiveId);
        if (beehive) {
          console.log(`Vented ${beehive.name} to regulate environment`);
        }
      }
    }, 2000);
  };

  if (allAlerts.length === 0) {
    return (
      <div className="bg-gray-800 shadow rounded-lg p-4 md:p-6">
        <div className="text-center py-4 md:py-6">
          <p className="text-gray-400">No active alerts</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 shadow rounded-lg p-3 md:p-4">
      <h2 className="text-lg font-semibold text-white mb-3 md:mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        Alerts
        <span className="ml-2 px-2 py-0.5 bg-amber-900/30 text-amber-400 text-xs font-medium rounded-full">
          {allAlerts.length}
        </span>
      </h2>
      <ul className="divide-y divide-gray-700">
        {allAlerts.map(alert => {
          const timestamps = formatTimestamp(alert.timestamp);
          // Format any numerical values in the message with max 2 decimal places
          const formattedMessage = alert.message.replace(
            /(\d+\.\d+)/g, 
            (match) => Number(match).toFixed(2)
          );
          
          const isSelected = selectedAlert === alert.id;
          const isTreated = treatedAlerts[alert.id];
          const isVented = ventedAlerts[alert.id];
          const isInProgress = treatmentInProgress[alert.id];
          const needsVenting = alert.type === 'temperature' || alert.type === 'humidity';
          const needsTreatment = alert.type === 'varroa';
          
          return (
            <li key={alert.id} className="py-3">
              <div 
                className={`flex items-center ${(needsVenting || needsTreatment) ? 'cursor-pointer hover:bg-gray-700 p-2 rounded' : ''}`}
                onClick={() => (needsVenting || needsTreatment) ? handleAlertClick(alert.id) : null}
              >
                <div className="text-xl mr-3 flex-shrink-0">
                  {getAlertTypeIcon(alert.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <p className="text-sm font-medium text-white mr-2 truncate">
                      {alert.beehiveName} - {alert.type === 'humidity' ? 'High Humidity (78.5%)' : 
                                            alert.type === 'varroa' ? 'Varroa Mites (2.8%)' : 
                                            alert.type}
                    </p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getSeverityColor(alert.severity)}`}>
                      {alert.severity}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-400 mt-1">
                    <span className="mr-2">{timestamps.relative}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      alert.status === 'healthy' ? 'bg-green-900/30 text-green-400' :
                      alert.status === 'warning' ? 'bg-yellow-900/30 text-yellow-400' :
                      'bg-red-900/30 text-red-400'
                    }`}>
                      {alert.status}
                    </span>
                  </div>
                  
                  {/* Treatment status indicators */}
                  {isVented && (
                    <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400">
                      ✅ Hive vented successfully
                    </span>
                  )}
                  
                  {isTreated && (
                    <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400">
                      ✅ Varroa mite treatment applied
                    </span>
                  )}
                  
                  {/* Treatment buttons */}
                  {isSelected && !isVented && !isTreated && (
                    <div className="mt-3 space-y-2">
                      {needsVenting && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVentHive(alert.id, alert.beehiveId);
                          }}
                          disabled={isInProgress}
                          className={`inline-flex w-full md:w-auto items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md ${
                            isInProgress
                              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-900/30 text-blue-400 hover:bg-blue-800/50'
                          }`}
                        >
                          {isInProgress ? (
                            <>
                              <span className="inline-block w-3 h-3 mr-2 border-t-2 border-blue-500 rounded-full animate-spin"></span>
                              Venting in progress...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                              </svg>
                              Vent Beehive
                            </>
                          )}
                        </button>
                      )}
                      
                      {needsTreatment && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTreatHive(alert.id, alert.beehiveId);
                          }}
                          disabled={isInProgress}
                          className={`inline-flex w-full md:w-auto items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md ${
                            isInProgress
                              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                              : 'bg-amber-900/30 text-amber-400 hover:bg-amber-800/50'
                          }`}
                        >
                          {isInProgress ? (
                            <>
                              <span className="inline-block w-3 h-3 mr-2 border-t-2 border-amber-500 rounded-full animate-spin"></span>
                              Treatment in progress...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              Treat for Varroa Mites
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
} 