import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, isValid, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Heart, Plus, Moon, Utensils, Dumbbell, Sparkles, Brain, Clock, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { AppTabs } from "@/components/app-tabs";
import { MobileNav } from "@/components/mobile-nav";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";

// Safe date formatter
function safeFormatDate(dateValue: any, formatString: string = 'MMM d, yyyy'): string {
  try {
    if (!dateValue) return 'Not set';
    
    if (typeof dateValue === 'string') {
      const parsedDate = parseISO(dateValue);
      if (isValid(parsedDate)) {
        return format(parsedDate, formatString);
      }
    }
    
    if (dateValue instanceof Date && isValid(dateValue)) {
      return format(dateValue, formatString);
    }
    
    return 'Invalid date';
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid date';
  }
}

export default function SelfCarePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("mood");

  // Fetch self-care records using a special user ID for self-care tracking
  const { data: allRecords = [] } = useQuery({
    queryKey: [`/api/children/self-care/milestones`],
  });

  const moodRecords = allRecords.filter((m: any) => m.category === 'mood');
  const sleepRecords = allRecords.filter((m: any) => m.category === 'sleep');
  const exerciseRecords = allRecords.filter((m: any) => m.category === 'exercise');
  const nutritionRecords = allRecords.filter((m: any) => m.category === 'nutrition');
  const meTimeRecords = allRecords.filter((m: any) => m.category === 'metime');
  const mentalHealthRecords = allRecords.filter((m: any) => m.category === 'mental');

  return (
    <div className="min-h-screen flex flex-col bg-secondary-50">
      <AppHeader />
      <AppTabs />
      
      <main className="flex-grow container mx-auto px-4 py-6 pb-20 md:pb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Self-Care & Wellness</h1>
            <p className="text-muted-foreground">Taking care of yourself is essential for taking care of your family</p>
          </div>
          <Button>
            <Sparkles className="w-4 h-4 mr-2" />
            Daily Check-in
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="mood">Mood</TabsTrigger>
            <TabsTrigger value="sleep">Sleep</TabsTrigger>
            <TabsTrigger value="exercise">Exercise</TabsTrigger>
            <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
            <TabsTrigger value="metime">Me Time</TabsTrigger>
            <TabsTrigger value="mental">Mental Health</TabsTrigger>
          </TabsList>

          <TabsContent value="mood" className="space-y-6">
            <MoodTrackerCard records={moodRecords} />
            <WellnessTipsCard category="mood" />
          </TabsContent>

          <TabsContent value="sleep" className="space-y-6">
            <SleepTrackerCard records={sleepRecords} />
            <WellnessTipsCard category="sleep" />
          </TabsContent>

          <TabsContent value="exercise" className="space-y-6">
            <ExerciseTrackerCard records={exerciseRecords} />
            <WellnessTipsCard category="exercise" />
          </TabsContent>

          <TabsContent value="nutrition" className="space-y-6">
            <NutritionTrackerCard records={nutritionRecords} />
            <WellnessTipsCard category="nutrition" />
          </TabsContent>

          <TabsContent value="metime" className="space-y-6">
            <MeTimeTrackerCard records={meTimeRecords} />
            <WellnessTipsCard category="metime" />
          </TabsContent>

          <TabsContent value="mental" className="space-y-6">
            <MentalHealthTrackerCard records={mentalHealthRecords} />
            <WellnessTipsCard category="mental" />
          </TabsContent>
        </Tabs>

        {/* Weekly Summary */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              This Week's Wellness Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">7</p>
                <p className="text-sm text-muted-foreground">Days tracked</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">6.5</p>
                <p className="text-sm text-muted-foreground">Avg sleep hours</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">4</p>
                <p className="text-sm text-muted-foreground">Exercise sessions</p>
              </div>
              <div className="text-center p-4 bg-pink-50 rounded-lg">
                <p className="text-2xl font-bold text-pink-600">Good</p>
                <p className="text-sm text-muted-foreground">Overall mood</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      
      <AppFooter />
      <MobileNav />
    </div>
  );
}

function MoodTrackerCard({ records }: { records: any[] }) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const moodForm = useForm({
    defaultValues: {
      mood: 5,
      energy: 5,
      stress: 3,
      notes: '',
      date: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const addMoodMutation = useMutation({
    mutationFn: async (data: any) => {
      const moodLabels = ['Very Low', 'Low', 'Below Average', 'Average', 'Good', 'Great', 'Excellent', 'Amazing', 'Fantastic', 'Perfect'];
      const moodTitle = `Mood: ${moodLabels[data.mood - 1] || 'Good'}`;
      const description = `Mood: ${data.mood}/10, Energy: ${data.energy}/10, Stress: ${data.stress}/10${data.notes ? `, Notes: ${data.notes}` : ''}`;
      
      return apiRequest(`/api/children/self-care/milestones`, {
        method: "POST",
        body: JSON.stringify({
          title: moodTitle,
          category: 'mood',
          date: new Date(data.date),
          description: description,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/children/self-care/milestones`] });
      toast({
        title: "Success",
        description: "Mood record saved successfully!",
      });
      setIsDialogOpen(false);
      moodForm.reset();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Heart className="w-5 h-5 mr-2" />
          Mood & Energy Tracker
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm mb-4">
          Track your daily mood, energy levels, and stress to identify patterns.
        </p>
        
        {records.length > 0 && (
          <div className="space-y-2 mb-4">
            <h4 className="font-medium text-sm">Recent Entries</h4>
            {records.slice(-3).map((record: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-2 bg-muted rounded text-sm">
                <span className="font-medium">{record.title}</span>
                <span className="text-muted-foreground">{safeFormatDate(record.date)}</span>
              </div>
            ))}
          </div>
        )}
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Record Mood
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Daily Mood Check-in</DialogTitle>
            </DialogHeader>
            <Form {...moodForm}>
              <form onSubmit={moodForm.handleSubmit((data) => addMoodMutation.mutate(data))} className="space-y-4">
                <div>
                  <Label>Date</Label>
                  <Input type="date" {...moodForm.register('date')} />
                </div>
                
                <div>
                  <Label>Mood (1-10)</Label>
                  <div className="px-3 py-2">
                    <Slider
                      value={[moodForm.watch('mood')]}
                      onValueChange={(value) => moodForm.setValue('mood', value[0])}
                      max={10}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Very Low</span>
                      <span>Perfect</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Energy Level (1-10)</Label>
                  <div className="px-3 py-2">
                    <Slider
                      value={[moodForm.watch('energy')]}
                      onValueChange={(value) => moodForm.setValue('energy', value[0])}
                      max={10}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <Label>Stress Level (1-10)</Label>
                  <div className="px-3 py-2">
                    <Slider
                      value={[moodForm.watch('stress')]}
                      onValueChange={(value) => moodForm.setValue('stress', value[0])}
                      max={10}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea placeholder="How are you feeling today? Any thoughts or observations..." {...moodForm.register('notes')} />
                </div>

                <Button type="submit" className="w-full">Save Mood Record</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function SleepTrackerCard({ records }: { records: any[] }) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const sleepForm = useForm({
    defaultValues: {
      bedtime: '22:00',
      wakeTime: '07:00',
      quality: 7,
      interruptions: 0,
      notes: '',
      date: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const addSleepMutation = useMutation({
    mutationFn: async (data: any) => {
      const hours = (new Date(`2000-01-01 ${data.wakeTime}`).getTime() - new Date(`2000-01-01 ${data.bedtime}`).getTime()) / (1000 * 60 * 60);
      const sleepHours = hours > 0 ? hours : hours + 24;
      const sleepTitle = `Sleep: ${sleepHours.toFixed(1)} hours`;
      const description = `Bedtime: ${data.bedtime}, Wake: ${data.wakeTime}, Quality: ${data.quality}/10, Interruptions: ${data.interruptions}${data.notes ? `, Notes: ${data.notes}` : ''}`;
      
      return apiRequest(`/api/children/self-care/milestones`, {
        method: "POST",
        body: JSON.stringify({
          title: sleepTitle,
          category: 'sleep',
          date: new Date(data.date),
          description: description,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/children/self-care/milestones`] });
      toast({
        title: "Success",
        description: "Sleep record saved successfully!",
      });
      setIsDialogOpen(false);
      sleepForm.reset();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Moon className="w-5 h-5 mr-2" />
          Sleep Tracker
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm mb-4">
          Track your sleep patterns to improve rest and recovery.
        </p>
        
        {records.length > 0 && (
          <div className="space-y-2 mb-4">
            <h4 className="font-medium text-sm">Recent Sleep</h4>
            {records.slice(-3).map((record: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-2 bg-muted rounded text-sm">
                <span className="font-medium">{record.title}</span>
                <span className="text-muted-foreground">{safeFormatDate(record.date)}</span>
              </div>
            ))}
          </div>
        )}
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Record Sleep
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sleep Tracking</DialogTitle>
            </DialogHeader>
            <Form {...sleepForm}>
              <form onSubmit={sleepForm.handleSubmit((data) => addSleepMutation.mutate(data))} className="space-y-4">
                <div>
                  <Label>Date</Label>
                  <Input type="date" {...sleepForm.register('date')} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Bedtime</Label>
                    <Input type="time" {...sleepForm.register('bedtime')} />
                  </div>
                  <div>
                    <Label>Wake Time</Label>
                    <Input type="time" {...sleepForm.register('wakeTime')} />
                  </div>
                </div>

                <div>
                  <Label>Sleep Quality (1-10)</Label>
                  <div className="px-3 py-2">
                    <Slider
                      value={[sleepForm.watch('quality')]}
                      onValueChange={(value) => sleepForm.setValue('quality', value[0])}
                      max={10}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <Label>Number of Interruptions</Label>
                  <Input type="number" min="0" {...sleepForm.register('interruptions')} />
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea placeholder="How did you sleep? Any factors affecting sleep..." {...sleepForm.register('notes')} />
                </div>

                <Button type="submit" className="w-full">Save Sleep Record</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function ExerciseTrackerCard({ records }: { records: any[] }) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const exerciseForm = useForm({
    defaultValues: {
      type: 'walking',
      duration: '',
      intensity: 'moderate',
      notes: '',
      date: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const addExerciseMutation = useMutation({
    mutationFn: async (data: any) => {
      const exerciseTitle = `${data.type.charAt(0).toUpperCase() + data.type.slice(1)} - ${data.duration} min`;
      const description = `Type: ${data.type}, Duration: ${data.duration} minutes, Intensity: ${data.intensity}${data.notes ? `, Notes: ${data.notes}` : ''}`;
      
      return apiRequest(`/api/children/self-care/milestones`, {
        method: "POST",
        body: JSON.stringify({
          title: exerciseTitle,
          category: 'exercise',
          date: new Date(data.date),
          description: description,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/children/self-care/milestones`] });
      toast({
        title: "Success",
        description: "Exercise record saved successfully!",
      });
      setIsDialogOpen(false);
      exerciseForm.reset();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Dumbbell className="w-5 h-5 mr-2" />
          Exercise & Movement
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm mb-4">
          Track your physical activity and movement throughout the day.
        </p>
        
        {records.length > 0 && (
          <div className="space-y-2 mb-4">
            <h4 className="font-medium text-sm">Recent Activities</h4>
            {records.slice(-3).map((record: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-2 bg-muted rounded text-sm">
                <span className="font-medium">{record.title}</span>
                <span className="text-muted-foreground">{safeFormatDate(record.date)}</span>
              </div>
            ))}
          </div>
        )}
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Record Exercise
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Exercise Tracking</DialogTitle>
            </DialogHeader>
            <Form {...exerciseForm}>
              <form onSubmit={exerciseForm.handleSubmit((data) => addExerciseMutation.mutate(data))} className="space-y-4">
                <div>
                  <Label>Date</Label>
                  <Input type="date" {...exerciseForm.register('date')} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Exercise Type</Label>
                    <Select onValueChange={(value) => exerciseForm.setValue('type', value)} defaultValue="walking">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="walking">Walking</SelectItem>
                        <SelectItem value="yoga">Yoga</SelectItem>
                        <SelectItem value="prenatal-yoga">Prenatal Yoga</SelectItem>
                        <SelectItem value="swimming">Swimming</SelectItem>
                        <SelectItem value="pilates">Pilates</SelectItem>
                        <SelectItem value="stretching">Stretching</SelectItem>
                        <SelectItem value="cardio">Cardio</SelectItem>
                        <SelectItem value="strength">Strength Training</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Duration (minutes)</Label>
                    <Input type="number" placeholder="30" {...exerciseForm.register('duration')} />
                  </div>
                </div>

                <div>
                  <Label>Intensity</Label>
                  <Select onValueChange={(value) => exerciseForm.setValue('intensity', value)} defaultValue="moderate">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="vigorous">Vigorous</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea placeholder="How did you feel? Any achievements or observations..." {...exerciseForm.register('notes')} />
                </div>

                <Button type="submit" className="w-full">Save Exercise Record</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function NutritionTrackerCard({ records }: { records: any[] }) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const nutritionForm = useForm({
    defaultValues: {
      meals: 3,
      snacks: 2,
      water: 8,
      vitamins: 'yes',
      notes: '',
      date: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const addNutritionMutation = useMutation({
    mutationFn: async (data: any) => {
      const nutritionTitle = `Nutrition: ${data.meals} meals, ${data.water} glasses water`;
      const description = `Meals: ${data.meals}, Snacks: ${data.snacks}, Water: ${data.water} glasses, Vitamins: ${data.vitamins}${data.notes ? `, Notes: ${data.notes}` : ''}`;
      
      return apiRequest(`/api/children/self-care/milestones`, {
        method: "POST",
        body: JSON.stringify({
          title: nutritionTitle,
          category: 'nutrition',
          date: new Date(data.date),
          description: description,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/children/self-care/milestones`] });
      toast({
        title: "Success",
        description: "Nutrition record saved successfully!",
      });
      setIsDialogOpen(false);
      nutritionForm.reset();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Utensils className="w-5 h-5 mr-2" />
          Nutrition & Hydration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm mb-4">
          Track your daily nutrition and hydration to maintain your health.
        </p>
        
        {records.length > 0 && (
          <div className="space-y-2 mb-4">
            <h4 className="font-medium text-sm">Recent Nutrition</h4>
            {records.slice(-3).map((record: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-2 bg-muted rounded text-sm">
                <span className="font-medium">{record.title}</span>
                <span className="text-muted-foreground">{safeFormatDate(record.date)}</span>
              </div>
            ))}
          </div>
        )}
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Record Nutrition
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nutrition Tracking</DialogTitle>
            </DialogHeader>
            <Form {...nutritionForm}>
              <form onSubmit={nutritionForm.handleSubmit((data) => addNutritionMutation.mutate(data))} className="space-y-4">
                <div>
                  <Label>Date</Label>
                  <Input type="date" {...nutritionForm.register('date')} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Number of Meals</Label>
                    <Input type="number" min="0" max="10" {...nutritionForm.register('meals')} />
                  </div>
                  <div>
                    <Label>Number of Snacks</Label>
                    <Input type="number" min="0" max="10" {...nutritionForm.register('snacks')} />
                  </div>
                </div>

                <div>
                  <Label>Glasses of Water</Label>
                  <Input type="number" min="0" max="20" {...nutritionForm.register('water')} />
                </div>

                <div>
                  <Label>Took Prenatal/Vitamins?</Label>
                  <Select onValueChange={(value) => nutritionForm.setValue('vitamins', value)} defaultValue="yes">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea placeholder="How was your nutrition today? Any cravings or aversions..." {...nutritionForm.register('notes')} />
                </div>

                <Button type="submit" className="w-full">Save Nutrition Record</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function MeTimeTrackerCard({ records }: { records: any[] }) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const meTimeForm = useForm({
    defaultValues: {
      activity: 'reading',
      duration: '',
      enjoyment: 8,
      notes: '',
      date: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const addMeTimeMutation = useMutation({
    mutationFn: async (data: any) => {
      const meTimeTitle = `Me Time: ${data.activity} - ${data.duration} min`;
      const description = `Activity: ${data.activity}, Duration: ${data.duration} minutes, Enjoyment: ${data.enjoyment}/10${data.notes ? `, Notes: ${data.notes}` : ''}`;
      
      return apiRequest(`/api/children/self-care/milestones`, {
        method: "POST",
        body: JSON.stringify({
          title: meTimeTitle,
          category: 'metime',
          date: new Date(data.date),
          description: description,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/children/self-care/milestones`] });
      toast({
        title: "Success",
        description: "Me time record saved successfully!",
      });
      setIsDialogOpen(false);
      meTimeForm.reset();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Sparkles className="w-5 h-5 mr-2" />
          Me Time & Relaxation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm mb-4">
          Track time you spend on yourself for relaxation and personal activities.
        </p>
        
        {records.length > 0 && (
          <div className="space-y-2 mb-4">
            <h4 className="font-medium text-sm">Recent Me Time</h4>
            {records.slice(-3).map((record: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-2 bg-muted rounded text-sm">
                <span className="font-medium">{record.title}</span>
                <span className="text-muted-foreground">{safeFormatDate(record.date)}</span>
              </div>
            ))}
          </div>
        )}
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Record Me Time
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Me Time Tracking</DialogTitle>
            </DialogHeader>
            <Form {...meTimeForm}>
              <form onSubmit={meTimeForm.handleSubmit((data) => addMeTimeMutation.mutate(data))} className="space-y-4">
                <div>
                  <Label>Date</Label>
                  <Input type="date" {...meTimeForm.register('date')} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Activity</Label>
                    <Select onValueChange={(value) => meTimeForm.setValue('activity', value)} defaultValue="reading">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reading">Reading</SelectItem>
                        <SelectItem value="bath">Relaxing Bath</SelectItem>
                        <SelectItem value="meditation">Meditation</SelectItem>
                        <SelectItem value="music">Listening to Music</SelectItem>
                        <SelectItem value="crafts">Arts & Crafts</SelectItem>
                        <SelectItem value="massage">Massage</SelectItem>
                        <SelectItem value="skincare">Skincare Routine</SelectItem>
                        <SelectItem value="journaling">Journaling</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Duration (minutes)</Label>
                    <Input type="number" placeholder="30" {...meTimeForm.register('duration')} />
                  </div>
                </div>

                <div>
                  <Label>Enjoyment Level (1-10)</Label>
                  <div className="px-3 py-2">
                    <Slider
                      value={[meTimeForm.watch('enjoyment')]}
                      onValueChange={(value) => meTimeForm.setValue('enjoyment', value[0])}
                      max={10}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea placeholder="How did you feel? What did you enjoy most..." {...meTimeForm.register('notes')} />
                </div>

                <Button type="submit" className="w-full">Save Me Time Record</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function MentalHealthTrackerCard({ records }: { records: any[] }) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const mentalForm = useForm({
    defaultValues: {
      type: 'check-in',
      feelings: '',
      coping: '',
      support: 'good',
      notes: '',
      date: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const addMentalMutation = useMutation({
    mutationFn: async (data: any) => {
      const mentalTitle = `Mental Health: ${data.type}`;
      const description = `Type: ${data.type}, Support Level: ${data.support}${data.feelings ? `, Feelings: ${data.feelings}` : ''}${data.coping ? `, Coping: ${data.coping}` : ''}${data.notes ? `, Notes: ${data.notes}` : ''}`;
      
      return apiRequest(`/api/children/self-care/milestones`, {
        method: "POST",
        body: JSON.stringify({
          title: mentalTitle,
          category: 'mental',
          date: new Date(data.date),
          description: description,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/children/self-care/milestones`] });
      toast({
        title: "Success",
        description: "Mental health record saved successfully!",
      });
      setIsDialogOpen(false);
      mentalForm.reset();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Brain className="w-5 h-5 mr-2" />
          Mental Health & Emotional Wellbeing
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm mb-4">
          Track your mental health, emotional state, and coping strategies.
        </p>
        
        {records.length > 0 && (
          <div className="space-y-2 mb-4">
            <h4 className="font-medium text-sm">Recent Check-ins</h4>
            {records.slice(-3).map((record: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-2 bg-muted rounded text-sm">
                <span className="font-medium">{record.title}</span>
                <span className="text-muted-foreground">{safeFormatDate(record.date)}</span>
              </div>
            ))}
          </div>
        )}
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Mental Health Check-in
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mental Health Check-in</DialogTitle>
            </DialogHeader>
            <Form {...mentalForm}>
              <form onSubmit={mentalForm.handleSubmit((data) => addMentalMutation.mutate(data))} className="space-y-4">
                <div>
                  <Label>Date</Label>
                  <Input type="date" {...mentalForm.register('date')} />
                </div>
                
                <div>
                  <Label>Check-in Type</Label>
                  <Select onValueChange={(value) => mentalForm.setValue('type', value)} defaultValue="check-in">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="check-in">Daily Check-in</SelectItem>
                      <SelectItem value="anxiety">Anxiety Management</SelectItem>
                      <SelectItem value="depression">Depression Support</SelectItem>
                      <SelectItem value="postpartum">Postpartum Mental Health</SelectItem>
                      <SelectItem value="stress">Stress Management</SelectItem>
                      <SelectItem value="therapy">Therapy Session</SelectItem>
                      <SelectItem value="breakthrough">Positive Breakthrough</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>How are you feeling?</Label>
                  <Textarea placeholder="Describe your current emotional state..." {...mentalForm.register('feelings')} />
                </div>

                <div>
                  <Label>Coping Strategies Used</Label>
                  <Textarea placeholder="What helped you today? Any techniques or strategies..." {...mentalForm.register('coping')} />
                </div>

                <div>
                  <Label>Support System Feel</Label>
                  <Select onValueChange={(value) => mentalForm.setValue('support', value)} defaultValue="good">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent Support</SelectItem>
                      <SelectItem value="good">Good Support</SelectItem>
                      <SelectItem value="adequate">Adequate Support</SelectItem>
                      <SelectItem value="lacking">Need More Support</SelectItem>
                      <SelectItem value="isolated">Feeling Isolated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Additional Notes</Label>
                  <Textarea placeholder="Any other thoughts, concerns, or reflections..." {...mentalForm.register('notes')} />
                </div>

                <Button type="submit" className="w-full">Save Mental Health Record</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function WellnessTipsCard({ category }: { category: string }) {
  const tips = {
    mood: [
      "Practice gratitude by writing down 3 things you're grateful for each day",
      "Take 5 minutes for deep breathing exercises",
      "Connect with a friend or family member who makes you smile",
      "Listen to your favorite music or relaxing sounds"
    ],
    sleep: [
      "Create a consistent bedtime routine",
      "Avoid screens 1 hour before bed",
      "Keep your bedroom cool and dark",
      "Try gentle stretches or meditation before sleep"
    ],
    exercise: [
      "Start with 10-15 minutes of gentle movement daily",
      "Try prenatal yoga or postnatal-safe exercises",
      "Take walking breaks throughout the day",
      "Listen to your body and don't overdo it"
    ],
    nutrition: [
      "Eat small, frequent meals to maintain energy",
      "Include protein and healthy fats in each meal",
      "Stay hydrated - aim for 8-10 glasses of water daily",
      "Take your prenatal vitamins consistently"
    ],
    metime: [
      "Schedule 'me time' like any other important appointment",
      "Start with just 10-15 minutes if you're pressed for time",
      "Try activities that make you feel rejuvenated",
      "Don't feel guilty about taking time for yourself"
    ],
    mental: [
      "Talk to someone you trust about your feelings",
      "Consider professional counseling if needed",
      "Practice mindfulness and stay present",
      "Remember that seeking help is a sign of strength"
    ]
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Heart className="w-5 h-5 mr-2" />
          Wellness Tips
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {tips[category as keyof typeof tips]?.map((tip, index) => (
            <li key={index} className="flex items-start">
              <span className="w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span className="text-sm">{tip}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}