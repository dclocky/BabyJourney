
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
import { Progress } from "@/components/ui/progress";
import { Child } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, addWeeks, differenceInWeeks } from "date-fns";
import { Loader2, Calendar, PlusCircle, Baby } from "lucide-react";

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
          <div className="space-y-6">
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
                            {Math.max(0, Math.min(calculateWeeks(new Date(pregnancy.dueDate)) - 13, 14))} / 14
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
                            {Math.max(0, Math.min(calculateWeeks(new Date(pregnancy.dueDate)) - 27, 13))} / 13
                          </p>
                          <p className="text-xs text-muted-foreground">weeks completed</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <AppFooter />
      <MobileNav />
    </div>
  );
}
