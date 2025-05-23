import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Mail, Shield, Settings, Activity, Crown, UserCheck, Eye, Edit3, Trash2, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface FamilyGroup {
  id: number;
  name: string;
  description?: string;
  childId: number;
  inviteCode: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface GroupMember {
  id: number;
  groupId: number;
  userId: number;
  role: string;
  permissions: {
    canViewPhotos: boolean;
    canViewMedical: boolean;
    canViewFeeding: boolean;
    canViewSleep: boolean;
    canViewDiapers: boolean;
    canAddData: boolean;
    canInviteMembers: boolean;
    canManageGroup: boolean;
  };
  joinedAt: string;
  invitedBy: number;
  user: {
    id: number;
    username: string;
    email: string;
    isPremium: boolean;
  };
}

interface Activity {
  id: number;
  activityType: string;
  title: string;
  description?: string;
  createdAt: string;
  user: {
    username: string;
  };
  comments: any[];
  likes: any[];
}

export default function FamilyMembersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isCreateGroupDialogOpen, setIsCreateGroupDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [editingMember, setEditingMember] = useState<GroupMember | null>(null);

  // Get user's children
  const { data: children } = useQuery({
    queryKey: ["/api/children"],
  });

  // Get family group for selected child
  const { data: familyGroup, isLoading: groupLoading } = useQuery({
    queryKey: ["/api/family-groups/child", selectedChildId],
    enabled: !!selectedChildId,
  });

  // Get group members
  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ["/api/family-groups", familyGroup?.id, "members"],
    enabled: !!familyGroup?.id,
  });

  // Get group activities
  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ["/api/family-groups", familyGroup?.id, "activities"],
    enabled: !!familyGroup?.id,
  });

  // Create family group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (data: { childId: number; name: string; description?: string }) => {
      return apiRequest("/api/family-groups", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Family group created successfully",
      });
      setIsCreateGroupDialogOpen(false);
      setGroupName("");
      setGroupDescription("");
      queryClient.invalidateQueries({ queryKey: ["/api/family-groups/child", selectedChildId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create family group",
        variant: "destructive",
      });
    },
  });

  // Send invitation mutation
  const inviteMutation = useMutation({
    mutationFn: async (data: { email: string; role: string }) => {
      return apiRequest(`/api/family-groups/${familyGroup?.id}/invite`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Invitation sent!",
        description: `Invitation sent to ${inviteEmail}`,
      });
      setIsInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("viewer");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    },
  });

  // Update member permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async (data: { userId: number; permissions: any }) => {
      return apiRequest(`/api/family-groups/${familyGroup?.id}/members/${data.userId}`, {
        method: "PATCH",
        body: JSON.stringify({ permissions: data.permissions }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Member permissions updated",
      });
      setEditingMember(null);
      queryClient.invalidateQueries({ queryKey: ["/api/family-groups", familyGroup?.id, "members"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update permissions",
        variant: "destructive",
      });
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest(`/api/family-groups/${familyGroup?.id}/members/${userId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Member removed from group",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/family-groups", familyGroup?.id, "members"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove member",
        variant: "destructive",
      });
    },
  });

  // Select first child by default
  useEffect(() => {
    if (children && children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-purple-100 text-purple-800";
      case "admin":
        return "bg-blue-100 text-blue-800";
      case "contributor":
        return "bg-green-100 text-green-800";
      case "viewer":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="w-4 h-4" />;
      case "admin":
        return <Shield className="w-4 h-4" />;
      case "contributor":
        return <Edit3 className="w-4 h-4" />;
      case "viewer":
        return <Eye className="w-4 h-4" />;
      default:
        return <UserCheck className="w-4 h-4" />;
    }
  };

  if (!children || children.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You need to create a child profile first before managing family groups.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Family Groups</h1>
          <p className="text-muted-foreground">
            Invite trusted family members to share in your journey
          </p>
        </div>
        <Users className="w-8 h-8 text-primary" />
      </div>

      {/* Child Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Child</CardTitle>
          <CardDescription>
            Choose which child's family group you want to manage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedChildId?.toString() || ""} onValueChange={(value) => setSelectedChildId(parseInt(value))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a child" />
            </SelectTrigger>
            <SelectContent>
              {children?.map((child: any) => (
                <SelectItem key={child.id} value={child.id.toString()}>
                  {child.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedChildId && (
        <>
          {!familyGroup && !groupLoading ? (
            <Card>
              <CardHeader>
                <CardTitle>No Family Group</CardTitle>
                <CardDescription>
                  Create a family group to start inviting family members
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={isCreateGroupDialogOpen} onOpenChange={setIsCreateGroupDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Family Group
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Family Group</DialogTitle>
                      <DialogDescription>
                        Create a private group for your family to share moments together
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="groupName">Group Name</Label>
                        <Input
                          id="groupName"
                          value={groupName}
                          onChange={(e) => setGroupName(e.target.value)}
                          placeholder="e.g., The Johnson Family"
                        />
                      </div>
                      <div>
                        <Label htmlFor="groupDescription">Description (Optional)</Label>
                        <Input
                          id="groupDescription"
                          value={groupDescription}
                          onChange={(e) => setGroupDescription(e.target.value)}
                          placeholder="Share our baby's journey..."
                        />
                      </div>
                      <Button
                        onClick={() => createGroupMutation.mutate({
                          childId: selectedChildId,
                          name: groupName,
                          description: groupDescription || undefined,
                        })}
                        disabled={!groupName || createGroupMutation.isPending}
                        className="w-full"
                      >
                        Create Group
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ) : (
            familyGroup && (
              <Tabs defaultValue="members" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="members">Members</TabsTrigger>
                  <TabsTrigger value="activity">Activity Feed</TabsTrigger>
                  <TabsTrigger value="settings">Group Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="members" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{familyGroup.name}</CardTitle>
                          <CardDescription>
                            {familyGroup.description || "Family group for sharing moments"}
                          </CardDescription>
                        </div>
                        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                          <DialogTrigger asChild>
                            <Button>
                              <Mail className="w-4 h-4 mr-2" />
                              Invite Member
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Invite Family Member</DialogTitle>
                              <DialogDescription>
                                Send an invitation to join your family group
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                  id="email"
                                  type="email"
                                  value={inviteEmail}
                                  onChange={(e) => setInviteEmail(e.target.value)}
                                  placeholder="Enter email address"
                                />
                              </div>
                              <div>
                                <Label htmlFor="role">Role</Label>
                                <Select value={inviteRole} onValueChange={setInviteRole}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="viewer">Viewer - Can view photos and updates</SelectItem>
                                    <SelectItem value="contributor">Contributor - Can add data and photos</SelectItem>
                                    <SelectItem value="admin">Admin - Can manage members and invite others</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button
                                onClick={() => inviteMutation.mutate({ email: inviteEmail, role: inviteRole })}
                                disabled={!inviteEmail || inviteMutation.isPending}
                                className="w-full"
                              >
                                Send Invitation
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {membersLoading ? (
                        <div>Loading members...</div>
                      ) : (
                        <div className="space-y-4">
                          {members?.map((member: GroupMember) => (
                            <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                  {getRoleIcon(member.role)}
                                </div>
                                <div>
                                  <div className="font-medium">{member.user.username}</div>
                                  <div className="text-sm text-muted-foreground">{member.user.email}</div>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <Badge className={getRoleColor(member.role)}>
                                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                    </Badge>
                                    {member.user.isPremium && (
                                      <Badge variant="secondary">Premium</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {member.role !== "owner" && (
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingMember(member)}
                                  >
                                    <Settings className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeMemberMutation.mutate(member.userId)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="activity">
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        <Activity className="w-5 h-5 mr-2 inline" />
                        Group Activity Feed
                      </CardTitle>
                      <CardDescription>
                        Recent activity from group members
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {activitiesLoading ? (
                        <div>Loading activities...</div>
                      ) : activities && activities.length > 0 ? (
                        <div className="space-y-4">
                          {activities.map((activity: Activity) => (
                            <div key={activity.id} className="border-l-2 border-primary/20 pl-4 pb-4">
                              <div className="flex items-center justify-between">
                                <div className="font-medium">{activity.title}</div>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(activity.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                by {activity.user.username}
                              </div>
                              {activity.description && (
                                <div className="text-sm mt-2">{activity.description}</div>
                              )}
                              <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                                <span>{activity.comments.length} comments</span>
                                <span>{activity.likes.length} likes</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground py-8">
                          No activities yet. Group activities will appear here.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="settings">
                  <Card>
                    <CardHeader>
                      <CardTitle>Group Settings</CardTitle>
                      <CardDescription>
                        Manage your family group settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <Label>Group Name</Label>
                          <Input value={familyGroup.name} disabled />
                        </div>
                        <div>
                          <Label>Invite Code</Label>
                          <div className="flex items-center space-x-2">
                            <Input value={familyGroup.inviteCode} disabled />
                            <Button variant="outline" size="sm">
                              Copy
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Share this code with family members to let them join directly
                          </p>
                        </div>
                        <Separator />
                        <div className="text-sm text-muted-foreground">
                          Created on {new Date(familyGroup.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )
          )}
        </>
      )}

      {/* Edit Member Permissions Dialog */}
      {editingMember && (
        <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Permissions</DialogTitle>
              <DialogDescription>
                Update permissions for {editingMember.user.username}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {Object.entries(editingMember.permissions).map(([permission, value]) => (
                <div key={permission} className="flex items-center justify-between">
                  <Label htmlFor={permission} className="flex-1">
                    {permission.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </Label>
                  <Switch
                    id={permission}
                    checked={value}
                    onCheckedChange={(checked) => {
                      setEditingMember({
                        ...editingMember,
                        permissions: {
                          ...editingMember.permissions,
                          [permission]: checked,
                        },
                      });
                    }}
                  />
                </div>
              ))}
              <Button
                onClick={() => updatePermissionsMutation.mutate({
                  userId: editingMember.userId,
                  permissions: editingMember.permissions,
                })}
                disabled={updatePermissionsMutation.isPending}
                className="w-full"
              >
                Update Permissions
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}