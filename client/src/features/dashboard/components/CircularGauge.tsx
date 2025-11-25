interface CircularGaugeProps {
  value: number;
  maxValue: number;
  label: string;
  unit: string;
  size?: number;
  metricType?: string;
  recommendedTarget?: number;
  userTarget?: number;
}

export function CircularGauge({
  value,
  maxValue,
  label,
  unit,
  size = 160,
  metricType = "",
  recommendedTarget,
  userTarget,
}: CircularGaugeProps) {
  const percentage = Math.min((value / maxValue) * 100, 100);
  const radius = size * 0.32; // 32% of size to leave padding
  const strokeWidth = size * 0.075; // 7.5% of size
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;


  // Determine status color based on target comparison - using theme colors
  const getStatusColor = () => {
    return '#00856F'
  };

  const testId = metricType
    ? `gauge-${metricType}-${label.toLowerCase().replace(/\s/g, "-")}`
    : `gauge-${label.toLowerCase().replace(/\s/g, "-")}`;

  return (
    <div
      className="flex flex-col items-center justify-center"
      data-testid={testId}
      style={{
        width: '100%',
        minWidth: size + 20,
        padding: '8px',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="relative flex items-center justify-center"
        style={{
          width: size,
          height: size,
          flexShrink: 0,
        }}
      >
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{
            overflow: 'visible',
            display: 'block',
          }}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(0, 133, 111, 0.15)"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getStatusColor()}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span style={{ fontSize: size * 0.12, fontWeight: 700, color: "#00453A", lineHeight: 1.2 }}>
            {value.toFixed(value % 1 === 0 ? 0 : 1)}
            {unit}
          </span>
          {(recommendedTarget || userTarget) && (
            <span style={{ fontSize: size * 0.075, fontWeight: 500, color: "#546E7A", marginTop: '4px' }}>
              Target: {userTarget || recommendedTarget}{unit}
            </span>
          )}
        </div>
      </div>
      <p
        className="mt-3 text-center"
        style={{ fontSize: "14px", fontWeight: 600, color: "#00453A" }}
      >
        {label}
      </p>
      {/* {(recommendedTarget || userTarget) && (
        <div className="mt-2 text-center">
          <span
            style={{
              fontSize: "12px",
              fontWeight: 500,
              color: getStatusColor(),
              padding: '4px 8px',
              borderRadius: '6px',
              background: `${getStatusColor()}15`,
            }}
          >
            {value >= (userTarget || recommendedTarget || 0) * 0.9
              ? '✓ On Track'
              : value >= (userTarget || recommendedTarget || 0) * 0.7
                ? '⚠ Getting There'
                : '⚠ Needs Improvement'}
          </span>
        </div>
      )} */}
    </div>
  );
}
