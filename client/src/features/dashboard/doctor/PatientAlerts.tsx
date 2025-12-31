import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";

interface PatientAlert {
  id: string;
  name: string;
  age: number;
  diabetesType: string;
  tags: string[];
  status: "high-risk" | "stable" | "needs-attention";
}

const mockPatientAlerts: PatientAlert[] = [
  {
    id: "1",
    name: "Arsalan Khan",
    age: 46,
    diabetesType: "Diabetes Type 1",
    tags: ["Glucose Spikes", "No Activity in last 24hrs", "Missed Meals"],
    status: "high-risk",
  },
  {
    id: "2",
    name: "Arsalan Khan",
    age: 46,
    diabetesType: "Diabetes Type 1",
    tags: ["Glucose Spikes", "No Activity in last 24hrs", "Missed Meals"],
    status: "high-risk",
  },
  {
    id: "3",
    name: "Arsalan Khan",
    age: 46,
    diabetesType: "Diabetes Type 1",
    tags: ["Glucose Spikes", "No Activity in last 24hrs", "Missed Meals"],
    status: "stable",
  },
  {
    id: "4",
    name: "Arsalan Khan",
    age: 46,
    diabetesType: "Diabetes Type 1",
    tags: ["Glucose Spikes", "No Activity in last 24hrs", "Missed Meals"],
    status: "stable",
  },
];

function StatusCard({
  title,
  count,
  variant,
}: {
  title: string;
  count: number;
  variant: "high-risk" | "stable" | "needs-attention";
}) {
  const colors = {
    "high-risk": {
      bg: "rgba(255, 107, 107, 0.08)",
      border: "#FF6B6B",
      text: "#FF6B6B",
    },
    stable: {
      bg: "rgba(0, 133, 111, 0.08)",
      border: "#00856F",
      text: "#00856F",
    },
    "needs-attention": {
      bg: "rgba(255, 183, 77, 0.08)",
      border: "#FFB74D",
      text: "#FFB74D",
    },
  };

  const color = colors[variant];

  return (
    <Card
      className="p-6 text-center"
      style={{
        background: color.bg,
        borderRadius: "16px",
        border: `2px solid ${color.border}`,
      }}
      data-testid={`card-status-${variant}`}
    >
      <h3
        style={{
          fontSize: "18px",
          fontWeight: 600,
          color: color.text,
          marginBottom: "8px",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: "48px",
          fontWeight: 300,
          color: color.text,
          lineHeight: 1,
        }}
      >
        {count.toString().padStart(2, "0")}
      </p>
    </Card>
  );
}

function AlertTag({ label, variant }: { label: string; variant: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    "Glucose Spikes": { bg: "rgba(0, 133, 111, 0.1)", text: "#00856F" },
    "No Activity in last 24hrs": { bg: "rgba(255, 183, 77, 0.15)", text: "#E6A23C" },
    "Missed Meals": { bg: "rgba(255, 107, 107, 0.1)", text: "#FF6B6B" },
  };

  const color = colors[label] || { bg: "#F5F5F5", text: "#666" };

  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 12px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: 500,
        background: color.bg,
        color: color.text,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function PatientAlertCard({ patient }: { patient: PatientAlert }) {
  return (
    <Card
      className="p-4 cursor-pointer hover:shadow-md transition-shadow"
      style={{
        background: "#FFFFFF",
        borderRadius: "12px",
        border: "1px solid rgba(0, 0, 0, 0.06)",
      }}
      data-testid={`card-patient-alert-${patient.id}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#00453A",
              marginBottom: "4px",
            }}
          >
            {patient.name}
          </h4>
          <p
            style={{
              fontSize: "13px",
              color: "#78909C",
              marginBottom: "12px",
            }}
          >
            Age : {patient.age},{" "}
            <span style={{ color: "#00856F" }}>{patient.diabetesType}</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {patient.tags.map((tag, index) => (
              <AlertTag key={index} label={tag} variant={tag} />
            ))}
          </div>
        </div>
        <ChevronRight size={20} color="#B0BEC5" className="flex-shrink-0 mt-2" />
      </div>
    </Card>
  );
}

export function PatientAlerts() {
  const highRiskPatients = mockPatientAlerts.filter(
    (p) => p.status === "high-risk"
  );
  const stablePatients = mockPatientAlerts.filter((p) => p.status === "stable");
  const needsAttentionPatients = mockPatientAlerts.filter(
    (p) => p.status === "needs-attention"
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: "#00453A",
              marginBottom: "32px",
            }}
            data-testid="text-patient-alerts-title"
          >
            Patient Alerts
          </h1>

          <div className="grid grid-cols-3 gap-6 mb-8">
            <StatusCard
              title="High Risk"
              count={highRiskPatients.length}
              variant="high-risk"
            />
            <StatusCard
              title="Stable"
              count={stablePatients.length}
              variant="stable"
            />
            <StatusCard
              title="Needs Attention"
              count={needsAttentionPatients.length}
              variant="needs-attention"
            />
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-4">
              {highRiskPatients.map((patient) => (
                <PatientAlertCard key={patient.id} patient={patient} />
              ))}
            </div>

            <div className="space-y-4">
              {stablePatients.map((patient) => (
                <PatientAlertCard key={patient.id} patient={patient} />
              ))}
            </div>

            <div className="space-y-4">
              {needsAttentionPatients.length === 0 ? (
                <Card
                  className="p-4"
                  style={{
                    background: "#FFFFFF",
                    borderRadius: "12px",
                    border: "1px solid rgba(0, 0, 0, 0.06)",
                  }}
                >
                  <p
                    style={{
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "#00453A",
                      marginBottom: "4px",
                    }}
                  >
                    Arsalan Khan
                  </p>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#78909C",
                      marginBottom: "12px",
                    }}
                  >
                    Age : 46,{" "}
                    <span style={{ color: "#00856F" }}>Diabetes Type 1</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <AlertTag label="Glucose Spikes" variant="Glucose Spikes" />
                    <AlertTag
                      label="No Activity in last 24hrs"
                      variant="No Activity in last 24hrs"
                    />
                    <AlertTag label="Missed Meals" variant="Missed Meals" />
                  </div>
                </Card>
              ) : (
                needsAttentionPatients.map((patient) => (
                  <PatientAlertCard key={patient.id} patient={patient} />
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
