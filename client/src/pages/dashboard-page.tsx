import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { AppTabs } from "@/components/app-tabs";
import { MobileNav } from "@/components/mobile-nav";
import { PremiumBadge } from "@/components/premium-badge";
import {
  Heart,
  CalendarCheck,
  User,
  Image,
  Upload,
  Check,
  Crown,
  Plus,
  Clock,
} from "lucide-react";
import { Child, Milestone } from "@shared/schema";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/hooks/use-toast";

// Define interfaces for all the data we expect from the API
interface User {
  id: number;
  fullName?: string;
  email: string;
  isPremium: boolean;
}

interface AppointmentType {
  id: number;
  childId: number;
  title: string;
  date: string;
  time: string;
  location?: string;
  notes?: string;
}

interface Photo {
  id: number;
  childId: number;
  userId: number;
  url: string;
  caption?: string;
  date: string;
  createdAt: Date;
}

interface PhotoCount {
  count: number;
}

interface SymptomData {
  backPain: boolean;
  nausea: boolean;
  fatigue: boolean;
  heartburn: boolean;
  headache: boolean;
  swelling: boolean;
  insomnia: boolean;
  mood: string;
  notes: string;
  date?: string;
}

interface MilestoneData {
  title: string;
  date: Date;
  description: string;
  category: string;
  image: File | null;
}

export default function DashboardPage() {
  const { user } = useAuth() as { user: User | null };
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: children = [], isLoading: isLoadingChildren } = useQuery<Child[]>({
    queryKey: ["/api/children"],
  });

  // For simplicity, we'll default to the first pregnancy/child in this MVP
  const activeChild = children.length > 0 ? children[0] : null;
  
  // Calculate pregnancy week if this is a pregnancy with a due date
  const pregnancyWeek = useMemo(() => {
    if (activeChild?.isPregnancy && activeChild?.dueDate) {
      const dueDate = new Date(activeChild.dueDate);
      const today = new Date();
      
      // Calculate difference between due date and today
      const differenceInTime = dueDate.getTime() - today.getTime();
      const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
      
      // Pregnancy is typically 40 weeks (280 days) long
      // So if dueDate is in 70 days, we're at week 30 (40 - 10)
      const weeksRemaining = Math.ceil(differenceInDays / 7);
      const currentWeek = 40 - weeksRemaining;
      
      // Ensure week is between 1 and 40
      return Math.max(1, Math.min(40, currentWeek));
    }
    
    // Default to week 20 if not a pregnancy or no due date
    return 20;
  }, [activeChild]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-secondary-50">
      <AppHeader />
      <AppTabs />

      <main className="flex-grow container mx-auto px-4 py-6 pb-20 md:pb-6">
        {/* Welcome Card */}
        <WelcomeCard child={activeChild} pregnancyWeek={pregnancyWeek} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Left Column */}
          <div className="md:col-span-2 space-y-6">
            {/* Pregnancy Progress Card */}
            <PregnancyProgressCard child={activeChild} pregnancyWeek={pregnancyWeek} />

            {/* Milestones Card */}
            <MilestonesCard childId={activeChild?.id} />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Baby Development Card */}
            <BabyDevelopmentCard pregnancyWeek={pregnancyWeek} />

            {/* Photo Gallery Card */}
            <PhotoGalleryCard
              childId={activeChild?.id}
              isPremium={user.isPremium}
            />

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

interface WelcomeCardProps {
  child: Child | null;
  pregnancyWeek: number;
}

function WelcomeCard({ child, pregnancyWeek }: WelcomeCardProps) {
  const { user } = useAuth() as { user: User | null };
  const [, setLocation] = useLocation();
  const firstName = user?.fullName?.split(" ")[0] || "";
  
  // Get the size comparison based on pregnancy week
  const getBabySize = (week: number) => {
    switch (true) {
      case week <= 8:
        return "a raspberry";
      case week <= 12:
        return "a lime";
      case week <= 16:
        return "an avocado";
      case week <= 20:
        return "a banana";
      case week <= 24:
        return "a corn";
      case week <= 28:
        return "an eggplant";
      case week <= 32:
        return "a squash";
      case week <= 36:
        return "a honeydew melon";
      case week <= 40:
        return "a watermelon";
      default:
        return "a watermelon";
    }
  };
  
  // Calculate days until due date
  const getDaysUntilDueDate = () => {
    if (child?.dueDate) {
      const dueDate = new Date(child.dueDate);
      const today = new Date();
      const differenceInTime = dueDate.getTime() - today.getTime();
      const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
      return Math.max(0, differenceInDays);
    }
    return 0;
  };
  
  const daysUntilDueDate = getDaysUntilDueDate();

  const handleLogUpdate = () => {
    setLocation("/dashboard/log-update");
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
        <div>
          <h2 className="font-bold text-xl mb-2">Welcome back, {firstName}!</h2>
          {child?.isPregnancy && child?.dueDate && (
            <>
              <p className="text-muted-foreground mb-1">
                You're in week {pregnancyWeek} of your pregnancy. Baby is the size of {getBabySize(pregnancyWeek)}!
              </p>
              <p className="text-sm font-medium text-primary-500 flex items-center">
                <Clock className="h-4 w-4 mr-1" /> 
                {daysUntilDueDate > 0 
                  ? `${daysUntilDueDate} days until your due date` 
                  : "Your due date is today!"
                }
              </p>
            </>
          )}
          {!child && (
            <p className="text-muted-foreground">
              Let's set up your pregnancy or baby profile to get started.
            </p>
          )}
        </div>
        <div className="mt-4 md:mt-0">
          <Button
            className="bg-primary-500 hover:bg-primary-600"
            onClick={handleLogUpdate}
          >
            Log Today's Update
          </Button>
        </div>
      </div>
    </div>
  );
}

interface PregnancyProgressCardProps {
  child: Child | null;
  pregnancyWeek: number;
}

function PregnancyProgressCard({ child, pregnancyWeek }: PregnancyProgressCardProps) {
  const [, setLocation] = useLocation();
  const [showSymptomsDialog, setShowSymptomsDialog] = useState<boolean>(false);

  const totalWeeks = 40;
  const progress = (pregnancyWeek / totalWeeks) * 100;

  const { data: upcomingAppointments = [] } = useQuery<AppointmentType[]>({
    queryKey: ["/api/children", child?.id, "appointments/upcoming"],
    enabled: !!child?.id,
  });

  const handleTrackSymptoms = () => {
    setShowSymptomsDialog(true);
  };

  const handleViewAllAppointments = () => {
    setLocation("/appointments");
  };

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
            <Button
              variant="link"
              className="p-0 h-auto mt-3 text-primary-500"
              onClick={handleTrackSymptoms}
            >
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
                <p className="text-xs text-muted-foreground">
                  May 15, 10:30 AM
                </p>
              </div>
              <div>
                <p className="font-medium">Ultrasound Scan</p>
                <p className="text-xs text-muted-foreground">May 28, 2:00 PM</p>
              </div>
            </div>
            <Button
              variant="link"
              className="p-0 h-auto mt-3 text-primary-500"
              onClick={handleViewAllAppointments}
            >
              View all appointments
            </Button>
          </div>
        </div>
      </div>

      {/* Track Symptoms Dialog */}
      <SymptomTrackingDialog
        open={showSymptomsDialog}
        onClose={() => setShowSymptomsDialog(false)}
        childId={child?.id}
      />
    </div>
  );
}

interface SymptomTrackingDialogProps {
  open: boolean;
  onClose: () => void;
  childId?: number;
}

function SymptomTrackingDialog({ open, onClose, childId }: SymptomTrackingDialogProps) {
  const queryClient = useQueryClient();
  const [symptoms, setSymptoms] = useState<SymptomData>({
    backPain: false,
    nausea: false,
    fatigue: false,
    heartburn: false,
    headache: false,
    swelling: false,
    insomnia: false,
    mood: "",
    notes: "",
  });

  const { toast } = useToast();
  
  const trackSymptomsMutation = useMutation({
    mutationFn: (data: SymptomData) => {
      if (!childId) throw new Error("Child ID is required");

      return fetch(`/api/children/${childId}/symptoms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to save symptoms");
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/children", childId, "symptoms"],
      });
      toast({
        title: "Symptoms tracked successfully",
        description: "Your symptom data has been saved.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save your symptoms. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSymptomToggle = (symptom: keyof Omit<SymptomData, "mood" | "notes" | "date">) => {
    setSymptoms((prev) => ({
      ...prev,
      [symptom]: !prev[symptom],
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSymptoms((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    trackSymptomsMutation.mutate({
      ...symptoms,
      date: new Date().toISOString(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Track Today's Symptoms</DialogTitle>
          <DialogDescription>
            Record how you're feeling today to help track your pregnancy
            journey.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                "backPain",
                "nausea",
                "fatigue",
                "heartburn",
                "headache",
                "swelling",
                "insomnia",
              ].map((symptom) => (
                <Button
                  key={symptom}
                  type="button"
                  variant={symptoms[symptom as keyof typeof symptoms] ? "default" : "outline"}
                  className={symptoms[symptom as keyof typeof symptoms] ? "bg-primary-500" : ""}
                  onClick={() => handleSymptomToggle(symptom as keyof Omit<SymptomData, "mood" | "notes" | "date">)}
                >
                  {symptom.charAt(0).toUpperCase() +
                    symptom.slice(1).replace(/([A-Z])/g, " $1")}
                </Button>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Mood Today
              </label>
              <Select
                value={symptoms.mood}
                onValueChange={(value) =>
                  setSymptoms((prev) => ({ ...prev, mood: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your mood" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="great">Great 😃</SelectItem>
                  <SelectItem value="good">Good 🙂</SelectItem>
                  <SelectItem value="okay">Okay 😐</SelectItem>
                  <SelectItem value="tired">Tired 😴</SelectItem>
                  <SelectItem value="uncomfortable">
                    Uncomfortable 😣
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Additional Notes
              </label>
              <Textarea
                name="notes"
                value={symptoms.notes}
                onChange={handleChange}
                placeholder="Anything else you want to mention..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="outline" onClick={onClose} className="bg-primary-500 hover:bg-primary-600">
              {trackSymptomsMutation.isPending ? "Saving..." : "Save Symptoms"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface MilestonesCardProps {
  childId?: number;
}

function MilestonesCard({ childId }: MilestonesCardProps) {
  const [showAddMilestoneDialog, setShowAddMilestoneDialog] = useState<boolean>(false);
  const [, setLocation] = useLocation();

  const { data: milestones = [], isLoading } = useQuery<Milestone[]>({
    queryKey: ["/api/children", childId, "milestones/recent"],
    enabled: !!childId,
  });

  // For MVP demo, show some placeholder milestones if none are found
  const displayMilestones: Milestone[] =
    milestones.length > 0
      ? milestones
      : [
          {
            id: 1,
            childId: 1,
            userId: 1,
            title: "First Kicks Felt!",
            date: new Date("2023-04-02"),
            description:
              "Felt the baby's first movements during evening rest. It was like little bubbles or flutters!",
            category: "pregnancy",
            createdAt: new Date(),
          },
          {
            id: 2,
            childId: 1,
            userId: 1,
            title: "20-Week Ultrasound",
            date: new Date("2023-03-26"),
            description:
              "Anatomy scan looked perfect! Baby is measuring right on track.",
            category: "pregnancy",
            createdAt: new Date(),
          },
          {
            id: 3,
            childId: 1,
            userId: 1,
            title: "Gender Reveal",
            date: new Date("2023-03-12"),
            description:
              "It's a girl! We're so excited to welcome our daughter in a few months.",
            category: "pregnancy",
            createdAt: new Date(),
          },
        ];

  const handleAddMilestone = () => {
    setShowAddMilestoneDialog(true);
  };

  const handleViewAllMilestones = () => {
    setLocation("/milestones");
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-secondary-100 flex justify-between items-center">
        <h3 className="font-bold">Recent Milestones</h3>
        <Button
          variant="link"
          className="p-0 h-auto text-primary-500"
          onClick={handleViewAllMilestones}
        >
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
                  ) : milestone.title && milestone.title.includes("Ultrasound") ? (
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
                  Week {Math.floor(Math.random() * 10) + 15} -{" "}
                  {milestone.date ? format(new Date(milestone.date), "MMM d, yyyy") : ""}
                </p>
                <p className="text-sm mt-2">{milestone.description}</p>

                {milestone.title && milestone.title.includes("Ultrasound") && (
                  <div className="mt-3 inline-block rounded-md overflow-hidden border border-secondary-100">
                    <div className="w-24 h-24 bg-gray-100 flex items-center justify-center">
                      <span className="text-xs text-gray-400">
                        Ultrasound image
                      </span>
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
          onClick={handleAddMilestone}
        >
          Add New Milestone
        </Button>
      </div>

      {/* Add Milestone Dialog */}
      <AddMilestoneDialog
        open={showAddMilestoneDialog}
        onClose={() => setShowAddMilestoneDialog(false)}
        childId={childId}
      />
    </div>
  );
}

interface AddMilestoneDialogProps {
  open: boolean;
  onClose: () => void;
  childId?: number;
}

function AddMilestoneDialog({ open, onClose, childId }: AddMilestoneDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [milestoneData, setMilestoneData] = useState<MilestoneData>({
    title: "",
    date: new Date(),
    description: "",
    category: "pregnancy",
    image: null,
  });

  const addMilestoneMutation = useMutation({
    mutationFn: (data: MilestoneData) => {
      if (!childId) throw new Error("Child ID is required");

      // Create a FormData object if there's an image to upload
      if (data.image) {
        const formData = new FormData();
        formData.append("title", data.title);
        formData.append("date", data.date.toISOString());
        formData.append("description", data.description);
        formData.append("category", data.category);
        formData.append("image", data.image);

        return fetch(`/api/children/${childId}/milestones`, {
          method: "POST",
          body: formData,
        }).then((res) => {
          if (!res.ok) throw new Error("Failed to save milestone");
          return res.json();
        });
      } else {
        // If no image, send a regular JSON request
        return fetch(`/api/children/${childId}/milestones`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: data.title,
            date: data.date.toISOString(),
            description: data.description,
            category: data.category,
          }),
        }).then((res) => {
          if (!res.ok) throw new Error("Failed to save milestone");
          return res.json();
        });
      }
    },
    onSuccess: () => {
      // Invalidate both recent and all milestones to ensure consistent data
      queryClient.invalidateQueries({
        queryKey: ["/api/children", childId, "milestones/recent"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/children", childId, "milestones"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/milestones"],
      });
      toast({
        title: "Milestone added",
        description: "Your milestone has been saved successfully.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save your milestone. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMilestoneData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setMilestoneData((prev) => ({
        ...prev,
        date,
      }));
    }
  };

  const handleCategoryChange = (category: string) => {
    setMilestoneData((prev) => ({
      ...prev,
      category,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMilestoneData((prev) => ({
        ...prev,
        image: e.target.files![0],
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMilestoneMutation.mutate(milestoneData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Milestone</DialogTitle>
          <DialogDescription>
            Record a special moment in your pregnancy or baby's journey.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => {
          e.preventDefault();
          if (!milestoneData.title) {
            toast({
              title: "Error",
              description: "Please enter a title for the milestone",
              variant: "destructive",
            });
            return;
          }
          addMilestoneMutation.mutate(milestoneData);
        }}>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input
                name="title"
                value={milestoneData.title}
                onChange={handleChange}
                placeholder="e.g., First Kick, Baby's First Smile"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <DatePicker
                date={milestoneData.date}
                onSelect={handleDateChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <Select
                value={milestoneData.category}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pregnancy">Pregnancy</SelectItem>
                  <SelectItem value="baby">Baby</SelectItem>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="family">Family</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <Textarea
                name="description"
                value={milestoneData.description}
                onChange={handleChange}
                placeholder="Share the details of this special moment..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Add Photo (Optional)
              </label>
              <Input
                type="file"
                onChange={handleImageChange}
                accept="image/*"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="outline" onClick={onClose} className="bg-primary-500 hover:bg-primary-600">
              {addMilestoneMutation.isPending ? "Saving..." : "Save Milestone"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Import SVG illustrations
import week12Svg from "../assets/baby-development/week-12.svg";
import week16Svg from "../assets/baby-development/week-16.svg";
import week20Svg from "../assets/baby-development/week-20.svg";
import week24Svg from "../assets/baby-development/week-24.svg";
import week28Svg from "../assets/baby-development/week-28.svg";
// Create placeholder SVGs for the rest
const week32Svg = week28Svg;
const week36Svg = week28Svg;
const week40Svg = week28Svg;

// Import fruit SVGs
import raspberrySvg from "../assets/baby-development/fruits/raspberry.svg";
import limeSvg from "../assets/baby-development/fruits/lime.svg";
import avocadoSvg from "../assets/baby-development/fruits/avocado.svg";
import bananaSvg from "../assets/baby-development/fruits/banana.svg";
import cornSvg from "../assets/baby-development/fruits/corn.svg";
import eggplantSvg from "../assets/baby-development/fruits/eggplant.svg";
import squashSvg from "../assets/baby-development/fruits/squash.svg";
import honeydewSvg from "../assets/baby-development/fruits/honeydew.svg";
import watermelonSvg from "../assets/baby-development/fruits/watermelon.svg";

interface BabyDevelopmentCardProps {
  pregnancyWeek: number;
}

function BabyDevelopmentCard({ pregnancyWeek }: BabyDevelopmentCardProps) {
  // Get the appropriate development information based on pregnancy week
  const getDevelopmentInfo = (week: number) => {
    switch (true) {
      case week <= 8:
        return {
          size: "Raspberry",
          weight: "0.04 oz",
          length: "0.6 inches",
          movement: "None yet",
          description: [
            "Baby's basic facial features are forming, including the eyes, nose, mouth, and ears.",
            "The heart is now beating at a steady rhythm. Major organs like the liver and kidneys are developing."
          ]
        };
      case week <= 12:
        return {
          size: "Lime",
          weight: "0.5 oz",
          length: "2.1 inches",
          movement: "First movements (not felt yet)",
          description: [
            "Your baby's fingers and toes are fully separated, and nails are beginning to develop.",
            "All major organs are formed and beginning to function. The baby can make tiny movements."
          ]
        };
      case week <= 16:
        return {
          size: "Avocado",
          weight: "3.5 oz",
          length: "4.6 inches",
          movement: "Subtle movements",
          description: [
            "Baby can now make facial expressions and may even suck their thumb.",
            "The skin is thin and translucent. The backbone and tiny ribs are beginning to be visible."
          ]
        };
      case week <= 20:
        return {
          size: "Banana",
          weight: "10.6 oz",
          length: "6.5 inches",
          movement: "Noticeable kicks",
          description: [
            "Your baby is developing a regular sleep and wake cycle. You might start feeling more movement.",
            "Baby's hearing is developing, and they may respond to loud sounds or your voice."
          ]
        };
      case week <= 24:
        return {
          size: "Corn",
          weight: "1.3 pounds",
          length: "11.8 inches",
          movement: "Regular kicks",
          description: [
            "Your baby now weighs about 1.3 pounds and is 11.8 inches long. Their face is fully formed with eyelashes, eyebrows, and hair.",
            "Baby's brain is developing rapidly, and they can now hear your voice clearly. Try talking or singing to your baby!"
          ]
        };
      case week <= 28:
        return {
          size: "Eggplant",
          weight: "2.2 pounds",
          length: "14.8 inches",
          movement: "Strong kicks and rolls",
          description: [
            "Your baby's eyes can now open and close, and they have eyelashes.",
            "The brain is developing rapidly, and baby is gaining weight and body fat quickly."
          ]
        };
      case week <= 32:
        return {
          size: "Squash",
          weight: "3.8 pounds",
          length: "16.7 inches",
          movement: "Rhythmic movements",
          description: [
            "Baby is practicing breathing movements and developing their immune system.",
            "They're running out of room to move around, but you'll still feel plenty of kicks and rolls."
          ]
        };
      case week <= 36:
        return {
          size: "Honeydew Melon",
          weight: "5.8 pounds",
          length: "18.7 inches",
          movement: "Less space to move",
          description: [
            "Baby is gaining about half a pound per week and developing more body fat.",
            "The lungs are nearly fully developed in preparation for breathing outside the womb."
          ]
        };
      case week <= 40:
        return {
          size: "Watermelon",
          weight: "7.5 pounds",
          length: "20.1 inches",
          movement: "Squirms rather than kicks",
          description: [
            "Your baby is considered full-term now. Most of their organs are ready for life outside the womb.",
            "The brain and lungs continue to mature, and baby is gaining weight until delivery."
          ]
        };
      default:
        return {
          size: "Watermelon",
          weight: "7.5+ pounds",
          length: "20.1+ inches",
          movement: "Ready for birth",
          description: [
            "Baby is fully developed and ready to meet you!",
            "You may notice less movement as there's very little room left in the uterus."
          ]
        };
    }
  };
  
  // Get the appropriate SVG illustration
  const getWeekSvg = (week: number) => {
    switch (true) {
      case week <= 12:
        return week12Svg;
      case week <= 16:
        return week16Svg;
      case week <= 20:
        return week20Svg;
      case week <= 24:
        return week24Svg;
      case week <= 28:
        return week28Svg;
      case week <= 32:
        return week32Svg;
      case week <= 36:
        return week36Svg;
      default:
        return week40Svg;
    }
  };
  
  // Get the appropriate fruit SVG
  const getFruitSvg = (week: number) => {
    switch (true) {
      case week <= 8:
        return raspberrySvg;
      case week <= 12:
        return limeSvg;
      case week <= 16:
        return avocadoSvg;
      case week <= 20:
        return bananaSvg;
      case week <= 24:
        return cornSvg;
      case week <= 28:
        return eggplantSvg;
      case week <= 32:
        return squashSvg;
      case week <= 36:
        return honeydewSvg;
      default:
        return watermelonSvg;
    }
  };
  
  const developmentInfo = getDevelopmentInfo(pregnancyWeek);
  const weekSvg = getWeekSvg(pregnancyWeek);
  const fruitSvg = getFruitSvg(pregnancyWeek);
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-secondary-100">
        <h3 className="font-bold">Week {pregnancyWeek}: Baby's Development</h3>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="h-64 bg-primary-50 rounded-md flex items-center justify-center overflow-hidden">
            <img 
              src={weekSvg} 
              alt={`Baby at week ${pregnancyWeek}`} 
              className="max-h-full p-4"
            />
          </div>
          <div className="h-64 bg-amber-50 rounded-md flex flex-col items-center justify-center overflow-hidden p-4">
            <h4 className="font-medium text-center mb-2">Size Comparison</h4>
            <img 
              src={fruitSvg} 
              alt={`Size comparison: ${developmentInfo.size}`} 
              className="max-h-44"
            />
            <p className="text-sm text-center mt-2">Your baby is about the size of a {developmentInfo.size.toLowerCase()}</p>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          {developmentInfo.description.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="bg-primary-50 p-3 rounded-md">
            <p className="font-medium text-primary-600">Weight</p>
            <p>~{developmentInfo.weight}</p>
          </div>
          <div className="bg-primary-50 p-3 rounded-md">
            <p className="font-medium text-primary-600">Length</p>
            <p>~{developmentInfo.length}</p>
          </div>
          <div className="bg-primary-50 p-3 rounded-md">
            <p className="font-medium text-primary-600">Movement</p>
            <p>{developmentInfo.movement}</p>
          </div>
          <div className="bg-primary-50 p-3 rounded-md">
            <p className="font-medium text-primary-600">Week</p>
            <p>Week {pregnancyWeek} of pregnancy</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PhotoGalleryCardProps {
  childId?: number;
  isPremium: boolean;
}

function PhotoGalleryCard({ childId, isPremium }: PhotoGalleryCardProps) {
  const [showUploadDialog, setShowUploadDialog] = useState<boolean>(false);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: photos = [] } = useQuery<Photo[]>({
    queryKey: ["/api/children", childId, "photos"],
    enabled: !!childId,
  });

  const { data: countData } = useQuery<PhotoCount>({
    queryKey: ["/api/children", childId, "photos/count"],
    enabled: !!childId,
  });

  const photoCount = countData?.count || 0;
  const maxPhotos = isPremium ? Infinity : 5;
  const remainingUploads = Math.max(0, maxPhotos - photoCount);
  const canUploadMore = isPremium || remainingUploads > 0;

  const handleUploadPhoto = () => {
    if (!canUploadMore && !isPremium) {
      // Show upgrade prompt if can't upload more
      setLocation("/upgrade");
      return;
    }

    setShowUploadDialog(true);
  };

  const handleViewAllPhotos = () => {
    setLocation("/dashboard/photos");
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-secondary-100 flex justify-between items-center">
        <h3 className="font-bold">Photo Gallery</h3>
        <Button
          variant="link"
          className="p-0 h-auto text-primary-500"
          onClick={handleViewAllPhotos}
        >
          View all
        </Button>
      </div>

      <div className="p-6">
        {photos.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {photos.slice(0, 4).map((photo) => (
              <div key={photo.id} className="relative h-24 bg-gray-100 rounded-md overflow-hidden">
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-xs text-gray-400">Photo</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                  {photo.caption || (photo.date ? format(new Date(photo.date), "MMM d, yyyy") : '')}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="bg-secondary-50 p-4 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-3">
              <Image className="h-6 w-6 text-primary-500" />
            </div>
            <h4 className="font-medium mb-1">No photos yet</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Start capturing special moments of your pregnancy journey
            </p>
          </div>
        )}

        <Button
          variant="outline"
          className="mt-4 w-full border-primary-500 text-primary-500 hover:bg-primary-50 flex items-center justify-center"
          onClick={handleUploadPhoto}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Photo
          {!isPremium && (<span className="ml-1 text-xs text-muted-foreground">
              ({remainingUploads}/{maxPhotos})
            </span>
          )}
        </Button>
      </div>

      {/* Upload Photo Dialog */}
      <UploadPhotoDialog
        open={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        childId={childId}
      />    </div>
  );
}

interface UploadPhotoDialogProps {
  open: boolean;
  onClose: () => void;
  childId?: number;
}

function UploadPhotoDialog({ open, onClose, childId }: UploadPhotoDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [photoData, setPhotoData] = useState({
    image: null as File | null,
    caption: "",
    date: new Date(),
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: (data: { image: File; caption: string; date: Date }) => {
      if (!childId) throw new Error("Child ID is required");
      if (!data.image) throw new Error("Image is required");

      const formData = new FormData();
      formData.append("image", data.image);
      formData.append("caption", data.caption);
      formData.append("date", data.date.toISOString());

      return fetch(`/api/children/${childId}/photos`, {
        method: "POST",
        body: formData,
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to upload photo");
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/children", childId, "photos"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/children", childId, "photos/count"],
      });
      toast({
        title: "Photo uploaded",
        description: "Your photo has been uploaded successfully.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to upload your photo. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoData((prev) => ({
        ...prev,
        image: e.target.files![0],
      }));
    }
  };

  const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoData((prev) => ({
      ...prev,
      caption: e.target.value,
    }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setPhotoData((prev) => ({
        ...prev,
        date,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (photoData.image) {
      uploadPhotoMutation.mutate({
        image: photoData.image,
        caption: photoData.caption,
        date: photoData.date,
      });
    } else {
      toast({
        title: "Error",
        description: "Please select an image to upload.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Photo</DialogTitle>
          <DialogDescription>
            Add a special moment to your pregnancy or baby's photo album.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Select Photo
              </label>
              <Input
                type="file"
                onChange={handleImageChange}
                accept="image/*"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Caption</label>
              <Input
                value={photoData.caption}
                onChange={handleCaptionChange}
                placeholder="Describe this moment..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Date Taken
              </label>
              <DatePicker
                date={photoData.date}
                onSelect={handleDateChange}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="outline" onClick={onClose} className="bg-primary-500 hover:bg-primary-600">
              {uploadPhotoMutation.isPending ? "Uploading..." : "Upload Photo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PremiumFeaturesCard() {
  const [, setLocation] = useLocation();

  const handleUpgrade = () => {
    setLocation("/upgrade");
  };

  return (
    <Card className="bg-gradient-to-br from-violet-500 to-primary-500 text-white">
      <CardHeader>
        <div className="flex items-center">
          <Crown className="h-5 w-5 mr-2" />
          <CardTitle className="text-lg">Premium Features</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          <li className="flex items-start">
            <Check className="h-4 w-4 mr-2 mt-0.5" />
            <span className="text-sm">Unlimited photo storage</span>
          </li>
          <li className="flex items-start">
            <Check className="h-4 w-4 mr-2 mt-0.5" />
            <span className="text-sm">Track multiple pregnancies or babies</span>
          </li>
          <li className="flex items-start">
            <Check className="h-4 w-4 mr-2 mt-0.5" />
            <span className="text-sm">Advanced health analytics & insights</span>
          </li>
          <li className="flex items-start">
            <Check className="h-4 w-4 mr-2 mt-0.5" />
            <span className="text-sm">Expert Q&A access</span>
          </li>
        </ul>

        <Button
          className="w-full mt-6 bg-white text-primary-600 hover:bg-white/90"
          onClick={handleUpgrade}
        >
          Upgrade to Premium
        </Button>
      </CardContent>
    </Card>
  );
}