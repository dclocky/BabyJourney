import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Heart, 
  Baby, 
  Calendar, 
  Camera, 
  Trophy, 
  Users, 
  Activity, 
  ChevronRight, 
  ChevronLeft,
  Star,
  Utensils,
  Moon,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import { useLocation } from "wouter";

interface TutorialModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  userType: "pregnancy" | "baby";
  userName?: string;
}

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  category: "free" | "premium";
  relevantFor: ("pregnancy" | "baby")[];
  benefits: string[];
}

const tutorialSteps: TutorialStep[] = [
  {
    id: "dashboard",
    title: "Your Personal Dashboard",
    description: "Track daily symptoms, milestones, and get personalized insights",
    icon: <Activity className="w-6 h-6" />,
    route: "/",
    category: "free",
    relevantFor: ["pregnancy", "baby"],
    benefits: ["Quick daily tracking", "Visual progress charts", "Personalized timeline"]
  },
  {
    id: "pregnancy",
    title: "Pregnancy Journey",
    description: "Week-by-week development tracking with baby size comparisons",
    icon: <Heart className="w-6 h-6" />,
    route: "/pregnancy",
    category: "free",
    relevantFor: ["pregnancy"],
    benefits: ["Weekly development updates", "Symptom tracking", "Doctor appointment reminders"]
  },
  {
    id: "baby-care",
    title: "Baby Care Tracking",
    description: "Log feeding, sleep, and diaper changes to understand patterns",
    icon: <Baby className="w-6 h-6" />,
    route: "/baby-care",
    category: "free",
    relevantFor: ["baby"],
    benefits: ["Feeding schedule tracking", "Sleep pattern analysis", "Diaper change logs"]
  },
  {
    id: "milestones",
    title: "Milestone Recording",
    description: "Capture first words, steps, smiles, and precious moments",
    icon: <Trophy className="w-6 h-6" />,
    route: "/milestones",
    category: "free",
    relevantFor: ["pregnancy", "baby"],
    benefits: ["Photo attachments", "Date tracking", "Shareable memories"]
  },
  {
    id: "appointments",
    title: "Medical Appointments",
    description: "Schedule and track doctor visits, vaccinations, and checkups",
    icon: <Calendar className="w-6 h-6" />,
    route: "/appointments",
    category: "free",
    relevantFor: ["pregnancy", "baby"],
    benefits: ["Appointment reminders", "Medical history", "Vaccination tracking"]
  },
  {
    id: "growth-charts",
    title: "Growth Charts & Analytics",
    description: "WHO percentile tracking with detailed growth analysis",
    icon: <Star className="w-6 h-6" />,
    route: "/growth-charts",
    category: "premium",
    relevantFor: ["baby"],
    benefits: ["WHO percentile comparison", "Growth trend analysis", "Doctor-ready reports"]
  },
  {
    id: "memories",
    title: "Photo Memories",
    description: "Create beautiful photo albums and memory books",
    icon: <Camera className="w-6 h-6" />,
    route: "/memories",
    category: "premium",
    relevantFor: ["pregnancy", "baby"],
    benefits: ["Unlimited photo storage", "Memory book creation", "Timeline organization"]
  },
  {
    id: "family",
    title: "Family Groups",
    description: "Share updates securely with grandparents and family members",
    icon: <Users className="w-6 h-6" />,
    route: "/family",
    category: "free",
    relevantFor: ["pregnancy", "baby"],
    benefits: ["Secure sharing", "Role-based access", "Family timeline"]
  }
];

export function TutorialModal({ open, onClose, onComplete, userType, userName }: TutorialModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [, setLocation] = useLocation();
  
  const firstName = userName?.split(" ")[0] || "";
  const relevantSteps = tutorialSteps.filter(step => step.relevantFor.includes(userType));
  const freeSteps = relevantSteps.filter(step => step.category === "free");
  const premiumSteps = relevantSteps.filter(step => step.category === "premium");
  
  const handleNext = () => {
    if (currentStep < freeSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Tutorial complete, show premium features
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleExploreFeature = () => {
    const step = freeSteps[currentStep];
    onClose();
    setLocation(step.route);
  };

  const currentStepData = freeSteps[currentStep];
  const progress = ((currentStep + 1) / freeSteps.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="text-center mb-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-4">
              {currentStepData?.icon}
            </div>
            <DialogTitle className="text-2xl">
              Welcome to your {userType === "pregnancy" ? "pregnancy" : "baby"} journey, {firstName}! 🎉
            </DialogTitle>
            <DialogDescription className="text-lg mt-2">
              Let's explore the features that will help you track every precious moment
            </DialogDescription>
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Tutorial Progress</span>
              <span className="text-sm text-muted-foreground">
                {currentStep + 1} of {freeSteps.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </DialogHeader>

        {currentStepData && (
          <div className="space-y-6">
            <Card className="border-2 border-primary/20">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                  {currentStepData.icon}
                </div>
                <CardTitle className="text-xl">{currentStepData.title}</CardTitle>
                <CardDescription className="text-base">
                  {currentStepData.description}
                </CardDescription>
                <Badge variant="secondary" className="w-fit mx-auto">
                  {currentStepData.category === "free" ? "✨ Free Feature" : "⭐ Premium Feature"}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    What you can do:
                  </h4>
                  {currentStepData.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      {benefit}
                    </div>
                  ))}
                </div>
                
                <Button 
                  onClick={handleExploreFeature}
                  className="w-full mt-4 bg-primary-600 hover:bg-primary-700"
                >
                  Explore This Feature
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <div className="flex justify-between items-center pt-4">
              <Button 
                variant="outline" 
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              
              <div className="flex space-x-2">
                {freeSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentStep ? "bg-primary-600" : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>

              <Button onClick={handleNext}>
                {currentStep < freeSteps.length - 1 ? (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  "Complete Tutorial"
                )}
              </Button>
            </div>

            {premiumSteps.length > 0 && (
              <div className="text-center pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  🌟 {premiumSteps.length} premium features available to unlock even more capabilities!
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}