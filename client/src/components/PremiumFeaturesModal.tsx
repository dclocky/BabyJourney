import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  Camera, 
  TrendingUp, 
  Users, 
  Cloud, 
  Shield,
  Crown,
  Sparkles,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import { useLocation } from "wouter";

interface PremiumFeaturesModalProps {
  open: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  userType: "pregnancy" | "baby";
  userName?: string;
}

interface PremiumFeature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  benefits: string[];
  highlight?: boolean;
}

const premiumFeatures: PremiumFeature[] = [
  {
    id: "unlimited-photos",
    title: "Unlimited Photo Storage",
    description: "Store thousands of precious memories without limits",
    icon: <Camera className="w-6 h-6" />,
    benefits: [
      "Unlimited high-quality photo uploads",
      "Auto-organized memory timelines",
      "Create beautiful photo books",
      "Export and share albums"
    ],
    highlight: true
  },
  {
    id: "growth-analytics",
    title: "Advanced Growth Analytics",
    description: "WHO percentile tracking with detailed insights",
    icon: <TrendingUp className="w-6 h-6" />,
    benefits: [
      "WHO growth percentile charts",
      "Trend analysis and predictions",
      "Doctor-ready growth reports",
      "Compare with developmental milestones"
    ]
  },
  {
    id: "family-premium",
    title: "Enhanced Family Sharing",
    description: "Advanced privacy controls and unlimited family members",
    icon: <Users className="w-6 h-6" />,
    benefits: [
      "Invite unlimited family members",
      "Advanced privacy settings",
      "Custom permission controls",
      "Family activity notifications"
    ]
  },
  {
    id: "cloud-backup",
    title: "Secure Cloud Backup",
    description: "Never lose your precious memories with automatic backup",
    icon: <Cloud className="w-6 h-6" />,
    benefits: [
      "Automatic cloud synchronization",
      "Cross-device access",
      "Data export capabilities",
      "99.9% uptime guarantee"
    ]
  },
  {
    id: "priority-support",
    title: "Priority Support",
    description: "Get expert help when you need it most",
    icon: <Shield className="w-6 h-6" />,
    benefits: [
      "24/7 priority customer support",
      "Expert parenting guidance",
      "Technical assistance",
      "Feature request priority"
    ]
  }
];

export function PremiumFeaturesModal({ 
  open, 
  onClose, 
  onUpgrade, 
  userType, 
  userName 
}: PremiumFeaturesModalProps) {
  const [, setLocation] = useLocation();
  const firstName = userName?.split(" ")[0] || "";

  const handleUpgrade = () => {
    onUpgrade();
    setLocation("/upgrade");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-full flex items-center justify-center mb-4">
            <Crown className="w-8 h-8 text-amber-600" />
          </div>
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Unlock Premium Features
          </DialogTitle>
          <DialogDescription className="text-lg mt-2">
            Take your {userType === "pregnancy" ? "pregnancy" : "baby"} tracking to the next level, {firstName}!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Pricing Banner */}
          <Card className="border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-amber-600 mr-2" />
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-lg px-4 py-2">
                  Limited Time Offer
                </Badge>
              </div>
              <div className="mb-4">
                <span className="text-4xl font-bold text-amber-600">€28</span>
                <span className="text-lg text-muted-foreground ml-2">one-time payment</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Lifetime access • No monthly fees • All future updates included
              </p>
              <Button 
                onClick={handleUpgrade}
                size="lg"
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-8"
              >
                Upgrade to Premium
                <Crown className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {premiumFeatures.map((feature) => (
              <Card 
                key={feature.id} 
                className={`transition-all hover:shadow-lg ${
                  feature.highlight ? "border-2 border-amber-300 bg-amber-50/50" : ""
                }`}
              >
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center">
                      {feature.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                      {feature.highlight && (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs">
                          Most Popular
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription className="mt-2">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {feature.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center text-sm">
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
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-bold mb-4">Why Premium is Worth It</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="space-y-2">
                  <Star className="w-8 h-8 text-yellow-500 mx-auto" />
                  <p className="font-semibold">Unlimited Memories</p>
                  <p className="text-muted-foreground">Never worry about storage limits for your precious photos</p>
                </div>
                <div className="space-y-2">
                  <TrendingUp className="w-8 h-8 text-green-500 mx-auto" />
                  <p className="font-semibold">Expert Insights</p>
                  <p className="text-muted-foreground">Get detailed analytics and growth tracking</p>
                </div>
                <div className="space-y-2">
                  <Shield className="w-8 h-8 text-blue-500 mx-auto" />
                  <p className="font-semibold">Peace of Mind</p>
                  <p className="text-muted-foreground">Secure backup and priority support when you need it</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={handleUpgrade}
              size="lg"
              className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
            >
              Upgrade Now - €28 Lifetime
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
              size="lg"
              className="sm:w-32"
            >
              Maybe Later
            </Button>
          </div>

          <div className="text-center text-xs text-muted-foreground pt-2">
            Secure payment • 30-day money-back guarantee • GDPR compliant
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}