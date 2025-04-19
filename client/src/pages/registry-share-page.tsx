import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "wouter";
import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Gift, ExternalLink, ShoppingBag } from "lucide-react";

// Define form schema for reserving items
const reserveItemSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Please enter a valid email"),
  status: z.enum(["reserved", "purchased"]),
});

type ReserveItemFormValues = z.infer<typeof reserveItemSchema>;

export default function RegistrySharePage() {
  const { toast } = useToast();
  const { shareCode } = useParams();
  const [reserveDialogOpen, setReserveDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Get registry by share code
  const {
    data: registry,
    isLoading: registryLoading,
    isError: registryError,
  } = useQuery({
    queryKey: ["/api/registries/public", shareCode],
    enabled: !!shareCode,
  });

  // Get registry items
  const {
    data: registryItems,
    isLoading: itemsLoading,
    isError: itemsError,
  } = useQuery({
    queryKey: ["/api/registries", registry?.id, "items"],
    enabled: !!registry?.id,
    queryFn: async ({ queryKey }) => {
      const registryId = queryKey[1];
      const response = await apiRequest(
        "GET",
        `/api/registries/${registryId}/items?shareCode=${shareCode}`
      );
      return await response.json();
    },
  });

  // Form for reserving items
  const reserveForm = useForm<ReserveItemFormValues>({
    resolver: zodResolver(reserveItemSchema),
    defaultValues: {
      name: "",
      email: "",
      status: "reserved",
    },
  });

  // Reserve item mutation
  const reserveItemMutation = useMutation({
    mutationFn: async (data: ReserveItemFormValues & { itemId: number }) => {
      const { itemId, ...formData } = data;
      const response = await apiRequest(
        "PUT",
        `/api/registry-items/${itemId}/status`,
        {
          ...formData,
          shareCode,
        }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/registries", registry?.id, "items"],
      });
      toast({
        title: "Thank you!",
        description:
          "You've successfully reserved this item. The parents will be notified.",
      });
      setReserveDialogOpen(false);
      setSelectedItem(null);
      reserveForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reserve this item. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle reserve form submission
  const onReserveSubmit = (data: ReserveItemFormValues) => {
    if (!selectedItem) return;
    
    reserveItemMutation.mutate({
      ...data,
      itemId: selectedItem.id,
    });
  };

  // Filter available items only
  const availableItems = registryItems?.filter(
    (item: any) => item.status === "available"
  );

  // Filter reserved and purchased items
  const reservedItems = registryItems?.filter(
    (item: any) => item.status === "reserved" || item.status === "purchased"
  );

  if (registryLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (registryError || !registry) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <Alert variant="destructive">
          <AlertTitle>Registry Not Found</AlertTitle>
          <AlertDescription>
            The registry you're looking for doesn't exist or the link is invalid.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <Card className="mb-8">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl flex justify-center items-center">
            <ShoppingBag className="h-8 w-8 mr-3 text-primary" />
            {registry.name}
          </CardTitle>
          <CardDescription className="text-lg">
            {registry.description || "Thanks for visiting our baby registry!"}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">
            This registry was created by the parents to help prepare for their baby's arrival.
            Thank you for your support!
          </p>
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <Gift className="h-5 w-5 mr-2 text-primary" />
        Available Items
      </h2>

      {itemsLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : itemsError ? (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            There was an error loading the registry items. Please try again.
          </AlertDescription>
        </Alert>
      ) : availableItems?.length === 0 ? (
        <Card className="border-dashed mb-8">
          <CardContent className="pt-6 text-center">
            <h3 className="text-xl font-medium mb-2">All items have been reserved</h3>
            <p className="text-muted-foreground">
              Thank you for your interest! All items in this registry have been reserved or purchased.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Table className="mb-12">
          <TableCaption>Available items in the registry</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {availableItems?.map((item: any) => (
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
                    {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>{getPriorityBadge(item.priority)}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    {item.url && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        title="View product"
                      >
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View
                        </a>
                      </Button>
                    )}
                    <Dialog
                      open={reserveDialogOpen && selectedItem?.id === item.id}
                      onOpenChange={(open) => {
                        setReserveDialogOpen(open);
                        if (!open) setSelectedItem(null);
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setSelectedItem(item)}
                        >
                          Reserve
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reserve Item</DialogTitle>
                          <DialogDescription>
                            Let the parents know you'll be getting this item for their baby. They will be notified of your reservation.
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...reserveForm}>
                          <form
                            onSubmit={reserveForm.handleSubmit(onReserveSubmit)}
                            className="space-y-4"
                          >
                            <div className="p-3 bg-muted rounded-md mb-4">
                              <h4 className="font-medium">{item.name}</h4>
                              {item.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            
                            <FormField
                              control={reserveForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Your Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Jane Smith" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={reserveForm.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Your Email</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="jane@example.com"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={reserveForm.control}
                              name="status"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Status</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="reserved">
                                        I plan to get this item
                                      </SelectItem>
                                      <SelectItem value="purchased">
                                        I've already purchased this item
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <DialogFooter>
                              <Button
                                type="submit"
                                disabled={reserveItemMutation.isPending}
                              >
                                {reserveItemMutation.isPending && (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Confirm Reservation
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {reservedItems?.length > 0 && (
        <>
          <h2 className="text-2xl font-bold mb-6 mt-12 flex items-center">
            <Gift className="h-5 w-5 mr-2 text-muted-foreground" />
            Reserved Items
          </h2>
          
          <Table>
            <TableCaption>Items that have been reserved or purchased</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reserved By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservedItems?.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.name}</div>
                    {item.description && (
                      <div className="text-sm text-muted-foreground">
                        {item.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>
                    {item.reservedByName || "Anonymous"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </div>
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