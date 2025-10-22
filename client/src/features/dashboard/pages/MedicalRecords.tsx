import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Lock } from 'lucide-react';
import { glucoseLogs, consultations, medications, labReports } from '@/mocks/medicalRecords';

interface MedicalRecordsProps {
  isPremium?: boolean;
}

export function MedicalRecords({ isPremium = false }: MedicalRecordsProps) {
  return (
    <div className="flex min-h-screen" style={{ background: '#F7F9F9' }}>
      <Sidebar />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full max-w-[1200px] mx-auto space-y-8">
          {/* Glucose Logs Section */}
          <div>
            <h2
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#00856F',
                marginBottom: '24px',
              }}
              data-testid="text-glucose-logs-title"
            >
              Glucose Logs
            </h2>

            {glucoseLogs.length === 0 ? (
              <Card
                className="p-6 flex items-center justify-between"
                style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                }}
                data-testid="card-glucose-empty"
              >
                <p
                  style={{
                    fontSize: '16px',
                    fontWeight: 400,
                    color: '#546E7A',
                  }}
                >
                  No glucose readings yet. Tap{' '}
                  <span style={{ color: '#00856F', fontWeight: 600 }}>Log New Reading</span> to
                  start tracking.
                </p>
                <Button
                  style={{
                    background: '#00856F',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '14px',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    height: 'auto',
                  }}
                  data-testid="button-log-reading"
                >
                  Log New Reading
                </Button>
              </Card>
            ) : (
              <Card
                style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                }}
              >
                {/* Glucose logs table would go here */}
              </Card>
            )}
          </div>

          {/* Consultations Section */}
          <div>
            <h2
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#00856F',
                marginBottom: '24px',
              }}
              data-testid="text-consultations-title"
            >
              Consultations
            </h2>

            <Card
              style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
              }}
            >
              {consultations.length === 0 ? (
                <div className="p-6">
                  <p
                    style={{
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#546E7A',
                      textAlign: 'center',
                    }}
                  >
                    No consultations recorded yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full" data-testid="table-consultations">
                    <thead>
                      <tr
                        style={{
                          background: '#F7F9F9',
                          borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
                        }}
                      >
                        <th
                          className="text-left p-4"
                          style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#546E7A',
                          }}
                        >
                          Date
                        </th>
                        <th
                          className="text-left p-4"
                          style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#546E7A',
                          }}
                        >
                          Provider
                        </th>
                        <th
                          className="text-left p-4"
                          style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#546E7A',
                          }}
                        >
                          Summary
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {consultations.map((consultation, index) => (
                        <tr
                          key={consultation.id}
                          style={{
                            borderBottom:
                              index < consultations.length - 1
                                ? '1px solid rgba(0, 0, 0, 0.05)'
                                : 'none',
                          }}
                          data-testid={`row-consultation-${consultation.id}`}
                        >
                          <td
                            className="p-4"
                            style={{
                              fontSize: '14px',
                              fontWeight: 500,
                              color: '#00856F',
                            }}
                          >
                            {consultation.date}
                          </td>
                          <td className="p-4">
                            <div>
                              <p
                                style={{
                                  fontSize: '14px',
                                  fontWeight: 600,
                                  color: '#00453A',
                                  marginBottom: '2px',
                                }}
                              >
                                {consultation.provider}
                              </p>
                              <p
                                style={{
                                  fontSize: '12px',
                                  fontWeight: 400,
                                  color: '#546E7A',
                                }}
                              >
                                {consultation.specialty}
                              </p>
                            </div>
                          </td>
                          <td
                            className="p-4"
                            style={{
                              fontSize: '14px',
                              fontWeight: 400,
                              color: '#00856F',
                            }}
                          >
                            {consultation.summary}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

          {/* Medications Section */}
          <div>
            <h2
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#00856F',
                marginBottom: '24px',
              }}
              data-testid="text-medications-title"
            >
              Medications
            </h2>

            {!isPremium ? (
              <Card
                className="p-6 flex items-center justify-center"
                style={{
                  background: '#F7F9F9',
                  borderRadius: '12px',
                  border: '2px dashed rgba(0, 133, 111, 0.3)',
                  minHeight: '160px',
                }}
                data-testid="card-medications-locked"
              >
                <div className="text-center">
                  <div
                    className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{ background: '#E8F5F3' }}
                  >
                    <Lock size={32} color="#00856F" />
                  </div>
                  <p
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#546E7A',
                      maxWidth: '300px',
                    }}
                  >
                    Subscribe to Premium
                    <br />
                    to unlock smart medication reminders and logs.
                  </p>
                </div>
              </Card>
            ) : medications.length === 0 ? (
              <Card
                className="p-6 flex items-center justify-between"
                style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                }}
                data-testid="card-medications-empty"
              >
                <p
                  style={{
                    fontSize: '16px',
                    fontWeight: 400,
                    color: '#546E7A',
                  }}
                >
                  You haven't added any medications. Tap{' '}
                  <span style={{ fontWeight: 600, color: '#00856F' }}>Add Medication</span> to keep track of doses.
                </p>
                <Button
                  style={{
                    background: '#00856F',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '14px',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    height: 'auto',
                  }}
                  aria-label="Add new medication"
                  data-testid="button-add-medication"
                >
                  Add new Medication
                </Button>
              </Card>
            ) : (
              <Card
                style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                }}
              >
                {/* Medications list would go here */}
              </Card>
            )}
          </div>

          {/* Lab Reports Section */}
          <div>
            <h2
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#00856F',
                marginBottom: '24px',
              }}
              data-testid="text-lab-reports-title"
            >
              Lab Reports
            </h2>

            {labReports.length === 0 ? (
              <Card
                className="p-6 flex items-center justify-between"
                style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                }}
                data-testid="card-lab-reports-empty"
              >
                <p
                  style={{
                    fontSize: '16px',
                    fontWeight: 400,
                    color: '#546E7A',
                  }}
                >
                  No reports uploaded. Tap{' '}
                  <span style={{ color: '#00856F', fontWeight: 600 }}>Upload Report</span> to add
                  your latest bloodwork or scans.
                </p>
                <Button
                  style={{
                    background: '#00856F',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '14px',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    height: 'auto',
                  }}
                  data-testid="button-upload-report"
                >
                  Upload Report
                </Button>
              </Card>
            ) : (
              <Card
                style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                }}
              >
                {/* Lab reports list would go here */}
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
