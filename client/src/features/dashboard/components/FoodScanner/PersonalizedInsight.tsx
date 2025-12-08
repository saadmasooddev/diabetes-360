import { Card } from '@/components/ui/card';
import { Lock, AlertTriangle } from 'lucide-react';
import type { ScanResult } from '@/mocks/scanResults';

interface PersonalizedInsightProps {
  scanResult: ScanResult | null;
  isPremium: boolean;
}

export function PersonalizedInsight({ scanResult, isPremium }: PersonalizedInsightProps) {
  const insight = scanResult?.personalizedInsight;

  return (
    <Card
      className="p-6 relative overflow-hidden"
      style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid rgba(0, 0, 0, 0.1)',
      }}
      data-testid="card-personalized-insight"
    >
      {!isPremium && (
        <div
          className="absolute inset-0 flex items-center justify-center z-10"
          style={{ background: 'rgba(255, 255, 255, 0.92)' }}
        >
          <div className="text-center">
            <div
              className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center"
              style={{ background: '#E8F5F3' }}
            >
              <Lock size={28} color="#00856F" />
            </div>
            <p
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#546E7A',
              }}
            >
              Subscribe to Premium
            </p>
          </div>
        </div>
      )}

      <h3
        style={{
          fontSize: '24px',
          fontWeight: 700,
          color: '#00453A',
          marginBottom: '20px',
        }}
      >
        Personalized Insight
      </h3>

      <div className="flex gap-4">
        {/* Left Column - Calories */}
        <div
          className="relative overflow-hidden"
          style={{
            width: '120px',
            minHeight: '140px',
            background: '#F8FAFA',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <span
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#00453A',
              display: 'block',
              marginBottom: '8px',
            }}
          >
            Calories
          </span>
          <div className="flex flex-col" style={{ flex: 1, justifyContent: 'center' }}>
            {(() => {
              const caloriesText = insight?.calories || '0';
              // Extract number and unit - handle formats like "1071kcal", "1071 kcal", "1071", etc.
              const match = caloriesText.match(/^(\d+)\s*(.*)$/);
              const number = match ? match[1] : caloriesText.replace(/\D/g, '') || '0';
              const unit = match ? match[2].trim() : (caloriesText.replace(/\d/g, '') || '');
              const numDigits = number.length;

              // Adjust font size based on number of digits
              let fontSize = '42px';
              if (numDigits >= 4) {
                fontSize = '28px';
              } else if (numDigits >= 3) {
                fontSize = '36px';
              }

              return (
                <>
                  <span
                    className=' flex justify-center items-center'
                    style={{
                      fontSize: fontSize,
                      fontWeight: 700,
                      color: '#00453A',
                      lineHeight: 1,
                    }}
                  >
                    {number}
                  </span>
                  {unit && (
                    <span
                      className=' flex justify-center items-center '
                      style={{
                        fontSize: '12px',
                        fontWeight: 500,
                        color: '#546E7A',
                        lineHeight: 1.2,
                        marginTop: '2px',
                      }}
                    >
                      {unit}
                    </span>
                  )}
                </>
              );
            })()}
          </div>
          {/* Wave decoration at bottom */}
          <svg
            viewBox="0 0 120 40"
            className="absolute bottom-0 left-0 right-0"
            style={{ width: '100%', height: '40px' }}
            preserveAspectRatio="none"
          >
            <path
              d="M0,20 Q15,5 30,15 T60,15 T90,20 T120,15 L120,40 L0,40 Z"
              fill="rgba(0, 133, 111, 0.15)"
            />
            <path
              d="M0,25 Q15,12 30,20 T60,18 T90,25 T120,20 L120,40 L0,40 Z"
              fill="rgba(0, 133, 111, 0.1)"
            />
          </svg>
        </div>

        {/* Right Column - Recommendation and Suggestions */}
        <div className="flex-1 flex flex-col gap-3">
          {/* Recommendation Row */}
          {insight?.recommendation && (
            <div
              style={{
                background: '#F8FAFA',
                borderRadius: '8px',
                padding: '12px 16px',
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#00453A',
                  }}
                >
                  {insight.recommendation}
                </span>
              </div>
            </div>
          )}

          {/* Suggestion Section */}
          {insight?.suggestedFoods && insight?.suggestedFoods.length > 0 && (
            <div
              style={{
                background: '#F8FAFA',
                borderRadius: '8px',
                padding: '12px 16px',
              }}
            >
              <>
                <p
                  style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#78909C',
                    marginBottom: '10px',
                  }}
                >
                  Suggested Foods
                </p>
                <div className="  flex flex-col justify-center items-start pt-1 gap-2 custom-scrollbar overflow-y-scroll h-[80px] ">
                  {insight?.suggestedFoods.map((food, index) => (
                    <div key={index} className="text-center">
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 500,
                          color: '#00856F',
                          display: 'block',
                        }}
                      >
                        {food.name}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

