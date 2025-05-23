import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Crown, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function UpgradePage() {
  const { user, createPaymentIntentMutation, confirmPremiumUpgradeMutation } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpgrade = async () => {
    try {
      setIsProcessing(true);
      
      // Create payment intent
      const paymentIntent = await createPaymentIntentMutation.mutateAsync();
      
      // In a real app, this would integrate with Stripe Elements
      // For demo purposes, we'll simulate successful payment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Confirm the upgrade
      const mockPaymentIntentId = paymentIntent.clientSecret.split('_')[2];
      await confirmPremiumUpgradeMutation.mutateAsync(mockPaymentIntentId);
      
      toast({
        title: "Welcome to Premium! 🎉",
        description: "Your account has been upgraded successfully. Enjoy unlimited features!",
      });
      
      navigate("/");
    } catch (error) {
      toast({
        title: "Upgrade failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (user?.isPremium) {
    return (
      <div className="min-h-screen flex flex-col bg-secondary-50">
        <AppHeader />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <Crown className="h-16 w-16 text-primary-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-4">You're Already Premium!</h1>
              <p className="text-muted-foreground">
                Thank you for being a premium member. Enjoy all the unlimited features!
              </p>
            </div>
            <Button onClick={() => navigate("/")} size="lg">
              Back to Dashboard
            </Button>
          </div>
        </main>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-secondary-50">
      <AppHeader />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Crown className="h-16 w-16 text-primary-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4">Upgrade to Premium</h1>
            <p className="text-xl text-muted-foreground">
              Unlock unlimited features for your pregnancy and baby journey
            </p>
          </div>

          {/* Pricing Card */}
          <div className="max-w-md mx-auto mb-12">
            <Card className="border-2 border-primary-200">
              <CardHeader className="text-center bg-gradient-to-br from-violet-500 to-primary-500 text-white rounded-t-lg">
                <div className="flex items-center justify-center mb-2">
                  <Star className="h-6 w-6 mr-2" />
                  <CardTitle className="text-2xl">Premium Plan</CardTitle>
                </div>
                <div className="text-4xl font-bold">$9.99</div>
                <p className="text-sm opacity-90">per month</p>
              </CardHeader>
              <CardContent className="p-8">
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                    <span>Unlimited photo storage</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                    <span>Track multiple pregnancies or babies</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                    <span>Advanced health analytics & insights</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                    <span>Export data to PDF reports</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                    <span>Priority customer support</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                    <span>Expert Q&A access</span>
                  </li>
                </ul>

                <Button 
                  onClick={handleUpgrade}
                  disabled={isProcessing || createPaymentIntentMutation.isPending || confirmPremiumUpgradeMutation.isPending}
                  className="w-full bg-primary-500 hover:bg-primary-600 text-lg py-6"
                  size="lg"
                >
                  {isProcessing ? "Processing..." : "Upgrade Now"}
                </Button>
                
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Cancel anytime. 30-day money-back guarantee.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Features Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Free Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">1 pregnancy/baby profile</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">5 photos maximum</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">Basic milestone tracking</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">Appointment reminders</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary-200">
              <CardHeader>
                <CardTitle className="text-center flex items-center justify-center">
                  <Crown className="h-5 w-5 mr-2 text-primary-500" />
                  Premium Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">Unlimited pregnancies/babies</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">Unlimited photo storage</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">Advanced analytics</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">PDF export capabilities</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">Priority support</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <AppFooter />
    </div>
  );
}