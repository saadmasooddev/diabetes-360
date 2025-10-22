import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Lock, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { healthTips, exercisePlans, weeklyChallenges } from '@/mocks/tipsExercises';

interface TipsExercisesProps {
  isPremium?: boolean;
}

export function TipsExercises({ isPremium = false }: TipsExercisesProps) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  const nextTip = () => {
    setCurrentTipIndex((prev) => (prev + 1) % healthTips.length);
  };

  const prevTip = () => {
    setCurrentTipIndex((prev) => (prev - 1 + healthTips.length) % healthTips.length);
  };

  const visibleExercisePlans = isPremium 
    ? exercisePlans 
    : exercisePlans.filter(plan => !plan.isLocked);

  const visibleWeeklyChallenges = isPremium
    ? weeklyChallenges
    : weeklyChallenges.filter(challenge => !challenge.isLocked);

  return (
    <div className="flex min-h-screen" style={{ background: '#F7F9F9' }}>
      <Sidebar />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full max-w-[1200px] mx-auto space-y-8">
          {/* Header Banner - Only show if not premium */}
          {!isPremium && (
            <Card
              className="p-8 flex items-center justify-between"
              style={{
                background: 'linear-gradient(135deg, #00856F 0%, #00A88E 100%)',
                borderRadius: '16px',
                border: 'none',
              }}
              data-testid="banner-upgrade"
            >
              <div>
                <h1
                  style={{
                    fontSize: '32px',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    marginBottom: '8px',
                  }}
                  data-testid="text-banner-title"
                >
                  Upgrade to get personalized
                </h1>
                <h2
                  style={{
                    fontSize: '32px',
                    fontWeight: 700,
                    color: '#FFFFFF',
                  }}
                >
                  Tips & Exercises
                </h2>
              </div>
              <Button
                className="px-12 py-6"
                style={{
                  background: '#FFFFFF',
                  color: '#00856F',
                  fontWeight: 600,
                  fontSize: '16px',
                  borderRadius: '8px',
                  height: 'auto',
                }}
                aria-label="View premium subscription plans"
                data-testid="button-see-plans"
              >
                See Plans
              </Button>
            </Card>
          )}

          {/* Health Tips for Diabetes */}
          <div>
            <div
              className="px-6 py-4 mb-4"
              style={{
                background: '#E8F5F3',
                borderRadius: '12px',
              }}
            >
              <h3
                style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#00856F',
                }}
                data-testid="text-health-tips-title"
              >
                Health Tips for Diabetes
              </h3>
            </div>

            <div className="relative">
              <div className="flex gap-4 items-center">
                <button
                  onClick={prevTip}
                  className="flex-shrink-0 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
                  aria-label="Previous health tip"
                  data-testid="button-tip-prev"
                >
                  <ChevronLeft size={20} color="#00856F" />
                </button>

                <div className="flex-1 overflow-hidden">
                  <div
                    className="flex transition-transform duration-300 ease-in-out"
                    style={{
                      transform: `translateX(-${currentTipIndex * 100}%)`,
                    }}
                  >
                    {healthTips.map((tip, index) => (
                      <Card
                        key={tip.id}
                        className="flex-shrink-0 p-6"
                        style={{
                          width: '100%',
                          background: '#FFFFFF',
                          borderRadius: '12px',
                          border: '1px solid rgba(0, 0, 0, 0.1)',
                          minHeight: '120px',
                        }}
                        data-testid={`card-tip-${index}`}
                      >
                        <p
                          style={{
                            fontSize: '16px',
                            fontWeight: 500,
                            color: '#00453A',
                            lineHeight: '1.6',
                          }}
                        >
                          {tip.text}
                        </p>
                      </Card>
                    ))}
                  </div>
                </div>

                <button
                  onClick={nextTip}
                  className="flex-shrink-0 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
                  aria-label="Next health tip"
                  data-testid="button-tip-next"
                >
                  <ChevronRight size={20} color="#00856F" />
                </button>
              </div>

              {/* Dots indicator */}
              <div className="flex justify-center gap-2 mt-4" role="group" aria-label="Health tips pagination">
                {healthTips.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTipIndex(index)}
                    className="transition-all"
                    style={{
                      width: index === currentTipIndex ? '32px' : '8px',
                      height: '8px',
                      borderRadius: '4px',
                      background: index === currentTipIndex ? '#00856F' : '#D9D9D9',
                    }}
                    aria-label={`Go to tip ${index + 1}`}
                    aria-current={index === currentTipIndex ? 'true' : 'false'}
                    data-testid={`dot-indicator-${index}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Exercise Plans for Diabetes */}
          <div>
            <h3
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#00856F',
                marginBottom: '24px',
              }}
              data-testid="text-exercise-plans-title"
            >
              Exercise Plans for Diabetes
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {visibleExercisePlans.map((plan) => (
                <Card
                  key={plan.id}
                  className="overflow-hidden"
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                  }}
                  data-testid={`card-exercise-${plan.id}`}
                >
                  <img
                    src={plan.image}
                    alt={plan.title}
                    className="w-full h-[180px] object-cover"
                    data-testid={`img-exercise-${plan.id}`}
                  />

                  <div className="p-4">
                    <p
                      style={{
                        fontSize: '12px',
                        fontWeight: 500,
                        color: '#00856F',
                        marginBottom: '4px',
                      }}
                    >
                      {plan.duration}
                    </p>
                    <h4
                      style={{
                        fontSize: '18px',
                        fontWeight: 700,
                        color: '#00453A',
                        marginBottom: '8px',
                      }}
                      data-testid={`text-exercise-title-${plan.id}`}
                    >
                      {plan.title}
                    </h4>
                    <p
                      style={{
                        fontSize: '12px',
                        fontWeight: 400,
                        color: '#546E7A',
                        lineHeight: '1.5',
                        marginBottom: '16px',
                      }}
                    >
                      {plan.description}
                    </p>
                    <Button
                      className="w-full"
                      style={{
                        background: '#00856F',
                        color: '#FFFFFF',
                        fontWeight: 600,
                        fontSize: '14px',
                        borderRadius: '8px',
                        padding: '12px',
                        height: 'auto',
                      }}
                      aria-label={`Start ${plan.title} exercise plan`}
                      data-testid={`button-start-${plan.id}`}
                    >
                      Start Now
                    </Button>
                  </div>
                </Card>
              ))}

              {/* Show "Add your Own Exercise" if premium, otherwise show locked placeholder */}
              {isPremium ? (
                <Card
                  className="overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:shadow-lg transition-shadow"
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    minHeight: '400px',
                  }}
                  data-testid="card-exercise-add"
                >
                  <div className="text-center p-6">
                    <div
                      className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
                      style={{ background: '#00856F' }}
                    >
                      <Plus size={40} color="#FFFFFF" strokeWidth={3} />
                    </div>
                    <h4
                      style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#00453A',
                      }}
                      data-testid="text-add-exercise-title"
                    >
                      Add your Own
                      <br />
                      Exercise
                    </h4>
                  </div>
                </Card>
              ) : (
                <Card
                  className="overflow-hidden flex items-center justify-center"
                  style={{
                    background: '#F7F9F9',
                    borderRadius: '12px',
                    border: '2px dashed rgba(0, 133, 111, 0.3)',
                    minHeight: '400px',
                  }}
                  data-testid="card-exercise-locked"
                >
                  <div className="text-center p-6">
                    <div
                      className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
                      style={{ background: '#E8F5F3' }}
                    >
                      <Lock size={40} color="#00856F" />
                    </div>
                    <h4
                      style={{
                        fontSize: '18px',
                        fontWeight: 700,
                        color: '#00453A',
                        marginBottom: '8px',
                      }}
                    >
                      Custom Exercise
                    </h4>
                    <p
                      style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#546E7A',
                        maxWidth: '200px',
                      }}
                    >
                      Subscribe to Premium to add your own exercise plans tailored to your needs.
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* Weekly Exercise Challenges */}
          <div>
            <h3
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#00856F',
                marginBottom: '24px',
              }}
              data-testid="text-challenges-title"
            >
              Weekly Exercise Challenges
            </h3>

            <Card
              className="p-6"
              style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid rgba(0, 0, 0, 0.1)',
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {visibleWeeklyChallenges.map((challenge) => (
                  <div
                    key={challenge.id}
                    className="p-6 rounded-lg"
                    style={{
                      background: '#F7F9F9',
                    }}
                    data-testid={`card-challenge-${challenge.id}`}
                  >
                    <div className="mb-4">
                      <p
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#00856F',
                        }}
                      >
                        {challenge.week}: {challenge.title}
                      </p>
                    </div>

                    <div className="mb-4">
                      <p
                        style={{
                          fontSize: '12px',
                          fontWeight: 500,
                          color: '#00453A',
                          marginBottom: '8px',
                        }}
                      >
                        Goal: {challenge.goal}
                      </p>

                      <div className="flex items-center gap-2 mb-2">
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 500,
                            color: '#546E7A',
                          }}
                        >
                          Weekly Goal
                        </span>
                        <div
                          className="flex-1 h-2 rounded-full overflow-hidden"
                          style={{ background: '#E0E0E0' }}
                        >
                          <div
                            className="h-full"
                            style={{
                              width: `${(challenge.progress / challenge.target) * 100}%`,
                              background: '#00856F',
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span
                          style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            color: '#00856F',
                          }}
                        >
                          {challenge.target.toLocaleString()}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 500,
                            color: '#546E7A',
                          }}
                        >
                          Goal: {challenge.target.toLocaleString()} steps. Start Now!
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Show locked placeholders only if not premium */}
                {!isPremium && [...Array(2)].map((_, index) => (
                  <div
                    key={`locked-${index}`}
                    className="p-6 rounded-lg flex items-center justify-center"
                    style={{
                      background: '#F7F9F9',
                      border: '2px dashed rgba(0, 133, 111, 0.3)',
                      minHeight: '200px',
                    }}
                    data-testid={`card-challenge-locked-${index}`}
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
                          fontSize: '12px',
                          fontWeight: 500,
                          color: '#546E7A',
                          maxWidth: '180px',
                        }}
                      >
                        Subscribe to Premium to access monthly challenges
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
