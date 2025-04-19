import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sprout } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function AppHeader() {
  const { user, logoutMutation, createPaymentIntentMutation, confirmPremiumUpgradeMutation } = useAuth();
  const { toast } = useToast();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  
  const handleUpgrade = async () => {
    try {
      console.log("Creating payment intent from app header...");
      const result = await createPaymentIntentMutation.mutateAsync();
      console.log("Payment intent created:", result);
      // In a real implementation, we would use Stripe Elements to collect payment
      // For now, we'll just store the mock payment intent ID
      setPaymentIntentId(result.clientSecret.split('_')[1]);
      setShowPaymentDialog(true);
    } catch (error) {
      console.error("Failed to create payment intent", error);
      toast({
        title: "Payment initialization failed",
        description: "There was an error starting the payment process. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleConfirmPayment = () => {
    if (paymentIntentId) {
      confirmPremiumUpgradeMutation.mutate(paymentIntentId);
      setShowPaymentDialog(false);
    }
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  if (!user) {
    return null;
  }
  
  // Get user initials for avatar
  const getInitials = () => {
    if (!user?.fullName) return "U";
    return user.fullName
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <>
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <div className="mr-2 text-primary-500 text-3xl">
              <Sprout />
            </div>
            <Link href="/">
              <h1 className="font-bold text-xl text-primary-500 cursor-pointer">BabyJourney</h1>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {!user.isPremium && (
              <Button
                variant="outline"
                className="hidden md:flex bg-accent-50 text-accent-500 hover:bg-accent-100 border-accent-100"
                onClick={handleUpgrade}
                disabled={createPaymentIntentMutation.isPending}
              >
                {createPaymentIntentMutation.isPending ? "Processing..." : "Upgrade to Premium"}
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger className="focus:outline-none">
                <div className="flex items-center space-x-2">
                  <Avatar>
                    <AvatarFallback className="bg-primary-500 text-white">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline text-sm font-medium">{user.fullName}</span>
                  <i className="ri-arrow-down-s-line"></i>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="cursor-pointer">
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" asChild>
                  <Link href="/family">Family Members</Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer text-destructive focus:text-destructive" 
                  onClick={handleLogout}
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade to Premium</DialogTitle>
            <DialogDescription>
              Unlock all premium features for just $9.99/month.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <h3 className="font-medium mb-2">Premium Benefits:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Unlimited photo uploads</li>
              <li>Advanced pregnancy tracking tools</li>
              <li>Detailed developmental milestone tracking</li>
              <li>Customizable journals and reminders</li>
              <li>Priority customer support</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmPayment} disabled={confirmPremiumUpgradeMutation.isPending}>
              {confirmPremiumUpgradeMutation.isPending ? "Processing..." : "Confirm Payment ($9.99)"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
