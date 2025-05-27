
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { AppTabs } from "@/components/app-tabs";
import { MobileNav } from "@/components/mobile-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ContractionTimer } from "@/components/contraction-timer";
import { BirthPlanner } from "@/components/birth-planner";
import { Child, Craving } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, addWeeks, differenceInWeeks, parseISO } from "date-fns";
import { 
  Loader2, 
  Calendar, 
  PlusCircle, 
  Baby, 
  Clock, 
  Clipboard, 
  Activity,
  CalendarPlus,
  Edit,
  Trash,
  MapPin,
  Check,
  X,
  Plus,
  AlertCircle
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent
} from "@/components/ui/collapsible";

// Form schema for adding a new craving
const cravingSchema = z.object({
  foodName: z.string().min(1, "Please enter what you're craving"),
  intensity: z.string().transform(val => parseInt(val)),
  satisfied: z.boolean().default(false),
  notes: z.string().optional(),
  date: z.string().refine(date => !isNaN(Date.parse(date)), {
    message: "Please enter a valid date",
  })
});

// Form schema for adding a new symptom
const symptomSchema = z.object({
  name: z.string().min(1, "Please enter the symptom name"),
  severity: z.string().transform(val => parseInt(val)),
  notes: z.string().optional(),
  date: z.string().refine(date => !isNaN(Date.parse(date)), {
    message: "Please enter a valid date",
  })
});

// Component for adding a new symptom
function SymptomForm({ pregnancyId, onSuccess }: { pregnancyId: number, onSuccess: () => void }) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(true);

  const form = useForm<z.infer<typeof symptomSchema>>({
    resolver: zodResolver(symptomSchema),
    defaultValues: {
      name: "",
      severity: "3",
      notes: "",
      date: format(new Date(), "yyyy-MM-dd"),
    },
  });

  const addSymptomMutation = useMutation({
    mutationFn: async (data: z.infer<typeof symptomSchema>) => {
      const res = await apiRequest("POST", `/api/pregnancies/${pregnancyId}/symptoms`, {
        ...data,
        date: new Date(data.date),
      });
      return await res.json();
    },
    onSuccess: () => {
      onSuccess();
      toast({
        title: "Symptom added",
        description: "Your symptom has been recorded!",
      });
      form.reset({
        name: "",
        severity: "3",
        notes: "",
        date: format(new Date(), "yyyy-MM-dd"),
      });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to add symptom",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof symptomSchema>) => {
    addSymptomMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Symptom Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Nausea, Fatigue, Backache" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="severity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Severity (1-5)</FormLabel>
              <FormControl>
                <Input type="number" min="1" max="5" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
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
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Any additional details..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          disabled={addSymptomMutation.isPending}
          className="w-full"
        >
          {addSymptomMutation.isPending ? "Saving..." : "Save Symptom"}
        </Button>
      </form>
    </Form>
  );
}

// Component for displaying symptoms list
function SymptomsList({ pregnancyId }: { pregnancyId: number }) {
  const { toast } = useToast();
  
  const { data: symptoms = [], isLoading } = useQuery<Symptom[]>({
    queryKey: [`/api/pregnancies/${pregnancyId}/symptoms`],
  });

  const deleteSymptomMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/symptoms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/pregnancies/${pregnancyId}/symptoms`] });
      toast({
        title: "Symptom deleted",
        description: "The symptom has been removed from your records",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete symptom",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (symptoms.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <div className="py-8">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Symptoms Recorded</h3>
            <p className="text-muted-foreground">
              Start tracking your pregnancy symptoms! Add your first symptom using the button above.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {symptoms.map((symptom) => (
            <div 
              key={symptom.id} 
              className="border rounded-md p-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center">
                    <h4 className="font-medium">{symptom.name}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {symptom.date ? format(new Date(symptom.date), "MMMM d, yyyy") : ""}
                  </p>
                  {symptom.notes && (
                    <p className="mt-2 text-sm">{symptom.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="py-1">
                    Severity: {symptom.severity || 0}/5
                  </Badge>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => deleteSymptomMutation.mutate(symptom.id)}
                  disabled={deleteSymptomMutation.isPending}
                >
                  <Trash className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Component for adding a new craving
function CravingForm({ pregnancyId, onSuccess }: { pregnancyId: number, onSuccess: () => void }) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(true);

  const form = useForm<z.infer<typeof cravingSchema>>({
    resolver: zodResolver(cravingSchema),
    defaultValues: {
      foodName: "",
      intensity: "3",
      satisfied: false,
      notes: "",
      date: format(new Date(), "yyyy-MM-dd"),
    },
  });

  const addCravingMutation = useMutation({
    mutationFn: async (data: z.infer<typeof cravingSchema>) => {
      const res = await apiRequest("POST", `/api/pregnancies/${pregnancyId}/cravings`, {
        ...data,
        date: new Date(data.date),
      });
      return await res.json();
    },
    onSuccess: () => {
      onSuccess();
      toast({
        title: "Craving added",
        description: "Your craving has been recorded!",
      });
      form.reset({
        foodName: "",
        intensity: "3",
        satisfied: false,
        notes: "",
        date: format(new Date(), "yyyy-MM-dd"),
      });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to add craving",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof cravingSchema>) => {
    addCravingMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="foodName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Food Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Pickles, Ice Cream, Spicy Food" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="intensity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Intensity (1-5)</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select intensity" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="1">1 - Mild</SelectItem>
                  <SelectItem value="2">2 - Light</SelectItem>
                  <SelectItem value="3">3 - Moderate</SelectItem>
                  <SelectItem value="4">4 - Strong</SelectItem>
                  <SelectItem value="5">5 - Intense</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
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

        <FormField
          control={form.control}
          name="satisfied"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2 rounded-md border">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Satisfied</FormLabel>
                <FormDescription>
                  Check this if you've satisfied this craving
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Additional details about your craving..." 
                  className="resize-none" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="submit" disabled={addCravingMutation.isPending}>
            {addCravingMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Craving"
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

// Component for displaying cravings
function CravingsList({ pregnancyId }: { pregnancyId: number }) {
  const { toast } = useToast();
  
  const { data: cravings = [], isLoading } = useQuery<Craving[]>({
    queryKey: [`/api/pregnancies/${pregnancyId}/cravings`],
  });

  const deleteCravingMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/cravings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/pregnancies/${pregnancyId}/cravings`] });
      toast({
        title: "Craving deleted",
        description: "The craving has been removed from your list",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete craving",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleSatisfiedMutation = useMutation({
    mutationFn: async ({ id, satisfied }: { id: number, satisfied: boolean }) => {
      const res = await apiRequest("PUT", `/api/cravings/${id}`, { satisfied });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/pregnancies/${pregnancyId}/cravings`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update craving",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (cravings.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <div className="py-8">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Cravings Recorded</h3>
            <p className="text-muted-foreground">
              Start tracking your pregnancy cravings! Add your first craving using the button above.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {cravings.map((craving) => (
            <div 
              key={craving.id} 
              className={`border rounded-md p-4 ${craving.satisfied ? 'bg-muted/30' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center">
                    <h4 className="font-medium">{craving.foodName}</h4>
                    {craving.satisfied && (
                      <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">
                        <Check className="h-3 w-3 mr-1" />
                        Satisfied
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {craving.date ? format(new Date(craving.date), "MMMM d, yyyy") : ""}
                  </p>
                  {craving.notes && (
                    <p className="mt-2 text-sm">{craving.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="py-1">
                    Intensity: {craving.intensity || 0}/5
                  </Badge>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => toggleSatisfiedMutation.mutate({ 
                    id: craving.id, 
                    satisfied: !craving.satisfied 
                  })}
                  disabled={toggleSatisfiedMutation.isPending}
                >
                  {craving.satisfied ? (
                    <>
                      <X className="h-3 w-3 mr-1" />
                      Mark Unsatisfied
                    </>
                  ) : (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Mark Satisfied
                    </>
                  )}
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => deleteCravingMutation.mutate(craving.id)}
                  disabled={deleteCravingMutation.isPending}
                >
                  <Trash className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function PregnancyPage() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: pregnancies = [], isLoading: isLoadingPregnancies } = useQuery<Child[]>({
    queryKey: ["/api/pregnancies"],
  });

  const pregnancySchema = z.object({
    dueDate: z.string().refine(date => !isNaN(Date.parse(date)), {
      message: "Please enter a valid date",
    }),
    babyName: z.string().optional(),
    notes: z.string().optional(),
  });

  const form = useForm<z.infer<typeof pregnancySchema>>({
    resolver: zodResolver(pregnancySchema),
    defaultValues: {
      dueDate: format(new Date(), "yyyy-MM-dd"),
      babyName: "",
      notes: "",
    },
  });

  const addPregnancyMutation = useMutation({
    mutationFn: async (data: z.infer<typeof pregnancySchema>) => {
      const res = await apiRequest("POST", "/api/pregnancies", {
        dueDate: data.dueDate, // Already a string as we defined in the schema
        babyName: data.babyName,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pregnancies"] });
      toast({
        title: "Pregnancy added",
        description: "Your pregnancy information has been saved!",
      });
      form.reset();
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to add pregnancy",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onAddPregnancy = (data: z.infer<typeof pregnancySchema>) => {
    addPregnancyMutation.mutate(data);
  };

  const calculateWeeks = (dueDate: Date) => {
    const startDate = addWeeks(dueDate, -40);
    const currentWeek = differenceInWeeks(new Date(), startDate);
    return Math.min(Math.max(currentWeek, 0), 40);
  };

  return (
    <div className="min-h-screen flex flex-col bg-secondary-50">
      <AppHeader />
      <AppTabs />

      <main className="flex-grow container mx-auto px-4 py-6 pb-20 md:pb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Pregnancy</h1>
          {pregnancies.length === 0 && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Pregnancy
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record a New Pregnancy</DialogTitle>
                  <DialogDescription>
                    Keep track of your pregnancy journey with important dates and details.
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onAddPregnancy)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Due Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormDescription>Your estimated due date</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="babyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Baby Name (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter baby's name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button type="submit" disabled={addPregnancyMutation.isPending}>
                        {addPregnancyMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoadingPregnancies ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : pregnancies.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-primary-50 text-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Baby className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold mb-4">No Pregnancy Recorded Yet</h2>
            <p className="text-muted-foreground mb-6">
              Start tracking your pregnancy journey by adding your pregnancy details.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Pregnancy
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            <Tabs defaultValue="progress" className="w-full">
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="progress" className="flex items-center gap-1.5">
                  <Baby className="h-4 w-4" />
                  Progress
                </TabsTrigger>
                <TabsTrigger value="self-care" className="flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.5 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
                  </svg>
                  Self-Care
                </TabsTrigger>
                <TabsTrigger value="symptoms" className="flex items-center gap-1.5">
                  <Activity className="h-4 w-4" />
                  Symptoms
                </TabsTrigger>
                <TabsTrigger value="cravings" className="flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.5 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
                  </svg>
                  Cravings
                </TabsTrigger>
                <TabsTrigger value="appointments" className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Appointments
                </TabsTrigger>
                <TabsTrigger value="contractions" className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  Contractions
                </TabsTrigger>
                <TabsTrigger value="birth-plan" className="flex items-center gap-1.5">
                  <Clipboard className="h-4 w-4" />
                  Birth Plan
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="progress" className="space-y-6 mt-6">
                {pregnancies.map((pregnancy) => (
                  <Card key={pregnancy.id}>
                    <CardHeader>
                      <CardTitle>
                        {pregnancy.name || "Baby"}'s Journey
                      </CardTitle>
                      <CardDescription>
                        Due Date: {pregnancy.dueDate ? format(new Date(pregnancy.dueDate), "MMMM d, yyyy") : "Not set"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <Label>Pregnancy Progress</Label>
                          <div className="mt-2">
                            <Progress 
                              value={pregnancy.dueDate ? (calculateWeeks(new Date(pregnancy.dueDate)) / 40) * 100 : 0} 
                              className="h-2" 
                            />
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            Week {pregnancy.dueDate ? calculateWeeks(new Date(pregnancy.dueDate)) : 0} of 40
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">First Trimester</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-2xl font-bold">
                                {pregnancy.dueDate ? Math.min(calculateWeeks(new Date(pregnancy.dueDate)), 13) : 0} / 13
                              </p>
                              <p className="text-xs text-muted-foreground">weeks completed</p>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Second Trimester</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-2xl font-bold">
                                {pregnancy.dueDate ? Math.max(0, Math.min(calculateWeeks(new Date(pregnancy.dueDate)) - 13, 14)) : 0} / 14
                              </p>
                              <p className="text-xs text-muted-foreground">weeks completed</p>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Third Trimester</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-2xl font-bold">
                                {pregnancy.dueDate ? Math.max(0, Math.min(calculateWeeks(new Date(pregnancy.dueDate)) - 27, 13)) : 0} / 13
                              </p>
                              <p className="text-xs text-muted-foreground">weeks completed</p>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
              
              <TabsContent value="self-care" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Maternal Self-Care & Wellness</CardTitle>
                    <CardDescription>
                      Taking care of yourself is essential for a healthy pregnancy and your wellbeing.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Access comprehensive self-care tracking including mood, sleep, exercise, nutrition, and mental health support.
                    </p>
                    <Button asChild className="w-full">
                      <a href="/self-care">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.5 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
                        </svg>
                        Open Self-Care Center
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="symptoms" className="mt-6">
                {pregnancies.map((pregnancy) => (
                  <div key={`symptoms-${pregnancy.id}`} className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">{pregnancy.name}'s Symptoms</h3>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Log Symptom
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Log New Symptom</DialogTitle>
                            <DialogDescription>
                              Track pregnancy symptoms to share with your healthcare provider.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <SymptomForm pregnancyId={pregnancy.id} onSuccess={() => {
                            queryClient.invalidateQueries({ queryKey: [`/api/pregnancies/${pregnancy.id}/symptoms`] });
                          }} />
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    <SymptomsList pregnancyId={pregnancy.id} />
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="cravings" className="mt-6">
                {pregnancies.map((pregnancy) => (
                  <div key={`cravings-${pregnancy.id}`} className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">{pregnancy.name}'s Cravings</h3>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Craving
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Log New Craving</DialogTitle>
                            <DialogDescription>
                              Keep track of your food cravings throughout your pregnancy journey.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <CravingForm pregnancyId={pregnancy.id} onSuccess={() => {
                            queryClient.invalidateQueries({ queryKey: [`/api/pregnancies/${pregnancy.id}/cravings`] });
                          }} />
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    <CravingsList pregnancyId={pregnancy.id} />
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="appointments" className="mt-6">
                {pregnancies.map((pregnancy) => (
                  <div key={`appointments-${pregnancy.id}`} className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">{pregnancy.name}'s Appointments</h3>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <CalendarPlus className="h-4 w-4 mr-2" />
                            Add Appointment
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Schedule New Appointment</DialogTitle>
                            <DialogDescription>
                              Add details about your upcoming prenatal appointments.
                            </DialogDescription>
                          </DialogHeader>
                          
                          {/* Appointment form would go here */}
                          <div className="grid gap-4 py-4">
                            <div>
                              <Label htmlFor="appointment-title">Title</Label>
                              <Input id="appointment-title" placeholder="e.g., 20-Week Ultrasound" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="appointment-date">Date</Label>
                                <Input id="appointment-date" type="date" />
                              </div>
                              <div>
                                <Label htmlFor="appointment-time">Time</Label>
                                <Input id="appointment-time" type="time" />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="appointment-location">Location</Label>
                              <Input id="appointment-location" placeholder="Doctor's office, hospital, etc." />
                            </div>
                            <div>
                              <Label htmlFor="appointment-notes">Notes</Label>
                              <Textarea id="appointment-notes" placeholder="Add any additional details..." />
                            </div>
                          </div>
                          
                          <DialogFooter>
                            <Button>Save Appointment</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    {/* Display appointments if they exist */}
                    <Card>
                      <CardContent className="p-6">
                        <Tabs defaultValue="upcoming">
                          <TabsList className="mb-4">
                            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                            <TabsTrigger value="past">Past</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="upcoming">
                            <div className="space-y-4">
                              {/* Sample upcoming appointments (would be populated from API) */}
                              <div className="border rounded-md divide-y">
                                <div className="p-4">
                                  <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-semibold">20-Week Ultrasound</h4>
                                    <Badge>May 15, 2025</Badge>
                                  </div>
                                  <div className="flex items-center text-sm text-muted-foreground">
                                    <Clock className="h-4 w-4 mr-1" />
                                    <span>10:30 AM</span>
                                    <MapPin className="h-4 w-4 ml-4 mr-1" />
                                    <span>Dr. Smith's Office</span>
                                  </div>
                                  <div className="mt-3 flex gap-2">
                                    <Button size="sm" variant="outline">
                                      <Edit className="h-3 w-3 mr-1" />
                                      Edit
                                    </Button>
                                    <Button size="sm" variant="outline">
                                      <Trash className="h-3 w-3 mr-1" />
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="past">
                            <div className="space-y-4">
                              {/* Sample past appointments (would be populated from API) */}
                              <div className="border rounded-md divide-y">
                                <div className="p-4">
                                  <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-semibold">First Prenatal Visit</h4>
                                    <Badge variant="outline">April 2, 2025</Badge>
                                  </div>
                                  <div className="flex items-center text-sm text-muted-foreground mb-2">
                                    <Clock className="h-4 w-4 mr-1" />
                                    <span>9:00 AM</span>
                                    <MapPin className="h-4 w-4 ml-4 mr-1" />
                                    <span>City Hospital</span>
                                  </div>
                                  <Collapsible>
                                    <CollapsibleTrigger asChild>
                                      <Button variant="ghost" size="sm" className="p-0 h-auto">
                                        <PlusCircle className="h-3 w-3 mr-1" />
                                        Doctor's Notes
                                      </Button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                      <div className="p-3 mt-2 bg-muted/50 rounded-md text-sm">
                                        <p>Blood pressure: 120/80</p>
                                        <p>Weight: 140 lbs</p>
                                        <p>Notes: Everything looking healthy. Recommended prenatal vitamins.</p>
                                      </div>
                                    </CollapsibleContent>
                                  </Collapsible>
                                </div>
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="contractions" className="mt-6">
                {pregnancies.length > 0 && (
                  <div className="space-y-4">
                    {pregnancies.map((pregnancy) => (
                      <ContractionTimer 
                        key={`contraction-timer-${pregnancy.id}`}
                        pregnancyId={pregnancy.id} 
                        pregnancyDue={pregnancy.dueDate ? new Date(pregnancy.dueDate) : null}
                        existingContractions={[]}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="birth-plan" className="mt-6">
                <BirthPlanner />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>

      <AppFooter />
      <MobileNav />
    </div>
  );
}
