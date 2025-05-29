import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { 
  Heart, 
  Calendar as CalendarIcon, 
  Thermometer, 
  FlaskConical, 
  Target,
  Plus,
  TrendingUp,
  Clock,
  Activity
} from "lucide-react";
import { format, differenceInDays, addDays, startOfDay } from "date-fns";

interface OvulationCycle {
  id: number;
  userId: number;
  cycleStartDate: string;
  cycleLength: number;
  ovulationDate?: string;
  lutealPhaseLength?: number;
  notes?: string;
  createdAt: string;
}

interface FertilitySymptom {
  id: number;
  userId: number;
  cycleId?: number;
  date: string;
  basalBodyTemp?: number;
  cervicalMucus?: string;
  cervicalPosition?: string;
  cervicalFirmness?: string;
  ovulationPain: boolean;
  breastTenderness: boolean;
  mood?: string;
  energyLevel?: number;
  libido?: number;
  notes?: string;
  createdAt: string;
}

interface OvulationTest {
  id: number;
  userId: number;
  cycleId?: number;
  date: string;
  testTime: string;
  result: string;
  testBrand?: string;
  notes?: string;
  createdAt: string;
}

interface ConceptionGoal {
  id: number;
  userId: number;
  targetConceptionDate?: string;
  vitaminsSupplement: boolean;
  folicAcidDaily: boolean;
  exerciseRoutine?: string;
  dietaryChanges?: string;
  stressManagement?: string;
  sleepHours?: number;
  caffeineLimit: boolean;
  alcoholLimit: boolean;
  smokingCessation: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ConceptionTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState("overview");

  // Queries
  const { data: cycles = [] } = useQuery<OvulationCycle[]>({
    queryKey: ["/api/conception/cycles"],
    enabled: !!user
  });

  const { data: symptoms = [] } = useQuery<FertilitySymptom[]>({
    queryKey: ["/api/conception/symptoms"],
    enabled: !!user
  });

  const { data: tests = [] } = useQuery<OvulationTest[]>({
    queryKey: ["/api/conception/tests"],
    enabled: !!user
  });

  const { data: goals } = useQuery<ConceptionGoal>({
    queryKey: ["/api/conception/goals"],
    enabled: !!user
  });

  // Current cycle calculation
  const currentCycle = cycles[0];
  const currentCycleDay = currentCycle 
    ? Math.max(1, differenceInDays(new Date(), new Date(currentCycle.cycleStartDate)) + 1)
    : 1;
  
  const estimatedOvulation = currentCycle 
    ? addDays(new Date(currentCycle.cycleStartDate), Math.floor(currentCycle.cycleLength / 2))
    : null;

  // Fertility window calculation
  const fertileWindowStart = estimatedOvulation ? addDays(estimatedOvulation, -5) : null;
  const fertileWindowEnd = estimatedOvulation ? addDays(estimatedOvulation, 1) : null;
  const isInFertileWindow = fertileWindowStart && fertileWindowEnd 
    ? (new Date() >= fertileWindowStart && new Date() <= fertileWindowEnd)
    : false;

  // Mutations
  const createCycleMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/conception/cycles", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conception/cycles"] });
      toast({ title: "Cycle started successfully!" });
    }
  });

  const createSymptomMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/conception/symptoms", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conception/symptoms"] });
      toast({ title: "Symptoms recorded successfully!" });
    }
  });

  const createTestMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/conception/tests", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conception/tests"] });
      toast({ title: "Test result recorded successfully!" });
    }
  });

  const updateGoalsMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/conception/goals", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conception/goals"] });
      toast({ title: "Goals updated successfully!" });
    }
  });

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Please log in to access conception tracking.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Fertility Tracker Banner */}
      <Card className="border-2 border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <Heart className="w-6 h-6 text-rose-600 mr-2" />
            <Badge variant="secondary" className="bg-rose-100 text-rose-800 text-lg px-4 py-2">
              Fertility Journey
            </Badge>
          </div>
          <h1 className="text-3xl font-bold text-rose-700 mb-2">Conception Tracker</h1>
          <p className="text-rose-600 mb-4">
            Track your fertility journey and maximize conception chances with comprehensive cycle monitoring
          </p>
          <div className="flex items-center justify-center gap-2 text-rose-600">
            <CalendarIcon className="h-5 w-5" />
            <span className="text-sm font-medium">
              {format(new Date(), "MMMM d, yyyy")}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Current Cycle Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cycle Day</p>
                <p className="text-2xl font-bold">{currentCycleDay}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cycle Length</p>
                <p className="text-2xl font-bold">{currentCycle?.cycleLength || 28}</p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fertile Window</p>
                <Badge variant={isInFertileWindow ? "default" : "secondary"}>
                  {isInFertileWindow ? "Active" : "Inactive"}
                </Badge>
              </div>
              <Heart className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estimated Ovulation</p>
                <p className="text-sm font-bold">
                  {estimatedOvulation ? format(estimatedOvulation, "MMM d") : "TBD"}
                </p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      {currentCycle && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Cycle Progress</span>
                <span>{currentCycleDay}/{currentCycle.cycleLength} days</span>
              </div>
              <Progress value={(currentCycleDay / currentCycle.cycleLength) * 100} />
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="symptoms">Symptoms</TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="cycle">Cycle</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {symptoms.slice(0, 3).map((symptom) => (
                    <div key={symptom.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Symptoms recorded</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(symptom.date), "MMM d")}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {symptom.basalBodyTemp ? `${symptom.basalBodyTemp}°F` : "No temp"}
                      </Badge>
                    </div>
                  ))}
                  {tests.slice(0, 2).map((test) => (
                    <div key={test.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Ovulation test</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(test.date), "MMM d")}
                        </p>
                      </div>
                      <Badge variant={test.result === "positive" ? "default" : "secondary"}>
                        {test.result}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full" 
                  onClick={() => setActiveTab("symptoms")}
                >
                  <Thermometer className="h-4 w-4 mr-2" />
                  Record Today's Symptoms
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setActiveTab("tests")}
                >
                  <FlaskConical className="h-4 w-4 mr-2" />
                  Log Ovulation Test
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setActiveTab("cycle")}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Start New Cycle
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="symptoms">
          <Card>
            <CardHeader>
              <CardTitle>Daily Fertility Symptoms</CardTitle>
            </CardHeader>
            <CardContent>
              <SymptomForm 
                onSubmit={(data) => createSymptomMutation.mutate({
                  ...data,
                  userId: user.id,
                  cycleId: currentCycle?.id
                })}
                isLoading={createSymptomMutation.isPending}
              />
              <Separator className="my-6" />
              <div className="space-y-4">
                <h3 className="font-semibold">Recent Symptoms</h3>
                {symptoms.slice(0, 5).map((symptom) => (
                  <SymptomCard key={symptom.id} symptom={symptom} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests">
          <Card>
            <CardHeader>
              <CardTitle>Ovulation Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <TestForm 
                onSubmit={(data) => createTestMutation.mutate({
                  ...data,
                  userId: user.id,
                  cycleId: currentCycle?.id
                })}
                isLoading={createTestMutation.isPending}
              />
              <Separator className="my-6" />
              <div className="space-y-4">
                <h3 className="font-semibold">Recent Tests</h3>
                {tests.slice(0, 5).map((test) => (
                  <TestCard key={test.id} test={test} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cycle">
          <Card>
            <CardHeader>
              <CardTitle>Cycle Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CycleForm 
                onSubmit={(data) => createCycleMutation.mutate({
                  ...data,
                  userId: user.id
                })}
                isLoading={createCycleMutation.isPending}
              />
              <Separator className="my-6" />
              <div className="space-y-4">
                <h3 className="font-semibold">Cycle History</h3>
                {cycles.slice(0, 5).map((cycle) => (
                  <CycleCard key={cycle.id} cycle={cycle} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals">
          <Card>
            <CardHeader>
              <CardTitle>Conception Goals & Health</CardTitle>
            </CardHeader>
            <CardContent>
              <GoalsForm 
                goals={goals}
                onSubmit={(data) => updateGoalsMutation.mutate({
                  ...data,
                  userId: user.id
                })}
                isLoading={updateGoalsMutation.isPending}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Component Forms and Cards
function SymptomForm({ onSubmit, isLoading }: { onSubmit: (data: any) => void; isLoading: boolean }) {
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    basalBodyTemp: "",
    cervicalMucus: "",
    cervicalPosition: "",
    cervicalFirmness: "",
    ovulationPain: false,
    breastTenderness: false,
    mood: "",
    energyLevel: "",
    libido: "",
    notes: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      basalBodyTemp: formData.basalBodyTemp ? parseFloat(formData.basalBodyTemp) : null,
      energyLevel: formData.energyLevel ? parseInt(formData.energyLevel) : null,
      libido: formData.libido ? parseInt(formData.libido) : null
    });
    setFormData({
      date: format(new Date(), "yyyy-MM-dd"),
      basalBodyTemp: "",
      cervicalMucus: "",
      cervicalPosition: "",
      cervicalFirmness: "",
      ovulationPain: false,
      breastTenderness: false,
      mood: "",
      energyLevel: "",
      libido: "",
      notes: ""
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="basalBodyTemp">Basal Body Temperature (°F)</Label>
          <Input
            id="basalBodyTemp"
            type="number"
            step="0.1"
            placeholder="98.6"
            value={formData.basalBodyTemp}
            onChange={(e) => setFormData({ ...formData, basalBodyTemp: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Cervical Mucus</Label>
          <Select value={formData.cervicalMucus} onValueChange={(value) => setFormData({ ...formData, cervicalMucus: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dry">Dry</SelectItem>
              <SelectItem value="sticky">Sticky</SelectItem>
              <SelectItem value="creamy">Creamy</SelectItem>
              <SelectItem value="watery">Watery</SelectItem>
              <SelectItem value="egg_white">Egg White</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Cervical Position</Label>
          <Select value={formData.cervicalPosition} onValueChange={(value) => setFormData({ ...formData, cervicalPosition: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Cervical Firmness</Label>
          <Select value={formData.cervicalFirmness} onValueChange={(value) => setFormData({ ...formData, cervicalFirmness: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select firmness" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="firm">Firm</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="soft">Soft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="ovulationPain"
            checked={formData.ovulationPain}
            onCheckedChange={(checked) => setFormData({ ...formData, ovulationPain: checked })}
          />
          <Label htmlFor="ovulationPain">Ovulation Pain</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="breastTenderness"
            checked={formData.breastTenderness}
            onCheckedChange={(checked) => setFormData({ ...formData, breastTenderness: checked })}
          />
          <Label htmlFor="breastTenderness">Breast Tenderness</Label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Mood</Label>
          <Select value={formData.mood} onValueChange={(value) => setFormData({ ...formData, mood: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select mood" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="happy">Happy</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
              <SelectItem value="sad">Sad</SelectItem>
              <SelectItem value="irritable">Irritable</SelectItem>
              <SelectItem value="anxious">Anxious</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="energyLevel">Energy Level (1-5)</Label>
          <Input
            id="energyLevel"
            type="number"
            min="1"
            max="5"
            value={formData.energyLevel}
            onChange={(e) => setFormData({ ...formData, energyLevel: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="libido">Libido (1-5)</Label>
          <Input
            id="libido"
            type="number"
            min="1"
            max="5"
            value={formData.libido}
            onChange={(e) => setFormData({ ...formData, libido: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Any additional notes..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Recording..." : "Record Symptoms"}
      </Button>
    </form>
  );
}

function TestForm({ onSubmit, isLoading }: { onSubmit: (data: any) => void; isLoading: boolean }) {
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    testTime: format(new Date(), "HH:mm"),
    result: "",
    testBrand: "",
    notes: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      date: format(new Date(), "yyyy-MM-dd"),
      testTime: format(new Date(), "HH:mm"),
      result: "",
      testBrand: "",
      notes: ""
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="testDate">Date</Label>
          <Input
            id="testDate"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="testTime">Time</Label>
          <Input
            id="testTime"
            type="time"
            value={formData.testTime}
            onChange={(e) => setFormData({ ...formData, testTime: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Result</Label>
          <Select value={formData.result} onValueChange={(value) => setFormData({ ...formData, result: value })} required>
            <SelectTrigger>
              <SelectValue placeholder="Select result" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="negative">Negative</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="peak">Peak</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="testBrand">Test Brand</Label>
          <Input
            id="testBrand"
            placeholder="e.g., Clearblue, First Response"
            value={formData.testBrand}
            onChange={(e) => setFormData({ ...formData, testBrand: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="testNotes">Notes</Label>
        <Textarea
          id="testNotes"
          placeholder="Any additional notes about the test..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Recording..." : "Record Test"}
      </Button>
    </form>
  );
}

function CycleForm({ onSubmit, isLoading }: { onSubmit: (data: any) => void; isLoading: boolean }) {
  const [formData, setFormData] = useState({
    cycleStartDate: format(new Date(), "yyyy-MM-dd"),
    cycleLength: "28",
    notes: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      cycleLength: parseInt(formData.cycleLength)
    });
    setFormData({
      cycleStartDate: format(new Date(), "yyyy-MM-dd"),
      cycleLength: "28",
      notes: ""
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cycleStartDate">Cycle Start Date</Label>
          <Input
            id="cycleStartDate"
            type="date"
            value={formData.cycleStartDate}
            onChange={(e) => setFormData({ ...formData, cycleStartDate: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cycleLength">Expected Cycle Length (days)</Label>
          <Input
            id="cycleLength"
            type="number"
            min="21"
            max="35"
            value={formData.cycleLength}
            onChange={(e) => setFormData({ ...formData, cycleLength: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cycleNotes">Notes</Label>
        <Textarea
          id="cycleNotes"
          placeholder="Any notes about this cycle..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Starting..." : "Start New Cycle"}
      </Button>
    </form>
  );
}

function GoalsForm({ goals, onSubmit, isLoading }: { goals?: ConceptionGoal; onSubmit: (data: any) => void; isLoading: boolean }) {
  const [formData, setFormData] = useState({
    targetConceptionDate: goals?.targetConceptionDate || "",
    vitaminsSupplement: goals?.vitaminsSupplement || false,
    folicAcidDaily: goals?.folicAcidDaily || false,
    exerciseRoutine: goals?.exerciseRoutine || "",
    dietaryChanges: goals?.dietaryChanges || "",
    stressManagement: goals?.stressManagement || "",
    sleepHours: goals?.sleepHours?.toString() || "",
    caffeineLimit: goals?.caffeineLimit || false,
    alcoholLimit: goals?.alcoholLimit || false,
    smokingCessation: goals?.smokingCessation || false,
    notes: goals?.notes || ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      sleepHours: formData.sleepHours ? parseInt(formData.sleepHours) : null
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="targetDate">Target Conception Date</Label>
        <Input
          id="targetDate"
          type="date"
          value={formData.targetConceptionDate}
          onChange={(e) => setFormData({ ...formData, targetConceptionDate: e.target.value })}
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Health & Wellness Goals</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="vitamins"
              checked={formData.vitaminsSupplement}
              onCheckedChange={(checked) => setFormData({ ...formData, vitaminsSupplement: checked })}
            />
            <Label htmlFor="vitamins">Taking prenatal vitamins</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="folicAcid"
              checked={formData.folicAcidDaily}
              onCheckedChange={(checked) => setFormData({ ...formData, folicAcidDaily: checked })}
            />
            <Label htmlFor="folicAcid">Taking folic acid daily</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="caffeine"
              checked={formData.caffeineLimit}
              onCheckedChange={(checked) => setFormData({ ...formData, caffeineLimit: checked })}
            />
            <Label htmlFor="caffeine">Limiting caffeine intake</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="alcohol"
              checked={formData.alcoholLimit}
              onCheckedChange={(checked) => setFormData({ ...formData, alcoholLimit: checked })}
            />
            <Label htmlFor="alcohol">Limiting alcohol consumption</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="smoking"
              checked={formData.smokingCessation}
              onCheckedChange={(checked) => setFormData({ ...formData, smokingCessation: checked })}
            />
            <Label htmlFor="smoking">Quit smoking</Label>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sleepHours">Sleep Hours per Night</Label>
        <Input
          id="sleepHours"
          type="number"
          min="4"
          max="12"
          placeholder="8"
          value={formData.sleepHours}
          onChange={(e) => setFormData({ ...formData, sleepHours: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="exercise">Exercise Routine</Label>
        <Textarea
          id="exercise"
          placeholder="Describe your exercise routine..."
          value={formData.exerciseRoutine}
          onChange={(e) => setFormData({ ...formData, exerciseRoutine: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="diet">Dietary Changes</Label>
        <Textarea
          id="diet"
          placeholder="Any dietary changes you're making..."
          value={formData.dietaryChanges}
          onChange={(e) => setFormData({ ...formData, dietaryChanges: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="stress">Stress Management</Label>
        <Textarea
          id="stress"
          placeholder="How are you managing stress..."
          value={formData.stressManagement}
          onChange={(e) => setFormData({ ...formData, stressManagement: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="goalNotes">Additional Notes</Label>
        <Textarea
          id="goalNotes"
          placeholder="Any other goals or notes..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Saving..." : "Save Goals"}
      </Button>
    </form>
  );
}

// Display Cards
function SymptomCard({ symptom }: { symptom: FertilitySymptom }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-medium">{format(new Date(symptom.date), "MMM d, yyyy")}</p>
            <div className="flex gap-2 mt-2">
              {symptom.basalBodyTemp && (
                <Badge variant="outline">{symptom.basalBodyTemp}°F</Badge>
              )}
              {symptom.cervicalMucus && (
                <Badge variant="outline">{symptom.cervicalMucus}</Badge>
              )}
              {symptom.ovulationPain && (
                <Badge variant="outline">Ovulation pain</Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            {symptom.mood && (
              <Badge variant="secondary">{symptom.mood}</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TestCard({ test }: { test: OvulationTest }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium">{format(new Date(test.date), "MMM d, yyyy")}</p>
            <p className="text-sm text-muted-foreground">{test.testTime}</p>
            {test.testBrand && (
              <p className="text-sm text-muted-foreground">{test.testBrand}</p>
            )}
          </div>
          <Badge variant={test.result === "positive" || test.result === "peak" ? "default" : "secondary"}>
            {test.result}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function CycleCard({ cycle }: { cycle: OvulationCycle }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium">
              Started {format(new Date(cycle.cycleStartDate), "MMM d, yyyy")}
            </p>
            <p className="text-sm text-muted-foreground">
              {cycle.cycleLength} days
            </p>
          </div>
          <div className="text-right">
            {cycle.ovulationDate && (
              <Badge variant="outline">
                Ovulated {format(new Date(cycle.ovulationDate), "MMM d")}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}