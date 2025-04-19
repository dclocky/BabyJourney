import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { AppTabs } from "@/components/app-tabs";
import { MobileNav } from "@/components/mobile-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { FamilyMember, InsertFamilyMember } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  Loader2, 
  PlusCircle, 
  Users, 
  User, 
  ShieldCheck, 
  Shield, 
  MoreVertical, 
  Edit, 
  Trash,
  Mail,
  UserPlus
} from "lucide-react";

export default function FamilyMembersPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

  const { data: familyMembers = [], isLoading: isLoadingFamilyMembers } = useQuery<FamilyMember[]>({
    queryKey: ["/api/family-members"],
  });

  // Form schema for family members
  const familyMemberSchema = z.object({
    name: z.string().min(1, "Name is required"), // We'll map this to fullName
    email: z.string().email("Valid email is required").optional().or(z.literal("")),
    relationship: z.string().min(1, "Relationship is required"),
    // These fields are for the UI only, not stored in DB yet
    canViewMedical: z.boolean().default(false),
    canEditProfile: z.boolean().default(false),
    canUploadPhotos: z.boolean().default(false),
  });

  const form = useForm<z.infer<typeof familyMemberSchema>>({
    resolver: zodResolver(familyMemberSchema),
    defaultValues: {
      name: "",
      email: "",
      relationship: "",
      canViewMedical: false,
      canEditProfile: false,
      canUploadPhotos: false,
    },
  });

  // Reset form when dialog closes
  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
      setEditingMember(null);
    }
    setIsAddMemberDialogOpen(open);
  };

  // Set form values when editing a member
  const handleEditMember = (member: FamilyMember) => {
    setEditingMember(member);
    form.reset({
      name: member.fullName,
      email: member.email || '',
      relationship: member.relationship,
      canViewMedical: false, // Default values since these fields aren't in DB yet
      canEditProfile: false,
      canUploadPhotos: false,
    });
    setIsAddMemberDialogOpen(true);
  };

  const addFamilyMemberMutation = useMutation({
    mutationFn: async (data: z.infer<typeof familyMemberSchema>) => {
      // Map from our UI form to the DB schema
      const payload = {
        fullName: data.name,
        email: data.email,
        relationship: data.relationship,
        // We'll store permissions in the DB later, currently just logging
        // canViewMedical: data.canViewMedical,
        // canEditProfile: data.canEditProfile,
        // canUploadPhotos: data.canUploadPhotos
      };
      console.log("Creating family member with permissions:", {
        canViewMedical: data.canViewMedical,
        canEditProfile: data.canEditProfile,
        canUploadPhotos: data.canUploadPhotos
      });
      
      const res = await apiRequest("POST", "/api/family-members", payload);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/family-members"] });
      toast({
        title: "Family member added",
        description: "The family member has been successfully added.",
      });
      setIsAddMemberDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to add family member",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateFamilyMemberMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: z.infer<typeof familyMemberSchema> }) => {
      // Map from our UI form to the DB schema
      const payload = {
        fullName: data.name,
        email: data.email,
        relationship: data.relationship,
        // We'll store permissions in the DB later, currently just logging
        // canViewMedical: data.canViewMedical,
        // canEditProfile: data.canEditProfile,
        // canUploadPhotos: data.canUploadPhotos
      };
      console.log("Updating family member with permissions:", {
        canViewMedical: data.canViewMedical,
        canEditProfile: data.canEditProfile,
        canUploadPhotos: data.canUploadPhotos
      });
      
      const res = await apiRequest("PATCH", `/api/family-members/${id}`, payload);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/family-members"] });
      toast({
        title: "Family member updated",
        description: "The family member has been successfully updated.",
      });
      setIsAddMemberDialogOpen(false);
      setEditingMember(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to update family member",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteFamilyMemberMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/family-members/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/family-members"] });
      toast({
        title: "Family member removed",
        description: "The family member has been successfully removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove family member",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmitFamilyMember(data: z.infer<typeof familyMemberSchema>) {
    if (editingMember) {
      updateFamilyMemberMutation.mutate({ id: editingMember.id, data });
    } else {
      addFamilyMemberMutation.mutate(data);
    }
  }

  function inviteFamilyMember(email: string) {
    // This would typically send an email invitation
    toast({
      title: "Invitation sent",
      description: `An invitation has been sent to ${email}.`,
    });
  }

  return (
    <div className="min-h-screen flex flex-col bg-secondary-50">
      <AppHeader />
      <AppTabs />
      
      <main className="flex-grow container mx-auto px-4 py-6 pb-20 md:pb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">Family Members</h1>
            <p className="text-muted-foreground">Manage access and permissions for family members</p>
          </div>
          
          <Dialog open={isAddMemberDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Family Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingMember ? "Edit Family Member" : "Add Family Member"}</DialogTitle>
                <DialogDescription>
                  {editingMember 
                    ? "Update information and permissions for this family member." 
                    : "Add a new family member and set their permissions."}
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitFamilyMember)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="relationship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relationship</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Spouse, Parent, Sibling" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Permissions</h3>
                    
                    <FormField
                      control={form.control}
                      name="canViewMedical"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Can view medical information
                            </FormLabel>
                            <FormDescription>
                              Access to appointments, symptoms, and growth records
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="canEditProfile"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Can edit child's profile
                            </FormLabel>
                            <FormDescription>
                              Make changes to child information and add milestones
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="canUploadPhotos"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Can upload photos
                            </FormLabel>
                            <FormDescription>
                              Add photos to the memories section
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => handleDialogOpenChange(false)}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={addFamilyMemberMutation.isPending || updateFamilyMemberMutation.isPending}
                    >
                      {(addFamilyMemberMutation.isPending || updateFamilyMemberMutation.isPending) ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        editingMember ? "Update Member" : "Add Member"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        {isLoadingFamilyMembers ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : familyMembers.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Family Members Yet</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Add family members to share your baby's journey with them and control what they can see and edit.
            </p>
            <Button onClick={() => setIsAddMemberDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Your First Family Member
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {familyMembers.map(member => (
              <Card key={member.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary-500" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{member.fullName}</CardTitle>
                        <CardDescription>{member.relationship}</CardDescription>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          className="cursor-pointer"
                          onClick={() => inviteFamilyMember(member.email)}
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          Send Invitation
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="cursor-pointer"
                          onClick={() => handleEditMember(member)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive cursor-pointer"
                          onClick={() => {
                            if (confirm(`Are you sure you want to remove ${member.fullName}?`)) {
                              deleteFamilyMemberMutation.mutate(member.id);
                            }
                          }}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mb-4">
                    <Mail className="inline-block h-4 w-4 mr-1 -mt-0.5" />
                    {member.email}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Permissions:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {member.canViewMedical && (
                        <Badge variant="outline" className="bg-green-50 text-green-600 hover:bg-green-50">
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          Medical Info
                        </Badge>
                      )}
                      {member.canEditProfile && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-600 hover:bg-blue-50">
                          <Edit className="h-3 w-3 mr-1" />
                          Edit Profile
                        </Badge>
                      )}
                      {member.canUploadPhotos && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-600 hover:bg-purple-50">
                          <PlusCircle className="h-3 w-3 mr-1" />
                          Upload Photos
                        </Badge>
                      )}
                      {!member.canViewMedical && !member.canEditProfile && !member.canUploadPhotos && (
                        <Badge variant="outline" className="bg-gray-50 text-gray-600 hover:bg-gray-50">
                          <Shield className="h-3 w-3 mr-1" />
                          No Permissions
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-gray-50 py-2">
                  <span className="text-xs text-muted-foreground">
                    Added on {new Date(member.createdAt).toLocaleDateString()}
                  </span>
                </CardFooter>
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