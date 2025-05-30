import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { AppTabs } from "@/components/app-tabs";
import { MobileNav } from "@/components/mobile-nav";
import { NavigationBar } from "@/components/navigation-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Child, Appointment, InsertAppointment, Symptom } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, isBefore, addDays } from "date-fns";
import { 
  Loader2, 
  Calendar, 
  PlusCircle, 
  Clock, 
  MapPin, 
  User, 
  Stethoscope, 
  Thermometer, 
  Tablet, 
  ClipboardList, 
  FileText, 
  ArrowRight
} from "lucide-react";

// Define a type for pregnancy (using Child with isPregnancy=true is the pregnancy model)
type Pregnancy = Child & { isPregnancy: true };

export default function AppointmentsPage() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [appointmentType, setAppointmentType] = useState<'child' | 'pregnancy'>('child');

  // Fetch children data
  const { data: children = [], isLoading: isLoadingChildren } = useQuery<Child[]>({
    queryKey: ["/api/children"],
  });

  // Fetch pregnancies data
  const { data: pregnancies = [], isLoading: isLoadingPregnancies } = useQuery<Pregnancy[]>({
    queryKey: ["/api/pregnancies"],
  });

  // Fetch appointments data
  const { data: appointments = [], isLoading: isLoadingAppointments } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  // Filter appointments
  // Temp fix: since the backend might not have pregnancyId field
  const childAppointments = appointments.filter(app => app.childId !== null);
  const pregnancyAppointments: Appointment[] = []; // This will be populated when the backend supports pregnancy appointments

  // State for Doctor Mode toggle
  const [isDoctorMode, setIsDoctorMode] = useState(false);

  // Schema for appointment form validation
  const appointmentSchema = z.object({
    title: z.string().min(1, "Title is required"),
    date: z.string().refine(date => !isNaN(Date.parse(date)), {
      message: "Please enter a valid date",
    }),
    time: z.string().min(1, "Time is required"),
    location: z.string().optional(),
    notes: z.string().optional(),
    type: z.enum(['child', 'pregnancy']),
    childId: z.number().optional().nullable(),
    pregnancyId: z.number().optional().nullable(),
    // Doctor mode fields
    isDoctorMode: z.boolean().optional().default(false),
    doctorName: z.string().optional(),
    doctorSpecialty: z.string().optional(),
    diagnosis: z.string().optional(),
    treatment: z.string().optional(),
    prescriptions: z.string().optional(),
    followUpDate: z.string().optional(),
    doctorNotes: z.string().optional(),
    vitals: z.record(z.string()).optional().default({}),
  });

  // Form setup
  const form = useForm<z.infer<typeof appointmentSchema>>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      title: "",
      date: format(new Date(), "yyyy-MM-dd"),
      time: "09:00",
      location: "",
      notes: "",
      type: 'child',
      childId: children.length > 0 ? children[0].id : null,
      pregnancyId: null,
      // Doctor mode fields
      isDoctorMode: false,
      doctorName: "",
      doctorSpecialty: "",
      diagnosis: "",
      treatment: "",
      prescriptions: "",
      followUpDate: "",
      doctorNotes: "",
      vitals: {},
    },
  });

  // Watch the appointment type to conditionally render form fields
  const watchType = form.watch("type");

  // Update form values when appointment type changes
  const handleTypeChange = (type: 'child' | 'pregnancy') => {
    setAppointmentType(type);
    form.setValue("type", type);

    if (type === 'child') {
      form.setValue("pregnancyId", null);
      form.setValue("childId", children.length > 0 ? children[0].id : null);
    } else {
      form.setValue("childId", null);
      form.setValue("pregnancyId", pregnancies.length > 0 ? pregnancies[0].id : null);
    }
  };

  // Add appointment mutation
  const addAppointmentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof appointmentSchema>) => {
      const newAppointment: InsertAppointment = {
        userId: 0, // Will be set by server based on authenticated user
        title: data.title,
        date: new Date(`${data.date}T${data.time}`),
        location: data.location || "",
        notes: data.notes || "",
        childId: (data.type === 'child' && data.childId) ? data.childId : (data.type === 'pregnancy' && data.pregnancyId) ? data.pregnancyId : 1,
        // Doctor mode fields
        doctorName: data.isDoctorMode ? data.doctorName || null : null,
        doctorSpecialty: data.isDoctorMode ? data.doctorSpecialty || null : null,
        diagnosis: data.isDoctorMode ? data.diagnosis || null : null,
        treatment: data.isDoctorMode ? data.treatment || null : null,
        prescriptions: data.isDoctorMode ? data.prescriptions || null : null,
        followUpDate: data.isDoctorMode && data.followUpDate ? new Date(data.followUpDate) : null,
        doctorNotes: data.isDoctorMode ? data.doctorNotes || null : null,
        vitals: data.isDoctorMode ? data.vitals : {},
      };
      
      // Use the apiRequest function instead of fetch directly to avoid JSON parsing issues
      if (data.type === 'child' && data.childId) {
        try {
          const response = await apiRequest(
            'POST',
            `/api/children/${data.childId}/appointments`,
            newAppointment
          );
          return await response.json();
        } catch (error) {
          console.error('Error creating appointment:', error);
          throw new Error('Failed to create appointment');
        }
      } else if (data.type === 'pregnancy' && data.pregnancyId) {
        try {
          const response = await apiRequest(
            'POST',
            `/api/children/${data.pregnancyId}/appointments`,
            newAppointment
          );
          return await response.json();
        } catch (error) {
          console.error('Error creating appointment:', error);
          throw new Error('Failed to create appointment');
        }
      } else {
        throw new Error("Missing child or pregnancy ID");
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate both specific child/pregnancy appointments and the general appointments list
      if (variables.type === 'child' && variables.childId) {
        queryClient.invalidateQueries({ queryKey: ["/api/children", variables.childId, "appointments"] });
      } else if (variables.type === 'pregnancy' && variables.pregnancyId) {
        queryClient.invalidateQueries({ queryKey: ["/api/children", variables.pregnancyId, "appointments"] });
      }
      // Also invalidate the general appointments endpoint if it exists
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Appointment added",
        description: "Your appointment has been scheduled!",
      });
      form.reset({
        title: "",
        date: format(new Date(), "yyyy-MM-dd"),
        time: "09:00",
        location: "",
        notes: "",
        type: appointmentType,
        childId: appointmentType === 'child' ? (children.length > 0 ? children[0].id : null) : null,
        pregnancyId: appointmentType === 'pregnancy' ? (pregnancies.length > 0 ? pregnancies[0].id : null) : null,
        // Reset doctor mode fields
        isDoctorMode: false,
        doctorName: "",
        doctorSpecialty: "",
        diagnosis: "",
        treatment: "",
        prescriptions: "",
        followUpDate: "",
        doctorNotes: "",
        vitals: {},
      });
      // Reset Doctor Mode UI state
      setIsDoctorMode(false);
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to add appointment",
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: "destructive",
      });
    },
  });

  function onAddAppointment(data: z.infer<typeof appointmentSchema>) {
    addAppointmentMutation.mutate(data);
  }

  // Loading state
  const isLoading = isLoadingChildren || isLoadingPregnancies || isLoadingAppointments;

  // Helper to find child name by ID
  const getChildName = (childId: number) => {
    const child = children.find(c => c.id === childId);
    return child ? child.name : "Unknown Child";
  };

  // Format date and time for display
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: format(date, "MMMM d, yyyy"),
      time: format(date, "h:mm a"),
    };
  };

  return (
    <div className="min-h-screen flex flex-col bg-secondary-50">
      <NavigationBar />
      <AppHeader />
      <AppTabs />

      <main className="flex-grow container mx-auto px-4 py-6 pb-20 md:pb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Appointments</h1>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Appointment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule a New Appointment</DialogTitle>
                <DialogDescription>
                  Schedule doctor visits, checkups, and other important appointments.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onAddAppointment)} className="space-y-4">
                  {/* Appointment Type Selection */}
                  <div className="mb-4">
                    <FormLabel>Appointment Type</FormLabel>
                    <div className="flex gap-4 mt-2">
                      <Button 
                        type="button"
                        variant={appointmentType === 'child' ? "default" : "outline"}
                        onClick={() => handleTypeChange('child')}
                        disabled={children.length === 0}
                      >
                        For Child
                      </Button>
                      <Button 
                        type="button"
                        variant={appointmentType === 'pregnancy' ? "default" : "outline"}
                        onClick={() => handleTypeChange('pregnancy')}
                        disabled={pregnancies.length === 0}
                      >
                        For Pregnancy
                      </Button>
                    </div>
                    {children.length === 0 && appointmentType === 'child' && (
                      <p className="text-sm text-red-500 mt-2">Please add a child profile first</p>
                    )}
                    {pregnancies.length === 0 && appointmentType === 'pregnancy' && (
                      <p className="text-sm text-red-500 mt-2">Please add pregnancy information first</p>
                    )}
                  </div>

                  {/* Child or Pregnancy Selection */}
                  {appointmentType === 'child' && children.length > 0 && (
                    <FormField
                      control={form.control}
                      name="childId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Child</FormLabel>
                          <FormControl>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              value={field.value || ""}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            >
                              {children.map(child => (
                                <option key={child.id} value={child.id}>
                                  {child.name}
                                </option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {appointmentType === 'pregnancy' && pregnancies.length > 0 && (
                    <FormField
                      control={form.control}
                      name="pregnancyId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Pregnancy</FormLabel>
                          <FormControl>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              value={field.value || ""}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            >
                              {pregnancies.map((pregnancy, index) => (
                                <option key={pregnancy.id} value={pregnancy.id}>
                                  Pregnancy {index + 1} {pregnancy.dueDate ? `(Due: ${format(new Date(pregnancy.dueDate), "MMM d, yyyy")})` : ""}
                                </option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Appointment Details */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Appointment Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Pediatrician Visit, Ultrasound Scan" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
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
                      name="time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., City Hospital, Dr. Smith's Office" {...field} />
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
                          <textarea 
                            className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Any additional information about this appointment"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Doctor Mode Toggle */}
                  <div className="border-t pt-4 mt-6">
                    <FormField
                      control={form.control}
                      name="isDoctorMode"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base flex items-center">
                              <Stethoscope className="w-4 h-4 mr-2" />
                              Doctor Mode
                            </FormLabel>
                            <FormDescription>
                              Track medical information from your doctor appointment
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                setIsDoctorMode(checked);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Doctor Mode Fields */}
                  {isDoctorMode && (
                    <div className="border rounded-lg p-4 mt-4 space-y-4">
                      <h3 className="text-sm font-medium mb-2 flex items-center">
                        <Stethoscope className="w-4 h-4 mr-2" />
                        Medical Details
                      </h3>

                      {/* Doctor Name */}
                      <FormField
                        control={form.control}
                        name="doctorName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Doctor Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Dr. Smith" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Doctor Specialty */}
                      <FormField
                        control={form.control}
                        name="doctorSpecialty"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Specialty</FormLabel>
                            <FormControl>
                              <Input placeholder="Pediatrician, OB/GYN, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Diagnosis */}
                      <FormField
                        control={form.control}
                        name="diagnosis"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Diagnosis</FormLabel>
                            <FormControl>
                              <textarea 
                                className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Any diagnosis provided by the doctor"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Treatment */}
                      <FormField
                        control={form.control}
                        name="treatment"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Treatment Plan</FormLabel>
                            <FormControl>
                              <textarea 
                                className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Treatment recommendations"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Prescriptions */}
                      <FormField
                        control={form.control}
                        name="prescriptions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prescriptions</FormLabel>
                            <FormControl>
                              <textarea 
                                className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Medications prescribed"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Follow-up Date */}
                      <FormField
                        control={form.control}
                        name="followUpDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Follow-up Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Doctor Notes */}
                      <FormField
                        control={form.control}
                        name="doctorNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Additional Notes</FormLabel>
                            <FormControl>
                              <textarea 
                                className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Any other notes from the appointment"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={addAppointmentMutation.isPending}>
                      {addAppointmentMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Schedule
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs for Different Views */}
        <Tabs defaultValue="upcoming">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center my-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Upcoming Appointments */}
          <TabsContent value="upcoming" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!isLoading && (
                <>
                  {/* Child Appointments */}
                  {appointmentType === 'child' && (
                    childAppointments
                      .filter(app => new Date(app.date) >= new Date())
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map(appointment => (
                        <Card key={appointment.id}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-primary" />
                              {appointment.title}
                            </CardTitle>
                            <CardDescription>
                              For {getChildName(appointment.childId)}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pb-4">
                            <div className="space-y-2 text-sm">
                              <div className="flex items-start">
                                <Clock className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                                <div>
                                  {formatDateTime(appointment.date.toString()).date}
                                  <br />
                                  {appointment.time ? formatDateTime(appointment.date.toString()).time : "Time not specified"}
                                </div>
                              </div>
                              
                              {appointment.location && (
                                <div className="flex items-start">
                                  <MapPin className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                                  <div>{appointment.location}</div>
                                </div>
                              )}
                              
                              {appointment.doctorName && (
                                <div className="flex items-start">
                                  <User className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                                  <div>
                                    Dr. {appointment.doctorName}
                                    {appointment.doctorSpecialty && <span className="text-muted-foreground"> ({appointment.doctorSpecialty})</span>}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                          <CardFooter className="pt-0">
                            <Accordion type="single" collapsible className="w-full">
                              <AccordionItem value="details">
                                <AccordionTrigger className="text-sm">
                                  View Details
                                </AccordionTrigger>
                                <AccordionContent>
                                  {appointment.notes && (
                                    <div className="mb-3">
                                      <h4 className="text-sm font-semibold mb-1 flex items-center">
                                        <FileText className="h-3.5 w-3.5 mr-1" /> Notes
                                      </h4>
                                      <p className="text-sm text-muted-foreground">{appointment.notes}</p>
                                    </div>
                                  )}
                                  
                                  {appointment.diagnosis && (
                                    <div className="mb-3">
                                      <h4 className="text-sm font-semibold mb-1">Diagnosis</h4>
                                      <p className="text-sm text-muted-foreground">{appointment.diagnosis}</p>
                                    </div>
                                  )}
                                  
                                  {appointment.treatment && (
                                    <div className="mb-3">
                                      <h4 className="text-sm font-semibold mb-1 flex items-center">
                                        <Tablet className="h-3.5 w-3.5 mr-1" /> Treatment
                                      </h4>
                                      <p className="text-sm text-muted-foreground">{appointment.treatment}</p>
                                    </div>
                                  )}
                                  
                                  {appointment.prescriptions && (
                                    <div className="mb-3">
                                      <h4 className="text-sm font-semibold mb-1">Prescriptions</h4>
                                      <p className="text-sm text-muted-foreground">{appointment.prescriptions}</p>
                                    </div>
                                  )}
                                  
                                  {appointment.followUpDate && (
                                    <div className="mb-3">
                                      <h4 className="text-sm font-semibold mb-1 flex items-center">
                                        <Calendar className="h-3.5 w-3.5 mr-1" /> Follow-up
                                      </h4>
                                      <p className="text-sm text-muted-foreground">
                                        {format(new Date(appointment.followUpDate), "MMMM d, yyyy")}
                                      </p>
                                    </div>
                                  )}
                                  
                                  {appointment.doctorNotes && (
                                    <div>
                                      <h4 className="text-sm font-semibold mb-1">Doctor's Notes</h4>
                                      <p className="text-sm text-muted-foreground">{appointment.doctorNotes}</p>
                                    </div>
                                  )}
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          </CardFooter>
                        </Card>
                      ))
                  )}
                  
                  {/* Empty State for Upcoming */}
                  {(appointmentType === 'child' && childAppointments.filter(app => new Date(app.date) >= new Date()).length === 0) ||
                   (appointmentType === 'pregnancy' && pregnancyAppointments.filter(app => new Date(app.date) >= new Date()).length === 0) ? (
                    <div className="col-span-2 flex flex-col items-center justify-center py-12 text-center">
                      <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-1">No Upcoming Appointments</h3>
                      <p className="text-muted-foreground mb-4">
                        You don't have any upcoming appointments scheduled.
                      </p>
                      <Button onClick={() => setIsAddDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Schedule an Appointment
                      </Button>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </TabsContent>

          {/* Past Appointments */}
          <TabsContent value="past" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!isLoading && (
                <>
                  {/* Child Appointments */}
                  {appointmentType === 'child' && (
                    childAppointments
                      .filter(app => new Date(app.date) < new Date())
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Most recent first
                      .map(appointment => (
                        <Card key={appointment.id}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-primary" />
                              {appointment.title}
                            </CardTitle>
                            <CardDescription>
                              For {getChildName(appointment.childId)}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pb-4">
                            <div className="space-y-2 text-sm">
                              <div className="flex items-start">
                                <Clock className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                                <div>
                                  {formatDateTime(appointment.date.toString()).date}
                                  <br />
                                  {appointment.time ? formatDateTime(appointment.date.toString()).time : "Time not specified"}
                                </div>
                              </div>
                              
                              {appointment.location && (
                                <div className="flex items-start">
                                  <MapPin className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                                  <div>{appointment.location}</div>
                                </div>
                              )}
                              
                              {appointment.doctorName && (
                                <div className="flex items-start">
                                  <User className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                                  <div>
                                    Dr. {appointment.doctorName}
                                    {appointment.doctorSpecialty && <span className="text-muted-foreground"> ({appointment.doctorSpecialty})</span>}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                          <CardFooter className="pt-0">
                            <Accordion type="single" collapsible className="w-full">
                              <AccordionItem value="details">
                                <AccordionTrigger className="text-sm">
                                  View Details
                                </AccordionTrigger>
                                <AccordionContent>
                                  {appointment.notes && (
                                    <div className="mb-3">
                                      <h4 className="text-sm font-semibold mb-1 flex items-center">
                                        <FileText className="h-3.5 w-3.5 mr-1" /> Notes
                                      </h4>
                                      <p className="text-sm text-muted-foreground">{appointment.notes}</p>
                                    </div>
                                  )}
                                  
                                  {appointment.diagnosis && (
                                    <div className="mb-3">
                                      <h4 className="text-sm font-semibold mb-1">Diagnosis</h4>
                                      <p className="text-sm text-muted-foreground">{appointment.diagnosis}</p>
                                    </div>
                                  )}
                                  
                                  {appointment.treatment && (
                                    <div className="mb-3">
                                      <h4 className="text-sm font-semibold mb-1 flex items-center">
                                        <Tablet className="h-3.5 w-3.5 mr-1" /> Treatment
                                      </h4>
                                      <p className="text-sm text-muted-foreground">{appointment.treatment}</p>
                                    </div>
                                  )}
                                  
                                  {appointment.prescriptions && (
                                    <div className="mb-3">
                                      <h4 className="text-sm font-semibold mb-1">Prescriptions</h4>
                                      <p className="text-sm text-muted-foreground">{appointment.prescriptions}</p>
                                    </div>
                                  )}
                                  
                                  {appointment.followUpDate && (
                                    <div className="mb-3">
                                      <h4 className="text-sm font-semibold mb-1 flex items-center">
                                        <Calendar className="h-3.5 w-3.5 mr-1" /> Follow-up
                                      </h4>
                                      <p className="text-sm text-muted-foreground">
                                        {format(new Date(appointment.followUpDate), "MMMM d, yyyy")}
                                      </p>
                                    </div>
                                  )}
                                  
                                  {appointment.doctorNotes && (
                                    <div>
                                      <h4 className="text-sm font-semibold mb-1">Doctor's Notes</h4>
                                      <p className="text-sm text-muted-foreground">{appointment.doctorNotes}</p>
                                    </div>
                                  )}
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          </CardFooter>
                        </Card>
                      ))
                  )}
                  
                  {/* Empty State for Past */}
                  {(appointmentType === 'child' && childAppointments.filter(app => new Date(app.date) < new Date()).length === 0) ||
                   (appointmentType === 'pregnancy' && pregnancyAppointments.filter(app => new Date(app.date) < new Date()).length === 0) ? (
                    <div className="col-span-2 flex flex-col items-center justify-center py-12 text-center">
                      <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-1">No Past Appointments</h3>
                      <p className="text-muted-foreground">
                        You don't have any past appointments to view.
                      </p>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <AppFooter />
      <MobileNav />
    </div>
  );
}