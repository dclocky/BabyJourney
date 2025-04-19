import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { AppTabs } from "@/components/app-tabs";
import { MobileNav } from "@/components/mobile-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Child, InsertChild, GrowthRecord, growthRecords, Vaccination } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2, PlusCircle, ArrowDown, ArrowUp, Calendar, Activity, Ruler, Weight, Syringe } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function BabyPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedChild, setSelectedChild] = useState<number | null>(null);

  const { data: children = [], isLoading: isLoadingChildren } = useQuery<Child[]>({
    queryKey: ["/api/children"],
  });

  // Find a non-pregnancy child profile
  const babyProfiles = children.filter(child => !child.isPregnancy);

  // If there's a baby profile, show it by default
  if (babyProfiles.length > 0 && selectedChild === null) {
    setSelectedChild(babyProfiles[0].id);
  }

  const { data: selectedChildData } = useQuery<Child>({
    queryKey: ["/api/children", selectedChild],
    enabled: selectedChild !== null,
  });

  // For this MVP we only allow one baby profile in free tier
  const canAddBaby = user?.isPremium || babyProfiles.length === 0;

  // Form for adding a new baby profile
  const addBabySchema = z.object({
    name: z.string().min(1, "Baby's name is required"),
    gender: z.enum(["male", "female", "other"]),
    birthDate: z.string().refine(date => !isNaN(Date.parse(date)), {
      message: "Please enter a valid date",
    }),
  });

  const addBabyForm = useForm<z.infer<typeof addBabySchema>>({
    resolver: zodResolver(addBabySchema),
    defaultValues: {
      name: "",
      gender: "other",
      birthDate: format(new Date(), "yyyy-MM-dd"),
    },
  });

  const addBabyMutation = useMutation({
    mutationFn: async (data: z.infer<typeof addBabySchema>) => {
      const newBaby: InsertChild = {
        userId: user!.id,
        name: data.name,
        gender: data.gender,
        birthDate: data.birthDate, // Send as string instead of Date object
        isPregnancy: false,
      };
      const res = await apiRequest("POST", "/api/children", newBaby);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      setSelectedChild(data.id);
      toast({
        title: "Baby profile created!",
        description: `You've successfully added ${data.name}'s profile.`,
      });
      addBabyForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to create baby profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onAddBaby(data: z.infer<typeof addBabySchema>) {
    addBabyMutation.mutate(data);
  }

  return (
    <div className="min-h-screen flex flex-col bg-secondary-50">
      <AppHeader />
      <AppTabs />
      
      <main className="flex-grow container mx-auto px-4 py-6 pb-20 md:pb-6">
        <h1 className="text-2xl font-bold mb-6">Baby Tracker</h1>
        
        {isLoadingChildren ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : babyProfiles.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Add Your Baby's Profile</CardTitle>
              <CardDescription>
                Start tracking your baby's growth, milestones, and medical history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...addBabyForm}>
                <form onSubmit={addBabyForm.handleSubmit(onAddBaby)} className="space-y-4">
                  <FormField
                    control={addBabyForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Baby's Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter baby's name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addBabyForm.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                          >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addBabyForm.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Birth Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={addBabyMutation.isPending}
                  >
                    {addBabyMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Profile...
                      </>
                    ) : (
                      "Create Baby Profile"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Baby selector if user has multiple babies (premium) */}
            {babyProfiles.length > 1 && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex flex-wrap gap-2">
                  {babyProfiles.map(baby => (
                    <Button
                      key={baby.id}
                      variant={selectedChild === baby.id ? "default" : "outline"}
                      onClick={() => setSelectedChild(baby.id)}
                    >
                      {baby.name}
                    </Button>
                  ))}
                  
                  {canAddBaby && (
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedChild(null)}
                      className="border-dashed"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Baby
                    </Button>
                  )}
                </div>
              </div>
            )}
            
            {selectedChild === null ? (
              <Card>
                <CardHeader>
                  <CardTitle>Add New Baby Profile</CardTitle>
                  <CardDescription>
                    Start tracking your baby's growth, milestones, and medical history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...addBabyForm}>
                    <form onSubmit={addBabyForm.handleSubmit(onAddBaby)} className="space-y-4">
                      <FormField
                        control={addBabyForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Baby's Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter baby's name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addBabyForm.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <FormControl>
                              <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                {...field}
                              >
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addBabyForm.control}
                        name="birthDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Birth Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={addBabyMutation.isPending}
                      >
                        {addBabyMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Profile...
                          </>
                        ) : (
                          "Create Baby Profile"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <BabyInfoCard child={selectedChildData} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <GrowthTrackerCard childId={selectedChild} />
                  <VaccinationTrackerCard childId={selectedChild} />
                </div>
                <DevelopmentalMilestonesCard childId={selectedChild} />
              </div>
            )}
          </div>
        )}
      </main>
      
      <AppFooter />
      <MobileNav />
    </div>
  );
}

function BabyInfoCard({ child }: { child?: Child }) {
  if (!child) return null;
  
  const birthDate = child.birthDate ? new Date(child.birthDate) : null;
  const ageInMonths = birthDate 
    ? Math.floor((new Date().getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)) 
    : 0;
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-shrink-0 w-24 h-24 md:w-32 md:h-32 bg-primary-50 rounded-full flex items-center justify-center text-primary-500">
          <span className="text-2xl font-bold">
            {child.name.charAt(0).toUpperCase()}
          </span>
        </div>
        
        <div className="flex-grow">
          <h2 className="text-2xl font-bold">{child.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <p className="text-sm text-muted-foreground">Age</p>
              <p className="font-medium">
                {ageInMonths < 1 ? 'Newborn' : `${ageInMonths} months`}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Birth Date</p>
              <p className="font-medium">
                {birthDate ? format(birthDate, 'MMM d, yyyy') : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gender</p>
              <p className="font-medium capitalize">{child.gender || 'Not specified'}</p>
            </div>
          </div>
        </div>
        
        <div className="flex-shrink-0 md:self-start">
          <Button variant="outline">Edit Profile</Button>
        </div>
      </div>
    </div>
  );
}

function GrowthTrackerCard({ childId }: { childId: number }) {
  const { toast } = useToast();
  
  const { data: growthData = [], isLoading } = useQuery<GrowthRecord[]>({
    queryKey: ["/api/children", childId, "growth"],
    enabled: !!childId,
  });
  
  // Sort by most recent first
  const sortedRecords = [...growthData].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Form for adding new growth record
  const growthRecordSchema = z.object({
    date: z.string().refine(date => !isNaN(Date.parse(date)), {
      message: "Please enter a valid date",
    }),
    weight: z.string().refine(val => !isNaN(Number(val)), {
      message: "Weight must be a number",
    }),
    height: z.string().refine(val => !isNaN(Number(val)), {
      message: "Height must be a number",
    }),
    headCircumference: z.string().optional(),
    notes: z.string().optional(),
  });
  
  const growthForm = useForm<z.infer<typeof growthRecordSchema>>({
    resolver: zodResolver(growthRecordSchema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      weight: "",
      height: "",
      headCircumference: "",
      notes: "",
    },
  });
  
  const addGrowthMutation = useMutation({
    mutationFn: async (data: z.infer<typeof growthRecordSchema>) => {
      const newRecord = {
        childId,
        userId: 0, // Will be set by server based on authenticated user
        date: new Date(data.date),
        weight: Number(data.weight) * 1000, // Convert kg to grams
        height: Number(data.height) * 10, // Convert cm to mm
        headCircumference: data.headCircumference ? Number(data.headCircumference) * 10 : undefined, // Convert cm to mm
        notes: data.notes,
      };
      const res = await apiRequest("POST", `/api/children/${childId}/growth`, newRecord);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/children", childId, "growth"] });
      toast({
        title: "Growth record added",
        description: "Growth record has been successfully added.",
      });
      growthForm.reset({
        date: format(new Date(), "yyyy-MM-dd"),
        weight: "",
        height: "",
        headCircumference: "",
        notes: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add growth record",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  function onAddGrowthRecord(data: z.infer<typeof growthRecordSchema>) {
    addGrowthMutation.mutate(data);
  }
  
  const [showAddForm, setShowAddForm] = useState(false);
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl">Growth Tracker</CardTitle>
          <CardDescription>Track your baby's height and weight</CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? "Cancel" : "Add Record"}
        </Button>
      </CardHeader>
      <CardContent>
        {showAddForm ? (
          <Form {...growthForm}>
            <form onSubmit={growthForm.handleSubmit(onAddGrowthRecord)} className="space-y-4">
              <FormField
                control={growthForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={growthForm.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (kg)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={growthForm.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Height (cm)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={growthForm.control}
                name="headCircumference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Head Circumference (cm) - Optional</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={growthForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <textarea 
                        className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Any additional notes"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full" 
                disabled={addGrowthMutation.isPending}
              >
                {addGrowthMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Growth Record"
                )}
              </Button>
            </form>
          </Form>
        ) : isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : sortedRecords.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No growth records yet</p>
            <Button 
              variant="link" 
              onClick={() => setShowAddForm(true)}
              className="mt-2"
            >
              Add your first record
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Date</th>
                    <th className="text-right py-2">Weight</th>
                    <th className="text-right py-2">Height</th>
                    <th className="text-right py-2">Head</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRecords.slice(0, 5).map((record) => (
                    <tr key={record.id} className="border-b last:border-0">
                      <td className="py-2">{format(new Date(record.date), 'MMM d, yyyy')}</td>
                      <td className="text-right py-2">
                        {record.weight ? `${(record.weight / 1000).toFixed(2)} kg` : '-'}
                      </td>
                      <td className="text-right py-2">
                        {record.height ? `${(record.height / 10).toFixed(1)} cm` : '-'}
                      </td>
                      <td className="text-right py-2">
                        {record.headCircumference ? `${(record.headCircumference / 10).toFixed(1)} cm` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {sortedRecords.length > 5 && (
              <Button variant="link" className="w-full">
                View All Records
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function VaccinationTrackerCard({ childId }: { childId: number }) {
  const { toast } = useToast();
  
  const { data: vaccinations = [], isLoading } = useQuery<Vaccination[]>({
    queryKey: ["/api/children", childId, "vaccinations"],
    enabled: !!childId,
  });
  
  // Sort by most recent first
  const sortedVaccinations = [...vaccinations].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Form for adding new vaccination
  const vaccinationSchema = z.object({
    name: z.string().min(1, "Vaccination name is required"),
    date: z.string().refine(date => !isNaN(Date.parse(date)), {
      message: "Please enter a valid date",
    }),
    notes: z.string().optional(),
  });
  
  const vaccinationForm = useForm<z.infer<typeof vaccinationSchema>>({
    resolver: zodResolver(vaccinationSchema),
    defaultValues: {
      name: "",
      date: format(new Date(), "yyyy-MM-dd"),
      notes: "",
    },
  });
  
  const addVaccinationMutation = useMutation({
    mutationFn: async (data: z.infer<typeof vaccinationSchema>) => {
      const newVaccination = {
        childId,
        userId: 0, // Will be set by server based on authenticated user
        name: data.name,
        date: new Date(data.date),
        notes: data.notes,
      };
      const res = await apiRequest("POST", `/api/children/${childId}/vaccinations`, newVaccination);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/children", childId, "vaccinations"] });
      toast({
        title: "Vaccination added",
        description: "Vaccination has been successfully recorded.",
      });
      vaccinationForm.reset({
        name: "",
        date: format(new Date(), "yyyy-MM-dd"),
        notes: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add vaccination",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  function onAddVaccination(data: z.infer<typeof vaccinationSchema>) {
    addVaccinationMutation.mutate(data);
  }
  
  const [showAddForm, setShowAddForm] = useState(false);
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl">Vaccination Tracker</CardTitle>
          <CardDescription>Keep track of immunizations</CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? "Cancel" : "Add Vaccine"}
        </Button>
      </CardHeader>
      <CardContent>
        {showAddForm ? (
          <Form {...vaccinationForm}>
            <form onSubmit={vaccinationForm.handleSubmit(onAddVaccination)} className="space-y-4">
              <FormField
                control={vaccinationForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vaccination Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. MMR, DTaP, Hib, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={vaccinationForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date Administered</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={vaccinationForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <textarea 
                        className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Dose number, reaction, provider, etc."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full" 
                disabled={addVaccinationMutation.isPending}
              >
                {addVaccinationMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Vaccination"
                )}
              </Button>
            </form>
          </Form>
        ) : isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : sortedVaccinations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No vaccinations recorded yet</p>
            <Button 
              variant="link" 
              onClick={() => setShowAddForm(true)}
              className="mt-2"
            >
              Add your first vaccination record
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedVaccinations.slice(0, 5).map((vaccination) => (
              <div key={vaccination.id} className="flex items-start p-3 border rounded-md">
                <div className="bg-primary-50 p-2 rounded-full mr-3">
                  <Syringe className="h-4 w-4 text-primary-500" />
                </div>
                <div className="flex-grow min-w-0">
                  <h4 className="font-medium text-sm">{vaccination.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(vaccination.date), 'MMM d, yyyy')}
                  </p>
                  {vaccination.notes && (
                    <p className="text-xs mt-1 text-muted-foreground">{vaccination.notes}</p>
                  )}
                </div>
              </div>
            ))}
            
            {sortedVaccinations.length > 5 && (
              <Button variant="link" className="w-full">
                View All Vaccinations
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DevelopmentalMilestonesCard({ childId }: { childId: number }) {
  const milestoneCategories = [
    { 
      title: "Early Development", 
      milestones: [
        { name: "First Smile", age: "1-2 months", completed: true, date: "Jan 15, 2023" },
        { name: "Laughs", age: "3-4 months", completed: true, date: "Mar 22, 2023" },
        { name: "Rolls Over", age: "4-6 months", completed: false },
      ]
    },
    { 
      title: "Motor Skills", 
      milestones: [
        { name: "Sits Unassisted", age: "6-8 months", completed: false },
        { name: "Crawls", age: "7-10 months", completed: false },
        { name: "Stands", age: "9-12 months", completed: false },
        { name: "First Steps", age: "9-15 months", completed: false },
      ]
    },
    { 
      title: "Language", 
      milestones: [
        { name: "First Word", age: "11-14 months", completed: false },
        { name: "Points to Objects", age: "12-15 months", completed: false },
        { name: "Two-Word Phrases", age: "18-24 months", completed: false },
      ]
    },
  ];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Developmental Milestones</CardTitle>
        <CardDescription>
          Track your baby's key developmental milestones
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="early">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="early">Early</TabsTrigger>
            <TabsTrigger value="motor">Motor</TabsTrigger>
            <TabsTrigger value="language">Language</TabsTrigger>
          </TabsList>
          
          {milestoneCategories.map((category, index) => (
            <TabsContent 
              key={index} 
              value={category.title.toLowerCase().split(' ')[0]}
              className="space-y-4"
            >
              <div className="space-y-3">
                {category.milestones.map((milestone, i) => (
                  <div key={i} className="flex items-center p-3 border rounded-md">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                      milestone.completed ? 'bg-green-500 text-white' : 'bg-gray-100'
                    }`}>
                      {milestone.completed && (
                        <Check className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{milestone.name}</h4>
                        <span className="text-xs text-muted-foreground">
                          {milestone.age}
                        </span>
                      </div>
                      {milestone.completed && milestone.date && (
                        <p className="text-xs text-green-600">
                          Completed on {milestone.date}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Button className="w-full">
                Record New Milestone
              </Button>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
