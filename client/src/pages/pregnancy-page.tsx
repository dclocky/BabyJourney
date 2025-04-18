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
import { Pregnancy, InsertPregnancy } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, addWeeks } from "date-fns";
import { Loader2, Calendar, PlusCircle } from "lucide-react";

export default function PregnancyPage() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);

  const { data: pregnancies = [], isLoading: isLoadingPregnancies } = useQuery<Pregnancy[]>({
    queryKey: ["/api/pregnancies"],
  });

  const pregnancySchema = z.object({
    dueDate: z.string().refine(date => !isNaN(Date.parse(date)), {
      message: "Please enter a valid date",
    }),
    startDate: z.string().refine(date => !isNaN(Date.parse(date)), {
      message: "Please enter a valid date",
    }),
    notes: z.string().optional(),
  });

  const appointmentSchema = z.object({
    appointmentDate: z.string().refine(date => !isNaN(Date.parse(date)), {
      message: "Please enter a valid date",
    }),
    description: z.string().min(1, "Description is required"),
  });

  const calculateStartDate = (dueDate: Date) => {
    return format(addWeeks(dueDate, -40), "yyyy-MM-dd");
  };

  const form = useForm<z.infer<typeof pregnancySchema>>({
    resolver: zodResolver(pregnancySchema),
    defaultValues: {
      dueDate: format(new Date(), "yyyy-MM-dd"),
      startDate: calculateStartDate(new Date()),
      notes: "",
    },
  });

  const appointmentForm = useForm<z.infer<typeof appointmentSchema>>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      appointmentDate: format(new Date(), "yyyy-MM-dd"),
      description: "",
    },
  });

  const watchDueDate = form.watch("dueDate");
  const updateStartDate = () => {
    if (!isNaN(Date.parse(watchDueDate))) {
      const dueDate = new Date(watchDueDate);
      form.setValue("startDate", calculateStartDate(dueDate));
    }
  };

  const addPregnancyMutation = useMutation({
    mutationFn: async (data: z.infer<typeof pregnancySchema>) => {
      const newPregnancy: InsertPregnancy = {
        userId: 0,
        dueDate: new Date(data.dueDate),
        startDate: new Date(data.startDate),
        notes: data.notes || "",
        status: "active",
      };
      const res = await apiRequest("POST", "/api/pregnancies", newPregnancy);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pregnancies"] });
      toast({
        title: "Pregnancy added",
        description: "Your pregnancy information has been saved!",
      });
      form.reset({
        dueDate: format(new Date(), "yyyy-MM-dd"),
        startDate: calculateStartDate(new Date()),
        notes: "",
      });
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

  const onAddAppointment = (data: z.infer<typeof appointmentSchema>) => {
    console.log("New appointment:", data);
    toast({
      title: "Appointment Added",
      description: `Your appointment on ${data.appointmentDate} has been added.`,
    });
    appointmentForm.reset();
    setIsAppointmentDialogOpen(false);
  };

  const getCurrentWeek = (startDate: Date) => {
    const diffTime = Math.abs(new Date().getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7) + 1;
  };

  return (
    <div className="min-h-screen flex flex-col bg-secondary-50">
      <AppHeader />
      <AppTabs />

      <main className="flex-grow container mx-auto px-4 py-6 pb-20 md:pb-6">
        <div className="flex justify-between items-center mb-6 gap-2">
          <h1 className="text-2xl font-bold">Pregnancy</h1>

          <div className="flex gap-2">
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
                            <Input
                              type="date"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                setTimeout(updateStartDate, 0);
                              }}
                            />
                          </FormControl>
                          <FormDescription>Your estimated due date</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} disabled />
                          </FormControl>
                          <FormDescription>Automatically calculated from due date</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Input placeholder="Optional notes" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button type="submit">Save</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Dialog open={isAppointmentDialogOpen} onOpenChange={setIsAppointmentDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Calendar className="mr-2 h-4 w-4" />
                  Add Appointment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Appointment</DialogTitle>
                  <DialogDescription>
                    Schedule an upcoming appointment related to your pregnancy.
                  </DialogDescription>
                </DialogHeader>

                <Form {...appointmentForm}>
                  <form onSubmit={appointmentForm.handleSubmit(onAddAppointment)} className="space-y-4">
                    <FormField
                      control={appointmentForm.control}
                      name="appointmentDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Appointment Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={appointmentForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input placeholder="Checkup, scan, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button type="submit">Add</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </main>

      <AppFooter />
      <MobileNav />
    </div>
  );
}
