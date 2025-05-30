import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { AppTabs } from "@/components/app-tabs";
import { MobileNav } from "@/components/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { OnboardingTour, useOnboarding } from "@/components/onboarding-tour";
import { useToast } from "@/hooks/use-toast";
import { Settings, User, Bell, Shield, Crown, HelpCircle } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { resetTour, completeTour } = useOnboarding();
  const [showTour, setShowTour] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    milestones: true,
    appointments: true,
    growth: false
  });

  const handleStartTour = () => {
    resetTour();
    setShowTour(true);
  };

  const handleTourComplete = () => {
    setShowTour(false);
    completeTour();
    toast({
      title: "Tour Completed",
      description: "Welcome to BabyJourney! You're all set to start tracking your journey.",
    });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-secondary-50">
      <AppHeader />
      <AppTabs />

      <main className="flex-grow container mx-auto px-4 py-6 pb-20 md:pb-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account preferences and privacy settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Settings */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" defaultValue={user.fullName} />
                </div>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" defaultValue={user.username} />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue={user.email} />
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={user.isPremium ? "default" : "secondary"}>
                  {user.isPremium ? (
                    <>
                      <Crown className="w-3 h-3 mr-1" />
                      Premium Account
                    </>
                  ) : (
                    "Free Account"
                  )}
                </Badge>
                {!user.isPremium && (
                  <Button size="sm" variant="outline">
                    Upgrade to Premium
                  </Button>
                )}
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <Switch
                  id="email-notifications"
                  checked={notifications.email}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, email: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="push-notifications">Push Notifications</Label>
                <Switch
                  id="push-notifications"
                  checked={notifications.push}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, push: checked }))
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label htmlFor="milestone-alerts">Milestone Alerts</Label>
                <Switch
                  id="milestone-alerts"
                  checked={notifications.milestones}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, milestones: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="appointment-reminders">Appointment Reminders</Label>
                <Switch
                  id="appointment-reminders"
                  checked={notifications.appointments}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, appointments: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="growth-tracking">Growth Tracking</Label>
                <Switch
                  id="growth-tracking"
                  checked={notifications.growth}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, growth: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Privacy & Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Account Security</h4>
                  <Button variant="outline" className="w-full">
                    Change Password
                  </Button>
                  <Button variant="outline" className="w-full">
                    Two-Factor Authentication
                  </Button>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Data & Privacy</h4>
                  <Button variant="outline" className="w-full">
                    Download My Data
                  </Button>
                  <Button variant="outline" className="w-full text-destructive">
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help & Support */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <HelpCircle className="w-5 h-5 mr-2" />
                Help & Support
              </CardTitle>
              <CardDescription>
                Get help and learn how to use BabyJourney
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleStartTour}
                className="w-full"
                variant="outline"
              >
                Take App Tour
              </Button>
              <Button variant="outline" className="w-full">
                Help Center
              </Button>
              <Button variant="outline" className="w-full">
                Contact Support
              </Button>
              <Button variant="outline" className="w-full">
                Send Feedback
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Onboarding Tour */}
        <OnboardingTour
          isOpen={showTour}
          onComplete={handleTourComplete}
          onSkip={handleTourComplete}
        />
      </main>

      <AppFooter />
      <MobileNav />
    </div>
  );
}