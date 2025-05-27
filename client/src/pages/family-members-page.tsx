import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppHeader } from '@/components/app-header';
import { AppTabs } from '@/components/app-tabs';
import { 
  Baby, 
  Users, 
  Settings, 
  Activity,
  Heart,
  MessageCircle,
  Share2,
  Calendar,
  TrendingUp,
  Camera
} from 'lucide-react';

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

export default function FamilyMembers() {
  const [activeTab, setActiveTab] = useState<'timeline' | 'members' | 'settings'>('timeline');
  const [selectedChild, setSelectedChild] = useState<number | null>(null);

  // Fetch children data
  const { data: children = [], isLoading: childrenLoading } = useQuery({
    queryKey: ['/api/children'],
    queryFn: async () => {
      const res = await fetch('/api/children');
      if (!res.ok) throw new Error('Failed to fetch children');
      return res.json();
    }
  });

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
          <div className="text-center py-8">
            <Baby className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Family Timeline Coming Soon</h2>
            <p className="text-muted-foreground">
              We're working on building an amazing family timeline experience for you.
            </p>
          </div>
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
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No family members yet</h3>
                <p className="text-muted-foreground mb-4">
                  Invite family members to share in your baby's journey
                </p>
                <Button>
                  Invite Family Members
                </Button>
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
                Timeline Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Privacy Settings</h4>
                    <p className="text-sm text-muted-foreground">
                      Control who can see your family timeline
                    </p>
                  </div>
                  <Badge variant="outline">Private</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Notifications</h4>
                    <p className="text-sm text-muted-foreground">
                      Get notified about family interactions
                    </p>
                  </div>
                  <Badge variant="outline">Enabled</Badge>
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