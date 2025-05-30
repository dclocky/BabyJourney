import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Crown } from "lucide-react";
import { NavigationBar } from "@/components/navigation-bar";

// Load Stripe
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ clientSecret }: { clientSecret: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/dashboard",
      },
      redirect: "if_required"
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
    } else if (paymentIntent.status === 'succeeded') {
      // Confirm the upgrade on our backend
      try {
        await apiRequest("POST", "/api/confirm-premium-upgrade", {
          paymentIntentId: paymentIntent.id
        });
        
        toast({
          title: "Payment Successful!",
          description: "Welcome to Premium! You now have access to all premium features.",
        });
        
        // Redirect to dashboard
        window.location.href = "/dashboard";
      } catch (err) {
        toast({
          title: "Payment processed, but upgrade failed",
          description: "Please contact support if premium features are not activated.",
          variant: "destructive",
        });
      }
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full" 
        size="lg" 
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? "Processing..." : "Pay €19.99"}
      </Button>
    </form>
  );
};

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Create PaymentIntent as soon as the page loads
    apiRequest("POST", "/api/create-payment-intent", { amount: 1999 }) // €19.99 in cents
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error creating payment intent:", error);
        toast({
          title: "Error",
          description: "Failed to initialize payment. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
      });
  }, [toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50">
        <NavigationBar />
        <div className="flex items-center justify-center pt-32">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50">
        <NavigationBar />
        <div className="container mx-auto px-4 pt-32">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <p className="text-red-600">Unable to initialize payment. Please try again later.</p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50">
      <NavigationBar />
      <div className="container mx-auto px-4 pt-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Crown className="h-8 w-8 text-yellow-500 mr-2" />
              <h1 className="text-3xl font-bold text-gray-900">Upgrade to Premium</h1>
            </div>
            <p className="text-lg text-gray-600">
              One-time payment of €19.99 - Lifetime access to all premium features
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Premium Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Crown className="h-5 w-5 text-yellow-500 mr-2" />
                  Premium Features
                </CardTitle>
                <CardDescription>
                  Everything you need for your parenting journey
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Unlimited Photo Storage</p>
                    <p className="text-sm text-gray-600">Store unlimited memories of your baby's journey</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Advanced Growth Tracking</p>
                    <p className="text-sm text-gray-600">Detailed charts and milestone predictions</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Family Timeline</p>
                    <p className="text-sm text-gray-600">Share updates with family members</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Conception Tracker</p>
                    <p className="text-sm text-gray-600">Complete fertility and ovulation tracking</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Partner Account Linking</p>
                    <p className="text-sm text-gray-600">Share access with your partner</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Priority Support</p>
                    <p className="text-sm text-gray-600">Get help when you need it most</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Form */}
            <Card>
              <CardHeader>
                <CardTitle>Complete Your Purchase</CardTitle>
                <CardDescription>
                  Secure payment powered by Stripe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm clientSecret={clientSecret} />
                </Elements>
                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm text-gray-600 text-center">
                    🔒 Your payment information is secure and encrypted
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}