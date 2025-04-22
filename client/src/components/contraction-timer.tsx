import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Clock, PlayCircle, StopCircle, TimerReset } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Contraction {
  id?: number;
  pregnancyId: number;
  startTime: Date;
  endTime?: Date | null;
  duration?: number | null;
  intensity?: 'mild' | 'moderate' | 'strong';
}

export interface ContractionTimerProps {
  pregnancyId: number;
  pregnancyDue?: Date | null;
  existingContractions?: Contraction[];
}

export function ContractionTimer({ pregnancyId, pregnancyDue, existingContractions = [] }: ContractionTimerProps) {
  const { toast } = useToast();
  const [isTracking, setIsTracking] = useState(false);
  const [contractionStart, setContractionStart] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [contractions, setContractions] = useState<Contraction[]>(existingContractions);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [isNearDueDate, setIsNearDueDate] = useState(false);

  // Check if user is within 2 weeks of due date
  useEffect(() => {
    if (pregnancyDue) {
      const now = new Date();
      const dueDate = new Date(pregnancyDue);
      const twoWeeksBeforeDue = new Date(dueDate);
      twoWeeksBeforeDue.setDate(dueDate.getDate() - 14);
      
      if (now >= twoWeeksBeforeDue) {
        setIsNearDueDate(true);
      }
    }
  }, [pregnancyDue]);

  // Save contraction to database
  const saveContractionMutation = useMutation({
    mutationFn: async (contraction: Contraction) => {
      const response = await apiRequest(
        "POST", 
        `/api/pregnancies/${pregnancyId}/contractions`, 
        contraction
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/pregnancies/${pregnancyId}/contractions`] });
      toast({
        title: "Contraction saved",
        description: "Your contraction has been recorded",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to save contraction",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Start tracking a contraction
  const startContraction = () => {
    const now = new Date();
    setContractionStart(now);
    setIsTracking(true);
    setElapsed(0);
    
    // Start timer
    const id = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
    
    setIntervalId(id);
  };

  // Stop tracking and save the contraction
  const stopContraction = (intensity: 'mild' | 'moderate' | 'strong') => {
    if (!contractionStart) return;
    
    // Clear interval
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    
    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - contractionStart.getTime()) / 1000);
    
    // Create new contraction object
    const newContraction: Contraction = {
      pregnancyId,
      startTime: contractionStart,
      endTime,
      duration,
      intensity,
    };
    
    // Save to local state first
    setContractions(prev => [newContraction, ...prev]);
    
    // Reset tracking state
    setIsTracking(false);
    setContractionStart(null);
    setElapsed(0);
    
    // Save to database
    saveContractionMutation.mutate(newContraction);
  };

  // Cancel the current tracking
  const cancelTracking = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    
    setIsTracking(false);
    setContractionStart(null);
    setElapsed(0);
  };

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate average contraction duration
  const averageDuration = contractions.length > 0 
    ? Math.round(contractions.reduce((sum, c) => sum + (c.duration || 0), 0) / contractions.length) 
    : 0;

  // Calculate average time between contractions
  const calculateTimeBetween = () => {
    if (contractions.length < 2) return 'N/A';
    
    const intervals = [];
    for (let i = 0; i < contractions.length - 1; i++) {
      const current = new Date(contractions[i].startTime).getTime();
      const next = new Date(contractions[i + 1].startTime).getTime();
      intervals.push((current - next) / 1000); // in seconds
    }
    
    const averageSeconds = Math.round(intervals.reduce((sum, val) => sum + val, 0) / intervals.length);
    
    const mins = Math.floor(averageSeconds / 60);
    return `${mins} min`;
  };

  return (
    <Card className={cn(
      "shadow-md", 
      isTracking ? "border-primary border-2" : ""
    )}>
      <CardHeader className={cn(
        "flex flex-row items-center justify-between space-y-0 pb-2",
        isTracking ? "bg-primary/10" : ""
      )}>
        <div>
          <CardTitle className="text-xl">Contraction Timer</CardTitle>
          <CardDescription>
            {isNearDueDate 
              ? "Track your contractions in the final weeks" 
              : "Available in the last 2 weeks of pregnancy"}
          </CardDescription>
        </div>
        <Clock className="h-6 w-6 text-primary" />
      </CardHeader>
      
      <CardContent className="pt-6">
        {!isNearDueDate ? (
          <div className="flex items-center p-4 bg-muted/50 rounded-md">
            <AlertCircle className="h-5 w-5 text-muted-foreground mr-2" />
            <p className="text-sm text-muted-foreground">
              This feature will be available in the last 2 weeks before your due date
            </p>
          </div>
        ) : isTracking ? (
          <div className="space-y-5">
            <div className="text-center">
              <div className="text-4xl font-bold tracking-tighter mb-1">
                {formatTime(elapsed)}
              </div>
              <p className="text-sm text-muted-foreground">
                Contraction in progress...
              </p>
            </div>
            
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium mb-1">When contraction ends, select intensity:</p>
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  variant="outline" 
                  className="border-yellow-300 hover:bg-yellow-50"
                  onClick={() => stopContraction('mild')}
                >
                  Mild
                </Button>
                <Button 
                  variant="outline" 
                  className="border-orange-400 hover:bg-orange-50"
                  onClick={() => stopContraction('moderate')}
                >
                  Moderate
                </Button>
                <Button 
                  variant="outline" 
                  className="border-red-500 hover:bg-red-50"
                  onClick={() => stopContraction('strong')}
                >
                  Strong
                </Button>
              </div>
              <Button 
                variant="ghost" 
                className="mt-2" 
                onClick={cancelTracking}
              >
                <TimerReset className="mr-2 h-4 w-4" />
                Cancel Timing
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <Button 
              className="w-full py-6 text-lg" 
              onClick={startContraction}
              disabled={saveContractionMutation.isPending}
            >
              <PlayCircle className="mr-2 h-5 w-5" />
              Start Timing Contraction
            </Button>
            
            {contractions.length > 0 && (
              <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-md">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Avg. Duration</p>
                  <p className="font-bold">{formatTime(averageDuration)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Avg. Time Between</p>
                  <p className="font-bold">{calculateTimeBetween()}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      {contractions.length > 0 && (
        <CardFooter className="flex flex-col items-stretch border-t pt-4">
          <p className="font-medium mb-2">Recent Contractions</p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {contractions.slice(0, 5).map((contraction, i) => (
              <div key={i} className="flex justify-between items-center bg-muted/20 p-2 rounded-md text-sm">
                <div className="flex items-center">
                  <StopCircle className={cn(
                    "h-4 w-4 mr-2",
                    contraction.intensity === 'mild' ? "text-yellow-500" :
                    contraction.intensity === 'moderate' ? "text-orange-500" : 
                    "text-red-500"
                  )} />
                  <span>{format(new Date(contraction.startTime), "h:mm a")}</span>
                  <span className="mx-2 text-muted-foreground">•</span>
                  <span>{formatTime(contraction.duration || 0)}</span>
                </div>
                <Badge variant={
                  contraction.intensity === 'mild' ? "outline" :
                  contraction.intensity === 'moderate' ? "default" : 
                  "destructive"
                }>
                  {contraction.intensity}
                </Badge>
              </div>
            ))}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}