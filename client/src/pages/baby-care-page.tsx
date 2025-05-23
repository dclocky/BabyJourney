import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { MobileNav } from "@/components/mobile-nav";
import { Baby, Clock, Droplets, Moon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface FeedingLog {
  id: number;
  date: string;
  type: 'bottle' | 'breast' | 'solids';
  amount?: number;
  duration?: number;
  food?: string;
  notes?: string;
}

interface DiaperLog {
  id: number;
  date: string;
  type: 'wet' | 'dirty' | 'both';
  notes?: string;
}

interface SleepLog {
  id: number;
  startTime: string;
  endTime?: string;
  duration?: number;
  type: 'nap' | 'night';
  quality?: 'good' | 'fair' | 'poor';
  location?: string;
  notes?: string;
}

export default function BabyCare() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showFeedingDialog, setShowFeedingDialog] = useState(false);
  const [showDiaperDialog, setShowDiaperDialog] = useState(false);
  const [showSleepDialog, setShowSleepDialog] = useState(false);
  
  // Get child ID (in a real app, this would come from route params or context)
  const childId = 1; // For demo purposes

  // Feeding log state
  const [feedingData, setFeedingData] = useState({
    type: 'bottle' as const,
    amount: '',
    duration: '',
    food: '',
    notes: ''
  });

  // Diaper log state
  const [diaperData, setDiaperData] = useState({
    type: 'wet' as const,
    notes: ''
  });

  // Sleep log state
  const [sleepData, setSleepData] = useState({
    startTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    endTime: '',
    type: 'nap' as const,
    quality: 'good' as const,
    location: '',
    notes: ''
  });

  // Fetch feeding logs
  const { data: feedingLogs = [] } = useQuery({
    queryKey: [`/api/children/${childId}/feeding-logs`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/children/${childId}/feeding-logs`);
      return await res.json();
    }
  });

  // Fetch diaper logs
  const { data: diaperLogs = [] } = useQuery({
    queryKey: [`/api/children/${childId}/diaper-logs`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/children/${childId}/diaper-logs`);
      return await res.json();
    }
  });

  // Fetch sleep logs
  const { data: sleepLogs = [] } = useQuery({
    queryKey: [`/api/children/${childId}/sleep-logs`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/children/${childId}/sleep-logs`);
      return await res.json();
    }
  });

  // Add feeding log mutation
  const addFeedingMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/children/${childId}/feeding-logs`, {
        childId,
        userId: 1, // In real app, get from auth context
        date: new Date().toISOString(),
        ...data,
        amount: data.amount ? parseInt(data.amount) : null,
        duration: data.duration ? parseInt(data.duration) : null
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/children/${childId}/feeding-logs`] });
      toast({ title: "Feeding logged successfully!" });
      setShowFeedingDialog(false);
      setFeedingData({ type: 'bottle', amount: '', duration: '', food: '', notes: '' });
    }
  });

  // Add diaper log mutation
  const addDiaperMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/children/${childId}/diaper-logs`, {
        childId,
        userId: 1,
        date: new Date().toISOString(),
        ...data
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/children/${childId}/diaper-logs`] });
      toast({ title: "Diaper change logged successfully!" });
      setShowDiaperDialog(false);
      setDiaperData({ type: 'wet', notes: '' });
    }
  });

  // Add sleep log mutation
  const addSleepMutation = useMutation({
    mutationFn: async (data: any) => {
      const duration = data.endTime ? 
        Math.round((new Date(data.endTime).getTime() - new Date(data.startTime).getTime()) / 60000) : 
        null;
      
      const res = await apiRequest("POST", `/api/children/${childId}/sleep-logs`, {
        childId,
        userId: 1,
        startTime: data.startTime,
        endTime: data.endTime || null,
        duration,
        type: data.type,
        quality: data.quality,
        location: data.location,
        notes: data.notes
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/children/${childId}/sleep-logs`] });
      toast({ title: "Sleep logged successfully!" });
      setShowSleepDialog(false);
      setSleepData({
        startTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        endTime: '',
        type: 'nap',
        quality: 'good',
        location: '',
        notes: ''
      });
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <AppHeader />
      <MobileNav />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Baby Care Tracking</h1>
          <p className="text-gray-600">Track feeding, diaper changes, and sleep patterns</p>
        </div>

        <Tabs defaultValue="feeding" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="feeding" className="flex items-center gap-2">
              <Baby className="h-4 w-4" />
              Feeding
            </TabsTrigger>
            <TabsTrigger value="diaper" className="flex items-center gap-2">
              <Droplets className="h-4 w-4" />
              Diaper
            </TabsTrigger>
            <TabsTrigger value="sleep" className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              Sleep
            </TabsTrigger>
          </TabsList>

          {/* Feeding Tab */}
          <TabsContent value="feeding" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Feeding Log</h2>
              <Button onClick={() => setShowFeedingDialog(true)}>
                Add Feeding
              </Button>
            </div>
            
            <div className="grid gap-4">
              {feedingLogs.map((log: FeedingLog) => (
                <Card key={log.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium capitalize">{log.type}</div>
                        <div className="text-sm text-gray-600">
                          {format(new Date(log.date), "MMM d, yyyy 'at' h:mm a")}
                        </div>
                        {log.amount && <div className="text-sm">Amount: {log.amount}ml</div>}
                        {log.duration && <div className="text-sm">Duration: {log.duration} min</div>}
                        {log.food && <div className="text-sm">Food: {log.food}</div>}
                        {log.notes && <div className="text-sm text-gray-600">{log.notes}</div>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Diaper Tab */}
          <TabsContent value="diaper" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Diaper Log</h2>
              <Button onClick={() => setShowDiaperDialog(true)}>
                Add Diaper Change
              </Button>
            </div>
            
            <div className="grid gap-4">
              {diaperLogs.map((log: DiaperLog) => (
                <Card key={log.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium capitalize">{log.type}</div>
                        <div className="text-sm text-gray-600">
                          {format(new Date(log.date), "MMM d, yyyy 'at' h:mm a")}
                        </div>
                        {log.notes && <div className="text-sm text-gray-600">{log.notes}</div>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Sleep Tab */}
          <TabsContent value="sleep" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Sleep Log</h2>
              <Button onClick={() => setShowSleepDialog(true)}>
                Add Sleep
              </Button>
            </div>
            
            <div className="grid gap-4">
              {sleepLogs.map((log: SleepLog) => (
                <Card key={log.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium capitalize">{log.type}</div>
                        <div className="text-sm text-gray-600">
                          Started: {format(new Date(log.startTime), "MMM d, yyyy 'at' h:mm a")}
                        </div>
                        {log.endTime && (
                          <div className="text-sm text-gray-600">
                            Ended: {format(new Date(log.endTime), "MMM d, yyyy 'at' h:mm a")}
                          </div>
                        )}
                        {log.duration && <div className="text-sm">Duration: {Math.floor(log.duration / 60)}h {log.duration % 60}m</div>}
                        {log.quality && <div className="text-sm">Quality: {log.quality}</div>}
                        {log.location && <div className="text-sm">Location: {log.location}</div>}
                        {log.notes && <div className="text-sm text-gray-600">{log.notes}</div>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Feeding Dialog */}
        <Dialog open={showFeedingDialog} onOpenChange={setShowFeedingDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Feeding</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Type</Label>
                <Select value={feedingData.type} onValueChange={(value: any) => setFeedingData({...feedingData, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bottle">Bottle</SelectItem>
                    <SelectItem value="breast">Breastfeeding</SelectItem>
                    <SelectItem value="solids">Solids</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {feedingData.type === 'bottle' && (
                <div>
                  <Label>Amount (ml)</Label>
                  <Input 
                    type="number" 
                    value={feedingData.amount}
                    onChange={(e) => setFeedingData({...feedingData, amount: e.target.value})}
                  />
                </div>
              )}
              
              {feedingData.type === 'breast' && (
                <div>
                  <Label>Duration (minutes)</Label>
                  <Input 
                    type="number" 
                    value={feedingData.duration}
                    onChange={(e) => setFeedingData({...feedingData, duration: e.target.value})}
                  />
                </div>
              )}
              
              {feedingData.type === 'solids' && (
                <div>
                  <Label>Food</Label>
                  <Input 
                    value={feedingData.food}
                    onChange={(e) => setFeedingData({...feedingData, food: e.target.value})}
                    placeholder="e.g. Baby rice, pureed carrots"
                  />
                </div>
              )}
              
              <div>
                <Label>Notes</Label>
                <Textarea 
                  value={feedingData.notes}
                  onChange={(e) => setFeedingData({...feedingData, notes: e.target.value})}
                  placeholder="Any additional notes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowFeedingDialog(false)}>Cancel</Button>
              <Button onClick={() => addFeedingMutation.mutate(feedingData)}>Add Feeding</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diaper Dialog */}
        <Dialog open={showDiaperDialog} onOpenChange={setShowDiaperDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Diaper Change</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Type</Label>
                <Select value={diaperData.type} onValueChange={(value: any) => setDiaperData({...diaperData, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wet">Wet</SelectItem>
                    <SelectItem value="dirty">Dirty</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Notes</Label>
                <Textarea 
                  value={diaperData.notes}
                  onChange={(e) => setDiaperData({...diaperData, notes: e.target.value})}
                  placeholder="Any additional notes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDiaperDialog(false)}>Cancel</Button>
              <Button onClick={() => addDiaperMutation.mutate(diaperData)}>Add Diaper Change</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Sleep Dialog */}
        <Dialog open={showSleepDialog} onOpenChange={setShowSleepDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Sleep</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Type</Label>
                <Select value={sleepData.type} onValueChange={(value: any) => setSleepData({...sleepData, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nap">Nap</SelectItem>
                    <SelectItem value="night">Night Sleep</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Start Time</Label>
                <Input 
                  type="datetime-local"
                  value={sleepData.startTime}
                  onChange={(e) => setSleepData({...sleepData, startTime: e.target.value})}
                />
              </div>
              
              <div>
                <Label>End Time (optional)</Label>
                <Input 
                  type="datetime-local"
                  value={sleepData.endTime}
                  onChange={(e) => setSleepData({...sleepData, endTime: e.target.value})}
                />
              </div>
              
              <div>
                <Label>Quality</Label>
                <Select value={sleepData.quality} onValueChange={(value: any) => setSleepData({...sleepData, quality: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Location</Label>
                <Input 
                  value={sleepData.location}
                  onChange={(e) => setSleepData({...sleepData, location: e.target.value})}
                  placeholder="e.g. Crib, bed, stroller"
                />
              </div>
              
              <div>
                <Label>Notes</Label>
                <Textarea 
                  value={sleepData.notes}
                  onChange={(e) => setSleepData({...sleepData, notes: e.target.value})}
                  placeholder="Any additional notes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSleepDialog(false)}>Cancel</Button>
              <Button onClick={() => addSleepMutation.mutate(sleepData)}>Add Sleep</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      
      <AppFooter />
    </div>
  );
}