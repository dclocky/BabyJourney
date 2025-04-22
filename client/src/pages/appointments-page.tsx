import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { AppTabs } from "@/components/app-tabs";
import { MobileNav } from "@/components/mobile-nav";
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
// Define a type for pregnancy (using Child with isPregnancy=true is the pregnancy model)
type Pregnancy = Child & { isPregnancy: true };
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

  // Group appointments by type
  const childAppointments = appointments.filter(app => app.childId !== null);
  const pregnancyAppointments = appointments.filter(app => app.pregnancyId !== null);

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
        childId: data.type === 'child' ? data.childId : null,
        status: "scheduled",
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
      // Use the correct endpoint path with the childId if it's a child appointment
      if (data.type === 'child' && data.childId) {
        const res = await apiRequest("POST", `/api/children/${data.childId}/appointments`, newAppointment);
        return await res.json();
      } else if (data.type === 'pregnancy' && data.pregnancyId) {
        // For pregnancy appointments
        const res = await apiRequest("POST", `/api/pregnancies/${data.pregnancyId}/appointments`, newAppointment);
        return await res.json();
      } else {
        throw new Error("Missing child or pregnancy ID");
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate both specific child/pregnancy appointments and the general appointments list
      if (variables.type === 'child' && variables.childId) {
        queryClient.invalidateQueries({ queryKey: ["/api/children", variables.childId, "appointments"] });
      } else if (variables.type === 'pregnancy' && variables.pregnancyId) {
        queryClient.invalidateQueries({ queryKey: ["/api/pregnancies", variables.pregnancyId, "appointments"] });
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
        description: error.message,
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
                                  Pregnancy {index + 1} (Due: {format(new Date(pregnancy.dueDate), "MMM d, yyyy")})
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
                    <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                      <h3 className="font-medium text-sm flex items-center mb-2">
                        <Stethoscope className="w-4 h-4 mr-2" />
                        Medical Information
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        
                        <FormField
                          control={form.control}
                          name="doctorSpecialty"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Specialty</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Pediatrician, OB/GYN" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Tabs defaultValue="diagnosis" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="diagnosis">Diagnosis</TabsTrigger>
                          <TabsTrigger value="treatment">Treatment</TabsTrigger>
                          <TabsTrigger value="followup">Follow-up</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="diagnosis" className="space-y-4 pt-4">
                          <FormField
                            control={form.control}
                            name="diagnosis"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Diagnosis</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Doctor's diagnosis"
                                    className="min-h-24"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {/* Vitals - Future Enhancement */}
                          <FormField
                            control={form.control}
                            name="vitals"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Vitals</FormLabel>
                                <div className="grid grid-cols-2 gap-2">
                                  <Input
                                    type="text"
                                    placeholder="Blood Pressure (e.g., 120/80)"
                                    onChange={(e) => {
                                      const newVitals = {...field.value};
                                      newVitals['blood_pressure'] = e.target.value;
                                      field.onChange(newVitals);
                                    }}
                                    value={field.value?.['blood_pressure'] || ''}
                                  />
                                  <Input
                                    type="text"
                                    placeholder="Temperature (e.g., 98.6°F)"
                                    onChange={(e) => {
                                      const newVitals = {...field.value};
                                      newVitals['temperature'] = e.target.value;
                                      field.onChange(newVitals);
                                    }}
                                    value={field.value?.['temperature'] || ''}
                                  />
                                </div>
                              </FormItem>
                            )}
                          />
                        </TabsContent>
                        
                        <TabsContent value="treatment" className="space-y-4 pt-4">
                          <FormField
                            control={form.control}
                            name="treatment"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Treatment Plan</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Recommended treatment plan"
                                    className="min-h-24"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="prescriptions"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Prescriptions</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="List medications prescribed"
                                    className="min-h-20"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TabsContent>
                        
                        <TabsContent value="followup" className="space-y-4 pt-4">
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
                          
                          <FormField
                            control={form.control}
                            name="doctorNotes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Doctor's Notes</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Additional notes from the doctor"
                                    className="min-h-20"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TabsContent>
                      </Tabs>
                    </div>
                  )}

                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={addAppointmentMutation.isPending}
                    >
                      {addAppointmentMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Appointment"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : (appointments.length === 0) ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h2 className="text-xl font-bold mb-4">No Appointments Scheduled</h2>
            <p className="text-muted-foreground mb-6">
              Schedule doctor visits, checkups, and other important appointments.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add First Appointment
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Upcoming Appointments Section */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {appointments
                    .filter(apt => new Date(apt.date) >= new Date())
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map(appointment => {
                      const { date, time } = formatDateTime(appointment.date);
                      return (
                        <div key={appointment.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium text-lg">{appointment.title}</h3>
                            <div className="flex gap-2">
                              {appointment.doctorName && (
                                <div className="text-sm bg-blue-50 text-blue-600 px-2 py-1 rounded flex items-center">
                                  <Stethoscope className="h-3 w-3 mr-1" />
                                  Doctor
                                </div>
                              )}
                              <div className="text-sm bg-primary-50 text-primary-500 px-2 py-1 rounded">
                                {appointment.childId ? 'Child' : 'Pregnancy'}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4 text-sm">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>{date}</span>
                            </div>

                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>{time}</span>
                            </div>

                            {appointment.location && (
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>{appointment.location}</span>
                              </div>
                            )}

                            {appointment.childId && (
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>{getChildName(appointment.childId)}</span>
                              </div>
                            )}
                            
                            {appointment.doctorName && (
                              <div className="flex items-center">
                                <Stethoscope className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>{appointment.doctorName}</span>
                                {appointment.doctorSpecialty && (
                                  <span className="ml-1 text-muted-foreground">({appointment.doctorSpecialty})</span>
                                )}
                              </div>
                            )}
                          </div>

                          {appointment.notes && (
                            <div className="mt-2 text-sm text-muted-foreground">
                              <p>{appointment.notes}</p>
                            </div>
                          )}
                          
                          {/* Doctor Mode Information */}
                          {appointment.doctorName && (
                            <div className="mt-4 pt-4 border-t border-dashed">
                              <Accordion type="single" collapsible className="w-full">
                                {appointment.diagnosis && (
                                  <AccordionItem value="diagnosis">
                                    <AccordionTrigger className="text-sm font-medium flex items-center py-2">
                                      <FileText className="h-4 w-4 mr-2 text-blue-500" />
                                      Diagnosis
                                    </AccordionTrigger>
                                    <AccordionContent className="text-sm">
                                      <p className="p-2 bg-muted/30 rounded-md">{appointment.diagnosis}</p>
                                      
                                      {/* Display vitals if available */}
                                      {appointment.vitals && Object.keys(appointment.vitals).length > 0 && (
                                        <div className="mt-2">
                                          <p className="font-medium text-xs mb-1">Vitals:</p>
                                          <div className="grid grid-cols-2 gap-2 text-xs">
                                            {Object.entries(appointment.vitals).map(([key, value]) => (
                                              <div key={key} className="bg-muted/20 p-1 px-2 rounded flex justify-between">
                                                <span className="capitalize">{key.replace('_', ' ')}</span>
                                                <span className="font-medium">{value}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </AccordionContent>
                                  </AccordionItem>
                                )}
                                
                                {appointment.treatment && (
                                  <AccordionItem value="treatment">
                                    <AccordionTrigger className="text-sm font-medium flex items-center py-2">
                                      <ClipboardList className="h-4 w-4 mr-2 text-green-500" />
                                      Treatment Plan
                                    </AccordionTrigger>
                                    <AccordionContent className="text-sm">
                                      <p className="p-2 bg-muted/30 rounded-md">{appointment.treatment}</p>
                                      
                                      {appointment.prescriptions && (
                                        <div className="mt-2">
                                          <p className="font-medium text-xs mb-1">Prescribed Medications:</p>
                                          <div className="bg-muted/20 p-2 rounded text-xs">
                                            <p>{appointment.prescriptions}</p>
                                          </div>
                                        </div>
                                      )}
                                    </AccordionContent>
                                  </AccordionItem>
                                )}
                                
                                {(appointment.followUpDate || appointment.doctorNotes) && (
                                  <AccordionItem value="followup">
                                    <AccordionTrigger className="text-sm font-medium flex items-center py-2">
                                      <ArrowRight className="h-4 w-4 mr-2 text-purple-500" />
                                      Follow-up
                                    </AccordionTrigger>
                                    <AccordionContent className="text-sm">
                                      {appointment.followUpDate && (
                                        <div className="flex items-center mb-2">
                                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                          <span>Follow-up on {format(new Date(appointment.followUpDate), "MMMM d, yyyy")}</span>
                                        </div>
                                      )}
                                      
                                      {appointment.doctorNotes && (
                                        <div>
                                          <p className="font-medium text-xs mb-1">Doctor's Notes:</p>
                                          <div className="bg-muted/30 p-2 rounded text-xs">
                                            <p>{appointment.doctorNotes}</p>
                                          </div>
                                        </div>
                                      )}
                                    </AccordionContent>
                                  </AccordionItem>
                                )}
                              </Accordion>
                            </div>
                          )}
                        </div>
                      );
                    })}

                  {appointments.filter(apt => new Date(apt.date) >= new Date()).length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      No upcoming appointments scheduled
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Past Appointments Section */}
            <Card>
              <CardHeader>
                <CardTitle>Past Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {appointments
                    .filter(apt => new Date(apt.date) < new Date())
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(appointment => {
                      const { date, time } = formatDateTime(appointment.date);
                      return (
                        <div key={appointment.id} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium text-lg">{appointment.title}</h3>
                            <div className="flex gap-2">
                              {appointment.doctorName && (
                                <div className="text-sm bg-blue-50 text-blue-600 px-2 py-1 rounded flex items-center">
                                  <Stethoscope className="h-3 w-3 mr-1" />
                                  Doctor
                                </div>
                              )}
                              <div className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                {appointment.childId ? 'Child' : 'Pregnancy'}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4 text-sm">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>{date}</span>
                            </div>

                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>{time}</span>
                            </div>

                            {appointment.location && (
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>{appointment.location}</span>
                              </div>
                            )}

                            {appointment.childId && (
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>{getChildName(appointment.childId)}</span>
                              </div>
                            )}
                            
                            {appointment.doctorName && (
                              <div className="flex items-center">
                                <Stethoscope className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>{appointment.doctorName}</span>
                                {appointment.doctorSpecialty && (
                                  <span className="ml-1 text-muted-foreground">({appointment.doctorSpecialty})</span>
                                )}
                              </div>
                            )}
                          </div>

                          {appointment.notes && (
                            <div className="mt-2 text-sm text-muted-foreground">
                              <p>{appointment.notes}</p>
                            </div>
                          )}
                          
                          {/* Doctor Mode Information */}
                          {appointment.doctorName && (
                            <div className="mt-4 pt-4 border-t border-dashed">
                              <Accordion type="single" collapsible className="w-full">
                                {appointment.diagnosis && (
                                  <AccordionItem value="diagnosis">
                                    <AccordionTrigger className="text-sm font-medium flex items-center py-2">
                                      <FileText className="h-4 w-4 mr-2 text-blue-500" />
                                      Diagnosis
                                    </AccordionTrigger>
                                    <AccordionContent className="text-sm">
                                      <p className="p-2 bg-muted/30 rounded-md">{appointment.diagnosis}</p>
                                      
                                      {/* Display vitals if available */}
                                      {appointment.vitals && Object.keys(appointment.vitals).length > 0 && (
                                        <div className="mt-2">
                                          <p className="font-medium text-xs mb-1">Vitals:</p>
                                          <div className="grid grid-cols-2 gap-2 text-xs">
                                            {Object.entries(appointment.vitals).map(([key, value]) => (
                                              <div key={key} className="bg-muted/20 p-1 px-2 rounded flex justify-between">
                                                <span className="capitalize">{key.replace('_', ' ')}</span>
                                                <span className="font-medium">{value}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </AccordionContent>
                                  </AccordionItem>
                                )}
                                
                                {appointment.treatment && (
                                  <AccordionItem value="treatment">
                                    <AccordionTrigger className="text-sm font-medium flex items-center py-2">
                                      <ClipboardList className="h-4 w-4 mr-2 text-green-500" />
                                      Treatment Plan
                                    </AccordionTrigger>
                                    <AccordionContent className="text-sm">
                                      <p className="p-2 bg-muted/30 rounded-md">{appointment.treatment}</p>
                                      
                                      {appointment.prescriptions && (
                                        <div className="mt-2">
                                          <p className="font-medium text-xs mb-1">Prescribed Medications:</p>
                                          <div className="bg-muted/20 p-2 rounded text-xs">
                                            <p>{appointment.prescriptions}</p>
                                          </div>
                                        </div>
                                      )}
                                    </AccordionContent>
                                  </AccordionItem>
                                )}
                                
                                {(appointment.followUpDate || appointment.doctorNotes) && (
                                  <AccordionItem value="followup">
                                    <AccordionTrigger className="text-sm font-medium flex items-center py-2">
                                      <ArrowRight className="h-4 w-4 mr-2 text-purple-500" />
                                      Follow-up
                                    </AccordionTrigger>
                                    <AccordionContent className="text-sm">
                                      {appointment.followUpDate && (
                                        <div className="flex items-center mb-2">
                                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                          <span>Follow-up on {format(new Date(appointment.followUpDate), "MMMM d, yyyy")}</span>
                                        </div>
                                      )}
                                      
                                      {appointment.doctorNotes && (
                                        <div>
                                          <p className="font-medium text-xs mb-1">Doctor's Notes:</p>
                                          <div className="bg-muted/30 p-2 rounded text-xs">
                                            <p>{appointment.doctorNotes}</p>
                                          </div>
                                        </div>
                                      )}
                                    </AccordionContent>
                                  </AccordionItem>
                                )}
                              </Accordion>
                            </div>
                          )}
                        </div>
                      );
                    })}

                  {appointments.filter(apt => new Date(apt.date) < new Date()).length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      No past appointments
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <AppFooter />
      <MobileNav />
    </div>
  );
}