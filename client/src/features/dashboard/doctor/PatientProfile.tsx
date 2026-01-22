import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { Sidebar } from "@/components/layout/Sidebar";
import { usePatientById } from "@/hooks/mutations/usePatients";
import { useRoute } from "wouter";
import { ROUTES } from "@/config/routes";
import { Loader2 } from "lucide-react";
import {
  HealthTrendChart,
  type IntervalType,
  formatTimeLabel,
  getDateRange,
} from "../components/HealthTrendChart";
import { useMemo, useState } from "react";
import { convertSlotTypeToLabel, formatDate, formatTime12 } from "@/lib/utils";

function MoonIcon() {
  return (
    <svg width="28" height="20" viewBox="0 0 28 20" fill="none">
      <circle cx="10" cy="10" r="8" fill="#00453A" />
      <circle cx="18" cy="10" r="6" fill="#B2DFDB" />
    </svg>
  );
}

function ToggleIcon() {
  return (
    <svg width="32" height="20" viewBox="0 0 32 20" fill="none">
      <rect width="32" height="20" rx="10" fill="#00856F" />
      <circle cx="22" cy="10" r="7" fill="white" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg width="24" height="28" viewBox="0 0 24 28" fill="none">
      <rect x="2" y="4" width="20" height="22" rx="3" fill="#00856F" />
      <rect x="6" y="2" width="12" height="4" rx="1" fill="#B2DFDB" />
    </svg>
  );
}

function getAlertStyle(alertColor: string) {
  // Convert hex color to rgba for background
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return {
    background: hexToRgba(alertColor, 0.1),
    color: alertColor,
    border: `1px solid ${hexToRgba(alertColor, 0.3)}`,
  };
}

export function PatientProfile() {
  const [matchDoctor, paramsDoctor] = useRoute<{ profileId: string }>(
    ROUTES.DOCTOR_PATIENT_PROFILE,
  );
  const [matchAdmin, paramsAdmin] = useRoute<{ profileId: string }>(
    ROUTES.ADMIN_PATIENT_PROFILE,
  );
  const [glucoseInterval, setGlucoseInterval] = useState<IntervalType>("daily");
  const [isAllSummariesDialogOpen, setIsAllSummariesDialogOpen] = useState(false);
  const glucoseDateRange = getDateRange(glucoseInterval);
  const isAdmin = !!matchAdmin;

  const patientId =
    (matchDoctor ? paramsDoctor?.profileId : paramsAdmin?.profileId) || null;
  const {
    data: patient,
    isLoading,
    error,
  } = usePatientById(patientId, glucoseDateRange);

  const glucoseData = useMemo(() => {
    if (!patient?.glucoseTrend || patient.glucoseTrend.length === 0) return [];

    // Reverse the array so oldest is on left, newest on right
    return [...patient.glucoseTrend].reverse().map((m) => {
      const date = new Date(m.recordedAt);
      return {
        time: formatTimeLabel(date, glucoseInterval),
        value: typeof m.value === 'string' ? parseFloat(m.value) : (m.value || 0),
      };
    });
  }, [patient?.glucoseTrend, glucoseInterval]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="max-w-5xl mx-auto flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#00856F]" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="max-w-5xl mx-auto text-center py-12 text-red-500">
            Failed to load patient profile. Please try again.
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Page Title */}
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: "#00453A",
              marginBottom: "24px",
            }}
            data-testid="text-patient-profile-title"
          >
            Patient Profile
          </h1>

          {/* Top Row: Patient Info + Appointments Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Patient Info Card */}
            <Card
              className="p-6"
              style={{
                background: "#FFFFFF",
                borderRadius: "16px",
                border: "1px solid rgba(0, 0, 0, 0.08)",
              }}
              data-testid="card-patient-info"
            >
              <div className="flex items-start justify-between mb-4">
                <MoonIcon />
                <span
                  className="px-4 py-1.5 rounded-full"
                  style={{
                    background: patient.riskLevelColor,
                    color: "#FFFFFF",
                    fontSize: "12px",
                    fontWeight: 500,
                  }}
                  data-testid="badge-risk-level"
                >
                  {patient.riskLevel}
                </span>
              </div>

              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "#00453A",
                  marginBottom: "4px",
                }}
                data-testid="text-patient-name"
              >
                {patient.name}
              </h2>
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 400,
                  color: "#00856F",
                  marginBottom: "16px",
                }}
                data-testid="text-patient-details"
              >
                Age : {patient.age}, {patient.condition}
              </p>

              <div className="flex flex-wrap gap-2">
                {patient.alerts.map((alert, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 rounded-lg"
                    style={{
                      ...getAlertStyle(alert.color),
                      fontSize: "11px",
                      fontWeight: 500,
                    }}
                    data-testid={`badge-alert-${index}`}
                  >
                    {alert.text}
                  </span>
                ))}
              </div>
            </Card>

            {/* Appointments Summary Card */}
            <Card
              className="p-6"
              style={{
                background: "#FFFFFF",
                borderRadius: "16px",
                border: "1px solid rgba(0, 0, 0, 0.08)",
              }}
              data-testid="card-appointments-summary"
            >
              <div className="flex items-center justify-between mb-4">
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#00453A",
                  }}
                >
                  Appointments Summary
                </h3>
                <ToggleIcon />
              </div>

              <div className="overflow-x-auto " >
                <table className="w-full " data-testid="table-appointments">
                  <thead>
                    <tr>
                      <th
                        className="text-left pb-3"
                        style={{
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "#78909C",
                        }}
                      >
                        Time
                      </th>
                      <th
                        className="text-left pb-3"
                        style={{
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "#78909C",
                        }}
                      >
                        Date
                      </th>
                      <th
                        className="text-left pb-3"
                        style={{
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "#78909C",
                        }}
                      >
                        In Person/Video Call
                      </th>
                    </tr>
                  </thead>
                  <tbody >
                    {patient.appointments.map((apt, index) => {
                      const date = new Date(apt.slot.availability.date)
                      const time = apt.slot.startTime
                      const type = apt.slot.slotType.type
                      return (
                        <tr key={index} data-testid={`row-appointment-${index}`}>
                          <td
                            className="py-2"
                            style={{
                              fontSize: "15px",
                              fontWeight: 600,
                              color: "#00856F",
                            }}
                          >
                            {formatTime12(time)}
                          </td>
                          <td
                            className="py-2"
                            style={{
                              fontSize: "15px",
                              fontWeight: 500,
                              color: "#37474F",
                            }}
                          >
                            {formatDate(date, "yyyy-MM-dd")}
                          </td>
                          <td
                            className="py-2"
                            style={{
                              fontSize: "15px",
                              fontWeight: 600,
                              color: "#00856F",
                            }}
                          >
                            {convertSlotTypeToLabel(type)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Glucose Trend Chart */}

          <HealthTrendChart
            title="Glucose Trend"
            data={glucoseData}
            gradientId="glucoseGradient"
            testId="card-glucose-trend"
            height={250}
            yAxisConfig={{
              domain: [0, 120],
              ticks: [0, 70, 80, 90, 100],
              label: "100mg/dL",
            }}
            interval={glucoseInterval}
            onIntervalChange={setGlucoseInterval}
            recommendedTarget={undefined}
            userTarget={undefined}
          />

          {/* Bottom Row: Glucose Summary + Recent Notes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Glucose Summary Card */}
            <Card
              className="p-6"
              style={{
                background: "#FFFFFF",
                borderRadius: "16px",
                border: "1px solid rgba(0, 0, 0, 0.08)",
              }}
              data-testid="card-glucose-summary"
            >
              <div className="flex items-center justify-between mb-6 lg:mb-0 ">
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#00453A",
                  }}
                >
                  Glucose Summary
                </h3>
                <ToggleIcon />
              </div>

              <div className="grid grid-cols-3 gap-4 lg:w-full lg:h-full lg:place-items-center ">
                <div className="text-center">
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#78909C",
                      marginBottom: "8px",
                    }}
                  >
                    Highs
                  </p>
                  <p
                    style={{
                      fontSize: "36px",
                      fontWeight: 700,
                      color: "#00856F",
                    }}
                    data-testid="text-highs"
                  >
                    {patient.glucoseSummary.highs}%
                  </p>
                </div>
                <div className="text-center">
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#78909C",
                      marginBottom: "8px",
                    }}
                  >
                    Lows
                  </p>
                  <p
                    style={{
                      fontSize: "36px",
                      fontWeight: 700,
                      color: "#00856F",
                    }}
                    data-testid="text-lows"
                  >
                    {patient.glucoseSummary.lows}%
                  </p>
                </div>
                <div className="text-center">
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#78909C",
                      marginBottom: "8px",
                    }}
                  >
                    Time in Range
                  </p>
                  <p
                    style={{
                      fontSize: "36px",
                      fontWeight: 700,
                      color: "#00856F",
                    }}
                    data-testid="text-time-in-range"
                  >
                    {patient.glucoseSummary.timeInRange}%
                  </p>
                </div>
              </div>
            </Card>

            {/* Recent Notes Card */}
            <Card
              className="p-6"
              style={{
                background: "#FFFFFF",
                borderRadius: "16px",
                border: "1px solid rgba(0, 0, 0, 0.08)",
              }}
              data-testid="card-recent-notes"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <ClipboardIcon />
                  <h3
                    style={{
                      fontSize: "20px",
                      fontWeight: 700,
                      color: "#00453A",
                    }}
                  >
                    Recent Notes
                  </h3>
                </div>
                {patient.consultationSummaries && patient.consultationSummaries.length > 3 && (
                  <Button
                    variant="ghost"
                    onClick={() => setIsAllSummariesDialogOpen(true)}
                    style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "#00856F",
                      padding: "4px 8px",
                    }}
                  >
                    See All
                  </Button>
                )}
              </div>

              {patient.recentNotes.length === 0 ? (
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 400,
                    color: "#78909C",
                    textAlign: "center",
                    padding: "20px 0",
                  }}
                >
                  No consultation summaries available yet.
                </div>
              ) : (
                <ul className="space-y-3 overflow-y-scroll " style={{ maxHeight: "200px", overflowY: "auto" }}>
                  {patient.recentNotes.slice(0, 3).map((note, index) => {
                    const summaryData = patient.consultationSummaries?.[index];
                    return (
                      <li
                        key={index}
                        className="flex items-start gap-3"
                        data-testid={`note-item-${index}`}
                      >
                        <div
                          className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                          style={{ background: "#00856F" }}
                        />
                        <div className="flex-1 min-w-0">
                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: 400,
                              color: "#546E7A",
                              display: "block",
                            }}
                          >
                            {note}
                          </span>
                          {summaryData && (
                            <div className="mt-1 flex items-center gap-2 flex-wrap">
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 400,
                                  color: "#78909C",
                                }}
                              >
                                {formatDate(new Date(summaryData.date), "MMM dd, yyyy")}
                              </span>
                              {isAdmin && summaryData.physicianName && (
                                <>
                                  <span
                                    style={{
                                      fontSize: "11px",
                                      color: "#78909C",
                                    }}
                                  >
                                    •
                                  </span>
                                  <span
                                    style={{
                                      fontSize: "11px",
                                      fontWeight: 500,
                                      color: "#00856F",
                                    }}
                                  >
                                    Dr. {summaryData.physicianName}
                                  </span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>
        </div>

        {/* All Summaries Dialog */}
        <Dialog open={isAllSummariesDialogOpen} onOpenChange={setIsAllSummariesDialogOpen}>
          <DialogContent
            style={{
              maxWidth: "600px",
              maxHeight: "80vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <DialogHeader>
              <DialogTitle
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#00453A",
                }}
              >
                All Consultation Summaries
              </DialogTitle>
            </DialogHeader>
            <div
              style={{
                overflowY: "auto",
                flex: 1,
                padding: "0 24px 24px 24px",
              }}
            >
              {patient.consultationSummaries && patient.consultationSummaries.length > 0 ? (
                <ul className="space-y-4">
                  {patient.consultationSummaries.map((summary, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 pb-4 border-b last:border-b-0"
                      style={{
                        borderColor: "rgba(0, 0, 0, 0.08)",
                      }}
                    >
                      <div
                        className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{ background: "#00856F" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          style={{
                            fontSize: "14px",
                            fontWeight: 400,
                            color: "#546E7A",
                            marginBottom: "8px",
                            lineHeight: "1.5",
                          }}
                        >
                          {summary.summary}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: 400,
                              color: "#78909C",
                            }}
                          >
                            {formatDate(new Date(summary.date), "MMM dd, yyyy")}
                          </span>
                          {isAdmin && summary.physicianName && (
                            <>
                              <span
                                style={{
                                  fontSize: "12px",
                                  color: "#78909C",
                                }}
                              >
                                •
                              </span>
                              <span
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 500,
                                  color: "#00856F",
                                }}
                              >
                                Dr. {summary.physicianName}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 400,
                    color: "#78909C",
                    textAlign: "center",
                    padding: "40px 0",
                  }}
                >
                  No consultation summaries available yet.
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main >
    </div >
  );
}
