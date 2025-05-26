import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Users, Crown, Eye, Gift, Calendar } from "lucide-react";

interface LoginModeSelectorProps {
  onModeSelect: (mode: "mother" | "family") => void;
}

export function LoginModeSelector({ onModeSelect }: LoginModeSelectorProps) {
  const [selectedMode, setSelectedMode] = useState<"mother" | "family" | null>(null);

  const handleModeSelect = (mode: "mother" | "family") => {
    setSelectedMode(mode);
    onModeSelect(mode);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Choose Your Access Level</h2>
        <p className="text-muted-foreground">
          Select the login mode that matches your role in this journey
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Mother Login */}
        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 ${
            selectedMode === "mother" ? "border-pink-300 bg-pink-50" : "hover:border-pink-300"
          }`}
          onClick={() => handleModeSelect("mother")}
        >
          <CardHeader className="text-center pb-3">
            <div className="mx-auto w-12 h-12 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center mb-3">
              <Crown className="w-6 h-6 text-pink-600" />
            </div>
            <CardTitle className="text-xl text-pink-700 flex items-center justify-center gap-2">
              Mother Login
              <Badge variant="secondary" className="bg-pink-100 text-pink-800">
                Full Access
              </Badge>
            </CardTitle>
            <CardDescription>
              Complete access to all features for tracking your pregnancy and baby's journey
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <Heart className="w-4 h-4 text-pink-500 mr-2" />
                <span>Full pregnancy tracking</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 text-pink-500 mr-2" />
                <span>Medical appointments & records</span>
              </div>
              <div className="flex items-center">
                <Gift className="w-4 h-4 text-pink-500 mr-2" />
                <span>Baby registry management</span>
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 text-pink-500 mr-2" />
                <span>Family group administration</span>
              </div>
              <div className="flex items-center">
                <Crown className="w-4 h-4 text-pink-500 mr-2" />
                <span>All premium features access</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Family Login */}
        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 ${
            selectedMode === "family" ? "border-blue-300 bg-blue-50" : "hover:border-blue-300"
          }`}
          onClick={() => handleModeSelect("family")}
        >
          <CardHeader className="text-center pb-3">
            <div className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mb-3">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle className="text-xl text-blue-700 flex items-center justify-center gap-2">
              Family Login
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Shared Access
              </Badge>
            </CardTitle>
            <CardDescription>
              View and contribute to the journey as a trusted family member
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <Eye className="w-4 h-4 text-blue-500 mr-2" />
                <span>Timeline view with photos & milestones</span>
              </div>
              <div className="flex items-center">
                <Gift className="w-4 h-4 text-blue-500 mr-2" />
                <span>Baby pool participation</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 text-blue-500 mr-2" />
                <span>Registry viewing and purchasing</span>
              </div>
              <div className="flex items-center">
                <Heart className="w-4 h-4 text-blue-500 mr-2" />
                <span>Name suggestions</span>
              </div>
              <div className="flex items-center text-blue-600 font-medium">
                <Crown className="w-4 h-4 text-blue-500 mr-2" />
                <span>Cravings page (partners only)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>Don't worry - you can always switch between modes later</p>
      </div>
    </div>
  );
}