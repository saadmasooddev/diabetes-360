import { Card } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { mockPatientProfile } from "@/mocks/doctorDashboard";
import { Sidebar } from "@/components/layout/Sidebar";

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
      <rect
        x="2"
        y="4"
        width="20"
        height="22"
        rx="3"
        fill="#00856F"
      />
      <rect x="6" y="2" width="12" height="4" rx="1" fill="#B2DFDB" />
    </svg>
  );
}

function getAlertStyle(alert: string) {
  if (alert.includes("Glucose") || alert.includes("Spikes")) {
    return {
      background: "#FFEBEE",
      color: "#E53935",
      border: "1px solid #FFCDD2",
    };
  }
  if (alert.includes("Activity")) {
    return {
      background: "#F5F5F5",
      color: "#37474F",
      border: "1px solid #E0E0E0",
    };
  }
  return {
    background: "#E8F5E9",
    color: "#43A047",
    border: "1px solid #C8E6C9",
  };
}

export function PatientProfile() {
  const patient = mockPatientProfile;

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
                    background:
                      patient.riskLevel === "High Risk" ? "#E53935" : "#43A047",
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
                      ...getAlertStyle(alert),
                      fontSize: "11px",
                      fontWeight: 500,
                    }}
                    data-testid={`badge-alert-${index}`}
                  >
                    {alert}
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

              <div className="overflow-x-auto">
                <table className="w-full" data-testid="table-appointments">
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
                  <tbody>
                    {patient.appointments.map((apt, index) => (
                      <tr key={index} data-testid={`row-appointment-${index}`}>
                        <td
                          className="py-2"
                          style={{
                            fontSize: "15px",
                            fontWeight: 600,
                            color: "#00856F",
                          }}
                        >
                          {apt.time}
                        </td>
                        <td
                          className="py-2"
                          style={{
                            fontSize: "15px",
                            fontWeight: 500,
                            color: "#37474F",
                          }}
                        >
                          {apt.date}
                        </td>
                        <td
                          className="py-2"
                          style={{
                            fontSize: "15px",
                            fontWeight: 600,
                            color: "#00856F",
                          }}
                        >
                          {apt.type}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Glucose Trend Chart */}
          <Card
            className="p-6"
            style={{
              background: "#FFFFFF",
              borderRadius: "16px",
              border: "1px solid rgba(0, 0, 0, 0.08)",
            }}
            data-testid="card-glucose-trend"
          >
            <h3
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "#00453A",
                marginBottom: "20px",
              }}
            >
              Glucose Trend
            </h3>

            <div style={{ width: "100%", height: "256px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={patient.glucoseTrend}
                  margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
                >
                  <defs>
                    <linearGradient
                      id="glucoseGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#F8BBD9" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#F8BBD9" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#E8E8E8"
                    horizontal={true}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="time"
                    axisLine={{ stroke: "#E0E0E0" }}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#78909C" }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 70, 80, 90, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#78909C" }}
                    tickFormatter={(value) =>
                      value === 0 ? "0" : `${value}mg/dL`
                    }
                    width={65}
                  />
                  <Area
                    type="natural"
                    dataKey="value"
                    stroke="#F48FB1"
                    strokeWidth={2.5}
                    fill="url(#glucoseGradient)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

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
              <div className="flex items-center justify-between mb-6">
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

              <div className="grid grid-cols-3 gap-4">
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
              <div className="flex items-center gap-3 mb-5">
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

              <ul className="space-y-3">
                {patient.recentNotes.map((note, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3"
                    data-testid={`note-item-${index}`}
                  >
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                      style={{ background: "#00856F" }}
                    />
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 400,
                        color: "#546E7A",
                      }}
                    >
                      {note}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
