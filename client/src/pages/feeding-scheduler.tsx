import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NavigationBar } from "@/components/navigation-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { 
  Utensils, 
  Clock, 
  Baby, 
  TrendingUp,
  Calendar,
  Milk,
  Apple,
  Droplets,
  Plus,
  Target,
  AlertCircle
} from "lucide-react";
import { format, addHours, differenceInMinutes } from "date-fns";

interface FeedingSchedule {
  id: number;
  childId: number;
  feedingType: string;
  scheduledTime: string;
  amount?: number;
  unit: string;
  isCompleted: boolean;
  completedAt?: string;
  notes?: string;
  createdAt: string;
}

interface NutritionGoal {
  id: number;
  childId: number;
  ageInMonths: number;
  dailyCalories?: number;
  dailyMilk?: number;
  dailyWater?: number;
  dailyFruits?: number;
  dailyVegetables?: number;
  dailyGrains?: number;
  notes?: string;
  createdAt: string;
}

export default function FeedingScheduler() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("schedule");
  const [selectedChild, setSelectedChild] = useState<number | null>(null);

  // Get children
  const { data: children = [] } = useQuery({
    queryKey: ["/api/children"],
    enabled: !!user
  });

  // Get feeding schedules
  const { data: schedules = [] } = useQuery<FeedingSchedule[]>({
    queryKey: ["/api/feeding-schedules", selectedChild],
    enabled: !!user && !!selectedChild
  });

  // Get nutrition goals
  const { data: nutritionGoals } = useQuery<NutritionGoal>({
    queryKey: ["/api/nutrition-goals", selectedChild],
    enabled: !!user && !!selectedChild
  });

  const currentChild = children.find(c => c.id === selectedChild) || children[0];
  
  // Calculate next feeding time
  const getNextFeedingTime = () => {
    const uncompletedSchedules = schedules.filter(s => !s.isCompleted);
    if (uncompletedSchedules.length === 0) return null;
    
    const sortedSchedules = uncompletedSchedules.sort((a, b) => 
      new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
    );
    return sortedSchedules[0];
  };

  const nextFeeding = getNextFeedingTime();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavigationBar />
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Please log in to access feeding scheduler.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar />
      
      {/* Navigation Banner */}
      <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg mx-6 mt-6 p-4 border border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Extras</span>
              <span className="text-sm text-muted-foreground">›</span>
              <span className="text-sm font-medium text-green-700">Feeding Scheduler</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-green-600">
            <Utensils className="h-4 w-4" />
            <span className="text-sm font-medium">
              {format(new Date(), "MMMM d, yyyy")}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 space-y-6">
        {/* Page Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center mb-2">
            <Utensils className="w-6 h-6 text-green-600 mr-2" />
            <h1 className="text-3xl font-bold text-green-700">Feeding Scheduler & Nutrition Tracker</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Create personalized feeding schedules and track nutritional goals for optimal baby development
          </p>
        </div>

        {/* Child Selection */}
        {children.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <Label>Select Child:</Label>
                <Select 
                  value={selectedChild?.toString() || ""} 
                  onValueChange={(value) => setSelectedChild(parseInt(value))}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Choose a child" />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map((child) => (
                      <SelectItem key={child.id} value={child.id.toString()}>
                        {child.name} ({child.isPregnancy ? 'Pregnancy' : 'Baby'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Feeding Alert */}
        {nextFeeding && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <AlertCircle className="h-8 w-8 text-orange-600" />
                <div>
                  <h3 className="font-semibold text-orange-800">Next Feeding Due</h3>
                  <p className="text-orange-700">
                    {nextFeeding.feedingType} - {format(new Date(nextFeeding.scheduledTime), "h:mm a")}
                    {nextFeeding.amount && ` (${nextFeeding.amount} ${nextFeeding.unit})`}
                  </p>
                </div>
                <Button size="sm" className="ml-auto">
                  Mark Complete
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="nutrition">Nutrition Goals</TabsTrigger>
            <TabsTrigger value="tracking">Daily Tracking</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Create Feeding Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScheduleForm childId={selectedChild} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Today's Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {schedules.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        No feeding schedule created yet
                      </p>
                    ) : (
                      schedules.map((schedule) => (
                        <ScheduleCard key={schedule.id} schedule={schedule} />
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="nutrition">
            <Card>
              <CardHeader>
                <CardTitle>Nutritional Goals & Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                <NutritionGoalsForm childId={selectedChild} goals={nutritionGoals} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tracking">
            <Card>
              <CardHeader>
                <CardTitle>Daily Nutrition Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <DailyTrackingView childId={selectedChild} goals={nutritionGoals} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights">
            <Card>
              <CardHeader>
                <CardTitle>Feeding Insights & Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <InsightsView childId={selectedChild} schedules={schedules} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Component placeholders - these would be fully implemented
function ScheduleForm({ childId }: { childId: number | null }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Create automated feeding schedules based on age and feeding preferences
      </p>
      <Button disabled={!childId}>
        <Plus className="h-4 w-4 mr-2" />
        Create Schedule
      </Button>
    </div>
  );
}

function ScheduleCard({ schedule }: { schedule: FeedingSchedule }) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center space-x-3">
        <Milk className="h-5 w-5 text-blue-600" />
        <div>
          <p className="font-medium">{schedule.feedingType}</p>
          <p className="text-sm text-muted-foreground">
            {format(new Date(schedule.scheduledTime), "h:mm a")}
          </p>
        </div>
      </div>
      <Badge variant={schedule.isCompleted ? "default" : "secondary"}>
        {schedule.isCompleted ? "Complete" : "Pending"}
      </Badge>
    </div>
  );
}

function NutritionGoalsForm({ childId, goals }: { childId: number | null; goals?: NutritionGoal }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Set age-appropriate nutritional goals and track daily intake
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Daily Milk (oz)</Label>
          <Input placeholder="24" disabled={!childId} />
        </div>
        <div className="space-y-2">
          <Label>Daily Water (oz)</Label>
          <Input placeholder="8" disabled={!childId} />
        </div>
      </div>
      <Button disabled={!childId}>Save Nutrition Goals</Button>
    </div>
  );
}

function DailyTrackingView({ childId, goals }: { childId: number | null; goals?: NutritionGoal }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Milk className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <p className="text-2xl font-bold">16/24</p>
              <p className="text-sm text-muted-foreground">oz Milk</p>
              <Progress value={67} className="mt-2" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Droplets className="h-8 w-8 mx-auto text-cyan-600 mb-2" />
              <p className="text-2xl font-bold">4/8</p>
              <p className="text-sm text-muted-foreground">oz Water</p>
              <Progress value={50} className="mt-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Apple className="h-8 w-8 mx-auto text-red-600 mb-2" />
              <p className="text-2xl font-bold">2/3</p>
              <p className="text-sm text-muted-foreground">Servings Fruit</p>
              <Progress value={67} className="mt-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Target className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <p className="text-2xl font-bold">850/1000</p>
              <p className="text-sm text-muted-foreground">Calories</p>
              <Progress value={85} className="mt-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InsightsView({ childId, schedules }: { childId: number | null; schedules: FeedingSchedule[] }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Schedule Adherence</p>
                <p className="text-2xl font-bold">87%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Feeding Duration</p>
                <p className="text-2xl font-bold">25min</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4">Personalized Recommendations</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <p className="text-sm">Consider increasing water intake by 2oz daily</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p className="text-sm">Great job maintaining consistent feeding times!</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <p className="text-sm">Try introducing new fruits for variety</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}