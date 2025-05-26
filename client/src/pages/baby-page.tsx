import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, isValid, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Baby, Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { MobileNav } from "@/components/mobile-nav";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Child } from "@/../../shared/schema";
import { insertChildSchema } from "@/../../shared/schema";

// Safe date formatter to prevent "Invalid time value" errors
function safeFormatDate(dateValue: any, formatString: string = 'MMM d, yyyy'): string {
  try {
    if (!dateValue) return 'Not set';
    
    // Handle string dates
    if (typeof dateValue === 'string') {
      const parsedDate = parseISO(dateValue);
      if (isValid(parsedDate)) {
        return format(parsedDate, formatString);
      }
    }
    
    // Handle Date objects
    if (dateValue instanceof Date && isValid(dateValue)) {
      return format(dateValue, formatString);
    }
    
    return 'Invalid date';
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid date';
  }
}

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

  const currentChild = children.find(child => child.id === selectedChild);

  const addBabyMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertChildSchema>) => {
      return apiRequest(`/api/children`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      toast({
        title: "Success",
        description: "Baby profile created successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create baby profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<z.infer<typeof insertChildSchema>>({
    resolver: zodResolver(insertChildSchema),
    defaultValues: {
      name: "",
      isPregnancy: false,
      birthDate: new Date(),
    },
  });

  function onAddBaby(data: z.infer<typeof insertChildSchema>) {
    const newBaby = {
      ...data,
      userId: user?.id!,
      isPregnancy: false,
    };
    addBabyMutation.mutate(newBaby);
  }

  if (isLoadingChildren) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading baby profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50">
      <AppHeader />
      
      <main className="container mx-auto px-4 pt-20 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Baby Tracker</h1>
              <p className="text-muted-foreground">
                Monitor your little one's growth, health, and development milestones
              </p>
            </div>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button className="mt-4 md:mt-0">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Baby Profile
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Baby Profile</DialogTitle>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onAddBaby)} className="space-y-4">
                    <FormField
                      control={form.control}
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
                      control={form.control}
                      name="birthDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Birth Date</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              value={field.value ? format(new Date(field.value), 'yyyy-MM-dd') : ''}
                              onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : new Date())}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" className="w-full" disabled={addBabyMutation.isPending}>
                      {addBabyMutation.isPending ? "Creating..." : "Create Baby Profile"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {babyProfiles.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Baby className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Baby Profiles Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first baby profile to start tracking growth and development.
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Baby
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Baby Profile</DialogTitle>
                    </DialogHeader>
                    
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onAddBaby)} className="space-y-4">
                        <FormField
                          control={form.control}
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
                          control={form.control}
                          name="birthDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Birth Date</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date" 
                                  value={field.value ? format(new Date(field.value), 'yyyy-MM-dd') : ''}
                                  onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : new Date())}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button type="submit" className="w-full" disabled={addBabyMutation.isPending}>
                          {addBabyMutation.isPending ? "Creating..." : "Create Baby Profile"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Baby Selection */}
              {babyProfiles.length > 1 && (
                <Card>
                  <CardContent className="p-4">
                    <Label className="text-sm font-medium mb-2 block">Select Baby</Label>
                    <Select value={selectedChild?.toString()} onValueChange={(value) => setSelectedChild(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a baby profile" />
                      </SelectTrigger>
                      <SelectContent>
                        {babyProfiles.map((child) => (
                          <SelectItem key={child.id} value={child.id.toString()}>
                            {child.name || 'Unnamed Baby'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              )}

              {/* Baby Info Card */}
              <BabyInfoCard child={currentChild} />

              {/* Basic Tracking Cards */}
              {currentChild && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Growth Tracker
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm mb-4">
                        Track your baby's growth milestones and development.
                      </p>
                      <Button className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Growth Record
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Baby className="w-5 h-5" />
                        Development
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm mb-4">
                        Record important developmental milestones.
                      </p>
                      <Button className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Milestone
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      
      <AppFooter />
      <MobileNav />
    </div>
  );
}

function BabyInfoCard({ child }: { child?: Child }) {
  if (!child || !child.name) return null;
  
  const birthDate = child.birthDate ? new Date(child.birthDate) : null;
  const isValidDate = birthDate && !isNaN(birthDate.getTime());
  const ageInMonths = isValidDate 
    ? Math.floor((new Date().getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)) 
    : 0;
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-shrink-0 w-24 h-24 md:w-32 md:h-32 bg-primary-50 rounded-full flex items-center justify-center text-primary-500">
          <span className="text-2xl font-bold">
            {child.name ? child.name.charAt(0).toUpperCase() : 'B'}
          </span>
        </div>
        
        <div className="flex-grow">
          <h2 className="text-2xl font-bold">{child.name || 'Baby'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <p className="text-sm text-muted-foreground">Age</p>
              <p className="font-medium">
                {isValidDate ? `${ageInMonths} months` : 'Age not available'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Birth Date</p>
              <p className="font-medium">
                {safeFormatDate(child.birthDate)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant="secondary">Healthy</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}