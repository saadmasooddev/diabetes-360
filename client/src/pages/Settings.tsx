import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserManagement } from '@/components/admin/UserManagement';
import { FreeTierLimitsManagement } from '@/components/admin/FreeTierLimitsManagement';
import { FoodScanLimitsManagement } from '@/components/admin/FoodScanLimitsManagement';
import { PhysicianSettings } from '@/components/admin/PhysicianSettings';
import { HealthMetricTargetsManagement } from '@/components/admin/HealthMetricTargetsManagement';
import { UserHealthTargets } from '@/components/customer/UserHealthTargets';
import { useAuthStore } from '@/stores/authStore';
import { Sidebar } from '@/components/layout/Sidebar';
import { User, Mail, Shield, Bell, Key, SettingsIcon, CalendarIcon, MapPin } from 'lucide-react';
import { useGetCustomerData, useGetConsultationQuotas } from '@/hooks/mutations/useCustomer';
import { CustomerProfileEdit } from '@/components/customer/CustomerProfileEdit';
import { PhysicianAvailabilityManagement } from '@/components/physician/PhysicianAvailabilityManagement';
import { ManageLocation } from '@/components/physician/ManageLocation';
import { parseDateToComponents } from '@/lib/utils';
import { ChangePasswordDialog } from '@/components/auth/ChangePasswordDialog';
import { TwoFactorAuth } from '@/components/settings/TwoFactorAuth';

export function Settings() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const { data: customerData, isLoading: isLoadingCustomerData, refetch: refetchCustomerData } = useGetCustomerData();
  const { data: consultationQuotas, isLoading: isLoadingQuotas } = useGetConsultationQuotas();
  const isCustomer = user?.role === 'customer';
  const hasCustomerData = isCustomer && customerData?.customerData;

  // Only show admin tabs if user is admin
  const isAdmin = user?.role === 'admin';

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'physician':
        return 'default';
      case 'customer':
        return 'secondary';
      default:
        return 'outline';
    }
  };
  const { day: birthDay, month: birthMonth, year: birthYear } = parseDateToComponents(customerData?.customerData?.birthday || '');
  const { day: diagnosisDay, month: diagnosisMonth, year: diagnosisYear } = parseDateToComponents(customerData?.customerData?.diagnosisDate || '');

  return (
    <div className="flex min-h-screen" style={{ background: '#F7F9F9' }}>
      <Sidebar />

      <main className="flex-1 flex justify-center px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 overflow-x-hidden">
        <div className="w-full max-w-full" style={{ maxWidth: '1145px' }}>
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Settings</h1>
            <p className="text-sm sm:text-base text-gray-600">
              Manage your account settings and preferences
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
            <div
              className="overflow-x-auto overflow-y-hidden -mx-4 sm:mx-0 px-4 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              style={{
                WebkitOverflowScrolling: 'touch',
                maxWidth: '100%'
              }}
            >
              <TabsList className="inline-flex h-auto min-w-max sm:w-auto sm:flex-wrap gap-1 sm:gap-0 p-1 flex-nowrap" style={{ minWidth: 'fit-content' }}>
                <TabsTrigger value="profile" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3 py-1.5 sm:py-2">
                  <User className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Profile</span>
                </TabsTrigger>
                <TabsTrigger value="account" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3 py-1.5 sm:py-2">
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Account</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3 py-1.5 sm:py-2">
                  <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Notifications</span>
                  <span className="sm:hidden">Notify</span>
                </TabsTrigger>
                {user?.role === 'physician' && (
                  <>
                    <TabsTrigger value="availability" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3 py-1.5 sm:py-2">
                      <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Availability</span>
                      <span className="sm:hidden">Available</span>
                    </TabsTrigger>
                    <TabsTrigger value="locations" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3 py-1.5 sm:py-2">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Locations</span>
                      <span className="sm:hidden">Locations</span>
                    </TabsTrigger>
                  </>
                )}
                {isAdmin && (
                  <>
                    <TabsTrigger value="admin" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3 py-1.5 sm:py-2">
                      <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Users</span>
                      <span className="sm:hidden">Users</span>
                    </TabsTrigger>
                    <TabsTrigger value="physicians" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3 py-1.5 sm:py-2">
                      <SettingsIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Physicians</span>
                      <span className="sm:hidden">MD</span>
                    </TabsTrigger>
                    <TabsTrigger value="limits" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3 py-1.5 sm:py-2">
                      <SettingsIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Limits</span>
                      <span className="sm:hidden">Limits</span>
                    </TabsTrigger>
                    <TabsTrigger value="targets" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3 py-1.5 sm:py-2">
                      <SettingsIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Targets</span>
                      <span className="sm:hidden">Targets</span>
                    </TabsTrigger>
                  </>
                )}
              </TabsList>
            </div>

            <TabsContent value="profile" className="space-y-6 overflow-x-hidden max-w-full">
              <Card
                className="overflow-hidden max-w-full"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '12px',
                }}
              >
                <CardHeader className="p-4 sm:p-6 lg:p-6">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600" />
                    Profile Information
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Update your personal information and profile details
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 lg:p-6 pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-4">

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Name</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-900">{user?.firstName} {user?.lastName}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Email</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-900">{user?.email}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Role</Label>
                        <div className="mt-1">
                          <Badge variant={getRoleBadgeVariant(user?.role || 'customer')} className="capitalize">
                            {user?.role}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  {isCustomer && hasCustomerData && (
                    <div className="mt-4 sm:mt-6 space-y-4">
                      <Separator />
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Health Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">First Name</Label>
                            <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-900">{customerData.customerData.firstName}</p>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Last Name</Label>
                            <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-900">{customerData.customerData.lastName}</p>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Gender</Label>
                            <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-900 capitalize">{customerData.customerData.gender}</p>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Date of Birth</Label>
                            <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-900">
                                {birthDay}/{birthMonth}/{birthYear}
                              </p>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Diagnosis Date</Label>
                            <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-900">
                                {diagnosisDay}/{diagnosisMonth}/{diagnosisYear}
                              </p>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Weight</Label>
                            <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-900">{customerData.customerData.weight} kg</p>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Height</Label>
                            <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-900">{customerData.customerData.height} cm</p>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Diabetes Type</Label>
                            <div className="mt-1">
                              <Badge variant="outline" className="capitalize">
                                {customerData.customerData.diabetesType.replace('type', 'Type ').replace('prediabetes', 'Prediabetes')}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="mt-4 sm:mt-6">
                    <Button
                      className="bg-teal-600 hover:bg-teal-700 w-full sm:w-auto"
                      onClick={() => setIsEditingProfile(true)}
                    >
                      Edit Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Edit Profile Modal */}
              {isCustomer && hasCustomerData && (
                <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
                  <DialogContent className="w-[calc(100vw-2rem)] sm:w-full sm:max-w-[500px] max-h-[90vh] flex flex-col">
                    <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
                      <DialogTitle className="text-lg sm:text-xl">Edit Health Information</DialogTitle>
                      <DialogDescription className="text-xs sm:text-sm">
                        Update your health profile information
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6">
                      <CustomerProfileEdit
                        customerData={customerData!.customerData}
                        onClose={() => {
                          setIsEditingProfile(false)
                        }}
                        onSuccess={() => {
                          refetchCustomerData()
                          setIsEditingProfile(false)
                        }}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </TabsContent>

            <TabsContent value="account" className="space-y-6 overflow-x-hidden max-w-full">
              <Card
                className="overflow-hidden max-w-full"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '12px',
                }}
              >
                <CardHeader className="p-4 sm:p-6 lg:p-6">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600" />
                    Account Security
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Manage your account security and authentication settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 lg:p-6 pt-0">
                  <div className="space-y-4 sm:space-y-6">
                    {isCustomer && (
                      <>
                        <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                          <h3 className="font-semibold text-sm sm:text-base text-teal-900 mb-3">Consultation Quotas</h3>
                          {isLoadingQuotas ? (
                            <p className="text-sm text-gray-600">Loading quotas...</p>
                          ) : consultationQuotas?.quota ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700">Discounted Consultations Left:</span>
                                <span className="font-semibold text-teal-700">
                                  {consultationQuotas.quota.discountedConsultationsLeft} / {consultationQuotas.quota.discountedQuotaLimit}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700">Free Consultations Left:</span>
                                <span className="font-semibold text-teal-700">
                                  {consultationQuotas.quota.freeConsultationsLeft} / {consultationQuotas.quota.freeQuotaLimit}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-600">Unable to load quotas</p>
                          )}
                        </div>
                        <Separator />
                      </>
                    )}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Key className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 flex-shrink-0" />
                        <div>
                          <h3 className="font-medium text-sm sm:text-base text-gray-900">Password</h3>
                          <p className="text-xs sm:text-sm text-gray-600">Change your password</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => setIsChangePasswordOpen(true)}
                      >
                        Change Password
                      </Button>
                    </div>

                    <Separator />

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 flex-shrink-0" />
                        <div>
                          <h3 className="font-medium text-sm sm:text-base text-gray-900">Email Verification</h3>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {user?.emailVerified ? 'Email verified' : 'Email not verified'}
                          </p>
                        </div>
                      </div>
                      {!user?.emailVerified && (
                        <Button variant="outline" className="w-full sm:w-auto">Verify Email</Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Two-Factor Authentication */}
              <TwoFactorAuth />

              {/* User Health Targets */}
              <UserHealthTargets />
            </TabsContent>

            {/* Change Password Dialog */}
            <ChangePasswordDialog
              open={isChangePasswordOpen}
              onOpenChange={setIsChangePasswordOpen}
            />

            <TabsContent value="notifications" className="space-y-6 overflow-x-hidden max-w-full">
              <Card
                className="overflow-hidden max-w-full"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '12px',
                }}
              >
                <CardHeader className="p-4 sm:p-6 lg:p-6">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Choose how you want to be notified about important updates
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 lg:p-6 pt-0">
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-sm sm:text-base text-gray-900">Email Notifications</h3>
                        <p className="text-xs sm:text-sm text-gray-600">Receive updates via email</p>
                      </div>
                      <Switch defaultChecked className="self-start sm:self-auto" />
                    </div>

                    <Separator />

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-sm sm:text-base text-gray-900">Push Notifications</h3>
                        <p className="text-xs sm:text-sm text-gray-600">Get instant notifications</p>
                      </div>
                      <Switch defaultChecked className="self-start sm:self-auto" />
                    </div>

                    <Separator />

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-sm sm:text-base text-gray-900">Health Reminders</h3>
                        <p className="text-xs sm:text-sm text-gray-600">Reminders for medication and checkups</p>
                      </div>
                      <Switch defaultChecked className="self-start sm:self-auto" />
                    </div>

                    <Separator />

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-sm sm:text-base text-gray-900">Marketing Emails</h3>
                        <p className="text-xs sm:text-sm text-gray-600">Receive updates about new features</p>
                      </div>
                      <Switch className="self-start sm:self-auto" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {user?.role === 'physician' && (
              <>
                <TabsContent value="availability" className="space-y-6 overflow-x-hidden">
                  <PhysicianAvailabilityManagement />
                </TabsContent>
                <TabsContent value="locations" className="space-y-6 overflow-x-hidden">
                  <ManageLocation />
                </TabsContent>
              </>
            )}

            {isAdmin && (
              <>
                <TabsContent value="admin" className="space-y-6 overflow-x-hidden">
                  <UserManagement />
                </TabsContent>
                <TabsContent value="physicians" className="space-y-6 overflow-x-hidden">
                  <PhysicianSettings />
                </TabsContent>
                <TabsContent value="limits" className="space-y-6 overflow-x-hidden">
                  <FreeTierLimitsManagement />
                  <FoodScanLimitsManagement />
                </TabsContent>
                <TabsContent value="targets" className="space-y-6 overflow-x-hidden">
                  <HealthMetricTargetsManagement />
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </main>
    </div>
  );
}
