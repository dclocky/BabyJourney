import { useAuth } from "@/hooks/use-auth";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { AppTabs } from "@/components/app-tabs";
import { MobileNav } from "@/components/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, Edit3, Crown, Calendar, Mail, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function ProfilePage() {
  const { user } = useAuth();

  const { data: children = [] } = useQuery({
    queryKey: ["/api/children"],
    enabled: !!user,
  });

  if (!user) {
    return null;
  }

  const userInitials = user.fullName
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen flex flex-col bg-secondary-50">
      <AppHeader />
      <AppTabs />

      <main className="flex-grow container mx-auto px-4 py-6 pb-20 md:pb-6">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src="" alt={user.fullName} />
                  <AvatarFallback className="text-2xl font-bold bg-primary-100 text-primary-700">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-2">
                    <h1 className="text-3xl font-bold text-foreground">{user.fullName}</h1>
                    <Badge variant={user.isPremium ? "default" : "secondary"} className="w-fit">
                      {user.isPremium ? (
                        <>
                          <Crown className="w-3 h-3 mr-1" />
                          Premium Member
                        </>
                      ) : (
                        "Free Account"
                      )}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-6 text-muted-foreground">
                    <div className="flex items-center justify-center md:justify-start">
                      <User className="w-4 h-4 mr-2" />
                      @{user.username}
                    </div>
                    <div className="flex items-center justify-center md:justify-start">
                      <Mail className="w-4 h-4 mr-2" />
                      {user.email}
                    </div>
                    <div className="flex items-center justify-center md:justify-start">
                      <Calendar className="w-4 h-4 mr-2" />
                      Joined {new Date(user.createdAt).toLocaleDateString('en-US', { 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </div>
                  </div>
                </div>
                
                <Button className="flex items-center">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Account Overview */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Account Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{Array.isArray(children) ? children.length : 0}</div>
                    <div className="text-sm text-blue-600">Children</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {user.isPremium ? "Premium" : "Free"}
                    </div>
                    <div className="text-sm text-green-600">Account Type</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{user.role}</div>
                    <div className="text-sm text-purple-600">Role</div>
                  </div>
                </div>

                {!user.isPremium && (
                  <div className="bg-gradient-to-r from-primary-50 to-primary-100 p-4 rounded-lg border border-primary-200">
                    <h4 className="font-semibold text-primary-800 mb-2">Upgrade to Premium</h4>
                    <p className="text-primary-700 text-sm mb-3">
                      Unlock advanced features like unlimited photo storage, detailed analytics, and family sharing.
                    </p>
                    <Button size="sm" className="bg-primary-600 hover:bg-primary-700">
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade Now
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <User className="w-4 h-4 mr-2" />
                  Privacy Settings
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="w-4 h-4 mr-2" />
                  Notification Preferences
                </Button>
                {!user.isPremium && (
                  <Button className="w-full justify-start bg-primary-600 hover:bg-primary-700">
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Premium
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Your recent activity will appear here</p>
                  <p className="text-sm mt-2">Start tracking your baby's journey to see your timeline</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <AppFooter />
      <MobileNav />
    </div>
  );
}