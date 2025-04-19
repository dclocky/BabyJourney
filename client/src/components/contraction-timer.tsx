import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Timer, AlertCircle, Play, Pause, StopCircle, Plus, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";
import { formatDuration } from "@/lib/utils";

type Contraction = {
  id: string;
  start: Date;
  end: Date | null;
  duration: number | null;
  interval: number | null;
};

export function ContractionTimer() {
  const [contractions, setContractions] = useState<Contraction[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentContraction, setCurrentContraction] = useState<Contraction | null>(null);

  // Update the current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate average duration and interval
  const averageDuration = contractions.length > 0
    ? contractions.filter(c => c.duration).reduce((sum, c) => sum + (c.duration || 0), 0) / contractions.filter(c => c.duration).length
    : 0;

  const averageInterval = contractions.length > 1
    ? contractions.filter(c => c.interval).reduce((sum, c) => sum + (c.interval || 0), 0) / contractions.filter(c => c.interval).length
    : 0;
  
  // Start tracking a new contraction
  const startContraction = () => {
    const now = new Date();
    const newContraction: Contraction = {
      id: Date.now().toString(),
      start: now,
      end: null,
      duration: null,
      interval: contractions.length > 0 && contractions[0].end 
        ? Math.floor((now.getTime() - contractions[0].end.getTime()) / 1000)
        : null
    };
    
    setCurrentContraction(newContraction);
    setIsTracking(true);
  };

  // Stop tracking the current contraction
  const stopContraction = () => {
    if (currentContraction) {
      const now = new Date();
      const duration = Math.floor((now.getTime() - currentContraction.start.getTime()) / 1000);
      
      const completed: Contraction = {
        ...currentContraction,
        end: now,
        duration
      };
      
      setContractions([completed, ...contractions]);
      setCurrentContraction(null);
      setIsTracking(false);
    }
  };

  // Reset the timer and clear all contractions
  const resetTimer = () => {
    setContractions([]);
    setCurrentContraction(null);
    setIsTracking(false);
  };

  // Remove a specific contraction
  const removeContraction = (id: string) => {
    setContractions(contractions.filter(c => c.id !== id));
  };

  // Get the current contraction duration
  const getCurrentDuration = () => {
    if (!currentContraction) return 0;
    return Math.floor((currentTime.getTime() - currentContraction.start.getTime()) / 1000);
  };

  // Determine contraction frequency status
  const getContractionStatus = () => {
    if (contractions.length < 3) return null;
    
    if (averageInterval <= 120 && averageDuration >= 60) {
      return {
        label: "Active Labor",
        description: "Contractions are 2 minutes apart or less and last 60+ seconds",
        color: "bg-red-500"
      };
    } else if (averageInterval <= 300 && averageDuration >= 45) {
      return {
        label: "Early Labor",
        description: "Contractions are 5 minutes apart or less and last 45+ seconds",
        color: "bg-amber-500"
      };
    } else {
      return {
        label: "Pre-labor",
        description: "Contractions are more than 5 minutes apart",
        color: "bg-green-500"
      };
    }
  };

  const status = getContractionStatus();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Timer className="mr-2 h-5 w-5" />
          Contraction Timer
        </CardTitle>
        <CardDescription>
          Track your contractions to help determine when to go to the hospital
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Card */}
        {status && (
          <Card>
            <CardHeader className={`${status.color} text-white rounded-t-lg py-2`}>
              <CardTitle className="text-base">{status.label}</CardTitle>
            </CardHeader>
            <CardContent className="py-3">
              <div className="text-sm text-muted-foreground">{status.description}</div>
              {status.label === "Active Labor" && (
                <div className="mt-2 flex items-center text-red-500">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  <span className="text-sm font-semibold">Consider going to the hospital</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Timer Display */}
        <div className="text-center py-6 space-y-4">
          <div className="text-4xl font-bold">
            {isTracking ? formatDuration(getCurrentDuration()) : "00:00:00"}
          </div>
          <div className="text-sm text-muted-foreground">
            {isTracking ? "Contraction in progress..." : "Press Start when a contraction begins"}
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {!isTracking ? (
              <Button onClick={startContraction} className="flex items-center">
                <Play className="mr-2 h-4 w-4" />
                Start
              </Button>
            ) : (
              <Button onClick={stopContraction} variant="destructive" className="flex items-center">
                <StopCircle className="mr-2 h-4 w-4" />
                Stop
              </Button>
            )}
            
            <Button onClick={resetTimer} variant="outline" className="flex items-center">
              <XCircle className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>

        {/* Stats */}
        {contractions.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Avg Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatDuration(averageDuration)}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Avg Interval</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatDuration(averageInterval)}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* History */}
        {contractions.length > 0 && (
          <div>
            <h3 className="text-base font-medium mb-2">History</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {contractions.map((contraction, index) => (
                <div key={contraction.id} className="flex items-center justify-between py-2 border-b">
                  <div>
                    <div className="text-sm font-medium">
                      {format(contraction.start, "h:mm a")}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      Duration: {formatDuration(contraction.duration || 0)}
                      {contraction.interval && (
                        <span className="ml-2">Interval: {formatDuration(contraction.interval)}</span>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeContraction(contraction.id)}
                    className="h-6 w-6 p-0"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col items-start text-xs text-muted-foreground">
        <div>
          <strong>Early Labor:</strong> Contractions every 5-30 minutes lasting 30-45 seconds
        </div>
        <div>
          <strong>Active Labor:</strong> Contractions every 2-3 minutes lasting 60+ seconds
        </div>
        <div>
          <strong>When to go to the hospital:</strong> Contractions 5 minutes apart lasting 1 minute for 1 hour (5-1-1 rule)
        </div>
      </CardFooter>
    </Card>
  );
}