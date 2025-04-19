import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { AppTabs } from "@/components/app-tabs";
import { MobileNav } from "@/components/mobile-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Child, Photo, InsertPhoto } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { Loader2, Upload, ImagePlus, Tag, Calendar, MoreVertical, Download, Trash, Lock, PlusCircle, Trophy } from "lucide-react";
import { PremiumBadge } from "@/components/premium-badge";

export default function MemoriesPage() {
  const { toast } = useToast();
  const { user, createPaymentIntentMutation, confirmPremiumUpgradeMutation } = useAuth();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState<number | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: children = [], isLoading: isLoadingChildren } = useQuery<Child[]>({
    queryKey: ["/api/children"],
  });

  // Set the first child as selected by default if none is selected
  if (children.length > 0 && selectedChild === null) {
    setSelectedChild(children[0].id);
  }

  const { data: photos = [], isLoading: isLoadingPhotos } = useQuery<Photo[]>({
    queryKey: ["/api/children", selectedChild, "photos"],
    enabled: selectedChild !== null,
  });

  const { data: countData } = useQuery({
    queryKey: ["/api/children", selectedChild, "photos/count"],
    enabled: !!selectedChild,
  });
  
  const photoCount = countData?.count || 0;
  const maxPhotos = user?.isPremium ? Infinity : 5;
  const remainingUploads = Math.max(0, maxPhotos - photoCount);
  const canUploadMore = user?.isPremium || remainingUploads > 0;

  // Check if premium features are available
  const isPremium = user?.isPremium || false;

  // If not premium, show the premium required message
  if (!isPremium) {
    return (
      <div className="min-h-screen flex flex-col bg-secondary-50">
        <AppHeader />
        <AppTabs />
        
        <main className="flex-grow container mx-auto px-4 py-6 pb-20 md:pb-6">
          <div className="max-w-3xl mx-auto text-center py-12">
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="w-16 h-16 bg-accent-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="h-8 w-8 text-accent-500" />
              </div>
              
              <h1 className="text-2xl font-bold mb-4">Premium Feature</h1>
              
              <p className="text-muted-foreground mb-8">
                The Memories feature is available exclusively to Premium users. Upgrade your account to unlock:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-secondary-50 p-4 rounded-md">
                  <ImagePlus className="h-8 w-8 text-accent-500 mb-2" />
                  <h3 className="font-medium mb-1">Unlimited Photo Uploads</h3>
                  <p className="text-sm text-muted-foreground">
                    Store as many precious memories as you'd like
                  </p>
                </div>
                
                <div className="bg-secondary-50 p-4 rounded-md">
                  <Tag className="h-8 w-8 text-accent-500 mb-2" />
                  <h3 className="font-medium mb-1">Photo Tagging</h3>
                  <p className="text-sm text-muted-foreground">
                    Organize photos by events and themes
                  </p>
                </div>
                
                <div className="bg-secondary-50 p-4 rounded-md">
                  <Trophy className="h-8 w-8 text-accent-500 mb-2" />
                  <h3 className="font-medium mb-1">Monthly Highlights</h3>
                  <p className="text-sm text-muted-foreground">
                    Auto-generated summary of your month's memories
                  </p>
                </div>
                
                <div className="bg-secondary-50 p-4 rounded-md">
                  <Download className="h-8 w-8 text-accent-500 mb-2" />
                  <h3 className="font-medium mb-1">Downloadable Baby Book</h3>
                  <p className="text-sm text-muted-foreground">
                    Export your journey as a beautiful PDF
                  </p>
                </div>
              </div>
              
              <Button 
                className="bg-accent-500 hover:bg-accent-600"
                onClick={async () => {
                  try {
                    console.log("Creating payment intent...");
                    const result = await createPaymentIntentMutation.mutateAsync();
                    console.log("Payment intent created:", result);
                    // In a real implementation, we'd use Stripe Elements
                    // For now we'll just use the dialog payment flow
                    const paymentIntentId = result.clientSecret.split('_')[1];
                    console.log("Payment intent ID:", paymentIntentId);
                    confirmPremiumUpgradeMutation.mutate(paymentIntentId);
                  } catch (error) {
                    console.error("Failed to process payment", error);
                    toast({
                      title: "Payment failed",
                      description: "There was an error processing your payment. Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
                disabled={createPaymentIntentMutation.isPending || confirmPremiumUpgradeMutation.isPending}
              >
                {createPaymentIntentMutation.isPending || confirmPremiumUpgradeMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Upgrade to Premium for $9.99/month"
                )}
              </Button>
            </div>
          </div>
        </main>
        
        <AppFooter />
        <MobileNav />
      </div>
    );
  }

  // Extract all unique tags from photos
  const allTags = new Set<string>();
  photos.forEach(photo => {
    if (Array.isArray(photo.tags)) {
      photo.tags.forEach(tag => allTags.add(tag as string));
    }
  });
  
  // Filter photos by tag if a tag is selected
  const filteredPhotos = activeTag
    ? photos.filter(photo => 
        Array.isArray(photo.tags) && photo.tags.includes(activeTag)
      )
    : photos;
  
  // Sort photos by date (newest first)
  const sortedPhotos = [...filteredPhotos].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Form schema for uploading photos
  const photoUploadSchema = z.object({
    childId: z.number(),
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    takenAt: z.string().refine(date => !isNaN(Date.parse(date)), {
      message: "Please enter a valid date",
    }),
    tags: z.string().optional(),
    photo: z.instanceof(File, { message: "Please select a photo to upload" }),
  });

  const form = useForm<z.infer<typeof photoUploadSchema>>({
    resolver: zodResolver(photoUploadSchema),
    defaultValues: {
      childId: selectedChild || 0,
      title: "",
      description: "",
      takenAt: format(new Date(), "yyyy-MM-dd"),
      tags: "",
    },
  });

  // Update form when selected child changes
  if (form.getValues("childId") !== selectedChild && selectedChild !== null) {
    form.setValue("childId", selectedChild);
  }

  const uploadPhotoMutation = useMutation({
    mutationFn: async (data: z.infer<typeof photoUploadSchema>) => {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description || "");
      formData.append("takenAt", data.takenAt);
      
      // Parse tags as comma-separated list
      if (data.tags) {
        const tagsArray = data.tags.split(",").map(tag => tag.trim());
        formData.append("tags", JSON.stringify(tagsArray));
      }
      
      formData.append("photo", data.photo);
      
      const res = await fetch(`/api/children/${data.childId}/photos`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/children", selectedChild, "photos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/children", selectedChild, "photos/count"] });
      toast({
        title: "Photo uploaded",
        description: "Your memory has been saved!",
      });
      form.reset({
        childId: selectedChild || 0,
        title: "",
        description: "",
        takenAt: format(new Date(), "yyyy-MM-dd"),
        tags: "",
      });
      setIsUploadDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to upload photo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("photo", file);
    }
  };

  function onUploadPhoto(data: z.infer<typeof photoUploadSchema>) {
    uploadPhotoMutation.mutate(data);
  }

  return (
    <div className="min-h-screen flex flex-col bg-secondary-50">
      <AppHeader />
      <AppTabs />
      
      <main className="flex-grow container mx-auto px-4 py-6 pb-20 md:pb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">Photo Memories</h1>
            <p className="text-muted-foreground">Capture and organize your precious moments</p>
          </div>
          
          <div className="flex gap-2">
            {isPremium && (
              <Button 
                variant="outline"
                className="hidden md:flex"
              >
                <Download className="mr-2 h-4 w-4" />
                Export Baby Book
              </Button>
            )}
            
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={!canUploadMore}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Memory
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload a New Memory</DialogTitle>
                  <DialogDescription>
                    Add a photo to preserve this precious moment.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onUploadPhoto)} className="space-y-4">
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
                      name="photo"
                      render={({ field: { value, onChange, ...fieldProps } }) => (
                        <FormItem>
                          <FormLabel>Photo</FormLabel>
                          <FormControl>
                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-primary-200 rounded-md p-6 bg-primary-50">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={(e) => {
                                  handleFileChange(e);
                                }}
                              />
                              {form.getValues("photo") ? (
                                <div className="text-center">
                                  <p className="text-sm font-medium mb-2">
                                    Selected: {form.getValues("photo").name}
                                  </p>
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                  >
                                    Change Photo
                                  </Button>
                                </div>
                              ) : (
                                <div className="text-center">
                                  <ImagePlus className="mx-auto h-12 w-12 text-primary-300 mb-2" />
                                  <p className="text-sm text-muted-foreground mb-4">
                                    Click to select a photo to upload
                                  </p>
                                  <Button 
                                    type="button" 
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                  >
                                    Select Photo
                                  </Button>
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Give this memory a title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="takenAt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date Taken</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="tags"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tags (comma separated)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g. Birthday, Christmas, First Steps" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Separate multiple tags with commas
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <textarea 
                              className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="Share the story behind this photo"
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
                        disabled={uploadPhotoMutation.isPending || !form.getValues("photo")}
                      >
                        {uploadPhotoMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          "Upload Memory"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
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
        
        {isLoadingChildren || isLoadingPhotos ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : selectedChild === null ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h2 className="text-xl font-bold mb-4">No Child Profiles Found</h2>
            <p className="text-muted-foreground mb-6">
              Add a child profile to start storing memories.
            </p>
            <Button>Add Child Profile</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tags filter bar */}
            {allTags.size > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="text-sm font-medium mr-2">Filter by tag:</span>
                  <Badge 
                    variant={activeTag === null ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setActiveTag(null)}
                  >
                    All
                  </Badge>
                  {Array.from(allTags).map(tag => (
                    <Badge 
                      key={tag} 
                      variant={activeTag === tag ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setActiveTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Photo grid */}
            {sortedPhotos.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ImagePlus className="h-8 w-8 text-primary-500" />
                </div>
                <h2 className="text-xl font-bold mb-4">No Photos Yet</h2>
                <p className="text-muted-foreground mb-6">
                  {activeTag
                    ? `No photos found with the tag "${activeTag}"`
                    : "Start capturing memories by uploading your first photo."}
                </p>
                {activeTag ? (
                  <Button onClick={() => setActiveTag(null)}>
                    Show All Photos
                  </Button>
                ) : (
                  <Button onClick={() => setIsUploadDialogOpen(true)} disabled={!canUploadMore}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload First Memory
                  </Button>
                )}
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {sortedPhotos.map(photo => (
                    <PhotoCard key={photo.id} photo={photo} />
                  ))}
                </div>
                
                {!isPremium && (
                  <div className="mt-6 bg-white rounded-lg shadow-sm p-6 text-center">
                    <p className="text-muted-foreground mb-4">
                      Free plan: {remainingUploads} of 5 photos used
                    </p>
                    <Button 
                      className="bg-accent-500 hover:bg-accent-600"
                      onClick={() => user?.upgradeToPremiumMutation.mutate()}
                      disabled={user?.upgradeToPremiumMutation.isPending}
                    >
                      <PremiumBadge className="mr-2" />
                      Upgrade for unlimited photos
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {/* Monthly Highlights (Premium feature) */}
            {isPremium && (
              <Card className="mt-8">
                <CardHeader>
                  <div className="flex items-center">
                    <Trophy className="h-5 w-5 mr-2 text-primary-500" />
                    <CardTitle>Monthly Highlights</CardTitle>
                  </div>
                  <CardDescription>
                    Automatically generated summary of your month's best moments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="april">
                    <TabsList className="mb-4">
                      <TabsTrigger value="april">April 2023</TabsTrigger>
                      <TabsTrigger value="march">March 2023</TabsTrigger>
                      <TabsTrigger value="february">February 2023</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="april" className="space-y-4">
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">
                          Highlight reel for April will be generated at the end of the month
                        </p>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="march" className="space-y-4">
                      <div className="bg-primary-50 p-6 rounded-lg">
                        <h3 className="text-lg font-bold mb-3">March 2023 Highlights</h3>
                        <p className="mb-4">
                          A beautiful month of growth and discovery for your little one!
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {[1, 2, 3, 4].map(i => (
                            <div key={i} className="aspect-square bg-white rounded-md flex items-center justify-center">
                              <span className="text-xs text-gray-400">Photo {i}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 flex justify-center">
                          <Button>View Full Highlight Reel</Button>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="february" className="space-y-4">
                      <div className="bg-primary-50 p-6 rounded-lg">
                        <h3 className="text-lg font-bold mb-3">February 2023 Highlights</h3>
                        <p className="mb-4">
                          A month of many firsts and special family moments!
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {[1, 2, 3, 4].map(i => (
                            <div key={i} className="aspect-square bg-white rounded-md flex items-center justify-center">
                              <span className="text-xs text-gray-400">Photo {i}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 flex justify-center">
                          <Button>View Full Highlight Reel</Button>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
      
      <AppFooter />
      <MobileNav />
    </div>
  );
}

interface PhotoCardProps {
  photo: Photo;
}

function PhotoCard({ photo }: PhotoCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="aspect-square bg-gray-100 relative">
        <div className="flex items-center justify-center w-full h-full">
          <span className="text-xs text-gray-400">Photo</span>
        </div>
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/80 rounded-full">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="cursor-pointer">
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-medium truncate">{photo.title}</h3>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          <Calendar className="h-3 w-3 mr-1" />
          <span>
            {photo.takenAt 
              ? format(new Date(photo.takenAt), 'MMM d, yyyy')
              : format(new Date(photo.createdAt), 'MMM d, yyyy')
            }
          </span>
        </div>
        {photo.description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {photo.description}
          </p>
        )}
        {Array.isArray(photo.tags) && photo.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {photo.tags.map((tag, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {tag as string}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
