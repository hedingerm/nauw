import React from 'react'

interface BarChartProps {
  data: Array<{
    label: string
    value: number
  }>
  height?: number
  color?: string
}

export function SimpleBarChart({ data, height = 200, color = 'hsl(var(--primary))' }: BarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value))
  
  return (
    <div className="w-full" style={{ height }}>
      <div className="flex items-end justify-between h-full gap-2">
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center justify-end">
            <div className="text-xs font-medium mb-1">{item.value}</div>
            <div 
              className="w-full rounded-t transition-all duration-300"
              style={{ 
                height: `${(item.value / maxValue) * 80}%`,
                backgroundColor: color
              }}
            />
            <div className="text-xs text-muted-foreground mt-2 text-center">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface LineChartProps {
  data: Array<{
    label: string
    value: number
  }>
  height?: number
  color?: string
}

export function SimpleLineChart({ data, height = 200, color = 'hsl(var(--primary))' }: LineChartProps) {
  const maxValue = Math.max(...data.map(d => d.value))
  const minValue = Math.min(...data.map(d => d.value))
  const range = maxValue - minValue || 1
  
  return (
    <div className="w-full relative" style={{ height }}>
      <svg className="w-full h-full">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={data.map((item, index) => {
            const x = (index / (data.length - 1)) * 100
            const y = 100 - ((item.value - minValue) / range) * 90
            return `${x},${y}`
          }).join(' ')}
        />
        {data.map((item, index) => {
          const x = (index / (data.length - 1)) * 100
          const y = 100 - ((item.value - minValue) / range) * 90
          return (
            <circle
              key={index}
              cx={`${x}%`}
              cy={`${y}%`}
              r="4"
              fill={color}
            />
          )
        })}
      </svg>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground">
        {data.map((item, index) => (
          <span key={index}>{item.label}</span>
        ))}
      </div>
    </div>
  )
}