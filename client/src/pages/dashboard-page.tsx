import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { AppTabs } from "@/components/app-tabs";
import { MobileNav } from "@/components/mobile-nav";
import { PremiumBadge } from "@/components/premium-badge";
import { Heart, CalendarCheck, User, Image, Upload, Check, Crown } from "lucide-react";
import { Child, Milestone } from "@shared/schema";
import { format } from "date-fns";

export default function DashboardPage() {
  const { user } = useAuth();
  
  const { data: children = [], isLoading: isLoadingChildren } = useQuery<Child[]>({
    queryKey: ["/api/children"],
  });

  // For simplicity, we'll default to the first pregnancy/child in this MVP
  const activeChild = children.length > 0 ? children[0] : null;
  
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-secondary-50">
      <AppHeader />
      <AppTabs />
      
      <main className="flex-grow container mx-auto px-4 py-6 pb-20 md:pb-6">
        {/* Welcome Card */}
        <WelcomeCard child={activeChild} />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Left Column */}
          <div className="md:col-span-2 space-y-6">
            {/* Pregnancy Progress Card */}
            <PregnancyProgressCard child={activeChild} />
            
            {/* Milestones Card */}
            <MilestonesCard childId={activeChild?.id} />
          </div>
          
          {/* Right Column */}
          <div className="space-y-6">
            {/* Baby Development Card */}
            <BabyDevelopmentCard pregnancyWeek={24} />
            
            {/* Photo Gallery Card */}
            <PhotoGalleryCard childId={activeChild?.id} isPremium={user.isPremium} />
            
            {/* Premium Features Card */}
            {!user.isPremium && <PremiumFeaturesCard />}
          </div>
        </div>
      </main>
      
      <AppFooter />
      <MobileNav />
    </div>
  );
}

function WelcomeCard({ child }: { child: Child | null }) {
  const { user } = useAuth();
  const firstName = user?.fullName?.split(' ')[0] || '';
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
        <div>
          <h2 className="font-bold text-xl mb-2">Welcome back, {firstName}!</h2>
          {child?.isPregnancy && child?.dueDate && (
            <p className="text-muted-foreground">
              You're in week 24 of your pregnancy. Baby is the size of a corn!
            </p>
          )}
          {!child && (
            <p className="text-muted-foreground">
              Let's set up your pregnancy or baby profile to get started.
            </p>
          )}
        </div>
        <div className="mt-4 md:mt-0">
          <Button className="bg-primary-500 hover:bg-primary-600">
            Log Today's Update
          </Button>
        </div>
      </div>
    </div>
  );
}

function PregnancyProgressCard({ child }: { child: Child | null }) {
  // For MVP, just showing static data
  const pregnancyWeek = 24;
  const totalWeeks = 40;
  const progress = (pregnancyWeek / totalWeeks) * 100;
  
  const { data: upcomingAppointments = [] } = useQuery({
    queryKey: ["/api/children", child?.id, "appointments/upcoming"],
    enabled: !!child?.id,
  });

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="bg-primary-500 px-6 py-4 flex justify-between items-center">
        <h3 className="text-white font-bold">Pregnancy Journey</h3>
        <span className="text-white bg-white bg-opacity-20 px-3 py-1 rounded-full text-xs">
          {pregnancyWeek} of {totalWeeks} weeks
        </span>
      </div>
      
      <div className="p-6">
        <Progress value={progress} className="h-2.5 mb-6" />
        
        <div className="flex justify-between text-xs text-muted-foreground mb-8">
          <span>First Trimester</span>
          <span>Second Trimester</span>
          <span>Third Trimester</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-secondary-100 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <Heart className="text-primary-500 h-4 w-4 mr-2" />
              <h4 className="font-medium">Recent Symptoms</h4>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
                <span>Lower back pain</span>
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                <span>Increased energy</span>
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-primary-500 rounded-full mr-2"></span>
                <span>Occasional heartburn</span>
              </li>
            </ul>
            <Button variant="link" className="p-0 h-auto mt-3 text-primary-500">
              Track symptoms
            </Button>
          </div>
          
          <div className="border border-secondary-100 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <CalendarCheck className="text-primary-500 h-4 w-4 mr-2" />
              <h4 className="font-medium">Upcoming Appointments</h4>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium">Prenatal Checkup</p>
                <p className="text-xs text-muted-foreground">May 15, 10:30 AM</p>
              </div>
              <div>
                <p className="font-medium">Ultrasound Scan</p>
                <p className="text-xs text-muted-foreground">May 28, 2:00 PM</p>
              </div>
            </div>
            <Button variant="link" className="p-0 h-auto mt-3 text-primary-500">
              View all appointments
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MilestonesCard({ childId }: { childId?: number }) {
  const { data: milestones = [], isLoading } = useQuery<Milestone[]>({
    queryKey: ["/api/children", childId, "milestones/recent"],
    enabled: !!childId,
  });
  
  // For MVP demo, show some placeholder milestones if none are found
  const displayMilestones = milestones.length > 0 ? milestones : [
    {
      id: 1,
      childId: 1,
      userId: 1,
      title: "First Kicks Felt!",
      date: new Date("2023-04-02"),
      description: "Felt the baby's first movements during evening rest. It was like little bubbles or flutters!",
      category: "pregnancy",
      createdAt: new Date()
    },
    {
      id: 2,
      childId: 1,
      userId: 1,
      title: "20-Week Ultrasound",
      date: new Date("2023-03-26"),
      description: "Anatomy scan looked perfect! Baby is measuring right on track.",
      category: "pregnancy",
      createdAt: new Date()
    },
    {
      id: 3,
      childId: 1,
      userId: 1,
      title: "Gender Reveal",
      date: new Date("2023-03-12"),
      description: "It's a girl! We're so excited to welcome our daughter in a few months.",
      category: "pregnancy",
      createdAt: new Date()
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-secondary-100 flex justify-between items-center">
        <h3 className="font-bold">Recent Milestones</h3>
        <Button variant="link" className="p-0 h-auto text-primary-500">
          View all
        </Button>
      </div>
      
      <div className="p-6">
        <div className="space-y-6">
          {displayMilestones.map((milestone, index) => (
            <div key={milestone.id} className="flex">
              <div className="flex flex-col items-center mr-4">
                <div className="rounded-full bg-primary-500 text-white w-8 h-8 flex items-center justify-center">
                  {milestone.category === "pregnancy" ? (
                    <Heart className="h-4 w-4" />
                  ) : milestone.title.includes("Ultrasound") ? (
                    <Image className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>
                {index < displayMilestones.length - 1 && (
                  <div className="h-full w-px bg-secondary-100 my-2"></div>
                )}
              </div>
              <div>
                <h4 className="font-medium">{milestone.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Week {Math.floor(Math.random() * 10) + 15} - {milestone.date.toDateString()}
                </p>
                <p className="text-sm mt-2">{milestone.description}</p>
                
                {milestone.title.includes("Ultrasound") && (
                  <div className="mt-3 inline-block rounded-md overflow-hidden border border-secondary-100">
                    <div className="w-24 h-24 bg-gray-100 flex items-center justify-center">
                      <span className="text-xs text-gray-400">Ultrasound image</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <Button 
          variant="outline" 
          className="mt-6 w-full border-primary-500 text-primary-500 hover:bg-primary-50"
        >
          Add New Milestone
        </Button>
      </div>
    </div>
  );
}

function BabyDevelopmentCard({ pregnancyWeek }: { pregnancyWeek: number }) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-secondary-100">
        <h3 className="font-bold">Week {pregnancyWeek}: Baby's Development</h3>
      </div>
      
      <div className="p-6">
        <div className="w-full h-64 bg-gray-100 rounded-md mb-4 flex items-center justify-center">
          <span className="text-sm text-gray-400">Baby development illustration</span>
        </div>
        
        <div className="space-y-3 text-sm">
          <p>Your baby now weighs about 1.3 pounds and is 11.8 inches long. Their face is fully formed with eyelashes, eyebrows, and hair.</p>
          <p>Baby's brain is developing rapidly, and they can now hear your voice clearly. Try talking or singing to your baby!</p>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="bg-primary-50 p-3 rounded-md">
            <p className="font-medium text-primary-600">Size</p>
            <p>Size of a corn</p>
          </div>
          <div className="bg-primary-50 p-3 rounded-md">
            <p className="font-medium text-primary-600">Weight</p>
            <p>~1.3 pounds</p>
          </div>
          <div className="bg-primary-50 p-3 rounded-md">
            <p className="font-medium text-primary-600">Length</p>
            <p>~11.8 inches</p>
          </div>
          <div className="bg-primary-50 p-3 rounded-md">
            <p className="font-medium text-primary-600">Movement</p>
            <p>Regular kicks</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhotoGalleryCard({ childId, isPremium }: { childId?: number, isPremium: boolean }) {
  const { data: photos = [] } = useQuery({
    queryKey: ["/api/children", childId, "photos"],
    enabled: !!childId,
  });
  
  const { data: countData } = useQuery({
    queryKey: ["/api/children", childId, "photos/count"],
    enabled: !!childId,
  });
  
  const photoCount = countData?.count || 0;
  const maxPhotos = isPremium ? Infinity : 5;
  const remainingUploads = Math.max(0, maxPhotos - photoCount);
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-secondary-100 flex justify-between items-center">
        <h3 className="font-bold">Photo Gallery</h3>
        <span className="text-xs bg-secondary-100 px-2 py-1 rounded-full">
          {photoCount} of {isPremium ? "∞" : "5"} uploads
        </span>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[1, 2, 3].map((_, i) => (
            <div key={i} className="aspect-square rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
              {photos[i] ? (
                <div className="w-full h-full bg-gray-200"></div>
              ) : (
                <span className="text-[10px] text-gray-400">Photo</span>
              )}
            </div>
          ))}
        </div>
        
        <Button 
          variant="outline" 
          className="w-full border-dashed border-secondary-500 text-muted-foreground hover:bg-secondary-50"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload New Photo
        </Button>
        
        <div className="mt-4 text-xs text-center">
          {!isPremium ? (
            <>
              <span className="text-muted-foreground">
                Free plan: {remainingUploads} uploads remaining
              </span>
              <Button 
                variant="link" 
                className="block mx-auto text-primary-500 font-medium mt-2 p-0 h-auto"
              >
                <PremiumBadge className="mr-1" />
                Upgrade for unlimited photos
              </Button>
            </>
          ) : (
            <span className="text-muted-foreground">
              Premium plan: Unlimited photo uploads
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function PremiumFeaturesCard() {
  const { upgradeToPremiumMutation } = useAuth();
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-accent-500">
      <div className="bg-accent-50 px-6 py-4 border-b border-accent-100">
        <h3 className="font-bold text-accent-600 flex items-center">
          <Crown className="h-5 w-5 mr-2" />
          Premium Features
        </h3>
      </div>
      
      <div className="p-6">
        <ul className="space-y-3 text-sm">
          <li className="flex items-start">
            <Check className="text-green-500 h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
            <span>Unlimited photo uploads with comments and tags</span>
          </li>
          <li className="flex items-start">
            <Check className="text-green-500 h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
            <span>Support for multiple children profiles</span>
          </li>
          <li className="flex items-start">
            <Check className="text-green-500 h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
            <span>Monthly highlight reels of your journey</span>
          </li>
          <li className="flex items-start">
            <Check className="text-green-500 h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
            <span>Export beautiful printable baby book as PDF</span>
          </li>
        </ul>
        
        <Button 
          className="mt-4 w-full bg-accent-500 hover:bg-accent-600"
          onClick={() => upgradeToPremiumMutation.mutate()}
          disabled={upgradeToPremiumMutation.isPending}
        >
          {upgradeToPremiumMutation.isPending ? "Processing..." : "Upgrade for $39.99 (one-time)"}
        </Button>
      </div>
    </div>
  );
}
