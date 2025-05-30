import { useAuth } from "@/hooks/use-auth";
import { NavigationBar } from "@/components/navigation-bar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useLocation } from "wouter";
import { AppHeader } from "@/components/app-header";
import { AppTabs } from "@/components/app-tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PackageOpen, Gift, Dices, FileHeart, Users, Target, Utensils } from "lucide-react";

export default function ExtrasPage() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar />
      <div className="container py-8">
        <AppHeader />
        <AppTabs activeTab="extras" />
        
        <h1 className="text-3xl font-bold mb-6">Extras</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Registry Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Gift className="h-5 w-5 text-primary" />
                <CardTitle>Registry</CardTitle>
              </div>
              <CardDescription>
                Create and manage gift registries for your baby
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Share your registry with family and friends so they know exactly what you need for your new arrival.
              </p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => navigate("/registry")} className="w-full">
                Manage Registry
              </Button>
            </CardFooter>
          </Card>
          
          {/* Baby Pool Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Dices className="h-5 w-5 text-primary" />
                <CardTitle>Baby Pool</CardTitle>
              </div>
              <CardDescription>
                Create a fun baby arrival guessing game
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Let family and friends guess your baby's birth date, weight, height, and gender. See who gets closest!
              </p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => navigate("/baby-pool")} className="w-full">
                Set Up Baby Pool
              </Button>
            </CardFooter>
          </Card>
          
          {/* Baby Names Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <FileHeart className="h-5 w-5 text-primary" />
                <CardTitle>Baby Names</CardTitle>
              </div>
              <CardDescription>
                Collect and organize baby name ideas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Keep track of baby name ideas, their meanings, origins, and ratings. Save your favorites and organize them by gender.
              </p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => navigate("/baby-names")} className="w-full">
                Explore Names
              </Button>
            </CardFooter>
          </Card>
          
          {/* Conception Tracker Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-primary" />
                <CardTitle>Conception Tracker</CardTitle>
              </div>
              <CardDescription>
                Track ovulation and maximize conception chances
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Monitor fertility symptoms, ovulation tests, cycles, and health goals to optimize your conception journey.
              </p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => navigate("/conception-tracker")} className="w-full">
                Start Tracking
              </Button>
            </CardFooter>
          </Card>
          
          {/* Babysitter Mode Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle>Babysitter Mode</CardTitle>
              </div>
              <CardDescription>
                Share baby care information with caregivers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Generate a printable care sheet with feeding schedules, sleep routines, emergency contacts, and important notes for babysitters.
              </p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => navigate("/babysitter")} className="w-full">
                Create Care Sheet
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}