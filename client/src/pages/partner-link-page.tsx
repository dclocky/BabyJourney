import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Heart, UserPlus, Unlink, Mail } from "lucide-react";
import { NavigationBar } from "@/components/navigation-bar";

export default function PartnerLinkPage() {
  const [partnerEmail, setPartnerEmail] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
    queryFn: () => apiRequest("GET", "/api/user"),
  });

  const linkPartnerMutation = useMutation({
    mutationFn: (email: string) => 
      apiRequest("POST", "/api/link-partner", { partnerEmail: email }),
    onSuccess: () => {
      toast({
        title: "Partner Linked Successfully!",
        description: "Your partner can now access your family data.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setPartnerEmail("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Link Partner",
        description: error.message || "Please check the email address and try again.",
        variant: "destructive",
      });
    },
  });

  const unlinkPartnerMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/unlink-partner"),
    onSuccess: () => {
      toast({
        title: "Partner Unlinked",
        description: "Your partner no longer has access to your family data.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Unlink Partner",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleLinkPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your partner's email address.",
        variant: "destructive",
      });
      return;
    }
    linkPartnerMutation.mutate(partnerEmail.trim());
  };

  const handleUnlinkPartner = () => {
    if (window.confirm("Are you sure you want to unlink your partner? They will lose access to your family data.")) {
      unlinkPartnerMutation.mutate();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50">
      <NavigationBar />
      <div className="container mx-auto px-4 pt-24">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Heart className="h-8 w-8 text-pink-500 mr-2" />
              <h1 className="text-3xl font-bold text-gray-900">Partner Account</h1>
            </div>
            <p className="text-lg text-gray-600">
              Share your parenting journey with your partner
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserPlus className="h-5 w-5 mr-2" />
                Partner Linking
              </CardTitle>
              <CardDescription>
                Connect your account with your partner to share family data, photos, and milestones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {user?.partnerId ? (
                // Partner is linked
                <div className="space-y-4">
                  <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
                    <Heart className="h-5 w-5 text-green-600 mr-3" />
                    <div>
                      <p className="font-medium text-green-800">
                        Partner account is linked
                      </p>
                      <p className="text-sm text-green-600">
                        Your partner has access to your family data
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Shared Access</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Family timeline
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Baby photos
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Growth records
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Milestones
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Appointments
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Daily care logs
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <Button
                    variant="destructive"
                    onClick={handleUnlinkPartner}
                    disabled={unlinkPartnerMutation.isPending}
                    className="w-full"
                  >
                    <Unlink className="h-4 w-4 mr-2" />
                    {unlinkPartnerMutation.isPending ? "Unlinking..." : "Unlink Partner"}
                  </Button>
                </div>
              ) : (
                // No partner linked
                <div className="space-y-4">
                  <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">No partner account linked</p>
                    <p className="text-sm text-gray-500">
                      Link your partner's account to share your parenting journey together
                    </p>
                  </div>

                  <form onSubmit={handleLinkPartner} className="space-y-4">
                    <div>
                      <Label htmlFor="partnerEmail">Partner's Email Address</Label>
                      <div className="relative mt-1">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="partnerEmail"
                          type="email"
                          value={partnerEmail}
                          onChange={(e) => setPartnerEmail(e.target.value)}
                          placeholder="Enter your partner's email"
                          className="pl-10"
                          required
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Your partner must already have a BabyJourney account with this email
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={linkPartnerMutation.isPending}
                      className="w-full"
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      {linkPartnerMutation.isPending ? "Linking..." : "Link Partner Account"}
                    </Button>
                  </form>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">What gets shared?</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Baby photos and memories</li>
                      <li>• Growth charts and milestones</li>
                      <li>• Feeding, sleep, and diaper logs</li>
                      <li>• Medical appointments and vaccinations</li>
                      <li>• Family timeline updates</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}