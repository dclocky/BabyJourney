import { useState, useRef } from "react";
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
import { Child, Milestone, InsertMilestone } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Loader2, Heart, Award, Baby, Star, Calendar, Image, PlusCircle } from "lucide-react";

export default function MilestonesPage() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { data: children = [], isLoading: isLoadingChildren } = useQuery<Child[]>({
    queryKey: ["/api/children"],
  });

  // Set the first child as selected by default if none is selected
  if (children.length > 0 && selectedChild === null) {
    setSelectedChild(children[0].id);
  }

  const { data: milestones = [], isLoading: isLoadingMilestones } = useQuery<Milestone[]>({
    queryKey: ["/api/children", selectedChild, "milestones"],
    enabled: selectedChild !== null,
  });

  // Group milestones by category
  const milestonesByCategory: Record<string, Milestone[]> = {};

  if (milestones.length > 0) {
    milestones.forEach(milestone => {
      if (!milestonesByCategory[milestone.category]) {
        milestonesByCategory[milestone.category] = [];
      }
      milestonesByCategory[milestone.category].push(milestone);
    });
  }

  // Sort milestones by date (newest first)
  Object.keys(milestonesByCategory).forEach(category => {
    milestonesByCategory[category].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  });

  const milestoneSchema = z.object({
    childId: z.number(),
    title: z.string().min(1, "Title is required"),
    date: z.string().refine(date => !isNaN(Date.parse(date)), {
      message: "Please enter a valid date",
    }),
    description: z.string().optional(),
    category: z.enum(["pregnancy", "birth", "first", "growth", "health", "other"]),
  });

  const form = useForm<z.infer<typeof milestoneSchema>>({
    resolver: zodResolver(milestoneSchema),
    defaultValues: {
      childId: selectedChild || 0,
      title: "",
      date: format(new Date(), "yyyy-MM-dd"),
      description: "",
      category: "first",
    },
  });

  // Update form when selected child changes
  if (form.getValues("childId") !== selectedChild && selectedChild !== null) {
    form.setValue("childId", selectedChild);
  }

  const addMilestoneMutation = useMutation({
    mutationFn: async (data: z.infer<typeof milestoneSchema>) => {
      const newMilestone: InsertMilestone = {
        childId: data.childId,
        userId: 0, // Will be set by server based on authenticated user
        title: data.title,
        date: new Date(data.date),
        description: data.description || "",
        category: data.category,
      };
      const res = await apiRequest("POST", `/api/children/${data.childId}/milestones`, newMilestone);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/children", selectedChild, "milestones"] });
      toast({
        title: "Milestone added",
        description: "Your baby's milestone has been saved!",
      });
      form.reset({
        childId: selectedChild || 0,
        title: "",
        date: format(new Date(), "yyyy-MM-dd"),
        description: "",
        category: "first",
      });
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to add milestone",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  // Function to reset the image selection
  const clearImageSelection = () => {
    setSelectedImage(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  // Updated function to handle milestone submission with image upload
  function onAddMilestone(data: z.infer<typeof milestoneSchema>) {
    if (selectedChild === null) {
      toast({
        title: "Error",
        description: "Please select a child first",
        variant: "destructive",
      });
      return;
    }

    // If there's an image, we need to use FormData to submit
    if (selectedImage) {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('date', data.date);
      formData.append('description', data.description || '');
      formData.append('category', data.category);
      formData.append('image', selectedImage);
      
      // Custom fetch to handle file upload
      fetch(`/api/children/${data.childId}/milestones`, {
        method: 'POST',
        body: formData,
      })
      .then(res => {
        if (!res.ok) throw new Error('Failed to save milestone');
        return res.json();
      })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/children", selectedChild, "milestones"] });
        toast({
          title: "Milestone added",
          description: "Your baby's milestone has been saved with the image!",
        });
        form.reset({
          childId: selectedChild,
          title: "",
          date: format(new Date(), "yyyy-MM-dd"),
          description: "",
          category: "first",
        });
        clearImageSelection();
        setIsAddDialogOpen(false);
      })
      .catch(error => {
        toast({
          title: "Failed to add milestone",
          description: error.message,
          variant: "destructive",
        });
      });
    } else {
      // Use the standard mutation without an image
      addMilestoneMutation.mutate(data);
    }
  }

  // Function to get icon for milestone category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "pregnancy":
        return <Heart className="h-5 w-5" />;
      case "birth":
        return <Baby className="h-5 w-5" />;
      case "first":
        return <Star className="h-5 w-5" />;
      case "growth":
        return <Award className="h-5 w-5" />;
      case "health":
        return <Heart className="h-5 w-5" />;
      default:
        return <Calendar className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-secondary-50">
      <AppHeader />
      <AppTabs />

      <main className="flex-grow container mx-auto px-4 py-6 pb-20 md:pb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Milestones</h1>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Milestone
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record a New Milestone</DialogTitle>
                <DialogDescription>
                  Capture your baby's special moments and achievements.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onAddMilestone)} className="space-y-4">
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
                        <FormLabel>Milestone Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., First Smile, Started Crawling" {...field} />
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
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                          >
                            <option value="pregnancy">Pregnancy</option>
                            <option value="birth">Birth</option>
                            <option value="first">First (words, steps, etc.)</option>
                            <option value="growth">Growth & Development</option>
                            <option value="health">Health & Medical</option>
                            <option value="other">Other</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <textarea 
                            className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Describe this milestone moment"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Image upload field */}
                  <div>
                    <Label htmlFor="image">Image (Optional)</Label>
                    <div className="mt-1 flex flex-col gap-2">
                      <Input
                        id="image"
                        type="file"
                        ref={imageInputRef}
                        accept="image/*"
                        onChange={handleImageSelect}
                      />
                      {selectedImage && (
                        <div className="flex flex-col gap-2">
                          <div className="relative h-32 w-32 overflow-hidden rounded-md">
                            <img
                              src={URL.createObjectURL(selectedImage)}
                              alt="Selected image preview"
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={clearImageSelection}
                            className="w-32"
                          >
                            Remove Image
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Add a photo of this milestone moment (max 5MB)
                    </p>
                  </div>

                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={addMilestoneMutation.isPending}
                    >
                      {addMilestoneMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Milestone"
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
            <Label className="mb-2 block">Select child:</Label>
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

        {isLoadingChildren || isLoadingMilestones ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : selectedChild === null ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h2 className="text-xl font-bold mb-4">No Child Profiles Found</h2>
            <p className="text-muted-foreground mb-6">
              Add a child profile to start tracking milestones.
            </p>
            <Button>Add Child Profile</Button>
          </div>
        ) : Object.keys(milestonesByCategory).length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h2 className="text-xl font-bold mb-4">No Milestones Recorded Yet</h2>
            <p className="text-muted-foreground mb-6">
              Start recording your baby's special moments and achievements.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add First Milestone
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(milestonesByCategory).map(category => (
              <Card key={category}>
                <CardHeader>
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-500 flex items-center justify-center mr-3">
                      {getCategoryIcon(category)}
                    </div>
                    <CardTitle className="capitalize">
                      {category === "first" ? "First Moments" : 
                       category === "health" ? "Health Milestones" :
                       `${category.charAt(0).toUpperCase()}${category.slice(1)} Milestones`}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {milestonesByCategory[category].map(milestone => (
                      <div key={milestone.id} className="flex border rounded-md p-4">
                        <div className="flex flex-col items-center mr-4">
                          <div className="text-sm font-medium text-center bg-primary-50 text-primary-500 rounded-md px-2 py-1 whitespace-nowrap">
                            {milestone.date ? format(new Date(milestone.date), "MMM d") : ""}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {milestone.date ? format(new Date(milestone.date), "yyyy") : ""}
                          </div>
                        </div>
                        <div className="flex-grow">
                          <h3 className="font-medium text-lg">{milestone.title}</h3>
                          {milestone.description && (
                            <p className="text-muted-foreground mt-1">{milestone.description}</p>
                          )}
                          {milestone.imageData && milestone.imageType && (
                            <div className="mt-3">
                              <img 
                                src={`data:${milestone.imageType};base64,${milestone.imageData}`} 
                                alt={milestone.title}
                                className="rounded-md max-h-36 object-cover" 
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add New Milestone button at the bottom */}
        <div className="mt-8 text-center">
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Milestone
          </Button>
        </div>
      </main>

      <AppFooter />
      <MobileNav />
    </div>
  );
}