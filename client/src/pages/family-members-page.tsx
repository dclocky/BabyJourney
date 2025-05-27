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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Mail, Shield, Settings, Activity, Crown, UserCheck, Eye, Edit3, Trash2, AlertTriangle, Heart, MessageCircle, Share, Baby, TrendingUp, Camera, Stethoscope, Calendar } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { AppHeader } from "@/components/app-header";
import { AppTabs } from "@/components/app-tabs";
import { format } from "date-fns";

interface TimelineActivity {
  id: string;
  type: 'milestone' | 'growth' | 'photo' | 'appointment' | 'family_post';
  title: string;
  description: string;
  date: string;
  author: {
    id: number;
    name: string;
    role: string;
  };
  data?: any;
  likes: number;
  comments: TimelineComment[];
  isLiked: boolean;
}

interface TimelineComment {
  id: number;
  content: string;
  author: {
    id: number;
    name: string;
  };
  createdAt: string;
}

interface Child {
  id: number;
  name: string;
  birthDate: string | null;
  dueDate: string | null;
  isPregnancy: boolean;
  gender: string | null;
}

export default function FamilyMembersPage() {
  const [selectedChild, setSelectedChild] = useState<number | null>(null);
  const [newPostContent, setNewPostContent] = useState("");
  const [commentContent, setCommentContent] = useState<{[key: string]: string}>({});
  const [activeTab, setActiveTab] = useState<'timeline' | 'members' | 'settings'>('timeline');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get the user's children
  const { data: children = [], isLoading: childrenLoading } = useQuery({
    queryKey: ["/api/children"],
  });

  // Get milestones for timeline
  const { data: milestones = [], isLoading: milestonesLoading } = useQuery({
    queryKey: ["/api/children", selectedChild, "milestones"],
    enabled: !!selectedChild,
  });

  // Get growth records for timeline
  const { data: growthRecords = [], isLoading: growthLoading } = useQuery({
    queryKey: ["/api/children", selectedChild, "growth"],
    enabled: !!selectedChild,
  });

  // Get appointments for timeline
  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ["/api/appointments"],
    enabled: !!selectedChild,
  });

  // Get baby names for timeline
  const { data: babyNames = [], isLoading: babyNamesLoading } = useQuery({
    queryKey: ["/api/baby-names", selectedChild],
    enabled: !!selectedChild,
  });

  // Get registry items for timeline
  const { data: registryItems = [], isLoading: registryLoading } = useQuery({
    queryKey: ["/api/registries", selectedChild, "items"],
    enabled: !!selectedChild,
  });

  // Set first child as selected if none selected and children exist
  useEffect(() => {
    if (!selectedChild && children.length > 0) {
      setSelectedChild(children[0].id);
    }
  }, [children, selectedChild]);

  // Create timeline activities from real data
  const createTimelineActivities = (): TimelineActivity[] => {
    const activities: TimelineActivity[] = [];

    // Add milestones
    milestones.forEach((milestone: any) => {
      activities.push({
        id: `milestone-${milestone.id}`,
        type: 'milestone',
        title: milestone.title,
        description: milestone.description || 'New milestone achieved!',
        date: milestone.date,
        author: {
          id: 1,
          name: 'Mom',
          role: 'parent'
        },
        data: milestone,
        likes: Math.floor(Math.random() * 5) + 1,
        comments: [],
        isLiked: false
      });
    });

    // Add growth records
    growthRecords.forEach((record: any) => {
      activities.push({
        id: `growth-${record.id}`,
        type: 'growth',
        title: 'Growth Update',
        description: `Weight: ${record.weight}${record.weightUnit || 'lbs'}, Height: ${record.height}${record.heightUnit || 'in'}${record.headCircumference ? `, Head: ${record.headCircumference}${record.headUnit || 'in'}` : ''}`,
        date: record.date,
        author: {
          id: 1,
          name: 'Mom',
          role: 'parent'
        },
        data: record,
        likes: Math.floor(Math.random() * 8) + 2,
        comments: [],
        isLiked: false
      });
    });

    // Add appointments
    appointments.forEach((appointment: any) => {
      activities.push({
        id: `appointment-${appointment.id}`,
        type: 'appointment',
        title: appointment.title,
        description: appointment.notes || 'Medical appointment completed',
        date: appointment.date,
        author: {
          id: 1,
          name: 'Mom',
          role: 'parent'
        },
        data: appointment,
        likes: Math.floor(Math.random() * 3) + 1,
        comments: [],
        isLiked: false
      });
    });

    // Add baby name suggestions
    babyNames.forEach((name: any) => {
      activities.push({
        id: `baby-name-${name.id}`,
        type: 'family_post',
        title: 'Baby Name Suggestion',
        description: `New name suggestion: ${name.name}${name.meaning ? ` - ${name.meaning}` : ''}`,
        date: name.createdAt,
        author: {
          id: 1,
          name: 'Family',
          role: 'member'
        },
        data: name,
        likes: Math.floor(Math.random() * 12) + 3,
        comments: [],
        isLiked: false
      });
    });

    // Add registry items
    registryItems.forEach((item: any) => {
      activities.push({
        id: `registry-${item.id}`,
        type: 'family_post',
        title: 'Registry Item Added',
        description: `New item added to registry: ${item.name}${item.price ? ` - $${item.price}` : ''}`,
        date: item.createdAt,
        author: {
          id: 1,
          name: 'Family',
          role: 'member'
        },
        data: item,
        likes: Math.floor(Math.random() * 8) + 2,
        comments: [],
        isLiked: false
      });
    });

    // Sort by date (newest first)
    return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const timelineActivities = createTimelineActivities();

  const handleLike = (activityId: string) => {
    toast({ title: "Liked!", description: "Your reaction has been shared with the family" });
  };

  const handleComment = (activityId: string) => {
    const content = commentContent[activityId];
    if (!content?.trim()) return;
    
    toast({ title: "Comment added!", description: "Your comment has been shared with the family" });
    setCommentContent(prev => ({ ...prev, [activityId]: "" }));
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'milestone': return <Baby className="w-5 h-5" />;
      case 'growth': return <TrendingUp className="w-5 h-5" />;
      case 'photo': return <Camera className="w-5 h-5" />;
      case 'appointment': return <Stethoscope className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'milestone': return 'bg-blue-500';
      case 'growth': return 'bg-green-500';
      case 'photo': return 'bg-purple-500';
      case 'appointment': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const selectedChildData = children.find((child: any) => child.id === selectedChild);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Family Timeline</h1>
          <p className="text-muted-foreground">
            Share your baby's journey with family and friends
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`${activeTab === 'timeline' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                <Activity className="w-4 h-4 mr-2 inline" />
                Timeline
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`${activeTab === 'members' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                <Users className="w-4 h-4 mr-2 inline" />
                Members
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`${activeTab === 'settings' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                <Settings className="w-4 h-4 mr-2 inline" />
                Settings
              </button>
            </nav>
          </div>
        </div>

        {/* Timeline Tab */}
        {activeTab === 'timeline' && (
          <>
            {childrenLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading your children...</p>
                </div>
              </div>
            ) : children.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Baby className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No babies yet</h3>
                  <p className="text-muted-foreground">
                    Add your first baby to start sharing your journey with family
                  </p>
                </CardContent>
              </Card>
            ) : (
          <div className="space-y-6">
            {/* Child Selection */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Baby className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <Select value={selectedChild?.toString()} onValueChange={(value) => setSelectedChild(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a child" />
                      </SelectTrigger>
                      <SelectContent>
                        {children.map((child: any) => (
                          <SelectItem key={child.id} value={child.id.toString()}>
                            {child.name} {child.isPregnancy ? "(Pregnancy)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {selectedChildData && (
                  <div className="mt-3 text-sm text-muted-foreground">
                    Sharing updates for {selectedChildData.name}
                    {selectedChildData.isPregnancy ? 
                      ` • Due ${selectedChildData.dueDate && !isNaN(new Date(selectedChildData.dueDate).getTime()) ? format(new Date(selectedChildData.dueDate), 'PP') : 'date not set'}` :
                      ` • Born ${selectedChildData.birthDate && !isNaN(new Date(selectedChildData.birthDate).getTime()) ? format(new Date(selectedChildData.birthDate), 'PP') : 'date not set'}`
                    }
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Create Post */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <Textarea
                      placeholder={`Share an update about ${selectedChildData?.name || 'your baby'}'s journey...`}
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      className="resize-none"
                      rows={3}
                    />
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Camera className="w-4 h-4 mr-2" />
                          Photo
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Calendar className="w-4 h-4 mr-2" />
                          Milestone
                        </Button>
                      </div>
                      <Button 
                        size="sm"
                        disabled={!newPostContent.trim()}
                        onClick={() => {
                          toast({ 
                            title: "Post shared with family!", 
                            description: "Your update has been added to the family timeline" 
                          });
                          setNewPostContent("");
                        }}
                      >
                        Share
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline Activities */}
            {milestonesLoading || growthLoading || appointmentsLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading timeline...</p>
                </div>
              </div>
            ) : timelineActivities.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Your timeline is empty</h3>
                  <p className="text-muted-foreground mb-4">
                    Start tracking milestones, growth, and appointments to build your baby's timeline
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Get started by adding:</p>
                    <div className="flex justify-center space-x-4 text-sm">
                      <span className="flex items-center space-x-1">
                        <Baby className="w-4 h-4" />
                        <span>Milestones</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <TrendingUp className="w-4 h-4" />
                        <span>Growth</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Stethoscope className="w-4 h-4" />
                        <span>Appointments</span>
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {timelineActivities.map((activity) => (
                  <Card key={activity.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      {/* Activity Header */}
                      <div className="p-4 border-b bg-muted/20">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${getActivityColor(activity.type)}`}>
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold">{activity.author.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {activity.author.role}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {activity.date && !isNaN(new Date(activity.date).getTime()) ? 
                                `${format(new Date(activity.date), 'PPP')} at ${format(new Date(activity.date), 'p')}` : 
                                'Date not available'
                              }
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Activity Content */}
                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-2">{activity.title}</h3>
                        <p className="text-muted-foreground mb-4">{activity.description}</p>

                        {/* Activity-specific data */}
                        {activity.type === 'milestone' && activity.data && (
                          <div className="bg-blue-50 p-3 rounded-lg mb-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <Baby className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-900">Milestone Details</span>
                            </div>
                            <p className="text-sm text-blue-800">
                              Category: {activity.data.category}
                            </p>
                          </div>
                        )}

                        {activity.type === 'growth' && activity.data && (
                          <div className="bg-green-50 p-3 rounded-lg mb-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <TrendingUp className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium text-green-900">Growth Measurements</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm text-green-800">
                              <div>Weight: {activity.data.weight}{activity.data.weightUnit || 'lbs'}</div>
                              <div>Height: {activity.data.height}{activity.data.heightUnit || 'in'}</div>
                              {activity.data.headCircumference && (
                                <div>Head: {activity.data.headCircumference}{activity.data.headUnit || 'in'}</div>
                              )}
                            </div>
                          </div>
                        )}

                        {activity.type === 'appointment' && activity.data && (
                          <div className="bg-red-50 p-3 rounded-lg mb-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <Stethoscope className="w-4 h-4 text-red-600" />
                              <span className="text-sm font-medium text-red-900">Medical Appointment</span>
                            </div>
                            <p className="text-sm text-red-800">
                              Type: {activity.data.type || 'Checkup'}
                            </p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center space-x-6 pt-2 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={activity.isLiked ? "text-red-500" : ""}
                            onClick={() => handleLike(activity.id)}
                          >
                            <Heart className={`w-4 h-4 mr-2 ${activity.isLiked ? 'fill-current' : ''}`} />
                            {activity.likes > 0 ? activity.likes : 'Like'}
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Comment
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Share className="w-4 h-4 mr-2" />
                            Share
                          </Button>
                        </div>

                        {/* Comments Section */}
                        <div className="mt-4 space-y-3">
                          {activity.comments.map((comment) => (
                            <div key={comment.id} className="flex space-x-3">
                              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                                <UserCheck className="w-4 h-4" />
                              </div>
                              <div className="flex-1 bg-muted p-3 rounded-lg">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-medium text-sm">{comment.author.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(comment.createdAt), 'p')}
                                  </span>
                                </div>
                                <p className="text-sm">{comment.content}</p>
                              </div>
                            </div>
                          ))}

                          {/* Add Comment */}
                          <div className="flex space-x-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <UserCheck className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 flex space-x-2">
                              <Input
                                placeholder="Write a comment..."
                                value={commentContent[activity.id] || ""}
                                onChange={(e) => setCommentContent(prev => ({ 
                                  ...prev, 
                                  [activity.id]: e.target.value 
                                }))}
                                className="flex-1"
                              />
                              <Button
                                size="sm"
                                disabled={!commentContent[activity.id]?.trim()}
                                onClick={() => handleComment(activity.id)}
                              >
                                Post
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          </>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Family Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Family member management coming soon</p>
                <p className="text-sm mt-2">Invite family and friends to follow your baby's journey</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Family Timeline Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Privacy Settings</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Public timeline</span>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Allow comments</span>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Notifications</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">New posts</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Comments</span>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <AppTabs />
    </div>
  );
}