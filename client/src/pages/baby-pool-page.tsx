import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useParams, Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { AppHeader } from "@/components/app-header";
import { AppTabs } from "@/components/app-tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
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
import { Loader2, Copy, Dices, Plus, Clock, User, Trophy, AlertTriangle } from "lucide-react";
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
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

// Since we don't have an actual Baby Pool API yet, we'll simulate it
// with a mock implementation for the UI

// Define the types
type BabyGuess = {
  id: number;
  name: string;
  email: string;
  birthDate: string;
  weight: string;
  length: string;
  gender: string;
  hairColor: string;
  createdAt: string;
};

type BabyPool = {
  id: number;
  childId: number | null;
  userId: number;
  name: string;
  dueDate: string;
  shareCode: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'closed';
  actualBirthDate?: string;
  actualWeight?: string;
  actualLength?: string;
  actualGender?: string;
  actualHairColor?: string;
  winner?: string;
};

// Form schemas
const babyPoolFormSchema = z.object({
  childId: z.string().optional(),
  name: z.string().min(3, "Name must be at least 3 characters"),
  dueDate: z.string().min(1, "Due date is required"),
});

const babyGuessFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Please enter a valid email"),
  birthDate: z.string().min(1, "Birth date is required"),
  weight: z.string().min(1, "Weight is required"),
  length: z.string().min(1, "Length is required"),
  gender: z.enum(["boy", "girl", "surprise"]),
  hairColor: z.enum(["brown", "black", "blonde", "red", "unknown"]),
});

const babyResultsFormSchema = z.object({
  actualBirthDate: z.string().min(1, "Birth date is required"),
  actualWeight: z.string().min(1, "Weight is required"),
  actualLength: z.string().min(1, "Length is required"),
  actualGender: z.enum(["boy", "girl"]),
  actualHairColor: z.enum(["brown", "black", "blonde", "red", "other"]),
});

type BabyPoolFormValues = z.infer<typeof babyPoolFormSchema>;
type BabyGuessFormValues = z.infer<typeof babyGuessFormSchema>;
type BabyResultsFormValues = z.infer<typeof babyResultsFormSchema>;

// Mock data for development
const mockBabyPool: BabyPool = {
  id: 1,
  childId: 1,
  userId: 1,
  name: "Baby Smith's Arrival Pool",
  dueDate: "2025-05-15",
  shareCode: "abc123",
  createdAt: "2025-04-01",
  updatedAt: "2025-04-01",
  status: 'active',
};

const mockGuesses: BabyGuess[] = [
  {
    id: 1,
    name: "Grandma Jones",
    email: "grandma@example.com",
    birthDate: "2025-05-10",
    weight: "7 lbs 3 oz",
    length: "20 inches",
    gender: "girl",
    hairColor: "brown",
    createdAt: "2025-04-05"
  },
  {
    id: 2,
    name: "Uncle Bob",
    email: "bob@example.com",
    birthDate: "2025-05-18",
    weight: "8 lbs 1 oz",
    length: "21 inches",
    gender: "boy",
    hairColor: "blonde",
    createdAt: "2025-04-07"
  },
  {
    id: 3,
    name: "Aunt Sarah",
    email: "sarah@example.com",
    birthDate: "2025-05-12",
    weight: "7 lbs 8 oz",
    length: "19.5 inches",
    gender: "girl",
    hairColor: "brown",
    createdAt: "2025-04-08"
  }
];

export default function BabyPoolPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const { id: poolId } = useParams();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [addGuessDialogOpen, setAddGuessDialogOpen] = useState(false);
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>("");
  
  // Mock implementation of queries that would normally go to the server
  const [babyPool, setBabyPool] = useState<BabyPool | null>(poolId ? mockBabyPool : null);
  const [guesses, setGuesses] = useState<BabyGuess[]>(mockGuesses);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get user's children for the form
  const { data: children, isLoading: childrenLoading } = useQuery({
    queryKey: ["/api/children"],
    enabled: createDialogOpen,
  });
  
  // Baby pool form
  const poolForm = useForm<BabyPoolFormValues>({
    resolver: zodResolver(babyPoolFormSchema),
    defaultValues: {
      name: "",
      dueDate: format(new Date(), 'yyyy-MM-dd'),
    },
  });
  
  // Baby guess form
  const guessForm = useForm<BabyGuessFormValues>({
    resolver: zodResolver(babyGuessFormSchema),
    defaultValues: {
      name: "",
      email: "",
      birthDate: format(new Date(), 'yyyy-MM-dd'),
      weight: "",
      length: "",
      gender: "surprise",
      hairColor: "unknown",
    },
  });
  
  // Baby results form
  const resultsForm = useForm<BabyResultsFormValues>({
    resolver: zodResolver(babyResultsFormSchema),
    defaultValues: {
      actualBirthDate: format(new Date(), 'yyyy-MM-dd'),
      actualWeight: "",
      actualLength: "",
      actualGender: "boy",
      actualHairColor: "brown",
    },
  });
  
  // Mock implementation of mutations
  const onPoolSubmit = (data: BabyPoolFormValues) => {
    setIsLoading(true);
    
    // Simulate API request
    setTimeout(() => {
      const newPool: BabyPool = {
        id: 1,
        childId: data.childId ? parseInt(data.childId) : null,
        userId: user?.id || 1,
        name: data.name,
        dueDate: data.dueDate,
        shareCode: Math.random().toString(36).substring(2, 8),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
      };
      
      setBabyPool(newPool);
      setCreateDialogOpen(false);
      poolForm.reset();
      setIsLoading(false);
      
      toast({
        title: "Baby Pool created",
        description: "Your Baby Pool has been created successfully",
      });
      
      // Navigate to the pool page
      navigate(`/baby-pool/${newPool.id}`);
    }, 1000);
  };
  
  const onGuessSubmit = (data: BabyGuessFormValues) => {
    setIsLoading(true);
    
    // Simulate API request
    setTimeout(() => {
      const newGuess: BabyGuess = {
        id: guesses.length + 1,
        ...data,
        createdAt: new Date().toISOString(),
      };
      
      setGuesses([newGuess, ...guesses]);
      setAddGuessDialogOpen(false);
      guessForm.reset({
        name: "",
        email: "",
        birthDate: format(new Date(), 'yyyy-MM-dd'),
        weight: "",
        length: "",
        gender: "surprise",
        hairColor: "unknown",
      });
      setIsLoading(false);
      
      toast({
        title: "Guess added",
        description: "Your guess has been added to the pool",
      });
    }, 1000);
  };
  
  const onResultsSubmit = (data: BabyResultsFormValues) => {
    setIsLoading(true);
    
    // Simulate API request
    setTimeout(() => {
      if (babyPool) {
        const updatedPool: BabyPool = {
          ...babyPool,
          status: 'closed',
          actualBirthDate: data.actualBirthDate,
          actualWeight: data.actualWeight,
          actualLength: data.actualLength,
          actualGender: data.actualGender,
          actualHairColor: data.actualHairColor,
          winner: "Grandma Jones", // In a real app, we'd calculate the winner
        };
        
        setBabyPool(updatedPool);
        setResultsDialogOpen(false);
        resultsForm.reset();
        setIsLoading(false);
        
        toast({
          title: "Results added",
          description: "Baby Pool has been closed and the winner has been calculated",
        });
      }
    }, 1000);
  };
  
  // Generate share link
  const generateShareLink = () => {
    if (!babyPool) return;
    
    const baseUrl = window.location.origin;
    const shareLink = `${baseUrl}/baby-pool/share/${babyPool.shareCode}`;
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
  
  // Format gender
  const formatGender = (gender: string) => {
    switch (gender) {
      case "boy":
        return <Badge variant="blue">Boy</Badge>;
      case "girl":
        return <Badge variant="pink">Girl</Badge>;
      case "surprise":
        return <Badge variant="secondary">Surprise</Badge>;
      default:
        return <Badge variant="outline">{gender}</Badge>;
    }
  };
  
  // If we're on the main baby pool page, show all pools or create one
  if (!poolId) {
    return (
      <div className="container py-8">
        <AppHeader />
        <AppTabs activeTab="extras" />
        
        <div className="flex items-center justify-between my-8">
          <h1 className="text-3xl font-bold">Baby Pool</h1>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create New Pool
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Baby Pool</DialogTitle>
                <DialogDescription>
                  Create a fun guessing game for family and friends to predict your baby's arrival details.
                </DialogDescription>
              </DialogHeader>
              <Form {...poolForm}>
                <form onSubmit={poolForm.handleSubmit(onPoolSubmit)} className="space-y-4">
                  <FormField
                    control={poolForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pool Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Baby Smith's Arrival" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {children && children.length > 0 && (
                    <FormField
                      control={poolForm.control}
                      name="childId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Child (Optional)</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a child" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {children.map((child: any) => (
                                <SelectItem key={child.id} value={child.id.toString()}>
                                  {child.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Link this pool to a specific child
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={poolForm.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Baby Pool"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Show created pools or empty state */}
        {babyPool ? (
          <Card className="mb-8">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">{babyPool.name}</CardTitle>
              <CardDescription>
                Due Date: {new Date(babyPool.dueDate).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {babyPool.status === 'active' 
                  ? `${guesses.length} guesses so far`
                  : `Pool closed. ${babyPool.winner} is the winner!`}
              </p>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => navigate(`/baby-pool/${babyPool.id}`)}>
                View Details
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card className="mb-8 border border-dashed">
            <CardHeader>
              <CardTitle>No Baby Pools Yet</CardTitle>
              <CardDescription>
                Create your first Baby Pool and invite family and friends to guess!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Dices className="h-16 w-16 text-primary/20 mb-4" />
                <p className="text-sm text-muted-foreground max-w-md">
                  Baby Pools are a fun way to engage friends and family in the excitement of your baby's arrival. They can guess the birth date, weight, length, and more!
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Pool
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    );
  }
  
  // If we're on a specific baby pool page
  if (!babyPool) {
    return (
      <div className="container py-8">
        <AppHeader />
        <AppTabs activeTab="extras" />
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <AppHeader />
      <AppTabs activeTab="extras" />
      
      <div className="my-6 flex flex-col md:flex-row justify-between md:items-center">
        <div>
          <div className="flex items-center mb-2">
            <h1 className="text-3xl font-bold mr-3">{babyPool.name}</h1>
            <Badge variant={babyPool.status === 'active' ? 'outline' : 'secondary'}>
              {babyPool.status === 'active' ? 'Active' : 'Closed'}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Due Date: {new Date(babyPool.dueDate).toLocaleDateString()}
          </p>
        </div>
        <div className="flex space-x-2 mt-4 md:mt-0">
          <Button variant="outline" onClick={generateShareLink}>
            <Copy className="mr-2 h-4 w-4" />
            Share Pool
          </Button>
          
          {babyPool.status === 'active' && (
            <>
              <Dialog open={addGuessDialogOpen} onOpenChange={setAddGuessDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Guess
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Your Guess</DialogTitle>
                    <DialogDescription>
                      Take your best guess at when and how the baby will arrive!
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...guessForm}>
                    <form onSubmit={guessForm.handleSubmit(onGuessSubmit)} className="space-y-4">
                      <FormField
                        control={guessForm.control}
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
                        control={guessForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="jane@example.com" {...field} />
                            </FormControl>
                            <FormDescription>
                              We'll notify you if you win!
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={guessForm.control}
                        name="birthDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Birth Date Guess</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={guessForm.control}
                          name="weight"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Weight</FormLabel>
                              <FormControl>
                                <Input placeholder="7 lbs 6 oz" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={guessForm.control}
                          name="length"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Length</FormLabel>
                              <FormControl>
                                <Input placeholder="20 inches" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={guessForm.control}
                          name="gender"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Gender</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select gender" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="boy">Boy</SelectItem>
                                  <SelectItem value="girl">Girl</SelectItem>
                                  <SelectItem value="surprise">Surprise</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={guessForm.control}
                          name="hairColor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Hair Color</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select hair color" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="black">Black</SelectItem>
                                  <SelectItem value="brown">Brown</SelectItem>
                                  <SelectItem value="blonde">Blonde</SelectItem>
                                  <SelectItem value="red">Red</SelectItem>
                                  <SelectItem value="unknown">Unknown</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            "Submit Guess"
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              
              <Dialog open={resultsDialogOpen} onOpenChange={setResultsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="secondary">
                    <Trophy className="mr-2 h-4 w-4" />
                    Close & Add Results
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Baby's Arrival Details</DialogTitle>
                    <DialogDescription>
                      Enter the actual details of your baby's arrival to close the pool and determine the winner.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...resultsForm}>
                    <form onSubmit={resultsForm.handleSubmit(onResultsSubmit)} className="space-y-4">
                      <FormField
                        control={resultsForm.control}
                        name="actualBirthDate"
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
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={resultsForm.control}
                          name="actualWeight"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Weight</FormLabel>
                              <FormControl>
                                <Input placeholder="7 lbs 6 oz" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={resultsForm.control}
                          name="actualLength"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Length</FormLabel>
                              <FormControl>
                                <Input placeholder="20 inches" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={resultsForm.control}
                          name="actualGender"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Gender</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select gender" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="boy">Boy</SelectItem>
                                  <SelectItem value="girl">Girl</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={resultsForm.control}
                          name="actualHairColor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Hair Color</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select hair color" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="black">Black</SelectItem>
                                  <SelectItem value="brown">Brown</SelectItem>
                                  <SelectItem value="blonde">Blonde</SelectItem>
                                  <SelectItem value="red">Red</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Alert variant="warning" className="mt-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Important</AlertTitle>
                        <AlertDescription>
                          Once you add the results, the pool will be closed and the winner will be determined. This action cannot be undone.
                        </AlertDescription>
                      </Alert>
                      
                      <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            "Submit Results & Close Pool"
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>
      
      {/* Results section if pool is closed */}
      {babyPool.status === 'closed' && babyPool.actualBirthDate && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Birth Date</div>
                <div className="font-medium">{new Date(babyPool.actualBirthDate).toLocaleDateString()}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Weight</div>
                <div className="font-medium">{babyPool.actualWeight}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Length</div>
                <div className="font-medium">{babyPool.actualLength}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Gender</div>
                <div className="font-medium">{formatGender(babyPool.actualGender || '')}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Hair Color</div>
                <div className="font-medium capitalize">{babyPool.actualHairColor}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Winner</div>
                <div className="font-medium text-primary">{babyPool.winner}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Guesses table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Guesses</CardTitle>
          <CardDescription>
            {guesses.length} {guesses.length === 1 ? 'guess' : 'guesses'} so far
          </CardDescription>
        </CardHeader>
        <CardContent>
          {guesses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Birth Date</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Length</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Hair Color</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guesses.map((guess) => (
                  <TableRow key={guess.id}>
                    <TableCell className="font-medium">{guess.name}</TableCell>
                    <TableCell>{new Date(guess.birthDate).toLocaleDateString()}</TableCell>
                    <TableCell>{guess.weight}</TableCell>
                    <TableCell>{guess.length}</TableCell>
                    <TableCell>{formatGender(guess.gender)}</TableCell>
                    <TableCell className="capitalize">{guess.hairColor}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <User className="h-12 w-12 text-primary/20 mb-4" />
              <p className="text-sm text-muted-foreground">
                No guesses yet. Share the pool with family and friends!
              </p>
              <Button 
                variant="outline" 
                onClick={() => setAddGuessDialogOpen(true)} 
                className="mt-4"
                disabled={babyPool.status !== 'active'}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Guess
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}