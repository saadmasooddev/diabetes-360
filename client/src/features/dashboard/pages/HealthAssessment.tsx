import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/card";
import { Droplet, Activity, Heart } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useAggregatedStatistics } from "@/hooks/mutations/useHealth";
import { CircularGauge } from "../components/CircularGauge";

export function HealthAssessment() {
  const user = useAuthStore((state) => state.user);
  const isPaidUser = user?.paymentType !== 'free' && user?.paymentType;
  const { data: statistics } = useAggregatedStatistics();

  // Helper to get target for a metric type
  const getTarget = (metricType: 'glucose' | 'steps' | 'water_intake' | 'heart_rate') => {
    const userTarget = statistics?.targets?.user.find(t => t.metricType === metricType);
    const recommendedTarget = statistics?.targets?.recommended.find(t => t.metricType === metricType);
    return {
      user: userTarget ? parseFloat(userTarget.targetValue) : undefined,
      recommended: recommendedTarget ? parseFloat(recommendedTarget.targetValue) : undefined,
    };
  };

  // Use statistics from API or default to 0 if no data
  const glucoseDaily = statistics?.glucose.daily ?? 0;
  const glucoseWeekly = statistics?.glucose.weekly ?? 0;
  const glucoseMonthly = statistics?.glucose.monthly ?? 0;
  const glucoseTargets = getTarget('glucose');

  // Water is in liters already from the API, convert to string with 1 decimal
  const waterDaily = (statistics?.water.daily ?? 0).toFixed(1);
  const waterWeekly = (statistics?.water.weekly ?? 0).toFixed(1);
  const waterMonthly = (statistics?.water.monthly ?? 0).toFixed(1);
  const waterTargets = getTarget('water_intake');

  const stepsDaily = statistics?.steps.daily ?? 0;
  const stepsWeekly = statistics?.steps.weekly ?? 0;
  const stepsMonthly = statistics?.steps.monthly ?? 0;
  const stepsTargets = getTarget('steps');

  const heartRateDaily = statistics?.heartRate.daily ?? 0;
  const heartRateWeekly = statistics?.heartRate.weekly ?? 0;
  const heartRateMonthly = statistics?.heartRate.monthly ?? 0;
  const heartRateTargets = getTarget('heart_rate');

  return (
    <div className="flex min-h-screen" style={{ background: "#F7F9F9" }}>
      <style>{`
        .scrollbar-thin::-webkit-scrollbar {
          height: 8px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(0, 133, 111, 0.05);
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(0, 133, 111, 0.3);
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 133, 111, 0.5);
        }
      `}</style>
      <Sidebar />

      <main className="flex-1 flex justify-center items-start pt-6 pb-8">
        <div className="w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1
              className="mb-2"
              style={{
                fontSize: "36px",
                fontWeight: 700,
                color: "#00453A",
                lineHeight: "44px",
                letterSpacing: "-0.02em",
              }}
              data-testid="title-health-assessment"
            >
              Health Assessment
            </h1>
            <p
              style={{
                fontSize: "16px",
                color: "#546E7A",
                lineHeight: "24px",
              }}
            >
              Comprehensive analysis of your health metrics and progress
            </p>
          </div>

          {/* Glucose Analysis Section */}
          <Card
            className="mb-8 p-6 lg:p-8 transition-all duration-300 hover:shadow-xl"
            style={{
              background: "#FFFFFF",
              border: "1px solid rgba(0, 133, 111, 0.12)",
              borderRadius: "16px",
              boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
            }}
            data-testid="section-glucose-analysis"
          >
            <div className="flex items-center gap-3 mb-6 pb-4 border-b" style={{ borderColor: 'rgba(0, 133, 111, 0.1)' }}>
              <div
                style={{
                  background: "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)",
                  borderRadius: "12px",
                  padding: "12px",
                }}
              >
                <Activity size={24} style={{ color: "#4CAF50" }} />
              </div>
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "#00453A",
                  margin: 0,
                }}
              >
                Glucose Analysis
              </h2>
            </div>
            <div
              className="overflow-x-auto pb-2 scrollbar-thin"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(0, 133, 111, 0.3) transparent',
              }}
            >
              <div className="flex gap-8 lg:gap-10" style={{ minWidth: 'min-content' }}>
                <div className="flex-shrink-0" style={{ minWidth: '200px' }}>
                  <CircularGauge
                    value={glucoseDaily}
                    maxValue={200}
                    label="Daily Average"
                    unit="mg/dL"
                    metricType="glucose"
                    size={180}
                    recommendedTarget={glucoseTargets.recommended}
                    userTarget={glucoseTargets.user}
                  />
                </div>
                <div className="flex-shrink-0" style={{ minWidth: '200px' }}>
                  <CircularGauge
                    value={glucoseWeekly}
                    maxValue={200}
                    label="Weekly Average"
                    unit="mg/dL"
                    metricType="glucose"
                    size={180}
                    recommendedTarget={glucoseTargets.recommended}
                    userTarget={glucoseTargets.user}
                  />
                </div>
                <div className="flex-shrink-0" style={{ minWidth: '200px' }}>
                  <CircularGauge
                    value={glucoseMonthly}
                    maxValue={200}
                    label="Monthly Average"
                    unit="mg/dL"
                    metricType="glucose"
                    size={180}
                    recommendedTarget={glucoseTargets.recommended}
                    userTarget={glucoseTargets.user}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Hydration and Activity Analysis */}
          <div className={`grid grid-cols-1 ${isPaidUser ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-6 mb-8`}>
            {/* Hydration Analysis */}
            <Card
              className="p-6 transition-all duration-300 hover:shadow-xl"
              style={{
                background: "#FFFFFF",
                border: "1px solid rgba(0, 133, 111, 0.12)",
                borderRadius: "16px",
                boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
              }}
              data-testid="section-hydration-analysis"
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b" style={{ borderColor: 'rgba(0, 133, 111, 0.1)' }}>
                <div
                  style={{
                    background: "linear-gradient(135deg, #E0F2F1 0%, #B2DFDB 100%)",
                    borderRadius: "12px",
                    padding: "10px",
                  }}
                >
                  <Droplet size={20} style={{ color: "#00856F" }} />
                </div>
                <h2
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#00453A",
                    margin: 0,
                  }}
                >
                  Hydration Analysis
                </h2>
              </div>
              <div
                className="overflow-x-auto pb-2 scrollbar-thin"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(0, 133, 111, 0.3) transparent',
                }}
              >
                <div className="flex gap-6 lg:gap-8" style={{ minWidth: 'min-content' }}>
                  <div className="flex-shrink-0" style={{ minWidth: '160px' }}>
                    <CircularGauge
                      value={parseFloat(waterDaily)}
                      maxValue={5}
                      label="Daily"
                      unit="L"
                      size={140}
                      metricType="hydration"
                      recommendedTarget={waterTargets.recommended}
                      userTarget={waterTargets.user}
                    />
                  </div>
                  <div className="flex-shrink-0" style={{ minWidth: '160px' }}>
                    <CircularGauge
                      value={parseFloat(waterWeekly)}
                      maxValue={5}
                      label="Weekly"
                      unit="L"
                      size={140}
                      metricType="hydration"
                      recommendedTarget={waterTargets.recommended}
                      userTarget={waterTargets.user}
                    />
                  </div>
                  <div className="flex-shrink-0" style={{ minWidth: '160px' }}>
                    <CircularGauge
                      value={parseFloat(waterMonthly)}
                      maxValue={5}
                      label="Monthly"
                      unit="L"
                      size={140}
                      metricType="hydration"
                      recommendedTarget={waterTargets.recommended}
                      userTarget={waterTargets.user}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Activity Analysis */}
            <Card
              className="p-6 transition-all duration-300 hover:shadow-xl"
              style={{
                background: "#FFFFFF",
                border: "1px solid rgba(0, 133, 111, 0.12)",
                borderRadius: "16px",
                boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
              }}
              data-testid="section-activity-analysis"
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b" style={{ borderColor: 'rgba(0, 133, 111, 0.1)' }}>
                <div
                  style={{
                    background: "linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)",
                    borderRadius: "12px",
                    padding: "10px",
                  }}
                >
                  <Activity size={20} style={{ color: "#2196F3" }} />
                </div>
                <h2
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#00453A",
                    margin: 0,
                  }}
                >
                  Activity Analysis
                </h2>
              </div>
              <div
                className="overflow-x-auto pb-2 scrollbar-thin"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(0, 133, 111, 0.3) transparent',
                }}
              >
                <div className="flex gap-6 lg:gap-8" style={{ minWidth: 'min-content' }}>
                  <div className="flex-shrink-0" style={{ minWidth: '160px' }}>
                    <CircularGauge
                      value={stepsDaily}
                      maxValue={15000}
                      label="Daily"
                      unit=" steps"
                      size={140}
                      metricType="activity"
                      recommendedTarget={stepsTargets.recommended}
                      userTarget={stepsTargets.user}
                    />
                  </div>
                  <div className="flex-shrink-0" style={{ minWidth: '160px' }}>
                    <CircularGauge
                      value={stepsWeekly}
                      maxValue={15000}
                      label="Weekly"
                      unit=" steps"
                      size={140}
                      metricType="activity"
                      recommendedTarget={stepsTargets.recommended}
                      userTarget={stepsTargets.user}
                    />
                  </div>
                  <div className="flex-shrink-0" style={{ minWidth: '160px' }}>
                    <CircularGauge
                      value={stepsMonthly}
                      maxValue={15000}
                      label="Monthly"
                      unit=" steps"
                      size={140}
                      metricType="activity"
                      recommendedTarget={stepsTargets.recommended}
                      userTarget={stepsTargets.user}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Heart Rate Analysis - Only for paid users */}
            {isPaidUser && (
              <Card
                className="p-6 transition-all duration-300 hover:shadow-xl"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(0, 133, 111, 0.12)",
                  borderRadius: "16px",
                  boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
                }}
                data-testid="section-heart-rate-analysis"
              >
                <div className="flex items-center gap-3 mb-6 pb-4 border-b" style={{ borderColor: 'rgba(0, 133, 111, 0.1)' }}>
                  <div
                    style={{
                      background: "linear-gradient(135deg, #FCE4EC 0%, #F8BBD0 100%)",
                      borderRadius: "12px",
                      padding: "10px",
                    }}
                  >
                    <Heart size={20} style={{ color: "#E91E63" }} />
                  </div>
                  <h2
                    style={{
                      fontSize: "20px",
                      fontWeight: 700,
                      color: "#00453A",
                      margin: 0,
                    }}
                  >
                    Heart Rate Analysis
                  </h2>
                </div>
                <div
                  className="overflow-x-auto pb-2 scrollbar-thin"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(0, 133, 111, 0.3) transparent',
                  }}
                >
                  <div className="flex gap-6 lg:gap-8" style={{ minWidth: 'min-content' }}>
                    <div className="flex-shrink-0" style={{ minWidth: '160px' }}>
                      <CircularGauge
                        value={heartRateDaily}
                        maxValue={200}
                        label="Daily"
                        unit=" BPM"
                        size={140}
                        metricType="heartRate"
                        recommendedTarget={heartRateTargets.recommended}
                        userTarget={heartRateTargets.user}
                      />
                    </div>
                    <div className="flex-shrink-0" style={{ minWidth: '160px' }}>
                      <CircularGauge
                        value={heartRateWeekly}
                        maxValue={200}
                        label="Weekly"
                        unit=" BPM"
                        size={140}
                        metricType="heartRate"
                        recommendedTarget={heartRateTargets.recommended}
                        userTarget={heartRateTargets.user}
                      />
                    </div>
                    <div className="flex-shrink-0" style={{ minWidth: '160px' }}>
                      <CircularGauge
                        value={heartRateMonthly}
                        maxValue={200}
                        label="Monthly"
                        unit=" BPM"
                        size={140}
                        metricType="heartRate"
                        recommendedTarget={heartRateTargets.recommended}
                        userTarget={heartRateTargets.user}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Summary Cards */}
          <div className={`grid grid-cols-1 md:grid-cols-2 ${isPaidUser ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6 mb-8`}>
            {/* Hydration Summary */}
            <Card
              className="p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
              style={{
                background: "linear-gradient(135deg, #E0F2F1 0%, #B2DFDB 100%)",
                border: "1px solid rgba(0, 133, 111, 0.2)",
                borderRadius: "16px",
                boxShadow: "0 2px 8px rgba(0, 133, 111, 0.1)",
              }}
              data-testid="card-hydration-summary"
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex items-center justify-center rounded-xl"
                  style={{
                    width: "52px",
                    height: "52px",
                    background: "#00856F",
                    boxShadow: "0 4px 8px rgba(0, 133, 111, 0.3)",
                  }}
                >
                  <Droplet
                    style={{ width: "26px", height: "26px", color: "#FFFFFF" }}
                  />
                </div>
                <div className="flex-1">
                  <h3
                    className="mb-2"
                    style={{
                      fontSize: "17px",
                      fontWeight: 700,
                      color: "#00453A",
                    }}
                  >
                    Hydration Summary
                  </h3>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#546E7A",
                      lineHeight: "22px",
                    }}
                  >
                    Your all time average is good! Please drink often to hydrate
                    more.
                  </p>
                </div>
              </div>
            </Card>

            {/* Glucose Summary */}
            <Card
              className="p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
              style={{
                background: "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)",
                border: "1px solid rgba(76, 175, 80, 0.2)",
                borderRadius: "16px",
                boxShadow: "0 2px 8px rgba(76, 175, 80, 0.1)",
              }}
              data-testid="card-glucose-summary"
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex items-center justify-center rounded-xl"
                  style={{
                    width: "52px",
                    height: "52px",
                    background: "#4CAF50",
                    boxShadow: "0 4px 8px rgba(76, 175, 80, 0.3)",
                  }}
                >
                  <Activity
                    style={{ width: "26px", height: "26px", color: "#FFFFFF" }}
                  />
                </div>
                <div className="flex-1">
                  <h3
                    className="mb-2"
                    style={{
                      fontSize: "17px",
                      fontWeight: 700,
                      color: "#00453A",
                    }}
                  >
                    Glucose Summary
                  </h3>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#546E7A",
                      lineHeight: "22px",
                    }}
                  >
                    Your all time average is good! Please maintain your glucose
                    levels.
                  </p>
                </div>
              </div>
            </Card>

            {/* Activity Summary */}
            <Card
              className="p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
              style={{
                background: "linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)",
                border: "1px solid rgba(33, 150, 243, 0.2)",
                borderRadius: "16px",
                boxShadow: "0 2px 8px rgba(33, 150, 243, 0.1)",
              }}
              data-testid="card-activity-summary"
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex items-center justify-center rounded-xl"
                  style={{
                    width: "52px",
                    height: "52px",
                    background: "#2196F3",
                    boxShadow: "0 4px 8px rgba(33, 150, 243, 0.3)",
                  }}
                >
                  <Activity
                    style={{ width: "26px", height: "26px", color: "#FFFFFF" }}
                  />
                </div>
                <div className="flex-1">
                  <h3
                    className="mb-2"
                    style={{
                      fontSize: "17px",
                      fontWeight: 700,
                      color: "#00453A",
                    }}
                  >
                    Activity Summary
                  </h3>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#546E7A",
                      lineHeight: "22px",
                    }}
                  >
                    Your all time average is good! Please try and be active as
                    much as you can!
                  </p>
                </div>
              </div>
            </Card>

            {/* Heart Rate Summary - Only for paid users */}
            {isPaidUser && (
              <Card
                className="p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(135deg, #FCE4EC 0%, #F8BBD0 100%)",
                  border: "1px solid rgba(233, 30, 99, 0.2)",
                  borderRadius: "16px",
                  boxShadow: "0 2px 8px rgba(233, 30, 99, 0.1)",
                }}
                data-testid="card-heart-rate-summary"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex items-center justify-center rounded-xl"
                    style={{
                      width: "52px",
                      height: "52px",
                      background: "#E91E63",
                      boxShadow: "0 4px 8px rgba(233, 30, 99, 0.3)",
                    }}
                  >
                    <Heart
                      style={{ width: "26px", height: "26px", color: "#FFFFFF" }}
                    />
                  </div>
                  <div className="flex-1">
                    <h3
                      className="mb-2"
                      style={{
                        fontSize: "17px",
                        fontWeight: 700,
                        color: "#00453A",
                      }}
                    >
                      Heart Rate Summary
                    </h3>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#546E7A",
                        lineHeight: "22px",
                      }}
                    >
                      Your heart rate averages are within normal range! Keep monitoring your cardiovascular health.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* What to Do Next Section */}
          <Card
            className="p-8 transition-all duration-300 hover:shadow-xl"
            style={{
              background: "linear-gradient(135deg, #FFFFFF 0%, #F7F9F9 100%)",
              border: "1px solid rgba(0, 133, 111, 0.12)",
              borderRadius: "16px",
              boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
            }}
            data-testid="section-what-to-do-next"
          >
            <h2
              className="mb-4"
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: "#00453A",
                letterSpacing: "-0.02em",
              }}
            >
              What to Do Next
            </h2>
            <p
              style={{
                fontSize: "16px",
                color: "#546E7A",
                lineHeight: "26px",
              }}
            >
              Continue tracking your health metrics regularly. Maintain a
              balanced diet, stay hydrated, and keep up with your physical
              activity. Consult with your healthcare provider if you notice any
              significant changes in your readings.
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
}
