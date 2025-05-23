import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { MobileNav } from "@/components/mobile-nav";
import { TrendingUp, Ruler, Weight, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface GrowthRecord {
  id: number;
  date: string;
  weight?: string;
  length?: string;
  headCircumference?: string;
  notes?: string;
}

interface DoctorVisit {
  id: number;
  date: string;
  type: string;
  doctorName?: string;
  clinic?: string;
  weight?: string;
  length?: string;
  notes?: string;
  concerns?: string;
  recommendations?: string;
  nextVisit?: string;
}

export default function GrowthCharts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showGrowthDialog, setShowGrowthDialog] = useState(false);
  const [showDoctorDialog, setShowDoctorDialog] = useState(false);
  
  // Get child ID (in a real app, this would come from route params or context)
  const childId = 1;

  // Growth record state
  const [growthData, setGrowthData] = useState({
    weight: '',
    length: '',
    headCircumference: '',
    notes: ''
  });

  // Doctor visit state
  const [doctorData, setDoctorData] = useState({
    type: 'checkup',
    doctorName: '',
    clinic: '',
    weight: '',
    length: '',
    notes: '',
    concerns: '',
    recommendations: '',
    nextVisit: ''
  });

  // Fetch growth records
  const { data: growthRecords = [] } = useQuery({
    queryKey: [`/api/children/${childId}/growth-records`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/children/${childId}/growth-records`);
      return await res.json();
    }
  });

  // Fetch doctor visits
  const { data: doctorVisits = [] } = useQuery({
    queryKey: [`/api/children/${childId}/doctor-visits`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/children/${childId}/doctor-visits`);
      return await res.json();
    }
  });

  // Add growth record mutation
  const addGrowthMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/children/${childId}/growth-records`, {
        childId,
        userId: 1,
        date: new Date().toISOString(),
        ...data
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/children/${childId}/growth-records`] });
      toast({ title: "Growth record added successfully!" });
      setShowGrowthDialog(false);
      setGrowthData({ weight: '', length: '', headCircumference: '', notes: '' });
    }
  });

  // Add doctor visit mutation
  const addDoctorMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/children/${childId}/doctor-visits`, {
        childId,
        userId: 1,
        date: new Date().toISOString(),
        nextVisit: data.nextVisit ? new Date(data.nextVisit).toISOString() : null,
        ...data
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/children/${childId}/doctor-visits`] });
      toast({ title: "Doctor visit recorded successfully!" });
      setShowDoctorDialog(false);
      setDoctorData({
        type: 'checkup',
        doctorName: '',
        clinic: '',
        weight: '',
        length: '',
        notes: '',
        concerns: '',
        recommendations: '',
        nextVisit: ''
      });
    }
  });

  // Prepare chart data
  const chartData = growthRecords.map((record: GrowthRecord, index: number) => ({
    date: format(new Date(record.date), "MMM dd"),
    weight: record.weight ? parseFloat(record.weight) : null,
    length: record.length ? parseFloat(record.length) : null,
    headCircumference: record.headCircumference ? parseFloat(record.headCircumference) : null,
    ageWeeks: index + 1 // Simple calculation - in real app would calculate from birth date
  }));

  // WHO percentile reference lines (simplified example data)
  const getPercentileLines = (metric: 'weight' | 'length') => {
    if (metric === 'weight') {
      return [
        { percentile: '3rd', value: 3.2 },
        { percentile: '15th', value: 3.8 },
        { percentile: '50th', value: 4.5 },
        { percentile: '85th', value: 5.2 },
        { percentile: '97th', value: 5.8 }
      ];
    } else {
      return [
        { percentile: '3rd', value: 48 },
        { percentile: '15th', value: 50 },
        { percentile: '50th', value: 53 },
        { percentile: '85th', value: 55 },
        { percentile: '97th', value: 57 }
      ];
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <AppHeader />
      <MobileNav />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Growth Charts & Medical Records</h1>
          <p className="text-gray-600">Track your baby's growth and medical appointments</p>
        </div>

        <Tabs defaultValue="charts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="charts" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Growth Charts
            </TabsTrigger>
            <TabsTrigger value="records" className="flex items-center gap-2">
              <Ruler className="h-4 w-4" />
              Growth Records
            </TabsTrigger>
            <TabsTrigger value="medical" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Doctor Visits
            </TabsTrigger>
          </TabsList>

          {/* Growth Charts Tab */}
          <TabsContent value="charts" className="space-y-6">
            <div className="grid gap-6">
              {/* Weight Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Weight className="h-5 w-5" />
                    Weight Growth Chart
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis 
                          label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft' }}
                          domain={['dataMin - 0.5', 'dataMax + 0.5']}
                        />
                        <Tooltip 
                          formatter={(value: any) => [`${value} kg`, 'Weight']}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        
                        {/* WHO Percentile Reference Lines */}
                        {getPercentileLines('weight').map((line) => (
                          <ReferenceLine 
                            key={line.percentile}
                            y={line.value} 
                            stroke="#e5e7eb" 
                            strokeDasharray="2 2"
                            label={{ value: line.percentile, position: "insideTopRight" }}
                          />
                        ))}
                        
                        <Line 
                          type="monotone" 
                          dataKey="weight" 
                          stroke="#3b82f6" 
                          strokeWidth={3}
                          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                          connectNulls={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Length Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ruler className="h-5 w-5" />
                    Length Growth Chart
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis 
                          label={{ value: 'Length (cm)', angle: -90, position: 'insideLeft' }}
                          domain={['dataMin - 2', 'dataMax + 2']}
                        />
                        <Tooltip 
                          formatter={(value: any) => [`${value} cm`, 'Length']}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        
                        {/* WHO Percentile Reference Lines */}
                        {getPercentileLines('length').map((line) => (
                          <ReferenceLine 
                            key={line.percentile}
                            y={line.value} 
                            stroke="#e5e7eb" 
                            strokeDasharray="2 2"
                            label={{ value: line.percentile, position: "insideTopRight" }}
                          />
                        ))}
                        
                        <Line 
                          type="monotone" 
                          dataKey="length" 
                          stroke="#10b981" 
                          strokeWidth={3}
                          dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }}
                          connectNulls={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Head Circumference Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Head Circumference Growth Chart</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis 
                          label={{ value: 'Head Circumference (cm)', angle: -90, position: 'insideLeft' }}
                          domain={['dataMin - 1', 'dataMax + 1']}
                        />
                        <Tooltip 
                          formatter={(value: any) => [`${value} cm`, 'Head Circumference']}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="headCircumference" 
                          stroke="#f59e0b" 
                          strokeWidth={3}
                          dot={{ fill: '#f59e0b', strokeWidth: 2, r: 6 }}
                          connectNulls={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Growth Records Tab */}
          <TabsContent value="records" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Growth Records</h2>
              <Button onClick={() => setShowGrowthDialog(true)}>
                Add Growth Record
              </Button>
            </div>
            
            <div className="grid gap-4">
              {growthRecords.map((record: GrowthRecord) => (
                <Card key={record.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="font-medium">
                          {format(new Date(record.date), "MMMM d, yyyy")}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          {record.weight && <div>Weight: {record.weight} kg</div>}
                          {record.length && <div>Length: {record.length} cm</div>}
                          {record.headCircumference && <div>Head Circumference: {record.headCircumference} cm</div>}
                          {record.notes && <div className="text-gray-500 italic">{record.notes}</div>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Doctor Visits Tab */}
          <TabsContent value="medical" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Doctor Visits & Medical Records</h2>
              <Button onClick={() => setShowDoctorDialog(true)}>
                Add Doctor Visit
              </Button>
            </div>
            
            <div className="grid gap-4">
              {doctorVisits.map((visit: DoctorVisit) => (
                <Card key={visit.id}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium capitalize">{visit.type}</div>
                          <div className="text-sm text-gray-600">
                            {format(new Date(visit.date), "MMMM d, yyyy")}
                          </div>
                        </div>
                      </div>
                      
                      {visit.doctorName && (
                        <div className="text-sm">
                          <strong>Doctor:</strong> {visit.doctorName}
                          {visit.clinic && ` at ${visit.clinic}`}
                        </div>
                      )}
                      
                      {(visit.weight || visit.length) && (
                        <div className="text-sm space-y-1">
                          {visit.weight && <div><strong>Weight:</strong> {visit.weight} kg</div>}
                          {visit.length && <div><strong>Length:</strong> {visit.length} cm</div>}
                        </div>
                      )}
                      
                      {visit.concerns && (
                        <div className="text-sm">
                          <strong>Concerns:</strong> {visit.concerns}
                        </div>
                      )}
                      
                      {visit.recommendations && (
                        <div className="text-sm">
                          <strong>Recommendations:</strong> {visit.recommendations}
                        </div>
                      )}
                      
                      {visit.notes && (
                        <div className="text-sm text-gray-600 italic">{visit.notes}</div>
                      )}
                      
                      {visit.nextVisit && (
                        <div className="text-sm text-blue-600">
                          <strong>Next Visit:</strong> {format(new Date(visit.nextVisit), "MMMM d, yyyy")}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Growth Record Dialog */}
        <Dialog open={showGrowthDialog} onOpenChange={setShowGrowthDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Growth Record</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Weight (kg)</Label>
                <Input 
                  type="number" 
                  step="0.1"
                  value={growthData.weight}
                  onChange={(e) => setGrowthData({...growthData, weight: e.target.value})}
                  placeholder="e.g. 4.5"
                />
              </div>
              
              <div>
                <Label>Length (cm)</Label>
                <Input 
                  type="number" 
                  step="0.1"
                  value={growthData.length}
                  onChange={(e) => setGrowthData({...growthData, length: e.target.value})}
                  placeholder="e.g. 53.2"
                />
              </div>
              
              <div>
                <Label>Head Circumference (cm)</Label>
                <Input 
                  type="number" 
                  step="0.1"
                  value={growthData.headCircumference}
                  onChange={(e) => setGrowthData({...growthData, headCircumference: e.target.value})}
                  placeholder="e.g. 37.8"
                />
              </div>
              
              <div>
                <Label>Notes</Label>
                <Textarea 
                  value={growthData.notes}
                  onChange={(e) => setGrowthData({...growthData, notes: e.target.value})}
                  placeholder="Any additional notes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowGrowthDialog(false)}>Cancel</Button>
              <Button onClick={() => addGrowthMutation.mutate(growthData)}>Add Record</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Doctor Visit Dialog */}
        <Dialog open={showDoctorDialog} onOpenChange={setShowDoctorDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Doctor Visit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Visit Type</Label>
                  <Input 
                    value={doctorData.type}
                    onChange={(e) => setDoctorData({...doctorData, type: e.target.value})}
                    placeholder="e.g. Checkup, sick visit"
                  />
                </div>
                
                <div>
                  <Label>Doctor Name</Label>
                  <Input 
                    value={doctorData.doctorName}
                    onChange={(e) => setDoctorData({...doctorData, doctorName: e.target.value})}
                    placeholder="e.g. Dr. Smith"
                  />
                </div>
              </div>
              
              <div>
                <Label>Clinic/Hospital</Label>
                <Input 
                  value={doctorData.clinic}
                  onChange={(e) => setDoctorData({...doctorData, clinic: e.target.value})}
                  placeholder="e.g. City Children's Hospital"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Weight (kg)</Label>
                  <Input 
                    type="number" 
                    step="0.1"
                    value={doctorData.weight}
                    onChange={(e) => setDoctorData({...doctorData, weight: e.target.value})}
                    placeholder="e.g. 4.5"
                  />
                </div>
                
                <div>
                  <Label>Length (cm)</Label>
                  <Input 
                    type="number" 
                    step="0.1"
                    value={doctorData.length}
                    onChange={(e) => setDoctorData({...doctorData, length: e.target.value})}
                    placeholder="e.g. 53.2"
                  />
                </div>
              </div>
              
              <div>
                <Label>Concerns Discussed</Label>
                <Textarea 
                  value={doctorData.concerns}
                  onChange={(e) => setDoctorData({...doctorData, concerns: e.target.value})}
                  placeholder="Any concerns discussed during the visit..."
                />
              </div>
              
              <div>
                <Label>Doctor's Recommendations</Label>
                <Textarea 
                  value={doctorData.recommendations}
                  onChange={(e) => setDoctorData({...doctorData, recommendations: e.target.value})}
                  placeholder="Doctor's recommendations and advice..."
                />
              </div>
              
              <div>
                <Label>Next Visit Date</Label>
                <Input 
                  type="date"
                  value={doctorData.nextVisit}
                  onChange={(e) => setDoctorData({...doctorData, nextVisit: e.target.value})}
                />
              </div>
              
              <div>
                <Label>Additional Notes</Label>
                <Textarea 
                  value={doctorData.notes}
                  onChange={(e) => setDoctorData({...doctorData, notes: e.target.value})}
                  placeholder="Any additional notes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDoctorDialog(false)}>Cancel</Button>
              <Button onClick={() => addDoctorMutation.mutate(doctorData)}>Add Visit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      
      <AppFooter />
    </div>
  );
}