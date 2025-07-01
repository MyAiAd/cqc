// JOURNEY PROGRESS CHART COMPONENT
// Simple chart for visualizing compliance journey progress over time

import React from 'react';
import { JourneyProgressData } from '../../types/journey';

interface JourneyProgressChartProps {
  data: JourneyProgressData;
  height?: number;
  showVelocity?: boolean;
}

const JourneyProgressChart: React.FC<JourneyProgressChartProps> = ({
  data,
  height = 300,
  showVelocity = false
}) => {
  if (!data.dates.length) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No progress data available
      </div>
    );
  }

  // Calculate chart dimensions
  const chartWidth = 800;
  const chartHeight = height - 80; // Leave space for labels
  const padding = 60;
  const plotWidth = chartWidth - (padding * 2);
  const plotHeight = chartHeight - (padding * 2);

  // Get data ranges
  const maxProgress = Math.max(...data.progress_percentages, 100);
  const maxSteps = Math.max(...data.completed_steps, 1);
  const maxEvidence = Math.max(...data.evidence_linked, 1);

  // Create SVG path for progress line
  const createPath = (values: number[], maxValue: number) => {
    if (values.length === 0) return '';
    
    const points = values.map((value, index) => {
      const x = padding + (index / (values.length - 1)) * plotWidth;
      const y = padding + plotHeight - (value / maxValue) * plotHeight;
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  };

  const progressPath = createPath(data.progress_percentages, maxProgress);
  const stepsPath = createPath(data.completed_steps, maxSteps);
  const evidencePath = createPath(data.evidence_linked, maxEvidence);

  // Create grid lines
  const gridLines = [];
  for (let i = 0; i <= 5; i++) {
    const y = padding + (i / 5) * plotHeight;
    gridLines.push(
      <line
        key={`grid-${i}`}
        x1={padding}
        y1={y}
        x2={padding + plotWidth}
        y2={y}
        stroke="#e5e7eb"
        strokeWidth="1"
      />
    );
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-full">
      {/* Chart */}
      <div className="overflow-x-auto">
        <svg width={chartWidth} height={height} className="border rounded-lg bg-white">
          {/* Grid lines */}
          {gridLines}
          
          {/* Y-axis labels */}
          {[0, 20, 40, 60, 80, 100].map((value, index) => (
            <text
              key={`y-label-${index}`}
              x={padding - 10}
              y={padding + plotHeight - (value / 100) * plotHeight + 5}
              textAnchor="end"
              className="text-xs fill-gray-600"
            >
              {value}%
            </text>
          ))}
          
          {/* X-axis labels */}
          {data.dates.map((date, index) => {
            if (index % Math.ceil(data.dates.length / 6) === 0) {
              const x = padding + (index / (data.dates.length - 1)) * plotWidth;
              return (
                <text
                  key={`x-label-${index}`}
                  x={x}
                  y={height - 20}
                  textAnchor="middle"
                  className="text-xs fill-gray-600"
                >
                  {formatDate(date)}
                </text>
              );
            }
            return null;
          })}
          
          {/* Progress line */}
          <path
            d={progressPath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Progress points */}
          {data.progress_percentages.map((value, index) => {
            const x = padding + (index / (data.progress_percentages.length - 1)) * plotWidth;
            const y = padding + plotHeight - (value / maxProgress) * plotHeight;
            return (
              <circle
                key={`progress-point-${index}`}
                cx={x}
                cy={y}
                r="4"
                fill="#3b82f6"
                className="hover:r-6 transition-all cursor-pointer"
              >
                <title>{`${formatDate(data.dates[index])}: ${value.toFixed(1)}%`}</title>
              </circle>
            );
          })}
          
          {/* Steps completed line (secondary) */}
          <path
            d={stepsPath}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeDasharray="5,5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.7"
          />
          
          {/* Evidence linked line (tertiary) */}
          <path
            d={evidencePath}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeDasharray="3,3"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.7"
          />
          
          {/* Axis lines */}
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={padding + plotHeight}
            stroke="#374151"
            strokeWidth="2"
          />
          <line
            x1={padding}
            y1={padding + plotHeight}
            x2={padding + plotWidth}
            y2={padding + plotHeight}
            stroke="#374151"
            strokeWidth="2"
          />
        </svg>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-0.5 bg-blue-600 mr-2"></div>
          <span className="text-gray-700">Progress %</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-0.5 bg-green-600 border-dashed border-t-2 border-green-600 mr-2"></div>
          <span className="text-gray-700">Steps Completed</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-0.5 bg-yellow-600 border-dotted border-t-2 border-yellow-600 mr-2"></div>
          <span className="text-gray-700">Evidence Linked</span>
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-4 text-center">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {data.progress_percentages[data.progress_percentages.length - 1]?.toFixed(1) || 0}%
          </div>
          <div className="text-sm text-blue-700">Current Progress</div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {data.completed_steps[data.completed_steps.length - 1] || 0}
          </div>
          <div className="text-sm text-green-700">Steps Completed</div>
        </div>
        <div className="bg-yellow-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {data.evidence_linked[data.evidence_linked.length - 1] || 0}
          </div>
          <div className="text-sm text-yellow-700">Evidence Items</div>
        </div>
      </div>
      
      {/* Velocity indicator */}
      {showVelocity && data.velocity.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-2">Recent Velocity</div>
          <div className="flex items-center">
            <div className="text-lg font-semibold text-gray-900">
              {data.velocity[data.velocity.length - 1]?.toFixed(1) || 0}
            </div>
            <div className="text-sm text-gray-600 ml-2">steps/week</div>
            {data.velocity.length > 1 && (
              <div className={`ml-4 text-sm ${
                data.velocity[data.velocity.length - 1] > data.velocity[data.velocity.length - 2]
                  ? 'text-green-600' : 'text-red-600'
              }`}>
                {data.velocity[data.velocity.length - 1] > data.velocity[data.velocity.length - 2] 
                  ? '↗ Accelerating' : '↘ Slowing'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default JourneyProgressChart; 