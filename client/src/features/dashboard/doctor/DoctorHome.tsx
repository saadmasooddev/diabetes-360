import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Loader2 } from "lucide-react";
import {
  mockPatientAlerts,
  mockPatients,
} from "@/mocks/doctorDashboard";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAppointments } from "@/hooks/mutations/useAppointments";
import { useLocation } from "wouter";
import { ROUTES } from "@/config/routes";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/utils/permissions";
import { AccessControl } from "@/components/common/AccessControl";

function ToggleIcon() {
  return (
    <svg width="28" height="16" viewBox="0 0 28 16" fill="none">
      <rect width="28" height="16" rx="8" fill="#00453A" />
      <circle cx="20" cy="8" r="6" fill="white" />
    </svg>
  );
}

function AlertDotsIcon() {
  return (
    <svg width="24" height="16" viewBox="0 0 24 16" fill="none">
      <circle cx="8" cy="8" r="6" fill="#EF5350" />
      <circle cx="16" cy="8" r="6" fill="#FFCDD2" />
    </svg>
  );
}

function PatientsIcon() {
  return (
    <svg width="28" height="16" viewBox="0 0 28 16" fill="none">
      <circle cx="8" cy="8" r="6" fill="#00453A" />
      <circle cx="18" cy="8" r="6" fill="#B2DFDB" />
    </svg>
  );
}

export function DoctorHome() {
  const [, navigate] = useLocation();
  const { hasAnyPermission } = usePermissions();
  const hasReadAllAppointments = hasAnyPermission([PERMISSIONS.READ_ALL_APPOINTMENTS]);

  const { data, isLoading, error } = useAppointments({
    page: 1,
    limit: 3,
  });

  const appointments = data?.appointments || [];
  const appointmentsCount = data?.total || 0;

  const handleViewAllAppointments = () => {
    const viewAllAppointmentsPage = hasReadAllAppointments ? ROUTES.ADMIN_APPOINTMENTS : ROUTES.DOCTOR_APPOINTMENTS;
    navigate(viewAllAppointmentsPage);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Today's Appointments */}
          <Card
            className="p-6"
            style={{
              background: "#FFFFFF",
              borderRadius: "16px",
              border: "1px solid rgba(0, 0, 0, 0.08)",
            }}
            data-testid="card-todays-appointments"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <ToggleIcon />
                <h2
                  style={{
                    fontSize: "22px",
                    fontWeight: 700,
                    color: "#00453A",
                  }}
                >
                  Today's Appointments
                </h2>
              </div>
              {isLoading ? (
                <Loader2 className="h-12 w-12 animate-spin text-[#00453A]" />
              ) : (
                <span
                  style={{
                    fontSize: "48px",
                    fontWeight: 300,
                    color: "#00453A",
                  }}
                  data-testid="text-appointments-count"
                >
                  {String(appointmentsCount).padStart(2, "0")}
                </span>
              )}
            </div>

            {/* Appointments Table */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#00856F]" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500">
                Failed to load appointments. Please try again.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="table-appointments">
                  <thead>
                    <tr>
                      <th
                        className="text-left pb-4"
                        style={{
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "#78909C",
                        }}
                      >
                        Time
                      </th>
                      <th
                        className="text-left pb-4"
                        style={{
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "#78909C",
                        }}
                      >
                        Date
                      </th>
                      <th
                        className="text-left pb-4"
                        style={{
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "#78909C",
                        }}
                      >
                        Patient Name
                      </th>
                      <AccessControl permission={PERMISSIONS.READ_ALL_APPOINTMENTS}>
                        <th
                          className="text-left pb-4"
                          style={{
                            fontSize: "14px",
                            fontWeight: 500,
                            color: "#78909C",
                          }}
                        >
                          Doctor Name
                        </th>
                      </AccessControl>
                      <th
                        className="text-left pb-4"
                        style={{
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "#78909C",
                        }}
                      >
                        In Person/Video Call
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.length === 0 ? (
                      <tr>
                        <td
                          colSpan={hasReadAllAppointments ? 5 : 4}
                          className="py-8 text-center text-gray-500"
                        >
                          No appointments scheduled for today
                        </td>
                      </tr>
                    ) : (
                      appointments.map((appointment) => (
                        <tr
                          key={appointment.id}
                          className="border-t border-gray-100"
                          data-testid={`row-appointment-${appointment.id}`}
                        >
                          <td
                            className="py-4"
                            style={{
                              fontSize: "15px",
                              fontWeight: 600,
                              color: "#00856F",
                            }}
                          >
                            {appointment.time}
                          </td>
                          <td
                            className="py-4"
                            style={{
                              fontSize: "15px",
                              fontWeight: 500,
                              color: "#37474F",
                            }}
                          >
                            {appointment.date}
                          </td>
                          <td
                            className="py-4"
                            style={{
                              fontSize: "15px",
                              fontWeight: 600,
                              color: "#00856F",
                            }}
                          >
                            {appointment.patientName}
                          </td>
                          <AccessControl permission={PERMISSIONS.READ_ALL_APPOINTMENTS}>
                            <td
                              className="py-4"
                              style={{
                                fontSize: "15px",
                                fontWeight: 600,
                                color: "#00856F",
                              }}
                            >
                              {appointment.doctorName}
                            </td>
                          </AccessControl>
                          <td
                            className="py-4"
                            style={{
                              fontSize: "15px",
                              fontWeight: 600,
                              color: appointment.type === "Video Call" ? "#00856F" : "#37474F",
                            }}
                          >
                            {appointment.type}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <Button
              className="w-full mt-4"
              style={{
                background: "#00856F",
                color: "#FFFFFF",
                borderRadius: "24px",
                height: "44px",
                fontSize: "14px",
                fontWeight: 600,
              }}
              data-testid="button-view-all-appointments"
              onClick={handleViewAllAppointments}
            >
              View all Appointments
            </Button>
          </Card>

          {/* Bottom Row: Patient Alerts + Patients */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Patient Alerts */}
            <Card
              className="p-6"
              style={{
                background: "#FFFFFF",
                borderRadius: "16px",
                border: "1px solid rgba(0, 0, 0, 0.08)",
              }}
              data-testid="card-patient-alerts"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <AlertDotsIcon />
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "#00453A",
                    }}
                  >
                    Patient Alerts
                  </h3>
                </div>
                <span
                  style={{
                    fontSize: "32px",
                    fontWeight: 300,
                    color: "#00856F",
                  }}
                  data-testid="text-alerts-count"
                >
                  {String(mockPatientAlerts.length - 1).padStart(2, "0")}
                </span>
              </div>

              {/* Alerts Table */}
              <div className="space-y-0">
                <div className="grid grid-cols-2 pb-3">
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#78909C",
                    }}
                  >
                    Patient Name
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#78909C",
                    }}
                  >
                    Alert
                  </span>
                </div>

                {mockPatientAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="grid grid-cols-2 py-3 border-t border-gray-100 items-center"
                    data-testid={`row-alert-${alert.id}`}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "#37474F",
                      }}
                    >
                      {alert.patientName}
                    </span>
                    <span
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium"
                      style={{
                        background: alert.severity === "high" ? "#FFEBEE" : "#FFF8E1",
                        color: alert.severity === "high" ? "#E53935" : "#F9A825",
                        fontSize: "12px",
                        fontWeight: 500,
                        maxWidth: "fit-content",
                      }}
                    >
                      {alert.alert}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                className="w-full mt-4"
                style={{
                  background: "#00856F",
                  color: "#FFFFFF",
                  borderRadius: "24px",
                  height: "44px",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
                data-testid="button-view-all-alerts"
              >
                View all Alerts
              </Button>
            </Card>

            {/* Patients */}
            <Card
              className="p-6"
              style={{
                background: "#FFFFFF",
                borderRadius: "16px",
                border: "1px solid rgba(0, 0, 0, 0.08)",
              }}
              data-testid="card-patients"
            >
              <div className="flex items-center gap-3 mb-5">
                <PatientsIcon />
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#00453A",
                  }}
                >
                  Patients
                </h3>
              </div>

              <div className="space-y-3">
                {mockPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between py-2"
                    data-testid={`row-patient-${patient.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback
                          style={{
                            background: "#00856F",
                            color: "#FFFFFF",
                            fontSize: "14px",
                            fontWeight: 600,
                          }}
                        >
                          {patient.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p
                          style={{
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "#00453A",
                          }}
                        >
                          {patient.name}
                        </p>
                        <p
                          style={{
                            fontSize: "12px",
                            fontWeight: 400,
                            color: "#00856F",
                          }}
                        >
                          Age : {patient.age}, {patient.condition}
                        </p>
                      </div>
                    </div>
                    <span
                      className="px-3 py-1.5 rounded-full text-xs font-medium"
                      style={{
                        background:
                          patient.status === "Needs Attention"
                            ? "#FFEBEE"
                            : "#E8F5E9",
                        color:
                          patient.status === "Needs Attention"
                            ? "#E53935"
                            : "#43A047",
                        fontSize: "11px",
                        fontWeight: 500,
                      }}
                    >
                      {patient.status === "Needs Attention"
                        ? "Needs\nAttention"
                        : "Stable"}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                className="w-full mt-4"
                style={{
                  background: "#00856F",
                  color: "#FFFFFF",
                  borderRadius: "24px",
                  height: "44px",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
                data-testid="button-view-all-patients"
              >
                View all Patients
              </Button>
            </Card>
          </div>

          {/* Add Availability Button */}
          <Button
            className="w-full"
            style={{
              background: "#00856F",
              color: "#FFFFFF",
              borderRadius: "16px",
              height: "56px",
              fontSize: "16px",
              fontWeight: 600,
            }}
            data-testid="button-add-availability"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Availability
          </Button>
        </div>
      </main>
    </div>
  );
}
