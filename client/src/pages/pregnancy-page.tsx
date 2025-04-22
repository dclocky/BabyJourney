
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
import { ContractionTimer } from "@/components/contraction-timer";
import { BirthPlanner } from "@/components/birth-planner";
import { Child } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, addWeeks, differenceInWeeks } from "date-fns";
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
  Plus
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent
} from "@/components/ui/collapsible";

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
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="progress" className="flex items-center gap-1.5">
                  <Baby className="h-4 w-4" />
                  Progress
                </TabsTrigger>
                <TabsTrigger value="symptoms" className="flex items-center gap-1.5">
                  <Activity className="h-4 w-4" />
                  Symptoms
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
                          
                          {/* Symptom form would go here */}
                          <div className="grid gap-4 py-4">
                            <div>
                              <Label htmlFor="symptom-name">Symptom</Label>
                              <Input id="symptom-name" placeholder="e.g., Nausea, Fatigue, Backache" />
                            </div>
                            <div>
                              <Label htmlFor="symptom-severity">Severity (1-5)</Label>
                              <Input id="symptom-severity" type="number" min="1" max="5" defaultValue="3" />
                            </div>
                            <div>
                              <Label htmlFor="symptom-date">Date</Label>
                              <Input id="symptom-date" type="date" defaultValue={format(new Date(), "yyyy-MM-dd")} />
                            </div>
                            <div>
                              <Label htmlFor="symptom-notes">Notes</Label>
                              <Textarea id="symptom-notes" placeholder="Add any additional details..." />
                            </div>
                          </div>
                          
                          <DialogFooter>
                            <Button>Save Symptom</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    {/* Display symptoms if they exist */}
                    <Card>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">Most common symptoms will be shown here. Log your first symptom to get started!</p>
                          
                          {/* Sample symptom list (would be populated from API) */}
                          <div className="border rounded-md divide-y">
                            <div className="flex justify-between items-center p-3">
                              <div>
                                <p className="font-medium">Morning Sickness</p>
                                <p className="text-sm text-muted-foreground">April 15, 2025</p>
                              </div>
                              <Badge variant="outline">Severity: 4</Badge>
                            </div>
                            <div className="flex justify-between items-center p-3">
                              <div>
                                <p className="font-medium">Fatigue</p>
                                <p className="text-sm text-muted-foreground">April 16, 2025</p>
                              </div>
                              <Badge variant="outline">Severity: 3</Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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
