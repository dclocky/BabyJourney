import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { AppTabs } from "@/components/app-tabs";
import { MobileNav } from "@/components/mobile-nav";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Child, Appointment, InsertAppointment } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, isSameDay, isSameMonth, addMonths } from "date-fns";
import { Loader2, CalendarPlus, MapPin, Clock, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

export default function AppointmentsPage() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const { data: children = [], isLoading: isLoadingChildren } = useQuery<Child[]>({
    queryKey: ["/api/children"],
  });

  // Set the first child as selected by default if none is selected
  if (children.length > 0 && selectedChild === null) {
    setSelectedChild(children[0].id);
  }

  const { data: appointments = [], isLoading: isLoadingAppointments } = useQuery<Appointment[]>({
    queryKey: ["/api/children", selectedChild, "appointments"],
    enabled: selectedChild !== null,
  });

  // Filter appointments for the selected month (for calendar view)
  const appointmentsThisMonth = appointments.filter(appointment => 
    isSameMonth(new Date(appointment.date), currentMonth)
  );

  // Filter appointments for the selected date (for day view)
  const appointmentsForSelectedDate = appointments.filter(appointment => 
    isSameDay(new Date(appointment.date), selectedDate)
  );

  // Get upcoming appointments (for list view)
  const upcomingAppointments = [...appointments]
    .filter(appointment => new Date(appointment.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Form schema for adding new appointment
  const appointmentSchema = z.object({
    childId: z.number(),
    title: z.string().min(1, "Title is required"),
    date: z.date({
      required_error: "Please select a date",
    }),
    time: z.string().optional(),
    location: z.string().optional(),
    notes: z.string().optional(),
  });

  const form = useForm<z.infer<typeof appointmentSchema>>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      childId: selectedChild || 0,
      title: "",
      date: new Date(),
      time: "",
      location: "",
      notes: "",
    },
  });

  // Update form when selected child changes
  if (form.getValues("childId") !== selectedChild && selectedChild !== null) {
    form.setValue("childId", selectedChild);
  }

  const addAppointmentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof appointmentSchema>) => {
      const newAppointment: InsertAppointment = {
        childId: data.childId,
        userId: 0, // Will be set by server based on authenticated user
        title: data.title,
        date: data.date,
        time: data.time || "",
        location: data.location || "",
        notes: data.notes || "",
      };
      const res = await apiRequest("POST", `/api/children/${data.childId}/appointments`, newAppointment);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/children", selectedChild, "appointments"] });
      toast({
        title: "Appointment added",
        description: "Your appointment has been scheduled.",
      });
      form.reset({
        childId: selectedChild || 0,
        title: "",
        date: new Date(),
        time: "",
        location: "",
        notes: "",
      });
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

  // Navigate between months
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => addMonths(prev, -1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
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
                <CalendarPlus className="mr-2 h-4 w-4" />
                Add Appointment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule New Appointment</DialogTitle>
                <DialogDescription>
                  Add important medical appointments and check-ups.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onAddAppointment)} className="space-y-4">
                  {children.length > 1 && (
                    <FormField
                      control={form.control}
                      name="childId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Child</FormLabel>
                          <FormControl>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              value={field.value}
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
                  
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Appointment Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Pediatrician Check-up, Vaccination" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date</FormLabel>
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            className="rounded-md border"
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Time (Optional)</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Clinic name, address, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
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
                  
                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={addAppointmentMutation.isPending}
                    >
                      {addAppointmentMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Scheduling...
                        </>
                      ) : (
                        "Schedule Appointment"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Child selector if user has multiple children */}
        {children.length > 1 && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-wrap gap-2">
              {children.map(child => (
                <Button
                  key={child.id}
                  variant={selectedChild === child.id ? "default" : "outline"}
                  onClick={() => setSelectedChild(child.id)}
                >
                  {child.name}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        {isLoadingChildren || isLoadingAppointments ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : selectedChild === null ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h2 className="text-xl font-bold mb-4">No Child Profiles Found</h2>
            <p className="text-muted-foreground mb-6">
              Add a child profile to start scheduling appointments.
            </p>
            <Button>Add Child Profile</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar View */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Calendar</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={goToPreviousMonth}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">
                      {format(currentMonth, 'MMMM yyyy')}
                    </span>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={goToNextMonth}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  month={currentMonth}
                  onMonthChange={setCurrentMonth}
                  modifiers={{
                    hasAppointment: appointmentsThisMonth.map(a => new Date(a.date)),
                  }}
                  modifiersStyles={{
                    hasAppointment: {
                      backgroundColor: "hsl(var(--primary-100))",
                      color: "hsl(var(--primary-900))",
                      fontWeight: "bold",
                    }
                  }}
                  className="rounded-md border"
                />
                
                {appointmentsForSelectedDate.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-medium mb-3">
                      Appointments on {format(selectedDate, 'MMMM d, yyyy')}
                    </h3>
                    <div className="space-y-3">
                      {appointmentsForSelectedDate.map(appointment => (
                        <AppointmentCard key={appointment.id} appointment={appointment} />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Upcoming Appointments List */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
                <CardDescription>
                  Your next scheduled appointments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingAppointments.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground mb-4">No upcoming appointments</p>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddDialogOpen(true)}
                    >
                      <CalendarPlus className="mr-2 h-4 w-4" />
                      Schedule New Appointment
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingAppointments.map(appointment => (
                      <AppointmentCard key={appointment.id} appointment={appointment} />
                    ))}
                  </div>
                )}
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

interface AppointmentCardProps {
  appointment: Appointment;
}

function AppointmentCard({ appointment }: AppointmentCardProps) {
  return (
    <div className="border rounded-md p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0 w-12 h-12 bg-primary-50 rounded-md flex flex-col items-center justify-center text-primary-500 mr-4">
          <span className="text-xs font-bold">{format(new Date(appointment.date), 'MMM')}</span>
          <span className="text-lg font-bold">{format(new Date(appointment.date), 'd')}</span>
        </div>
        
        <div className="flex-grow min-w-0">
          <h4 className="font-medium text-base">{appointment.title}</h4>
          
          <div className="flex flex-wrap gap-x-4 mt-1">
            {appointment.time && (
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                <span>{appointment.time}</span>
              </div>
            )}
            
            {appointment.location && (
              <div className="flex items-center text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 mr-1" />
                <span>{appointment.location}</span>
              </div>
            )}
          </div>
          
          {appointment.notes && (
            <p className="text-xs text-muted-foreground mt-2">{appointment.notes}</p>
          )}
        </div>
      </div>
    </div>
  );
}
