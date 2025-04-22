import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useParams, Link, useLocation } from "wouter";
import { useState } from "react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Loader2, Copy, ShoppingBag, Plus, Gift, ExternalLink, Trash } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AppHeader } from "@/components/app-header";
import { AppTabs } from "@/components/app-tabs";

// Define form schemas
const registryFormSchema = z.object({
  childId: z.string().optional(),
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
});

const registryItemFormSchema = z.object({
  name: z.string().min(2, "Item name is required"),
  description: z.string().optional(),
  url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  category: z.string().min(1, "Category is required"),
  priority: z.enum(["high", "medium", "low"]),
  price: z.string().optional(),
  quantity: z.string().transform(val => parseInt(val) || 1),
});

type RegistryFormValues = z.infer<typeof registryFormSchema>;
type RegistryItemFormValues = z.infer<typeof registryItemFormSchema>;

export default function RegistryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const { id: registryId } = useParams();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>("");
  
  // Get user's children for the registry form
  const { data: children, isLoading: childrenLoading } = useQuery({
    queryKey: ["/api/children"],
    enabled: createDialogOpen,
  });
  
  // Get user's registries
  const { 
    data: registries, 
    isLoading: registriesLoading,
    isError: registriesError
  } = useQuery({
    queryKey: ["/api/registries"],
  });
  
  // Get specific registry if ID is provided
  const {
    data: registry,
    isLoading: registryLoading,
    isError: registryError
  } = useQuery({
    queryKey: ["/api/registries", registryId],
    enabled: !!registryId,
  });
  
  // Get registry items if registry ID is provided
  const {
    data: registryItems = [],
    isLoading: itemsLoading,
    isError: itemsError
  } = useQuery<any[]>({
    queryKey: ["/api/registries", registryId, "items"],
    enabled: !!registryId,
  });
  
  // Create registry form
  const registryForm = useForm<RegistryFormValues>({
    resolver: zodResolver(registryFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });
  
  // Add registry item form
  const itemForm = useForm<RegistryItemFormValues>({
    resolver: zodResolver(registryItemFormSchema),
    defaultValues: {
      name: "",
      description: "",
      url: "",
      category: "essentials",
      priority: "medium",
      quantity: "1",
      price: "0.00", // Add price field with default value
    },
  });
  
  // Create registry mutation
  const createRegistryMutation = useMutation({
    mutationFn: async (data: RegistryFormValues) => {
      // Only include childId if it's provided
      const payload = {
        name: data.name, // Use name field as expected by the server
        description: data.description,
        childId: data.childId ? parseInt(data.childId) : undefined,
      };
      const response = await apiRequest("POST", "/api/registries", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/registries"] });
      toast({
        title: "Registry created",
        description: "Your registry has been created successfully",
      });
      setCreateDialogOpen(false);
      registryForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to create registry",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Add registry item mutation
  const addItemMutation = useMutation({
    mutationFn: async (data: RegistryItemFormValues) => {
      const response = await apiRequest("POST", "/api/registry-items", {
        name: data.name, // Server expects name, not title
        description: data.description,
        url: data.url,
        category: data.category,
        priority: data.priority,
        quantity: data.quantity,
        price: data.price,
        registryId: parseInt(registryId as string),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/registries", registryId, "items"] });
      toast({
        title: "Item added",
        description: "The item has been added to your registry",
      });
      setAddItemDialogOpen(false);
      itemForm.reset({
        name: "",
        description: "",
        url: "",
        category: "essentials",
        priority: "medium",
        quantity: "1",
        price: "0.00", // Added price field
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add item",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete registry item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const response = await apiRequest("DELETE", `/api/registry-items/${itemId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/registries", registryId, "items"] });
      toast({
        title: "Item deleted",
        description: "The item has been removed from your registry",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete registry mutation
  const deleteRegistryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/registries/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/registries"] });
      toast({
        title: "Registry deleted",
        description: "Your registry has been deleted",
      });
      navigate("/registry");
    },
    onError: (error) => {
      toast({
        title: "Failed to delete registry",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle registry form submission
  const onRegistrySubmit = (data: RegistryFormValues) => {
    createRegistryMutation.mutate(data);
  };
  
  // Handle registry item form submission
  const onItemSubmit = (data: RegistryItemFormValues) => {
    addItemMutation.mutate(data);
  };
  
  // Generate share link for registry
  const generateShareLink = () => {
    if (!registry) return;
    
    const baseUrl = window.location.origin;
    const shareLink = `${baseUrl}/registry/share/${registry.shareCode}`;
    setShareUrl(shareLink);
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareLink).then(() => {
      toast({
        title: "Link copied",
        description: "Share link has been copied to clipboard",
      });
    }).catch(err => {
      console.error("Failed to copy:", err);
    });
  };
  
  // Format status with color coding
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge variant="outline">Available</Badge>;
      case "reserved":
        return <Badge variant="secondary">Reserved</Badge>;
      case "purchased":
        return <Badge variant="success">Purchased</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Helper function to render priority
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High</Badge>;
      case "medium":
        return <Badge variant="default">Medium</Badge>;
      case "low":
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };
  
  // If we're on a specific registry page, show the registry details and items
  if (registryId) {
    return (
      <div className="container py-8">
        <AppHeader />
        <AppTabs activeTab="registry" />
        
        <div className="my-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">
              {registryLoading ? "Loading..." : registry?.name || "Registry"}
            </h1>
            {registry && (
              <p className="text-muted-foreground mt-1">{registry.description}</p>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={generateShareLink}>
              <Copy className="mr-2 h-4 w-4" />
              Share Registry
            </Button>
            <Dialog open={addItemDialogOpen} onOpenChange={setAddItemDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Registry Item</DialogTitle>
                  <DialogDescription>
                    Add a new item to your registry. Family and friends will be able to mark items as reserved or purchased.
                  </DialogDescription>
                </DialogHeader>
                <Form {...itemForm}>
                  <form onSubmit={itemForm.handleSubmit(onItemSubmit)} className="space-y-4">
                    <FormField
                      control={itemForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Baby crib" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={itemForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Provide any details about the item" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={itemForm.control}
                      name="url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product URL (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://example.com/product" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Link to where the item can be purchased
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={itemForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="essentials">Essentials</SelectItem>
                                <SelectItem value="clothing">Clothing</SelectItem>
                                <SelectItem value="toys">Toys</SelectItem>
                                <SelectItem value="feeding">Feeding</SelectItem>
                                <SelectItem value="nursery">Nursery</SelectItem>
                                <SelectItem value="healthcare">Healthcare</SelectItem>
                                <SelectItem value="travel">Travel</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={itemForm.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={itemForm.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="29.99" 
                                {...field} 
                                type="number"
                                step="0.01"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={itemForm.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number"
                                min="1"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        disabled={addItemMutation.isPending}
                      >
                        {addItemMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Add Item
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {shareUrl && (
          <Alert className="my-4">
            <Copy className="h-4 w-4" />
            <AlertTitle>Share your registry</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <div className="truncate flex-1 mr-2">{shareUrl}</div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  toast({
                    title: "Link copied",
                    description: "Share link has been copied to clipboard",
                  });
                }}
              >
                Copy Link
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {registryError && (
          <Alert variant="destructive" className="my-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              There was an error loading the registry. Please try again.
            </AlertDescription>
          </Alert>
        )}
        
        {registryLoading ? (
          <div className="flex justify-center my-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <Tabs defaultValue="all" className="my-6">
              <TabsList>
                <TabsTrigger value="all">All Items</TabsTrigger>
                <TabsTrigger value="available">Available</TabsTrigger>
                <TabsTrigger value="reserved">Reserved</TabsTrigger>
                <TabsTrigger value="purchased">Purchased</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                <ItemsTable 
                  items={registryItems} 
                  isLoading={itemsLoading} 
                  onDelete={(id) => deleteItemMutation.mutate(id)}
                  isDeleting={deleteItemMutation.isPending}
                />
              </TabsContent>
              
              <TabsContent value="available">
                <ItemsTable 
                  items={registryItems.filter(item => item.status === "available")} 
                  isLoading={itemsLoading} 
                  onDelete={(id) => deleteItemMutation.mutate(id)}
                  isDeleting={deleteItemMutation.isPending}
                />
              </TabsContent>
              
              <TabsContent value="reserved">
                <ItemsTable 
                  items={registryItems.filter(item => item.status === "reserved")} 
                  isLoading={itemsLoading} 
                  onDelete={(id) => deleteItemMutation.mutate(id)}
                  isDeleting={deleteItemMutation.isPending}
                />
              </TabsContent>
              
              <TabsContent value="purchased">
                <ItemsTable 
                  items={registryItems.filter(item => item.status === "purchased")} 
                  isLoading={itemsLoading}
                  onDelete={(id) => deleteItemMutation.mutate(id)}
                  isDeleting={deleteItemMutation.isPending}
                />
              </TabsContent>
            </Tabs>
            
            <div className="mt-8 flex justify-end">
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this registry? This will delete all items in the registry.")) {
                    deleteRegistryMutation.mutate(parseInt(registryId as string));
                  }
                }}
                disabled={deleteRegistryMutation.isPending}
              >
                {deleteRegistryMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Delete Registry
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }
  
  // Otherwise, show the list of registries
  return (
    <div className="container py-8">
      <AppHeader />
      <AppTabs activeTab="registry" />
      
      <div className="my-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Baby Registries</h1>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Registry
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Registry</DialogTitle>
              <DialogDescription>
                Create a new wishlist registry for your baby. Share it with family and friends to help prepare for your baby's arrival.
              </DialogDescription>
            </DialogHeader>
            <Form {...registryForm}>
              <form onSubmit={registryForm.handleSubmit(onRegistrySubmit)} className="space-y-4">
                <FormField
                  control={registryForm.control}
                  name="childId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Child (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a child or leave empty" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">No child selected (Pre-pregnancy registry)</SelectItem>
                          {childrenLoading ? (
                            <SelectItem value="loading" disabled>
                              Loading...
                            </SelectItem>
                          ) : children?.length === 0 ? (
                            <SelectItem value="none" disabled>
                              No children yet
                            </SelectItem>
                          ) : (
                            children?.map((child) => (
                              <SelectItem key={child.id} value={child.id.toString()}>
                                {child.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        You can create a registry without selecting a child for pre-pregnancy planning.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={registryForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registry Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Baby Shower Registry" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={registryForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add details about this registry" 
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
                    disabled={createRegistryMutation.isPending}
                  >
                    {createRegistryMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Registry
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
        {registriesLoading ? (
          <div className="col-span-1 md:col-span-2 flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : registriesError ? (
          <div className="col-span-1 md:col-span-2">
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                There was an error loading your registries. Please try again.
              </AlertDescription>
            </Alert>
          </div>
        ) : registries?.length === 0 ? (
          <div className="col-span-1 md:col-span-2">
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center">
                <Gift className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-medium mb-2">No Registries Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first registry to start adding items for your baby
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Registry
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          registries?.map((registry) => (
            <Link key={registry.id} href={`/registry/${registry.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ShoppingBag className="h-5 w-5 mr-2 text-primary" />
                    {registry.name}
                  </CardTitle>
                  <CardDescription>
                    {registry.description || "Wishlist registry for your baby"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Created on {new Date(registry.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm">
                    View Registry
                  </Button>
                </CardFooter>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

// Registry items table component
function ItemsTable({ 
  items, 
  isLoading,
  onDelete,
  isDeleting
}: { 
  items: any[], 
  isLoading: boolean,
  onDelete: (id: number) => void,
  isDeleting: boolean
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium mb-2">No items in this registry</h3>
        <p className="text-muted-foreground">
          Add items to your registry for family and friends to purchase
        </p>
      </div>
    );
  }
  
  return (
    <Table>
      <TableCaption>List of items in the registry</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Item</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Reserved By</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>
              <div className="font-medium">{item.name}</div>
              {item.description && (
                <div className="text-sm text-muted-foreground">
                  {item.description}
                </div>
              )}
              {item.price && (
                <div className="text-sm font-medium mt-1">
                  ${parseFloat(item.price).toFixed(2)}
                </div>
              )}
            </TableCell>
            <TableCell>
              <Badge variant="outline">
                {item.category ? (item.category.charAt(0).toUpperCase() + item.category.slice(1)) : 'Other'}
              </Badge>
            </TableCell>
            <TableCell>
              {getPriorityBadge(item.priority)}
            </TableCell>
            <TableCell>
              {getStatusBadge(item.status)}
            </TableCell>
            <TableCell>
              {item.status !== "available" && item.reservedByName ? (
                <div>
                  <div className="font-medium">{item.reservedByName}</div>
                  {item.reservedByEmail && (
                    <div className="text-xs text-muted-foreground">
                      {item.reservedByEmail}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-muted-foreground">-</div>
              )}
            </TableCell>
            <TableCell>
              <div className="flex space-x-2">
                {item.url && (
                  <Button variant="ghost" size="icon" asChild title="Visit product page">
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (confirm("Are you sure you want to delete this item?")) {
                      onDelete(item.id);
                    }
                  }}
                  disabled={isDeleting}
                  title="Delete item"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Helper function to format priority badges
function getPriorityBadge(priority: string) {
  switch (priority) {
    case "high":
      return <Badge variant="destructive">High</Badge>;
    case "medium":
      return <Badge variant="default">Medium</Badge>;
    case "low":
      return <Badge variant="outline">Low</Badge>;
    default:
      return <Badge variant="outline">{priority}</Badge>;
  }
}

// Helper function to format status badges
function getStatusBadge(status: string) {
  switch (status) {
    case "available":
      return <Badge variant="outline">Available</Badge>;
    case "reserved":
      return <Badge variant="secondary">Reserved</Badge>;
    case "purchased":
      return <Badge className="bg-green-500 hover:bg-green-600">Purchased</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}