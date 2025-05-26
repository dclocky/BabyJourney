import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AppHeader } from "@/components/app-header";
import { AppTabs } from "@/components/app-tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Crown, 
  Camera, 
  TrendingUp, 
  Users, 
  Cloud, 
  Shield,
  CheckCircle,
  Star,
  Sparkles,
  CreditCard,
  Lock
} from "lucide-react";

const premiumFeatures = [
  {
    icon: <Camera className="w-6 h-6" />,
    title: "Unlimited Photo Storage",
    description: "Store thousands of precious memories without limits",
    benefits: ["Unlimited high-quality uploads", "Auto-organized timelines", "Beautiful photo books"]
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: "Advanced Growth Analytics",
    description: "WHO percentile tracking with detailed insights",
    benefits: ["WHO growth charts", "Trend analysis", "Doctor-ready reports"]
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Enhanced Family Sharing",
    description: "Advanced privacy controls and unlimited family members",
    benefits: ["Unlimited family members", "Custom permissions", "Activity notifications"]
  },
  {
    icon: <Cloud className="w-6 h-6" />,
    title: "Secure Cloud Backup",
    description: "Never lose your precious memories",
    benefits: ["Automatic synchronization", "Cross-device access", "99.9% uptime"]
  }
];

export default function UpgradePage() {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpgrade = async () => {
    setIsProcessing(true);
    
    try {
      // This would integrate with Stripe for actual payment processing
      // For now, show a message that Stripe keys are needed
      toast({
        title: "Payment Setup Required",
        description: "Stripe API keys need to be configured to process payments securely.",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "There was an issue processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-secondary-50">
      <AppHeader />
      <AppTabs />

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-full flex items-center justify-center mb-6">
              <Crown className="w-10 h-10 text-amber-600" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-4">
              Upgrade to Premium
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Unlock all features and take your pregnancy and baby tracking to the next level
            </p>
          </div>

          {/* Pricing Card */}
          <Card className="border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 mb-8">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-amber-600 mr-3" />
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xl px-6 py-3">
                  Limited Time Offer
                </Badge>
              </div>
              
              <div className="mb-6">
                <span className="text-6xl font-bold text-amber-600">€28</span>
                <span className="text-xl text-muted-foreground ml-3">one-time payment</span>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4 mb-8 text-sm">
                <div className="flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  <span>Lifetime access</span>
                </div>
                <div className="flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  <span>No monthly fees</span>
                </div>
                <div className="flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  <span>All future updates</span>
                </div>
              </div>

              <Button 
                onClick={handleUpgrade}
                disabled={isProcessing}
                size="lg"
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-12 py-4 text-lg"
              >
                {isProcessing ? (
                  "Processing..."
                ) : (
                  <>
                    <CreditCard className="w-6 h-6 mr-3" />
                    Upgrade Now - €28 Lifetime
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center mt-4 text-sm text-muted-foreground">
                <Lock className="w-4 h-4 mr-2" />
                Secure payment • 30-day money-back guarantee • GDPR compliant
              </div>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {premiumFeatures.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center">
                      {feature.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {feature.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-center text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {benefit}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Value Proposition */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 mb-8">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-6">Why Choose Premium?</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Star className="w-12 h-12 text-yellow-500 mx-auto" />
                  <h4 className="font-semibold">Unlimited Memories</h4>
                  <p className="text-sm text-muted-foreground">
                    Never worry about storage limits for your precious photos and moments
                  </p>
                </div>
                <div className="space-y-3">
                  <TrendingUp className="w-12 h-12 text-green-500 mx-auto" />
                  <h4 className="font-semibold">Expert Insights</h4>
                  <p className="text-sm text-muted-foreground">
                    Get detailed analytics and professional-grade growth tracking
                  </p>
                </div>
                <div className="space-y-3">
                  <Shield className="w-12 h-12 text-blue-500 mx-auto" />
                  <h4 className="font-semibold">Peace of Mind</h4>
                  <p className="text-sm text-muted-foreground">
                    Secure backup and priority support when you need it most
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Integration Notice */}
          <Alert className="mb-8">
            <Lock className="h-4 w-4" />
            <AlertDescription>
              <strong>Secure Payment Processing:</strong> This app uses Stripe for secure, GDPR-compliant payment processing. 
              To enable payments, Stripe API keys need to be configured by the administrator.
            </AlertDescription>
          </Alert>

          {/* FAQ Section */}
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Is this really a one-time payment?</h4>
                <p className="text-sm text-muted-foreground">
                  Yes! Pay once and get lifetime access to all premium features, including future updates.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">What if I'm not satisfied?</h4>
                <p className="text-sm text-muted-foreground">
                  We offer a 30-day money-back guarantee. If you're not completely satisfied, we'll refund your payment.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Is my data secure?</h4>
                <p className="text-sm text-muted-foreground">
                  Absolutely. We use bank-level encryption and are fully GDPR compliant to protect your precious memories.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}