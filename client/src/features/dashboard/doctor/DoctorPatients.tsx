import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  mockPatientsList,
  mockPatientsDisease,
  mockPatientsIndication,
} from "@/mocks/doctorDashboard";
import { Sidebar } from "@/components/layout/Sidebar";

function MoonIcon() {
  return (
    <svg width="32" height="24" viewBox="0 0 32 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#00453A" />
      <circle cx="22" cy="12" r="10" fill="#B2DFDB" />
    </svg>
  );
}

function getIndicationStyle(indication: string) {
  switch (indication) {
    case "Needs Attention":
      return {
        background: "#FFEBEE",
        color: "#E53935",
      };
    case "Stable":
      return {
        background: "#E8F5E9",
        color: "#43A047",
      };
    case "High Risk":
      return {
        background: "#FFEBEE",
        color: "#E53935",
      };
    default:
      return {
        background: "#F5F5F5",
        color: "#757575",
      };
  }
}

export function DoctorPatients() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPatients = mockPatientsList.filter((patient) =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Page Title */}
          <div className="flex items-center gap-3 mb-6">
            <MoonIcon />
            <h1
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: "#00453A",
              }}
              data-testid="text-patients-title"
            >
              Patients
            </h1>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Search by name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-4 pr-12 rounded-full border-gray-200"
              style={{
                fontSize: "15px",
                background: "#FFFFFF",
              }}
              data-testid="input-search-patients"
            />
            <Search
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
          </div>

          {/* Patients Table */}
          <Card
            className="p-6"
            style={{
              background: "#FFFFFF",
              borderRadius: "16px",
              border: "1px solid rgba(0, 0, 0, 0.08)",
            }}
            data-testid="card-patients-table"
          >
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="table-patients">
                <thead>
                  <tr>
                    <th
                      className="text-left pb-4"
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#37474F",
                        width: "40%",
                      }}
                    >
                      Patient Name
                    </th>
                    <th
                      className="text-center pb-4"
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#37474F",
                        width: "30%",
                      }}
                    >
                      Indication
                    </th>
                    <th
                      className="text-center pb-4"
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#37474F",
                        width: "30%",
                      }}
                    >
                      Profile
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((patient) => (
                    <tr
                      key={patient.id}
                      className="border-t border-gray-100"
                      data-testid={`row-patient-${patient.id}`}
                    >
                      <td className="py-4">
                        <div>
                          <p
                            style={{
                              fontSize: "15px",
                              fontWeight: 600,
                              color: "#00453A",
                            }}
                          >
                            {patient.name}
                          </p>
                          <p
                            style={{
                              fontSize: "13px",
                              fontWeight: 400,
                              color: "#78909C",
                            }}
                          >
                            Age : {patient.age},{" "}
                            <span style={{ color: "#00856F" }}>
                              {patient.condition}
                            </span>
                          </p>
                        </div>
                      </td>
                      <td className="py-4 text-center">
                        <span
                          className="inline-flex items-center justify-center px-4 py-1.5 rounded-full"
                          style={{
                            ...getIndicationStyle(patient.indication),
                            fontSize: "12px",
                            fontWeight: 500,
                            minWidth: "120px",
                          }}
                        >
                          {patient.indication}
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <Button
                          style={{
                            background: "#00856F",
                            color: "#FFFFFF",
                            borderRadius: "8px",
                            height: "36px",
                            fontSize: "13px",
                            fontWeight: 500,
                            minWidth: "110px",
                          }}
                          data-testid={`button-view-profile-${patient.id}`}
                        >
                          View Profile
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Statistics Cards with Pie Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Patients Disease */}
            <Card
              className="p-6"
              style={{
                background: "#FFFFFF",
                borderRadius: "16px",
                border: "1px solid rgba(0, 0, 0, 0.08)",
              }}
              data-testid="card-patients-disease"
            >
              <div className="flex items-center gap-3 mb-4">
                <svg width="28" height="20" viewBox="0 0 28 20" fill="none">
                  <circle cx="10" cy="10" r="8" fill="#00453A" />
                  <circle cx="20" cy="10" r="6" fill="#B2DFDB" />
                </svg>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#00453A",
                  }}
                >
                  Patients Disease
                </h3>
              </div>

              <div className="flex items-center gap-4">
                {/* Pie Chart */}
                <div className="w-32 h-32 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={mockPatientsDisease}
                        dataKey="percentage"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={55}
                        innerRadius={0}
                        strokeWidth={0}
                      >
                        {mockPatientsDisease.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="space-y-3 flex-1">
                  {mockPatientsDisease.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                      data-testid={`disease-item-${index}`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ background: item.color }}
                        />
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: 400,
                            color: "#546E7A",
                          }}
                        >
                          {item.name}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#37474F",
                        }}
                      >
                        {item.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Patients Indication */}
            <Card
              className="p-6"
              style={{
                background: "#FFFFFF",
                borderRadius: "16px",
                border: "1px solid rgba(0, 0, 0, 0.08)",
              }}
              data-testid="card-patients-indication"
            >
              <div className="flex items-center gap-3 mb-4">
                <svg width="28" height="20" viewBox="0 0 28 20" fill="none">
                  <circle cx="10" cy="10" r="8" fill="#00453A" />
                  <circle cx="20" cy="10" r="6" fill="#B2DFDB" />
                </svg>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#00453A",
                  }}
                >
                  Patients Indication
                </h3>
              </div>

              <div className="flex items-center gap-4">
                {/* Pie Chart */}
                <div className="w-32 h-32 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={mockPatientsIndication}
                        dataKey="percentage"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={55}
                        innerRadius={0}
                        strokeWidth={0}
                      >
                        {mockPatientsIndication.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="space-y-3 flex-1">
                  {mockPatientsIndication.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                      data-testid={`indication-item-${index}`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ background: item.color }}
                        />
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: 400,
                            color: "#546E7A",
                          }}
                        >
                          {item.name}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#37474F",
                        }}
                      >
                        {item.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
