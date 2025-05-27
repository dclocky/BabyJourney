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
import { Textarea } from "@/components/ui/textarea";
import { TrendingUp, Baby, Plus, Stethoscope, StickyNote, Music, Heart, Utensils, CircleDot, Clock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { AppTabs } from "@/components/app-tabs";
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
  const [showAddChildDialog, setShowAddChildDialog] = useState(false);

  const { data: babyProfiles = [], isLoading: isLoadingChildren } = useQuery<Child[]>({
    queryKey: ["/api/children"],
  });

  // Filter to only get baby profiles (not pregnancies)
  const babies = babyProfiles.filter(child => child.birthDate);

  // Auto-select first baby if none selected
  if (babies.length > 0 && selectedChild === null) {
    setSelectedChild(babies[0].id);
  }

  const currentChild = babies.find(child => child.id === selectedChild);

  const addChildForm = useForm({
    resolver: zodResolver(insertChildSchema.omit({ id: true, userId: true })),
    defaultValues: {
      name: "",
      gender: "unknown" as const,
      birthDate: "",
    },
  });

  const addChildMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/children", {
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
      setShowAddChildDialog(false);
      addChildForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create baby profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  function onAddChild(data: any) {
    addChildMutation.mutate(data);
  }

  if (isLoadingChildren) {
    return (
      <div className="min-h-screen flex flex-col bg-secondary-50">
        <AppHeader />
        <AppTabs />
        <main className="flex-grow container mx-auto px-4 py-6 pb-20 md:pb-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading baby profiles...</p>
            </div>
          </div>
        </main>
        <AppFooter />
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-secondary-50">
      <AppHeader />
      <AppTabs />
      
      <main className="flex-grow container mx-auto px-4 py-6 pb-20 md:pb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Baby Tracking</h1>
          <Dialog open={showAddChildDialog} onOpenChange={setShowAddChildDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Baby Profile
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Baby Profile</DialogTitle>
              </DialogHeader>
              <Form {...addChildForm}>
                <form onSubmit={addChildForm.handleSubmit(onAddChild)} className="space-y-4">
                  <FormField
                    control={addChildForm.control}
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
                    control={addChildForm.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="boy">Boy</SelectItem>
                            <SelectItem value="girl">Girl</SelectItem>
                            <SelectItem value="unknown">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={addChildForm.control}
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
                  
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1" disabled={addChildMutation.isPending}>
                      {addChildMutation.isPending ? "Creating..." : "Create Profile"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowAddChildDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-6">
          {babies.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Baby className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-bold mb-2">No Baby Profiles Yet</h2>
                <p className="text-muted-foreground mb-6">
                  Create your first baby profile to start tracking their development, feeding, health, and more.
                </p>
                <Button onClick={() => setShowAddChildDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Baby Profile
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Baby Selection */}
              {babies.length > 1 && (
                <Card>
                  <CardContent className="p-4">
                    <Label className="text-sm font-medium mb-2 block">Select Baby</Label>
                    <Select value={selectedChild?.toString()} onValueChange={(value) => setSelectedChild(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a baby profile" />
                      </SelectTrigger>
                      <SelectContent>
                        {babies.map((child) => (
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

              {/* Comprehensive Tracking Cards */}
              {currentChild && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <GrowthTrackerCard childId={currentChild.id} />
                    <DevelopmentCard childId={currentChild.id} />
                  </div>
                  
                  {/* Daily Care Tracking */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <FeedingTrackerCard childId={currentChild.id} />
                    <DiaperTrackerCard childId={currentChild.id} />
                  </div>
                  
                  {/* Notes and Preferences */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <NotesCard childId={currentChild.id} />
                    <MusicPreferencesCard childId={currentChild.id} />
                  </div>
                  
                  {/* Health Tracking */}
                  <HealthTrackerCard childId={currentChild.id} />
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

function GrowthTrackerCard({ childId }: { childId: number }) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data: allMilestones = [] } = useQuery({
    queryKey: [`/api/children/${childId}/milestones`],
  });
  
  const growthRecords = allMilestones.filter((m: any) => m.category === 'growth');
  
  const growthForm = useForm({
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      weight: '',
      height: '',
      headCircumference: '',
      notes: '',
    },
  });

  const addGrowthMutation = useMutation({
    mutationFn: async (data: any) => {
      const growthTitle = `Growth Record - ${data.weight ? data.weight + 'kg' : ''}${data.weight && data.height ? ', ' : ''}${data.height ? data.height + 'cm' : ''}`;
      const description = `Weight: ${data.weight || 'N/A'}kg, Height: ${data.height || 'N/A'}cm, Head: ${data.headCircumference || 'N/A'}cm${data.notes ? `, Notes: ${data.notes}` : ''}`;
      
      return apiRequest(`/api/children/${childId}/milestones`, {
        method: "POST",
        body: JSON.stringify({
          title: growthTitle,
          category: 'growth',
          date: new Date(data.date),
          description: description,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/children/${childId}/milestones`] });
      toast({
        title: "Success",
        description: "Growth record added successfully!",
      });
      setIsDialogOpen(false);
      growthForm.reset();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          Growth Tracker
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm mb-4">
          Track your baby's weight, height, and head circumference over time.
        </p>
        
        {growthRecords.length > 0 && (
          <div className="space-y-2 mb-4">
            <h4 className="font-medium text-sm">Recent Records</h4>
            {growthRecords.slice(-3).map((record: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-2 bg-muted rounded text-sm">
                <span>{safeFormatDate(record.date)}</span>
                <span className="font-medium">
                  {record.weight && `${record.weight}kg`}
                  {record.weight && record.height && ' • '}
                  {record.height && `${record.height}cm`}
                </span>
              </div>
            ))}
          </div>
        )}
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Growth Record
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Growth Measurements</DialogTitle>
            </DialogHeader>
            <Form {...growthForm}>
              <form onSubmit={growthForm.handleSubmit((data) => addGrowthMutation.mutate(data))} className="space-y-4">
                <div>
                  <Label>Date</Label>
                  <Input type="date" {...growthForm.register('date')} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Weight (kg)</Label>
                    <Input placeholder="7.5" {...growthForm.register('weight')} />
                  </div>
                  <div>
                    <Label>Height (cm)</Label>
                    <Input placeholder="68" {...growthForm.register('height')} />
                  </div>
                  <div>
                    <Label>Head (cm)</Label>
                    <Input placeholder="42" {...growthForm.register('headCircumference')} />
                  </div>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea placeholder="Any observations..." {...growthForm.register('notes')} />
                </div>
                <Button type="submit" className="w-full">Save Growth Record</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function DevelopmentCard({ childId }: { childId: number }) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data: milestones = [] } = useQuery({
    queryKey: [`/api/children/${childId}/milestones`],
  });
  
  const developmentMilestones = milestones.filter((m: any) => m.category === 'first' || m.category === 'other');
  
  const milestoneForm = useForm({
    defaultValues: {
      title: '',
      category: 'first',
      date: format(new Date(), 'yyyy-MM-dd'),
      description: '',
    },
  });

  const addMilestoneMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/children/${childId}/milestones`, {
        method: "POST",
        body: JSON.stringify({
          title: data.title,
          category: data.category,
          date: new Date(data.date),
          description: data.description || null,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/children/${childId}/milestones`] });
      toast({
        title: "Success",
        description: "Milestone recorded successfully!",
      });
      setIsDialogOpen(false);
      milestoneForm.reset();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Baby className="w-5 h-5 mr-2" />
          Development Milestones
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm mb-4">
          Record important developmental milestones and achievements.
        </p>
        
        {developmentMilestones.length > 0 && (
          <div className="space-y-2 mb-4">
            <h4 className="font-medium text-sm">Recent Milestones</h4>
            {developmentMilestones.slice(-3).map((milestone: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-2 bg-muted rounded text-sm">
                <span className="font-medium">{milestone.title}</span>
                <span className="text-muted-foreground">{safeFormatDate(milestone.date)}</span>
              </div>
            ))}
          </div>
        )}
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Milestone
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Development Milestone</DialogTitle>
            </DialogHeader>
            <Form {...milestoneForm}>
              <form onSubmit={milestoneForm.handleSubmit((data) => addMilestoneMutation.mutate(data))} className="space-y-4">
                <div>
                  <Label>Milestone Title</Label>
                  <Input placeholder="e.g., First steps, First word" {...milestoneForm.register('title')} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select onValueChange={(value) => milestoneForm.setValue('category', value)} defaultValue="first">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="first">First Moments</SelectItem>
                        <SelectItem value="other">Other Milestone</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input type="date" {...milestoneForm.register('date')} />
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea placeholder="Describe this special moment..." {...milestoneForm.register('description')} />
                </div>
                <Button type="submit" className="w-full">Save Milestone</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// Feeding Tracker Card
function FeedingTrackerCard({ childId }: { childId: number }) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data: allMilestones = [] } = useQuery({
    queryKey: [`/api/children/${childId}/milestones`],
  });
  
  const feedingRecords = allMilestones.filter((m: any) => m.category === 'feeding');
  
  const feedingForm = useForm({
    defaultValues: {
      type: 'bottle',
      amount: '',
      duration: '',
      notes: '',
      time: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
    },
  });

  const addFeedingMutation = useMutation({
    mutationFn: async (data: any) => {
      const feedingTitle = `${data.type.charAt(0).toUpperCase() + data.type.slice(1)} feeding`;
      const description = `Type: ${data.type}, Amount: ${data.amount || 'N/A'}, Duration: ${data.duration || 'N/A'}${data.notes ? `, Notes: ${data.notes}` : ''}`;
      
      return apiRequest(`/api/children/${childId}/milestones`, {
        method: "POST",
        body: JSON.stringify({
          title: feedingTitle,
          category: 'feeding',
          date: new Date(data.time),
          description: description,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/children/${childId}/milestones`] });
      toast({
        title: "Success",
        description: "Feeding record added successfully!",
      });
      setIsDialogOpen(false);
      feedingForm.reset();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Utensils className="w-5 h-5 mr-2" />
          Feeding Tracker
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm mb-4">
          Track feeding times, amounts, and types.
        </p>
        
        {feedingRecords.length > 0 && (
          <div className="space-y-2 mb-4">
            <h4 className="font-medium text-sm">Recent Feedings</h4>
            {feedingRecords.slice(-3).map((record: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-2 bg-muted rounded text-sm">
                <span className="font-medium">{record.title}</span>
                <span className="text-muted-foreground">{safeFormatDate(record.date, 'HH:mm')}</span>
              </div>
            ))}
          </div>
        )}
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Feeding
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Feeding</DialogTitle>
            </DialogHeader>
            <Form {...feedingForm}>
              <form onSubmit={feedingForm.handleSubmit((data) => addFeedingMutation.mutate(data))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Feeding Type</Label>
                    <Select onValueChange={(value) => feedingForm.setValue('type', value)} defaultValue="bottle">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bottle">Bottle</SelectItem>
                        <SelectItem value="breastfeeding">Breastfeeding</SelectItem>
                        <SelectItem value="solid">Solid Food</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Time</Label>
                    <Input 
                      type="datetime-local" 
                      {...feedingForm.register('time')}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Amount (ml/oz)</Label>
                    <Input placeholder="120ml" {...feedingForm.register('amount')} />
                  </div>
                  <div>
                    <Label>Duration (min)</Label>
                    <Input placeholder="15" {...feedingForm.register('duration')} />
                  </div>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea placeholder="Any observations..." {...feedingForm.register('notes')} />
                </div>
                <Button type="submit" className="w-full">Save Feeding Record</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// Diaper Tracker Card
function DiaperTrackerCard({ childId }: { childId: number }) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data: allMilestones = [] } = useQuery({
    queryKey: [`/api/children/${childId}/milestones`],
  });
  
  const diaperRecords = allMilestones.filter((m: any) => m.category === 'diaper');
  
  const diaperForm = useForm({
    defaultValues: {
      type: 'wet',
      notes: '',
      time: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
    },
  });

  const addDiaperMutation = useMutation({
    mutationFn: async (data: any) => {
      const diaperTitle = `Diaper change - ${data.type}`;
      const description = `Type: ${data.type}${data.notes ? `, Notes: ${data.notes}` : ''}`;
      
      return apiRequest(`/api/children/${childId}/milestones`, {
        method: "POST",
        body: JSON.stringify({
          title: diaperTitle,
          category: 'diaper',
          date: new Date(data.time),
          description: description,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/children/${childId}/milestones`] });
      toast({
        title: "Success",
        description: "Diaper change recorded successfully!",
      });
      setIsDialogOpen(false);
      diaperForm.reset();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CircleDot className="w-5 h-5 mr-2" />
          Diaper Changes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm mb-4">
          Track diaper changes and patterns.
        </p>
        
        {diaperRecords.length > 0 && (
          <div className="space-y-2 mb-4">
            <h4 className="font-medium text-sm">Recent Changes</h4>
            {diaperRecords.slice(-3).map((record: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-2 bg-muted rounded text-sm">
                <span className="font-medium">{record.title}</span>
                <span className="text-muted-foreground">{safeFormatDate(record.date, 'HH:mm')}</span>
              </div>
            ))}
          </div>
        )}
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Record Change
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Diaper Change</DialogTitle>
            </DialogHeader>
            <Form {...diaperForm}>
              <form onSubmit={diaperForm.handleSubmit((data) => addDiaperMutation.mutate(data))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select onValueChange={(value) => diaperForm.setValue('type', value)} defaultValue="wet">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wet">Wet</SelectItem>
                        <SelectItem value="dirty">Dirty</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                        <SelectItem value="dry">Dry (routine change)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Time</Label>
                    <Input 
                      type="datetime-local" 
                      {...diaperForm.register('time')}
                    />
                  </div>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea placeholder="Any observations about color, texture, etc..." {...diaperForm.register('notes')} />
                </div>
                <Button type="submit" className="w-full">Save Diaper Record</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// Notes Card
function NotesCard({ childId }: { childId: number }) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data: allMilestones = [] } = useQuery({
    queryKey: [`/api/children/${childId}/milestones`],
  });
  
  const notes = allMilestones.filter((m: any) => m.category === 'notes');
  
  const noteForm = useForm({
    defaultValues: {
      title: '',
      content: '',
      date: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/children/${childId}/milestones`, {
        method: "POST",
        body: JSON.stringify({
          title: data.title,
          category: 'notes',
          date: new Date(data.date),
          description: data.content,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/children/${childId}/milestones`] });
      toast({
        title: "Success",
        description: "Note saved successfully!",
      });
      setIsDialogOpen(false);
      noteForm.reset();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <StickyNote className="w-5 h-5 mr-2" />
          Notes & Observations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm mb-4">
          Keep track of important observations and memories.
        </p>
        
        {notes.length > 0 && (
          <div className="space-y-2 mb-4">
            <h4 className="font-medium text-sm">Recent Notes</h4>
            {notes.slice(-3).map((note: any, index: number) => (
              <div key={index} className="p-3 bg-muted rounded">
                <h5 className="font-medium text-sm">{note.title}</h5>
                <p className="text-xs text-muted-foreground mt-1">{note.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{safeFormatDate(note.date)}</p>
              </div>
            ))}
          </div>
        )}
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Note
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Note</DialogTitle>
            </DialogHeader>
            <Form {...noteForm}>
              <form onSubmit={noteForm.handleSubmit((data) => addNoteMutation.mutate(data))} className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input placeholder="Note title..." {...noteForm.register('title')} />
                </div>
                <div>
                  <Label>Date</Label>
                  <Input type="date" {...noteForm.register('date')} />
                </div>
                <div>
                  <Label>Content</Label>
                  <Textarea 
                    placeholder="Write your observations, thoughts, or memories..." 
                    rows={4}
                    {...noteForm.register('content')} 
                  />
                </div>
                <Button type="submit" className="w-full">Save Note</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// Music Preferences Card
function MusicPreferencesCard({ childId }: { childId: number }) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data: allMilestones = [] } = useQuery({
    queryKey: [`/api/children/${childId}/milestones`],
  });
  
  const musicPreferences = allMilestones.filter((m: any) => m.category === 'music');
  
  const musicForm = useForm({
    defaultValues: {
      song: '',
      artist: '',
      reaction: 'loves',
      notes: '',
      date: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const addMusicMutation = useMutation({
    mutationFn: async (data: any) => {
      const musicTitle = `${data.reaction} "${data.song}"${data.artist ? ` by ${data.artist}` : ''}`;
      const description = `Song: ${data.song}, Artist: ${data.artist || 'Unknown'}, Reaction: ${data.reaction}${data.notes ? `, Notes: ${data.notes}` : ''}`;
      
      return apiRequest(`/api/children/${childId}/milestones`, {
        method: "POST",
        body: JSON.stringify({
          title: musicTitle,
          category: 'music',
          date: new Date(data.date),
          description: description,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/children/${childId}/milestones`] });
      toast({
        title: "Success",
        description: "Music preference recorded!",
      });
      setIsDialogOpen(false);
      musicForm.reset();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Music className="w-5 h-5 mr-2" />
          Music Preferences
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm mb-4">
          Track what music your baby enjoys or dislikes.
        </p>
        
        {musicPreferences.length > 0 && (
          <div className="space-y-2 mb-4">
            <h4 className="font-medium text-sm">Music Library</h4>
            {musicPreferences.slice(-3).map((music: any, index: number) => (
              <div key={index} className="p-3 bg-muted rounded">
                <h5 className="font-medium text-sm">{music.title}</h5>
                <p className="text-xs text-muted-foreground mt-1">{safeFormatDate(music.date)}</p>
              </div>
            ))}
          </div>
        )}
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Music
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Music Preference</DialogTitle>
            </DialogHeader>
            <Form {...musicForm}>
              <form onSubmit={musicForm.handleSubmit((data) => addMusicMutation.mutate(data))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Song/Music</Label>
                    <Input placeholder="Song title or type of music..." {...musicForm.register('song')} />
                  </div>
                  <div>
                    <Label>Artist/Source</Label>
                    <Input placeholder="Artist, album, or source..." {...musicForm.register('artist')} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Baby's Reaction</Label>
                    <Select onValueChange={(value) => musicForm.setValue('reaction', value)} defaultValue="loves">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="loves">Loves it</SelectItem>
                        <SelectItem value="likes">Likes it</SelectItem>
                        <SelectItem value="neutral">Neutral</SelectItem>
                        <SelectItem value="dislikes">Dislikes</SelectItem>
                        <SelectItem value="calms">Calms down</SelectItem>
                        <SelectItem value="energizes">Gets excited</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input type="date" {...musicForm.register('date')} />
                  </div>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea placeholder="Describe the baby's reaction..." {...musicForm.register('notes')} />
                </div>
                <Button type="submit" className="w-full">Save Music Preference</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// Health Tracker Card
function HealthTrackerCard({ childId }: { childId: number }) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data: allMilestones = [] } = useQuery({
    queryKey: [`/api/children/${childId}/milestones`],
  });
  
  const healthRecords = allMilestones.filter((m: any) => m.category === 'health');
  
  const healthForm = useForm({
    defaultValues: {
      type: 'checkup',
      title: '',
      symptoms: '',
      treatment: '',
      doctor: '',
      temperature: '',
      notes: '',
      date: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const addHealthMutation = useMutation({
    mutationFn: async (data: any) => {
      const healthTitle = data.title || `${data.type.charAt(0).toUpperCase() + data.type.slice(1)}`;
      const description = `Type: ${data.type}${data.symptoms ? `, Symptoms: ${data.symptoms}` : ''}${data.treatment ? `, Treatment: ${data.treatment}` : ''}${data.doctor ? `, Doctor: ${data.doctor}` : ''}${data.temperature ? `, Temperature: ${data.temperature}` : ''}${data.notes ? `, Notes: ${data.notes}` : ''}`;
      
      return apiRequest(`/api/children/${childId}/milestones`, {
        method: "POST",
        body: JSON.stringify({
          title: healthTitle,
          category: 'health',
          date: new Date(data.date),
          description: description,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/children/${childId}/milestones`] });
      toast({
        title: "Success",
        description: "Health record saved successfully!",
      });
      setIsDialogOpen(false);
      healthForm.reset();
    },
  });

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Stethoscope className="w-5 h-5 mr-2" />
          Health & Illness Tracking
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm mb-4">
          Track health checkups, illnesses, symptoms, and treatments.
        </p>
        
        {healthRecords.length > 0 && (
          <div className="space-y-2 mb-4">
            <h4 className="font-medium text-sm">Recent Health Records</h4>
            {healthRecords.slice(-3).map((record: any, index: number) => (
              <div key={index} className="p-3 bg-muted rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-medium text-sm">{record.title}</h5>
                    <p className="text-xs text-muted-foreground mt-1">{record.description}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{safeFormatDate(record.date)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Health Record
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Record Health Information</DialogTitle>
            </DialogHeader>
            <Form {...healthForm}>
              <form onSubmit={healthForm.handleSubmit((data) => addHealthMutation.mutate(data))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select onValueChange={(value) => healthForm.setValue('type', value)} defaultValue="checkup">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="checkup">Regular Checkup</SelectItem>
                        <SelectItem value="illness">Illness</SelectItem>
                        <SelectItem value="vaccination">Vaccination</SelectItem>
                        <SelectItem value="emergency">Emergency Visit</SelectItem>
                        <SelectItem value="medication">Medication</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input type="date" {...healthForm.register('date')} />
                  </div>
                </div>
                <div>
                  <Label>Title/Condition</Label>
                  <Input placeholder="e.g., Cold, 6-month checkup, First vaccination..." {...healthForm.register('title')} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Symptoms</Label>
                    <Textarea placeholder="Describe any symptoms..." {...healthForm.register('symptoms')} />
                  </div>
                  <div>
                    <Label>Treatment</Label>
                    <Textarea placeholder="Medications, procedures, recommendations..." {...healthForm.register('treatment')} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Doctor/Healthcare Provider</Label>
                    <Input placeholder="Dr. Smith, Pediatrician..." {...healthForm.register('doctor')} />
                  </div>
                  <div>
                    <Label>Temperature (°F/°C)</Label>
                    <Input placeholder="98.6°F or 37°C..." {...healthForm.register('temperature')} />
                  </div>
                </div>
                <div>
                  <Label>Additional Notes</Label>
                  <Textarea 
                    placeholder="Any additional observations, follow-up instructions, etc..." 
                    {...healthForm.register('notes')} 
                  />
                </div>
                <Button type="submit" className="w-full">Save Health Record</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}