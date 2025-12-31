import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowUpRight } from 'lucide-react';
import { healthPlans } from '@/mocks/healthPlans';

type BillingCycle = 'monthly' | 'yearly';

export function HealthPlans() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-PK');
  };

  return (
    <div className="flex min-h-screen" style={{ background: '#F7F9F9' }}>
      <Sidebar />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full max-w-[1200px] mx-auto">
          {/* Billing Cycle Toggle */}
          <div className="flex justify-center mb-12" data-testid="container-billing-toggle">
            <div
              className="inline-flex rounded-full p-1"
              style={{
                background: '#FFFFFF',
                border: '2px solid rgba(0, 133, 111, 0.3)',
              }}
            >
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-8 py-2 rounded-full text-base font-semibold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-[#E8F5F3] text-[#00856F]'
                    : 'bg-transparent text-[#546E7A]'
                }`}
                data-testid="button-monthly"
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-8 py-2 rounded-full text-base font-semibold transition-all ${
                  billingCycle === 'yearly'
                    ? 'bg-[#E8F5F3] text-[#00856F]'
                    : 'bg-transparent text-[#546E7A]'
                }`}
                data-testid="button-yearly"
              >
                Yearly
              </button>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {healthPlans.map((plan) => (
              <Card
                key={plan.id}
                className="overflow-hidden flex flex-col"
                style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                }}
                data-testid={`card-plan-${plan.id}`}
              >
                {/* Plan Header */}
                <div
                  className="px-8 py-12 text-center"
                  style={{
                    background: plan.bgColor,
                  }}
                >
                  <h2
                    style={{
                      fontSize: '32px',
                      fontWeight: 700,
                      color: '#00453A',
                      marginBottom: '8px',
                    }}
                    data-testid={`text-plan-name-${plan.id}`}
                  >
                    {plan.name}
                  </h2>
                  <div className="flex items-center justify-center gap-2">
                    <span
                      style={{
                        fontSize: '20px',
                        fontWeight: 600,
                        color: '#00453A',
                      }}
                    >
                      PKR
                    </span>
                    <span
                      style={{
                        fontSize: '56px',
                        fontWeight: 700,
                        color: '#00453A',
                        lineHeight: '1',
                      }}
                      data-testid={`text-plan-price-${plan.id}`}
                    >
                      {formatPrice(
                        billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
                      )}
                    </span>
                  </div>
                </div>

                {/* Plan Features */}
                <div className="px-8 py-8 flex flex-col flex-1">
                  <div className="space-y-4 mb-8 flex-1">
                    {plan.features.map((feature) => (
                      <div
                        key={feature.id}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg"
                        style={{
                          background: '#F7F9F9',
                        }}
                        data-testid={`feature-${feature.id}`}
                      >
                        <ArrowUpRight
                          size={20}
                          style={{ color: '#00856F', flexShrink: 0 }}
                        />
                        <span
                          style={{
                            fontSize: '15px',
                            fontWeight: 500,
                            color: '#00453A',
                          }}
                        >
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Subscribe Button */}
                  <Button
                    className="w-full"
                    style={{
                      background: '#00856F',
                      color: '#FFFFFF',
                      fontWeight: 600,
                      fontSize: '16px',
                      borderRadius: '12px',
                      padding: '16px',
                      height: 'auto',
                    }}
                    aria-label={`Subscribe to ${plan.name}`}
                    data-testid={`button-subscribe-${plan.id}`}
                  >
                    Subscribe Now
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
