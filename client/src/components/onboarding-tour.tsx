import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Baby, 
  Calendar, 
  Camera, 
  Heart, 
  Users, 
  Crown,
  CheckCircle
} from "lucide-react";
import { Link } from "wouter";

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: {
    text: string;
    href: string;
  };
  highlight?: string;
}

const tourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to BabyJourney!",
    description: "Your comprehensive digital companion for pregnancy and early motherhood. Let's take a quick tour to get you started.",
    icon: <Baby className="h-8 w-8 text-pink-500" />,
  },
  {
    id: "dashboard",
    title: "Your Dashboard",
    description: "This is your home base. See recent activities, upcoming appointments, and quick access to all features.",
    icon: <Heart className="h-8 w-8 text-red-500" />,
    action: {
      text: "Go to Dashboard",
      href: "/dashboard"
    }
  },
  {
    id: "baby-profiles",
    title: "Baby Profiles",
    description: "Create profiles for pregnancy or existing children. Track milestones, growth, and precious memories.",
    icon: <Baby className="h-8 w-8 text-blue-500" />,
    action: {
      text: "Manage Babies",
      href: "/baby"
    }
  },
  {
    id: "appointments",
    title: "Appointments & Medical",
    description: "Schedule and track medical appointments, vaccinations, and important health information.",
    icon: <Calendar className="h-8 w-8 text-green-500" />,
    action: {
      text: "View Appointments",
      href: "/appointments"
    }
  },
  {
    id: "memories",
    title: "Capture Memories",
    description: "Upload photos, videos, and create beautiful memory books of your journey together.",
    icon: <Camera className="h-8 w-8 text-purple-500" />,
    action: {
      text: "Add Memories",
      href: "/memories"
    }
  },
  {
    id: "family",
    title: "Family Sharing",
    description: "Connect with family members and your partner to share updates and memories together.",
    icon: <Users className="h-8 w-8 text-orange-500" />,
    action: {
      text: "Manage Family",
      href: "/family"
    }
  },
  {
    id: "premium",
    title: "Premium Features",
    description: "Unlock unlimited storage, advanced tracking, and exclusive features with our one-time premium upgrade for €19.99.",
    icon: <Crown className="h-8 w-8 text-yellow-500" />,
    action: {
      text: "Upgrade Now",
      href: "/checkout"
    }
  }
];

interface OnboardingTourProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingTour({ isOpen, onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  const currentTourStep = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    onComplete();
  };

  const handleSkip = () => {
    setIsVisible(false);
    onSkip();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-lg animate-in fade-in-0 zoom-in-95">
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              Step {currentStep + 1} of {tourSteps.length}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <Progress value={progress} className="w-full" />
          
          <div className="flex items-center space-x-3 pt-4">
            {currentTourStep.icon}
            <div>
              <CardTitle className="text-lg">{currentTourStep.title}</CardTitle>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <CardDescription className="text-base leading-relaxed">
            {currentTourStep.description}
          </CardDescription>

          {currentTourStep.action && (
            <div className="p-4 bg-gradient-to-r from-pink-50 to-blue-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Try it out:
                </span>
                <Link href={currentTourStep.action.href}>
                  <Button variant="outline" size="sm" onClick={handleSkip}>
                    {currentTourStep.action.text}
                  </Button>
                </Link>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>

            <div className="flex space-x-2">
              <Button variant="ghost" onClick={handleSkip}>
                Skip Tour
              </Button>
              
              <Button onClick={handleNext} className="flex items-center space-x-2">
                {currentStep === tourSteps.length - 1 ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Get Started</span>
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook to manage onboarding state
export function useOnboarding() {
  const [hasSeenTour, setHasSeenTour] = useState(() => {
    return localStorage.getItem('babyjourney-onboarding-completed') === 'true';
  });

  const completeTour = () => {
    setHasSeenTour(true);
    localStorage.setItem('babyjourney-onboarding-completed', 'true');
  };

  const resetTour = () => {
    setHasSeenTour(false);
    localStorage.removeItem('babyjourney-onboarding-completed');
  };

  return {
    hasSeenTour,
    completeTour,
    resetTour,
    shouldShowTour: !hasSeenTour
  };
}