import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useLocation } from "wouter";
import { AppHeader } from "@/components/app-header";
import { AppTabs } from "@/components/app-tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PackageOpen, Gift, Dices, Users } from "lucide-react";

export default function ExtrasPage() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();

  return (
    <div className="container py-8">
      <AppHeader />
      <AppTabs activeTab="extras" />
      
      <div className="mt-8">
        <h1 className="text-3xl font-bold mb-6">Extras</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          
          {/* Coming Soon Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle>Coming Soon</CardTitle>
              </div>
              <CardDescription>
                More features on the way
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                We're working on more exciting features to help you document and celebrate your maternal journey.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" disabled className="w-full">
                Stay Tuned
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}