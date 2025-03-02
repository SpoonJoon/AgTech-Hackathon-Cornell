'use client';

import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Tooltip, ZoomControl, AttributionControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Beehive } from '../models/beehive';
import { CORNELL_BOTANICAL_GARDENS } from '../utils/constants';
import { checkCriticalMetrics } from '../utils/alertNotifications';

// Note: Using completely custom CSS with no image dependencies

interface BeehiveMapProps {
  beehives: Beehive[];
  onSelectBeehive: (beehive: Beehive) => void;
}

// Create a custom icon with an emoji
const createEmojiIcon = (emoji: string, statusClass: string, number?: number) => {
  return new L.DivIcon({
    html: `
      <div class="flex items-center justify-center">
        <div class="beehive-marker ${statusClass} flex flex-col items-center">
          <div class="text-2xl">${emoji}</div>
          ${number !== undefined ? `<div class="text-xs font-bold" style="margin-top: -3px;">#${number}</div>` : ''}
        </div>
      </div>
    `,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

// Function to get beehive emoji based on status
const getBeehiveEmoji = (beehive: Beehive, index: number) => {
  if (beehive.status === 'critical') {
    return createEmojiIcon('🚨', 'beehive-critical', index + 1);
  } else if (beehive.status === 'warning') {
    return createEmojiIcon('⚠️', 'beehive-warning', index + 1);
  } else {
    return createEmojiIcon('🐝', 'beehive-healthy', index + 1);
  }
};

// Simple emoji zoom control component
function EmojiControls() {
  const map = useMap();
  
  return (
    <div className="leaflet-top leaflet-right" style={{ zIndex: 1000 }}>
      <div className="leaflet-control leaflet-bar" style={{ background: 'white', margin: '10px', boxShadow: '0 1px 5px rgba(0,0,0,0.4)', borderRadius: '4px' }}>
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); map.zoomIn(); }}
          title="Zoom in"
          style={{ display: 'block', width: '30px', height: '30px', lineHeight: '30px', textAlign: 'center', textDecoration: 'none', fontSize: '18px', fontWeight: 'bold', borderBottom: '1px solid #ccc' }}
        >
          ➕
        </a>
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); map.zoomOut(); }}
          title="Zoom out"
          style={{ display: 'block', width: '30px', height: '30px', lineHeight: '30px', textAlign: 'center', textDecoration: 'none', fontSize: '18px', fontWeight: 'bold' }}
        >
          ➖
        </a>
      </div>
    </div>
  );
}

export default function BeehiveMap({ beehives, onSelectBeehive }: BeehiveMapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [selectedBeehive, setSelectedBeehive] = useState<Beehive | null>(null);
  const [criticalAlerts, setCriticalAlerts] = useState<{ hiveId: string; name: string; messages: string[] }[]>([]);
  const [showAlertPanel, setShowAlertPanel] = useState(false);
  const [mapPosition, setMapPosition] = useState([CORNELL_BOTANICAL_GARDENS.lat, CORNELL_BOTANICAL_GARDENS.lng]);
  const [mapZoom, setMapZoom] = useState(16);
  const [selectedBeehiveId, setSelectedBeehiveId] = useState<string | null>(null);

  // Add ref for map container to apply styles
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check for critical alerts whenever beehives data changes
  useEffect(() => {
    // Collect all critical alerts
    const alerts: { hiveId: string; name: string; messages: string[] }[] = [];
    
    beehives.forEach(hive => {
      const { isCritical, criticalMessages } = checkCriticalMetrics(hive, null);
      if (isCritical) {
        alerts.push({
          hiveId: hive.id,
          name: hive.name,
          messages: criticalMessages
        });
      }
    });
    
    setCriticalAlerts(alerts);
  }, [beehives]);

  // Check if dark mode is active
  useEffect(() => {
    // Check if the document has the 'dark' class
    const isDark = document.documentElement.classList.contains('dark');
    
    // If map container exists, apply dark mode styling
    if (mapContainerRef.current && isDark) {
      const mapEl = mapContainerRef.current.querySelector('.leaflet-container');
      if (mapEl) {
        (mapEl as HTMLElement).style.filter = 'invert(92%) hue-rotate(180deg) brightness(0.9)';
      }
    }
  }, []);

  // Calculate map center
  const mapCenter = beehives.length > 0
    ? [
        beehives.reduce((acc, b) => acc + b.coordinates.latitude, 0) / beehives.length,
        beehives.reduce((acc, b) => acc + b.coordinates.longitude, 0) / beehives.length
      ]
    : [CORNELL_BOTANICAL_GARDENS.lat, CORNELL_BOTANICAL_GARDENS.lng];

  // Don't render the map until component is mounted on the client
  if (!isMounted) {
    return (
      <div 
        className="rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center" 
        style={{ height: '400px', width: '100%' }}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  // Calculate fixed position for beehive
  const getFixedPosition = (beehive: Beehive): [number, number] => {
    return [beehive.coordinates.latitude, beehive.coordinates.longitude];
  };

  // Calculate summary statistics
  const getStatsSummary = () => {
    if (beehives.length === 0) return null;
    
    // Get counts by status
    const healthyCount = beehives.filter(h => h.status === 'healthy').length;
    const warningCount = beehives.filter(h => h.status === 'warning').length;
    const criticalCount = beehives.filter(h => h.status === 'critical').length;
    
    // Calculate averages
    const avgTemperature = beehives.reduce((sum, hive) => sum + hive.metrics.temperature, 0) / beehives.length;
    const avgHumidity = beehives.reduce((sum, hive) => sum + hive.metrics.humidity, 0) / beehives.length;
    const avgWeight = beehives.reduce((sum, hive) => sum + hive.metrics.weight, 0) / beehives.length;
    const totalWeight = beehives.reduce((sum, hive) => sum + hive.metrics.weight, 0);
    const averageVarroaMiteLevel = beehives.reduce((sum, hive) => sum + hive.metrics.varroaMiteLevel, 0) / beehives.length;
    
    return {
      healthyCount,
      warningCount,
      criticalCount,
      avgTemperature,
      avgHumidity,
      avgWeight,
      totalWeight,
      averageVarroaMiteLevel
    };
  };
  
  const stats = getStatsSummary();

  const handleMarkerClick = (beehive: Beehive) => {
    setSelectedBeehive(beehive);
    onSelectBeehive(beehive);
  };

  // Find beehive by id
  const getBeehiveById = (id: string): Beehive | undefined => {
    return beehives.find(beehive => beehive.id === id);
  };

  // Handle beehive selection
  const handleBeehiveSelection = (beehive: Beehive) => {
    setSelectedBeehiveId(beehive.id);
    if (onSelectBeehive) {
      onSelectBeehive(beehive);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      
      
      {/* Map container - larger and at the top */}
      <div 
        ref={mapContainerRef}
        className="rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800"
        style={{ height: '300px', width: '100%' }}
      >
        <MapContainer
          center={mapPosition as [number, number]}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
          />
          <AttributionControl position="bottomright" prefix={false} />
          <ZoomControl position="bottomleft" />
          
          {/* Map beehives to markers */}
          {beehives.map((beehive, index) => {
            // Check if beehive is in critical state
            const criticalIssues = checkCriticalMetrics(beehive, null);
            const statusClass = 
              beehive.status === 'critical' || criticalIssues.criticalMessages.length > 0 
                ? 'beehive-critical'
                : beehive.status === 'warning' 
                  ? 'beehive-warning' 
                  : 'beehive-healthy';
            
            const position = getFixedPosition(beehive);
            return (
              <Marker 
                key={beehive.id}
                position={position}
                icon={getBeehiveEmoji(beehive, index)}
                eventHandlers={{
                  click: () => handleBeehiveSelection(beehive)
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold text-lg">{beehive.name}</h3>
                    <p className="text-sm text-gray-600">Status: <span className={`font-medium ${beehive.status === 'healthy' ? 'text-green-600' : beehive.status === 'warning' ? 'text-yellow-600' : 'text-red-600'}`}>{beehive.status}</span></p>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm">Temperature: {beehive.metrics.temperature.toFixed(2)}°C</p>
                      <p className="text-sm">Humidity: {beehive.metrics.humidity.toFixed(2)}%</p>
                      <p className="text-sm">Weight: {beehive.metrics.weight.toFixed(2)} kg</p>
                      <p className="text-sm">Activity: {beehive.metrics.entranceActivity.toFixed(2)}/100</p>
                    </div>
                    {beehive.alerts && beehive.alerts.some(alert => !alert.resolved) && (
                      <div className="mt-2">
                        <p className="text-sm font-semibold text-red-600">{beehive.alerts.filter(alert => !alert.resolved).length} Active Alert(s)</p>
                      </div>
                    )}
                    <button 
                      onClick={() => handleBeehiveSelection(beehive)} 
                      className="mt-3 w-full px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded"
                    >
                      View Details
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
      
      {/* Summary stats below the map */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 md:p-4">
            <h3 className="text-md md:text-lg font-semibold text-gray-800 dark:text-white">Temperature</h3>
            <p className="text-2xl md:text-3xl font-bold text-amber-500">
              {stats.avgTemperature.toFixed(2)}°C
            </p>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Apiary Average</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 md:p-4">
            <h3 className="text-md md:text-lg font-semibold text-gray-800 dark:text-white">Humidity</h3>
            <p className="text-2xl md:text-3xl font-bold text-blue-500">
              {stats.avgHumidity.toFixed(2)}%
            </p>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Apiary Average</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 md:p-4 sm:col-span-2 md:col-span-1">
            <h3 className="text-md md:text-lg font-semibold text-gray-800 dark:text-white">Varroa Mite Detection</h3>
            <p className={`text-2xl md:text-3xl font-bold ${
              stats.averageVarroaMiteLevel < 2 
                ? 'text-green-500' 
                : stats.averageVarroaMiteLevel < 3 
                  ? 'text-orange-500' 
                  : 'text-red-500'
            }`}>
              {stats.averageVarroaMiteLevel.toFixed(2)}%
            </p>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
              {stats.averageVarroaMiteLevel < 2 
                ? 'Safe Level' 
                : stats.averageVarroaMiteLevel < 3 
                  ? 'Warning Level' 
                  : 'Critical Level'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 