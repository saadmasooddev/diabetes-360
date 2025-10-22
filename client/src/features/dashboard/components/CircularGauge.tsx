interface CircularGaugeProps {
  value: number;
  maxValue: number;
  label: string;
  unit: string;
  size?: number;
  metricType?: string;
}

export function CircularGauge({
  value,
  maxValue,
  label,
  unit,
  size = 160,
  metricType = "",
}: CircularGaugeProps) {
  const percentage = Math.min((value / maxValue) * 100, 100);
  const radius = 60;
  const strokeWidth = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const testId = metricType
    ? `gauge-${metricType}-${label.toLowerCase().replace(/\s/g, "-")}`
    : `gauge-${label.toLowerCase().replace(/\s/g, "-")}`;

  return (
    <div className="flex flex-col items-center" data-testid={testId}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg 
          className="transform -rotate-90" 
          width={size} 
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ overflow: 'visible' }}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E0F2F1"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#00856F"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span style={{ fontSize: "20px", fontWeight: 700, color: "#00453A" }}>
            {value}
            {unit}
          </span>
        </div>
      </div>
      <p
        className="mt-3 text-center"
        style={{ fontSize: "14px", fontWeight: 500, color: "#546E7A" }}
      >
        {label}
      </p>
    </div>
  );
}
