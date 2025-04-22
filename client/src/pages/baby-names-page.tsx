import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { AppHeader } from "@/components/app-header";
import { AppTabs } from "@/components/app-tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Pencil, Trash2, Heart, Star, StarHalf } from "lucide-react";

// Define the BabyName type
type BabyName = {
  id: number;
  userId: number;
  childId: number | null;
  name: string;
  meaning: string | null;
  origin: string | null;
  gender: "male" | "female" | "neutral" | null;
  rating: number;
  isFavorite: boolean;
  notes: string | null;
  suggestedBy: string | null;
  createdAt: string;
};

// Create form schema
const babyNameSchema = z.object({
  childId: z.number().nullable(),
  name: z.string().min(1, "Name is required"),
  meaning: z.string().nullable(),
  origin: z.string().nullable(),
  gender: z.enum(["male", "female", "neutral"]).nullable(),
  rating: z.number().min(0).max(5).default(0),
  isFavorite: z.boolean().default(false),
  notes: z.string().nullable(),
  suggestedBy: z.string().nullable()
});

// Create rating component for display
const RatingStars = ({ rating }: { rating: number }) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  for (let i = 0; i < fullStars; i++) {
    stars.push(<Star key={`star-${i}`} className="h-4 w-4 fill-yellow-500 text-yellow-500" />);
  }
  
  if (hasHalfStar) {
    stars.push(<StarHalf key="half-star" className="h-4 w-4 fill-yellow-500 text-yellow-500" />);
  }
  
  const emptyStars = 5 - stars.length;
  for (let i = 0; i < emptyStars; i++) {
    stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-slate-300" />);
  }
  
  return <div className="flex">{stars}</div>;
};

export default function BabyNamesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedChild, setSelectedChild] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentBabyName, setCurrentBabyName] = useState<BabyName | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  // Fetch children
  const { data: children = [] } = useQuery({
    queryKey: ["/api/children"],
    enabled: !!user
  });

  // Fetch baby names
  const { data: babyNames = [], isLoading } = useQuery<BabyName[]>({
    queryKey: ["/api/baby-names", selectedChild],
    queryFn: async () => {
      const url = selectedChild 
        ? `/api/baby-names?childId=${selectedChild}` 
        : "/api/baby-names";
      return apiRequest(url);
    },
    enabled: !!user
  });

  // Create baby name mutation
  const createMutation = useMutation({
    mutationFn: (data: z.infer<typeof babyNameSchema>) => 
      apiRequest("/api/baby-names", { method: "POST", data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/baby-names"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Baby name added successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating baby name:", error);
      toast({
        title: "Error",
        description: "Failed to add baby name",
        variant: "destructive",
      });
    }
  });

  // Update baby name mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<z.infer<typeof babyNameSchema>> }) => 
      apiRequest(`/api/baby-names/${id}`, { method: "PATCH", data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/baby-names"] });
      setIsEditDialogOpen(false);
      toast({
        title: "Success",
        description: "Baby name updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating baby name:", error);
      toast({
        title: "Error",
        description: "Failed to update baby name",
        variant: "destructive",
      });
    }
  });

  // Delete baby name mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/baby-names/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/baby-names"] });
      toast({
        title: "Success",
        description: "Baby name deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting baby name:", error);
      toast({
        title: "Error",
        description: "Failed to delete baby name",
        variant: "destructive",
      });
    }
  });

  // Toggle favorite status
  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ id, isFavorite }: { id: number; isFavorite: boolean }) => 
      apiRequest(`/api/baby-names/${id}`, { 
        method: "PATCH", 
        data: { isFavorite } 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/baby-names"] });
    },
    onError: (error) => {
      console.error("Error updating favorite status:", error);
      toast({
        title: "Error",
        description: "Failed to update favorite status",
        variant: "destructive",
      });
    }
  });

  // Form for creating/editing baby names
  const form = useForm<z.infer<typeof babyNameSchema>>({
    resolver: zodResolver(babyNameSchema),
    defaultValues: {
      childId: null,
      name: "",
      meaning: "",
      origin: "",
      gender: null,
      rating: 0,
      isFavorite: false,
      notes: "",
      suggestedBy: ""
    }
  });

  // Handle form submission for new baby names
  const onSubmit = (data: z.infer<typeof babyNameSchema>) => {
    createMutation.mutate(data);
  };

  // Handle form submission for editing baby names
  const onEditSubmit = (data: z.infer<typeof babyNameSchema>) => {
    if (!currentBabyName) return;
    updateMutation.mutate({ id: currentBabyName.id, data });
  };

  // Handle edit button click
  const handleEdit = (babyName: BabyName) => {
    setCurrentBabyName(babyName);
    form.reset({
      childId: babyName.childId,
      name: babyName.name,
      meaning: babyName.meaning,
      origin: babyName.origin,
      gender: babyName.gender,
      rating: babyName.rating,
      isFavorite: babyName.isFavorite,
      notes: babyName.notes,
      suggestedBy: babyName.suggestedBy
    });
    setIsEditDialogOpen(true);
  };

  // Filter baby names based on active tab
  const filteredBabyNames = babyNames.filter(babyName => {
    if (activeTab === "favorites") return babyName.isFavorite;
    if (activeTab === "male") return babyName.gender === "male";
    if (activeTab === "female") return babyName.gender === "female";
    if (activeTab === "neutral") return babyName.gender === "neutral";
    return true; // "all" tab
  });

  // Reset form when opening create dialog
  const handleOpenCreateDialog = () => {
    form.reset({
      childId: selectedChild,
      name: "",
      meaning: "",
      origin: "",
      gender: null,
      rating: 0,
      isFavorite: false,
      notes: "",
      suggestedBy: ""
    });
    setIsCreateDialogOpen(true);
  };

  // Helper function to render baby names in a grid
  function renderBabyNames(names: BabyName[]) {
    if (isLoading) {
      return <div className="text-center py-8">Loading...</div>;
    }

    if (names.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No baby names found.</p>
          <p className="mt-2">Click "Add Baby Name" to add your first name idea!</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {names.map(babyName => (
          <Card key={babyName.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {babyName.name}
                    {babyName.isFavorite && (
                      <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <RatingStars rating={babyName.rating} />
                    {babyName.gender && (
                      <Badge variant={
                        babyName.gender === "male" ? "default" : 
                        babyName.gender === "female" ? "secondary" : "outline"
                      }>
                        {babyName.gender === "male" ? "Boy" : 
                         babyName.gender === "female" ? "Girl" : "Neutral"}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => toggleFavoriteMutation.mutate({ 
                      id: babyName.id, 
                      isFavorite: !babyName.isFavorite 
                    })}
                    title={babyName.isFavorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Heart className={`h-4 w-4 ${babyName.isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleEdit(babyName)}
                    title="Edit name"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this name?")) {
                        deleteMutation.mutate(babyName.id);
                      }
                    }}
                    title="Delete name"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="py-2">
              {(babyName.meaning || babyName.origin) && (
                <div className="mb-2">
                  {babyName.meaning && (
                    <p className="text-sm">
                      <span className="font-semibold">Meaning:</span> {babyName.meaning}
                    </p>
                  )}
                  {babyName.origin && (
                    <p className="text-sm">
                      <span className="font-semibold">Origin:</span> {babyName.origin}
                    </p>
                  )}
                </div>
              )}
              {babyName.notes && (
                <div className="mt-2">
                  <p className="text-sm">{babyName.notes}</p>
                </div>
              )}
            </CardContent>
            {babyName.suggestedBy && (
              <CardFooter className="pt-2 pb-3 border-t text-xs text-gray-500">
                Suggested by: {babyName.suggestedBy}
              </CardFooter>
            )}
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="container py-8">
      <AppHeader />
      <AppTabs activeTab="extras" />
      
      <div className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
          <h1 className="text-2xl font-bold">Baby Name Ideas</h1>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={selectedChild?.toString() || "all"} onValueChange={(val) => setSelectedChild(val !== "all" ? parseInt(val) : null)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All names" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All names</SelectItem>
                {children.map((child: any) => (
                  <SelectItem key={child.id} value={child.id.toString()}>
                    {child.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleOpenCreateDialog}>Add Baby Name</Button>
          </div>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="male">Boys</TabsTrigger>
            <TabsTrigger value="female">Girls</TabsTrigger>
            <TabsTrigger value="neutral">Neutral</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            {renderBabyNames(filteredBabyNames)}
          </TabsContent>
          <TabsContent value="favorites" className="mt-4">
            {renderBabyNames(filteredBabyNames)}
          </TabsContent>
          <TabsContent value="male" className="mt-4">
            {renderBabyNames(filteredBabyNames)}
          </TabsContent>
          <TabsContent value="female" className="mt-4">
            {renderBabyNames(filteredBabyNames)}
          </TabsContent>
          <TabsContent value="neutral" className="mt-4">
            {renderBabyNames(filteredBabyNames)}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Baby Name</DialogTitle>
            <DialogDescription>
              Add a new baby name to your collection
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="childId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>For child (optional)</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : null)} 
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a child (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No specific child</SelectItem>
                        {children.map((child: any) => (
                          <SelectItem key={child.id} value={child.id.toString()}>
                            {child.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="meaning"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meaning</FormLabel>
                      <FormControl>
                        <Input placeholder="Name meaning" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="origin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Origin</FormLabel>
                      <FormControl>
                        <Input placeholder="Name origin" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={field.onChange} 
                        value={field.value || ""} 
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="male" />
                          </FormControl>
                          <FormLabel className="font-normal">Boy</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="female" />
                          </FormControl>
                          <FormLabel className="font-normal">Girl</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="neutral" />
                          </FormControl>
                          <FormLabel className="font-normal">Neutral</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rating (0-5)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="5" 
                        step="1" 
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isFavorite"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4"
                      />
                    </FormControl>
                    <FormLabel>Mark as favorite</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="suggestedBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Suggested By</FormLabel>
                    <FormControl>
                      <Input placeholder="Who suggested this name?" {...field} value={field.value || ""} />
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
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional notes" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Saving..." : "Save Name"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Baby Name</DialogTitle>
            <DialogDescription>
              Update the baby name details
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="childId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>For child (optional)</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : null)} 
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a child (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No specific child</SelectItem>
                        {children.map((child: any) => (
                          <SelectItem key={child.id} value={child.id.toString()}>
                            {child.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="meaning"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meaning</FormLabel>
                      <FormControl>
                        <Input placeholder="Name meaning" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="origin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Origin</FormLabel>
                      <FormControl>
                        <Input placeholder="Name origin" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={field.onChange} 
                        value={field.value || ""} 
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="male" />
                          </FormControl>
                          <FormLabel className="font-normal">Boy</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="female" />
                          </FormControl>
                          <FormLabel className="font-normal">Girl</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="neutral" />
                          </FormControl>
                          <FormLabel className="font-normal">Neutral</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rating (0-5)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="5" 
                        step="1" 
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isFavorite"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4"
                      />
                    </FormControl>
                    <FormLabel>Mark as favorite</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="suggestedBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Suggested By</FormLabel>
                    <FormControl>
                      <Input placeholder="Who suggested this name?" {...field} value={field.value || ""} />
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
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional notes" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Updating..." : "Update Name"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );

  // Helper function to render baby names in a grid
  function renderBabyNames(names: BabyName[]) {
    if (isLoading) {
      return <div className="text-center py-8">Loading...</div>;
    }

    if (names.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No baby names found.</p>
          <p className="mt-2">Click "Add Baby Name" to add your first name idea!</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {names.map(babyName => (
          <Card key={babyName.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {babyName.name}
                    {babyName.isFavorite && (
                      <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <RatingStars rating={babyName.rating} />
                    {babyName.gender && (
                      <Badge variant={
                        babyName.gender === "male" ? "default" : 
                        babyName.gender === "female" ? "secondary" : "outline"
                      }>
                        {babyName.gender === "male" ? "Boy" : 
                         babyName.gender === "female" ? "Girl" : "Neutral"}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => toggleFavoriteMutation.mutate({ 
                      id: babyName.id, 
                      isFavorite: !babyName.isFavorite 
                    })}
                    title={babyName.isFavorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Heart className={`h-4 w-4 ${babyName.isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleEdit(babyName)}
                    title="Edit name"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this name?")) {
                        deleteMutation.mutate(babyName.id);
                      }
                    }}
                    title="Delete name"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="py-2">
              {(babyName.meaning || babyName.origin) && (
                <div className="mb-2">
                  {babyName.meaning && (
                    <p className="text-sm">
                      <span className="font-semibold">Meaning:</span> {babyName.meaning}
                    </p>
                  )}
                  {babyName.origin && (
                    <p className="text-sm">
                      <span className="font-semibold">Origin:</span> {babyName.origin}
                    </p>
                  )}
                </div>
              )}
              {babyName.notes && (
                <div className="mt-2">
                  <p className="text-sm">{babyName.notes}</p>
                </div>
              )}
            </CardContent>
            {babyName.suggestedBy && (
              <CardFooter className="pt-2 pb-3 border-t text-xs text-gray-500">
                Suggested by: {babyName.suggestedBy}
              </CardFooter>
            )}
          </Card>
        ))}
      </div>
    );
  }
}