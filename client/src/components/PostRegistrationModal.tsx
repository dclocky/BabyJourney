import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Baby, Heart, Sparkles } from "lucide-react";

interface PostRegistrationModalProps {
  open: boolean;
  onClose: () => void;
  onPregnancySelect: () => void;
  onBabySelect: () => void;
  userName?: string;
}

export function PostRegistrationModal({ 
  open, 
  onClose, 
  onPregnancySelect, 
  onBabySelect,
  userName 
}: PostRegistrationModalProps) {
  const firstName = userName?.split(" ")[0] || "";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-purple-600" />
          </div>
          <DialogTitle className="text-2xl font-bold">
            Welcome to your journey, {firstName}! 🎉
          </DialogTitle>
          <DialogDescription className="text-lg mt-2">
            Let's get you started with the perfect tracking experience for your situation
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 py-6">
          {/* Pregnancy Option */}
          <Card 
            className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 hover:border-pink-300"
            onClick={onPregnancySelect}
          >
            <CardHeader className="text-center pb-3">
              <div className="mx-auto w-12 h-12 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center mb-3">
                <Heart className="w-6 h-6 text-pink-600" />
              </div>
              <CardTitle className="text-xl text-pink-700">I'm Pregnant</CardTitle>
              <CardDescription>
                Track your pregnancy journey week by week
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-pink-400 rounded-full mr-2"></div>
                  Weekly development tracking
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-pink-400 rounded-full mr-2"></div>
                  Symptom monitoring
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-pink-400 rounded-full mr-2"></div>
                  Appointment scheduling
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-pink-400 rounded-full mr-2"></div>
                  Baby size comparisons
                </div>
              </div>
              <Button className="w-full mt-4 bg-pink-600 hover:bg-pink-700">
                Start Pregnancy Journey
              </Button>
            </CardContent>
          </Card>

          {/* Baby Option */}
          <Card 
            className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 hover:border-blue-300"
            onClick={onBabySelect}
          >
            <CardHeader className="text-center pb-3">
              <div className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mb-3">
                <Baby className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl text-blue-700">Add My Baby</CardTitle>
              <CardDescription>
                Track your little one's growth and milestones
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                  Growth chart tracking
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                  Milestone recording
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                  Feeding & sleep logs
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                  Photo memories
                </div>
              </div>
              <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
                Add Baby Profile
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Don't worry - you can always add more profiles later!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}