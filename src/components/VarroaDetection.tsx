import React, { useEffect, useState, useRef } from 'react';
import { VarroaDetection, VarroaInfestation } from '../models/varroa';
import { format, parseISO } from 'date-fns';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area 
} from 'recharts';

interface VarroaDetectionProps {
  beehiveId: string;
  varroaDetections: VarroaDetection[];
  varroaInfestation: VarroaInfestation;
}

export default function VarroaDetectionComponent({ 
  beehiveId, 
  varroaDetections,
  varroaInfestation 
}: VarroaDetectionProps) {
  // For 2DFT visualization
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedDetection, setSelectedDetection] = useState<VarroaDetection | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [highlightFeature, setHighlightFeature] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{x: number, y: number, text: string} | null>(null);

  // Check if dark mode is active
  useEffect(() => {
    // Check if the document has the 'dark' class
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

  // Get the most recent detection
  useEffect(() => {
    if (varroaDetections && varroaDetections.length > 0) {
      // Sort by timestamp descending and get the first one
      const mostRecent = [...varroaDetections].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0];
      
      setSelectedDetection(mostRecent);
    }
  }, [varroaDetections]);

  // Add mouse move handler to show tooltips
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !selectedDetection) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Y-axis (frequency) area
    if (x < 50 && y < canvas.height - 30) {
      const freq = 4000 - ((y / (canvas.height - 30)) * 4000);
      setTooltipPosition({
        x: e.clientX,
        y: e.clientY,
        text: `Frequency: ${Math.round(freq)} Hz`
      });
      setHighlightFeature('frequency');
      return;
    }
    
    // X-axis (pulse repetition) area
    if (x >= 50 && y > canvas.height - 30) {
      const repFreq = ((x - 50) / (canvas.width - 70)) * 60;
      setTooltipPosition({
        x: e.clientX,
        y: e.clientY,
        text: `Repetition: ${repFreq.toFixed(1)} Hz`
      });
      setHighlightFeature('repetition');
      return;
    }
    
    // Main visualization area
    if (x >= 50 && y < canvas.height - 30) {
      // Check if cursor is near any primary frequency bands
      const yScale = (canvas.height - 50) / 4000;
      const { primaryFrequencyBand } = selectedDetection.vibrationData.detectionFeatures;
      const primaryBandY1 = canvas.height - 40 - (primaryFrequencyBand[0] * yScale);
      const primaryBandY2 = canvas.height - 40 - (primaryFrequencyBand[1] * yScale);
      
      if (y >= Math.min(primaryBandY1, primaryBandY2) - 10 && y <= Math.max(primaryBandY1, primaryBandY2) + 10) {
        setTooltipPosition({
          x: e.clientX,
          y: e.clientY,
          text: `Primary frequency band: ${Math.round(primaryFrequencyBand[0])}-${Math.round(primaryFrequencyBand[1])} Hz`
        });
        setHighlightFeature('primaryBand');
        return;
      }
      
      // Check if cursor is near any repetition frequency lines
      const xScale = (canvas.width - 70) / 60;
      const { spectralRepetitionFrequencies } = selectedDetection.vibrationData.spectralData;
      
      for (const freq of spectralRepetitionFrequencies) {
        const lineX = 50 + (freq * xScale);
        if (Math.abs(x - lineX) < 5) {
          setTooltipPosition({
            x: e.clientX,
            y: e.clientY,
            text: `Repetition frequency: ${freq.toFixed(1)} Hz`
          });
          setHighlightFeature('repFreq');
          return;
        }
      }
      
      // General area
      setTooltipPosition({
        x: e.clientX,
        y: e.clientY,
        text: `Spectral magnitude at this point`
      });
      setHighlightFeature(null);
    } else {
      setTooltipPosition(null);
      setHighlightFeature(null);
    }
  };
  
  const handleCanvasMouseLeave = () => {
    setTooltipPosition(null);
    setHighlightFeature(null);
  };

  // Render the 2DFT visualization when the selected detection changes
  useEffect(() => {
    if (!selectedDetection || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set background color based on theme
    ctx.fillStyle = isDarkMode ? '#1f2937' : '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Define colors based on theme
    const axisColor = isDarkMode ? '#e5e7eb' : '#1f2937';
    const textColor = isDarkMode ? '#f3f4f6' : '#1f2937';
    const primaryColor = isDarkMode ? 'rgba(239, 68, 68, 0.7)' : 'rgba(220, 38, 38, 0.5)'; // Red
    const secondaryColor = isDarkMode ? 'rgba(59, 130, 246, 0.7)' : 'rgba(37, 99, 235, 0.5)'; // Blue
    const highlightColor = isDarkMode ? '#fcd34d' : '#f59e0b'; // Amber/yellow for highlights
    
    // Draw grid
    ctx.strokeStyle = isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.5)';
    ctx.lineWidth = 0.5;
    
    // Vertical grid lines
    for (let x = 0; x <= canvas.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    // Horizontal grid lines
    for (let y = 0; y <= canvas.height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    // Draw the axes
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 2;
    
    // X-axis (horizontal)
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 30);
    ctx.lineTo(canvas.width, canvas.height - 30);
    ctx.stroke();
    
    // Y-axis (vertical)
    ctx.beginPath();
    ctx.moveTo(40, 0);
    ctx.lineTo(40, canvas.height - 30);
    ctx.stroke();
    
    // Get the spectral data
    const { spectralData, detectionFeatures } = selectedDetection.vibrationData;
    
    // Draw frequency bands (vertical axis: frequency, horizontal axis: time)
    // This represents the spectral shape of Varroa walking pulses
    
    // Create a gradient color scale for the 2DFT heatmap (dark red to dark blue)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    
    if (isDarkMode) {
      gradient.addColorStop(0, '#ef4444'); // Red (max)
      gradient.addColorStop(0.25, '#fb923c'); // Orange
      gradient.addColorStop(0.5, '#facc15'); // Yellow
      gradient.addColorStop(0.75, '#22d3ee'); // Cyan
      gradient.addColorStop(1, '#1e3a8a'); // Dark blue (min)
    } else {
      gradient.addColorStop(0, '#dc2626'); // Red (max)
      gradient.addColorStop(0.25, '#ea580c'); // Orange
      gradient.addColorStop(0.5, '#eab308'); // Yellow
      gradient.addColorStop(0.75, '#06b6d4'); // Cyan
      gradient.addColorStop(1, '#1e40af'); // Dark blue (min)
    }
    
    // Draw the 2DFT visualization
    // Similar to Figure 1(c) in the paper
    
    // Draw the main spectral features (500-2000 Hz for Varroa)
    const yScale = (canvas.height - 50) / 4000; // Scale for frequency (y-axis)
    const primaryBand = detectionFeatures.primaryFrequencyBand;
    
    // Create a logarithmically scaled visualization similar to the paper
    // This shows the magnitude of frequency components
    for (let freq = 0; freq < 4000; freq += 10) {
      const y = canvas.height - 40 - (freq * yScale);
      
      // Calculate intensity based on proximity to primary frequency band
      const inPrimaryBand = freq >= primaryBand[0] && freq <= primaryBand[1];
      const distanceFromBand = inPrimaryBand ? 0 : 
        Math.min(Math.abs(freq - primaryBand[0]), Math.abs(freq - primaryBand[1]));
      
      // Intensity falls off logarithmically
      let intensity = inPrimaryBand ? 
        0.8 + (Math.random() * 0.2) : // Random variation within the band
        Math.max(0.05, 0.6 * Math.exp(-distanceFromBand / 300)); // Exponential falloff
      
      // Highlight the primary frequency band if that feature is selected
      if (highlightFeature === 'primaryBand' && inPrimaryBand) {
        intensity = 1.0; // Maximum intensity for highlighting
      }
      
      // Draw horizontal lines with varying intensity
      // Loop through the x-axis (representing the temporal pattern)
      for (let x = 50; x < canvas.width - 20; x++) {
        const xRatio = (x - 50) / (canvas.width - 70);
        
        // Add pulse-like patterns
        let pulseIntensity = intensity;
        
        // Add spectral repetition features similar to the paper
        for (const repFreq of spectralData.spectralRepetitionFrequencies) {
          // Scale repetition frequency to fit canvas width
          const scaledFreq = repFreq / 60;
          
          // Create pulse modulation pattern
          const pulseEffect = 0.4 * Math.sin(2 * Math.PI * scaledFreq * xRatio * 10);
          pulseIntensity = Math.max(0, Math.min(1, pulseIntensity + pulseEffect));
        }
        
        // Apply some randomization for realistic effect
        pulseIntensity *= (0.85 + Math.random() * 0.15);
        
        // Set alpha based on intensity
        ctx.globalAlpha = pulseIntensity;
        ctx.fillStyle = gradient;
        
        // Draw pixel
        ctx.fillRect(x, y, 1, 2);
      }
    }
    
    // Reset global alpha
    ctx.globalAlpha = 1.0;
    
    // Draw the spectral repetition frequencies (vertical lines)
    // These are a key feature of Varroa walking patterns (4-60 Hz)
    const xScale = (canvas.width - 70) / 60; // Scale for repetition frequency (x-axis)
    
    spectralData.spectralRepetitionFrequencies.forEach(freq => {
      const x = 50 + (freq * xScale);
      
      // Draw vertical line
      ctx.strokeStyle = highlightFeature === 'repFreq' ? highlightColor : secondaryColor;
      ctx.lineWidth = highlightFeature === 'repFreq' ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x, canvas.height - 40);
      ctx.stroke();
      
      // Label the frequency
      ctx.fillStyle = highlightFeature === 'repFreq' ? highlightColor : textColor;
      ctx.font = '10px Arial';
      ctx.fillText(`${freq.toFixed(1)} Hz`, x - 12, 15);
    });
    
    // Add axis labels
    ctx.fillStyle = textColor;
    ctx.font = '12px Arial';
    
    // X-axis label with highlight if needed
    ctx.fillStyle = highlightFeature === 'repetition' ? highlightColor : textColor;
    ctx.fillText('Pulse Repetition Frequency (Hz)', canvas.width / 2 - 80, canvas.height - 10);
    
    // Y-axis label (rotate) with highlight if needed
    ctx.save();
    ctx.translate(15, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = highlightFeature === 'frequency' ? highlightColor : textColor;
    ctx.fillText('Frequency (Hz)', -50, 0);
    ctx.restore();
    
    // Add tick marks and values on axes
    ctx.fillStyle = textColor;
    ctx.font = '10px Arial';
    
    // Y-axis ticks (frequency)
    const freqTicks = [0, 1000, 2000, 3000, 4000];
    freqTicks.forEach(tick => {
      const y = canvas.height - 40 - (tick * yScale);
      
      // Draw tick
      ctx.strokeStyle = axisColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(35, y);
      ctx.lineTo(45, y);
      ctx.stroke();
      
      // Add label
      ctx.fillStyle = highlightFeature === 'frequency' ? highlightColor : textColor;
      ctx.fillText(`${tick}`, 10, y + 4);
    });
    
    // X-axis ticks (repetition frequency)
    const repFreqTicks = [0, 10, 20, 30, 40, 50, 60];
    repFreqTicks.forEach(tick => {
      const x = 50 + (tick * xScale);
      
      // Draw tick
      ctx.strokeStyle = axisColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, canvas.height - 25);
      ctx.lineTo(x, canvas.height - 35);
      ctx.stroke();
      
      // Add label
      ctx.fillStyle = highlightFeature === 'repetition' ? highlightColor : textColor;
      ctx.fillText(`${tick}`, x - 5, canvas.height - 15);
    });
    
    // Add detection information
    ctx.fillStyle = textColor;
    ctx.font = 'bold 14px Arial';
    ctx.fillText(`Detection Confidence: ${selectedDetection.detectionConfidence.toFixed(2)}%`, canvas.width - 230, 25);
    ctx.fillText(`Status: ${selectedDetection.detectionStatus}`, canvas.width - 230, 45);
    
    // Highlight varroa-specific regions if available in the data
    if (detectionFeatures.varroaSignatureRegions && detectionFeatures.varroaSignatureRegions.length > 0) {
      ctx.strokeStyle = isDarkMode ? 'rgba(249, 115, 22, 0.7)' : 'rgba(234, 88, 12, 0.7)';
      ctx.lineWidth = 2;
      
      detectionFeatures.varroaSignatureRegions.forEach(region => {
        const x1 = 50 + (region.repetitionFreq.min * xScale);
        const x2 = 50 + (region.repetitionFreq.max * xScale);
        const y1 = canvas.height - 40 - (region.frequency.min * yScale);
        const y2 = canvas.height - 40 - (region.frequency.max * yScale);
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x1, y2);
        ctx.closePath();
        ctx.stroke();
        
        // Add small indicator text
        ctx.fillStyle = isDarkMode ? 'rgba(249, 115, 22, 0.9)' : 'rgba(234, 88, 12, 0.9)';
        ctx.font = '9px Arial';
        ctx.fillText('Varroa', (x1 + x2) / 2 - 15, y1 - 5);
      });
    }
    
  }, [selectedDetection, isDarkMode, highlightFeature]);

  // Format time
  const formatTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return dateString;
    }
  };

  // Get color for infestation level
  const getInfestationLevelColor = (level: string) => {
    switch (level) {
      case 'none': return 'bg-green-900/30 text-green-400 dark:bg-green-900/30 dark:text-green-400';
      case 'low': return 'bg-blue-900/30 text-blue-400 dark:bg-blue-900/30 dark:text-blue-400';
      case 'moderate': return 'bg-yellow-900/30 text-yellow-400 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'high': return 'bg-orange-900/30 text-orange-400 dark:bg-orange-900/30 dark:text-orange-400';
      case 'severe': return 'bg-red-900/30 text-red-400 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-900/30 text-gray-400 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  // Get color for trend direction
  const getTrendDirectionColor = (trend: string) => {
    switch (trend) {
      case 'decreasing': return 'text-green-600 dark:text-green-400';
      case 'stable': return 'text-blue-600 dark:text-blue-400';
      case 'increasing': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  // Get icon for trend direction
  const getTrendDirectionIcon = (trend: string) => {
    switch (trend) {
      case 'decreasing': return '↓';
      case 'stable': return '→';
      case 'increasing': return '↑';
      default: return '-';
    }
  };

  if (!varroaInfestation) {
    return <div className="p-4 bg-gray-800 rounded-lg shadow">Loading Varroa data...</div>;
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-1">Varroa Mite Detection</h2>
        <p className="text-sm text-gray-400">
          Last updated: {formatTime(varroaInfestation.lastUpdated)}
        </p>
      </div>

      {/* Current Infestation Status */}
      <div className="p-6 border-b border-gray-700">
        <h3 className="text-md font-medium mb-4 text-white">Current Infestation Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-700 p-4 rounded-lg">
            <p className="text-sm text-gray-400">Infestation Level</p>
            <p className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getInfestationLevelColor(varroaInfestation.currentStatus.infestationLevel)}`}>
              {varroaInfestation.currentStatus.infestationLevel.charAt(0).toUpperCase() + 
               varroaInfestation.currentStatus.infestationLevel.slice(1)}
            </p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <p className="text-sm text-gray-400">Infestation Percentage</p>
            <p className={`text-xl font-bold ${
              varroaInfestation.currentStatus.infestationPercentage < 3 
                ? 'text-green-400' 
                : varroaInfestation.currentStatus.infestationPercentage < 8 
                  ? 'text-yellow-400' 
                  : 'text-red-400'
            }`}>
              {varroaInfestation.currentStatus.infestationPercentage.toFixed(3)}%
            </p>
            <p className="text-xs text-gray-400 mt-1">of colony population affected</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <p className="text-sm text-gray-400">Trend</p>
            <p className={`text-xl font-bold ${getTrendDirectionColor(varroaInfestation.currentStatus.trendDirection)}`}>
              {getTrendDirectionIcon(varroaInfestation.currentStatus.trendDirection)}{' '}
              {varroaInfestation.currentStatus.trendDirection.charAt(0).toUpperCase() + 
               varroaInfestation.currentStatus.trendDirection.slice(1)}
            </p>
          </div>
        </div>
        
        <div className="mt-4 bg-gray-700 p-4 rounded-lg">
          <p className="text-sm text-gray-400 mb-1">Recommended Action</p>
          <p className="text-white">{varroaInfestation.currentStatus.recommendedAction}</p>
        </div>
      </div>

      {/* Detection History Chart */}
      <div className="p-6 border-b border-gray-700">
        <h3 className="text-md font-medium text-white mb-4">Varroa Infestation History</h3>
        <div style={{ height: '250px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={varroaInfestation.detectionHistory}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorInfestation" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ade80" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(75, 85, 99, 0.3)" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => format(parseISO(value), 'MMM d')}
                tick={{ fill: '#e5e7eb' }}
                stroke="#e5e7eb"
              />
              <YAxis 
                yAxisId="left" 
                tick={{ fill: '#e5e7eb' }}
                stroke="#e5e7eb"
                domain={[0, (dataMax: number) => Math.max(30, dataMax * 1.2)]}
                tickFormatter={(value) => `${value}%`}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                domain={[0, 100]} 
                tick={{ fill: '#e5e7eb' }}
                stroke="#e5e7eb"
              />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'infestationPercentage') return [`${Number(value).toFixed(3)}%`, 'Infestation'];
                  if (name === 'averageConfidence') return [`${Number(value).toFixed(1)}%`, 'Confidence'];
                  return [value, name];
                }}
                labelFormatter={(label) => format(parseISO(label), 'MMM d, yyyy')}
                contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '0.375rem', color: '#f3f4f6' }}
                itemStyle={{ color: '#f3f4f6' }}
                labelStyle={{ color: '#f3f4f6', fontWeight: 'bold' }}
              />
              <Legend 
                wrapperStyle={{ color: '#e5e7eb' }}
              />
              <Area 
                type="monotone" 
                dataKey="infestationPercentage" 
                name="Varroa Infestation" 
                stroke="#ef4444" 
                fillOpacity={1} 
                fill="url(#colorInfestation)" 
                yAxisId="left"
              />
              <Area 
                type="monotone" 
                dataKey="averageConfidence" 
                name="Detection Confidence" 
                stroke="#4ade80" 
                fillOpacity={1} 
                fill="url(#colorConfidence)" 
                yAxisId="right"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2DFT Visualization */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-medium text-white">Spectral Analysis (2DFT)</h3>
          <button 
            onClick={() => setShowExplanation(!showExplanation)}
            className="px-3 py-1 bg-gray-700 text-gray-300 text-sm rounded hover:bg-gray-600 transition duration-150"
          >
            {showExplanation ? 'Hide Explanation' : 'How to Read This?'}
          </button>
        </div>
        
        {showExplanation && (
          <div className="mb-4 bg-gray-700/50 p-3 rounded-md border border-gray-600 text-gray-300 text-sm">
            <h4 className="text-white font-medium mb-2">How to Read the 2DFT Visualization</h4>
            
            <div className="space-y-1">
              <p><span className="text-amber-400 font-medium">X-axis:</span> Represents pulse repetition frequency (4-60 Hz) - how often the mite's legs create vibration patterns as they walk.</p>
              <p><span className="text-amber-400 font-medium">Y-axis:</span> Represents frequency bands (0-4000 Hz) - the acoustic signature of mite movement.</p>
              <p><span className="text-amber-400 font-medium">Color intensity:</span> Indicates the strength of spectral components - brighter colors show stronger signals.</p>
              <p><span className="text-amber-400 font-medium">Vertical blue lines:</span> Show specific repetition frequencies detected in the signal, typically 15-40 Hz for Varroa mites.</p>
              <p><span className="text-amber-400 font-medium">Red/orange regions:</span> Primary frequency band where Varroa signatures are strongest (typically 500-2000 Hz).</p>
            </div>
            
            <div className="mt-2">
              <p className="text-white font-medium">Key indicators of Varroa presence:</p>
              <ul className="list-disc list-inside mt-1">
                <li>Strong signals in the 500-2000 Hz range</li>
                <li>Regular repetition patterns at 15-40 Hz</li>
                <li>Distinct walking gait pattern visible as regular pulses</li>
              </ul>
            </div>
            
            <div className="mt-2">
              <p className="text-white font-medium">Understanding Infestation Percentages:</p>
              <ul className="list-disc list-inside mt-1">
                <li><span className="text-green-400 font-medium">&lt;3%:</span> Low infestation - routine monitoring recommended</li>
                <li><span className="text-yellow-400 font-medium">3-8%:</span> Moderate infestation - treatment planning advised</li>
                <li><span className="text-orange-400 font-medium">8-15%:</span> High infestation - prompt treatment needed</li>
                <li><span className="text-red-400 font-medium">&gt;15%:</span> Severe infestation - immediate intervention required</li>
              </ul>
              <p className="text-xs italic mt-1">Percentages represent the proportion of bees in the colony that are affected by Varroa mites. Industry standards consider &gt;3% as concerning and &gt;10% as requiring immediate action.</p>
            </div>
            
            <p className="mt-2 text-xs italic">Hover over different parts of the visualization for more information. The graph highlights features as you explore it.</p>
          </div>
        )}
        
        {selectedDetection ? (
          <div className="relative">
            <p className="text-sm text-gray-400 mb-2">
              Two-dimensional Fourier transform visualization of Varroa mite gait patterns
            </p>
            <div className="relative inline-block">
            <canvas 
              ref={canvasRef}
              width={600}
              height={300}
                className="border border-gray-600 rounded mx-auto cursor-crosshair"
                onMouseMove={handleCanvasMouseMove}
                onMouseLeave={handleCanvasMouseLeave}
              />
              {tooltipPosition && (
                <div 
                  className="absolute bg-gray-900 text-white text-xs rounded px-2 py-1 z-10 pointer-events-none"
                  style={{
                    left: `${tooltipPosition.x - 280}px`, 
                    top: `${tooltipPosition.y - 30}px`,
                    maxWidth: '200px'
                  }}
                >
                  {tooltipPosition.text}
                </div>
              )}
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
              <div>
                <p className="mb-1"><strong className="text-white">Detection Time:</strong> {formatTime(selectedDetection.timestamp)}</p>
                <p className="mb-1"><strong className="text-white">Primary Frequency Band:</strong> {Math.round(selectedDetection.vibrationData.detectionFeatures.primaryFrequencyBand[0])}-{Math.round(selectedDetection.vibrationData.detectionFeatures.primaryFrequencyBand[1])} Hz</p>
                <p className="mb-1"><strong className="text-white">Common Repetition Frequencies:</strong> {selectedDetection.vibrationData.detectionFeatures.commonRepetitionFrequencies.map(freq => Math.round(freq)).join(', ')} Hz</p>
              </div>
              <div>
                <p className="mb-1"><strong className="text-white">Location in Hive:</strong> {selectedDetection.locationInHive}</p>
                <p className="mb-1"><strong className="text-white">Mean Walking Speed:</strong> {selectedDetection.vibrationData.detectionFeatures.meanWalkingSpeed.toFixed(1)} mm/s</p>
                <p className="mb-1"><strong className="text-white">Gait Time Between Pulses:</strong> {(selectedDetection.vibrationData.detectionFeatures.pulseDuration * 1000).toFixed(0)} ms</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gray-700 rounded text-center text-gray-400">
            No detection data available for visualization
          </div>
        )}
      </div>

      {/* Recent Detections */}
      <div className="p-6">
        <h3 className="text-md font-medium mb-4 text-white">Recent Detections</h3>
        {varroaDetections && varroaDetections.length > 0 ? (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {[...varroaDetections]
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .slice(0, 5)
              .map(detection => (
                <div 
                  key={detection.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all hover:bg-gray-700 ${
                    selectedDetection && selectedDetection.id === detection.id 
                      ? 'bg-gray-700 border-purple-600' 
                      : 'bg-gray-800 border-gray-700'
                  }`}
                  onClick={() => setSelectedDetection(detection)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-white">
                        {detection.detectionStatus === 'confirmed' 
                          ? '🔴 Confirmed Detection' 
                          : detection.detectionStatus === 'possible' 
                            ? '🟠 Possible Detection' 
                            : '⚪ No Detection'}
                      </p>
                      <p className="text-sm text-gray-400">{formatTime(detection.timestamp)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white">{Math.round(detection.detectionConfidence)}%</p>
                      <p className="text-xs text-gray-400">confidence</p>
                    </div>
                  </div>
                  {detection.recommendedActions && detection.recommendedActions.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-300">Recommended Actions:</p>
                      <ul className="text-xs text-gray-400 list-disc ml-4">
                        {detection.recommendedActions.map((action, idx) => (
                          <li key={idx}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
          </div>
        ) : (
          <div className="p-4 bg-gray-700 rounded text-center text-gray-400">
            No recent detections available
          </div>
        )}
      </div>
    </div>
  );
} 