import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft } from "lucide-react";
import { NavigationBar } from "@/components/navigation-bar";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50">
      <NavigationBar />
      <div className="container mx-auto px-4 pt-32">
        <Card className="max-w-lg mx-auto">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <h1 className="text-6xl font-bold text-gray-300 mb-2">404</h1>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Page Not Found</h2>
              <p className="text-gray-600 mb-8">
                Sorry, the page you're looking for doesn't exist or may have been moved.
              </p>
            </div>
            
            <div className="space-y-3">
              <Link href="/dashboard">
                <Button className="w-full" size="lg">
                  <Home className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>
              </Link>
              
              <Button 
                variant="outline" 
                onClick={() => window.history.back()}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}