import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, isValid, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Baby, Share, Printer, Plus, Clock, Utensils, CircleDot, Heart, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { AppTabs } from "@/components/app-tabs";
import { MobileNav } from "@/components/mobile-nav";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Child } from "@/../../shared/schema";
import { useForm } from "react-hook-form";

// Safe date formatter
function safeFormatDate(dateValue: any, formatString: string = 'MMM d, yyyy'): string {
  try {
    if (!dateValue) return 'Not set';
    
    if (typeof dateValue === 'string') {
      const parsedDate = parseISO(dateValue);
      if (isValid(parsedDate)) {
        return format(parsedDate, formatString);
      }
    }
    
    if (dateValue instanceof Date && isValid(dateValue)) {
      return format(dateValue, formatString);
    }
    
    return 'Invalid date';
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid date';
  }
}

export default function BabysitterPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedChild, setSelectedChild] = useState<number | null>(null);
  const [showAddRecordDialog, setShowAddRecordDialog] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: babyProfiles = [], isLoading: isLoadingChildren } = useQuery<Child[]>({
    queryKey: ["/api/children"],
  });

  const babies = babyProfiles.filter(child => child.birthDate);

  if (babies.length > 0 && selectedChild === null) {
    setSelectedChild(babies[0].id);
  }

  const currentChild = babies.find(child => child.id === selectedChild);

  const { data: allMilestones = [] } = useQuery({
    queryKey: [`/api/children/${selectedChild}/milestones`],
    enabled: selectedChild !== null,
  });

  const feedingRecords = allMilestones.filter((m: any) => m.category === 'feeding');
  const diaperRecords = allMilestones.filter((m: any) => m.category === 'diaper');
  const healthRecords = allMilestones.filter((m: any) => m.category === 'health');
  const notes = allMilestones.filter((m: any) => m.category === 'notes');

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share && currentChild) {
      try {
        await navigator.share({
          title: `${currentChild.name}'s Care Information`,
          text: `Baby care details for ${currentChild.name}`,
          url: window.location.href,
        });
      } catch (error) {
        // Fallback to copying URL
        navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied!",
          description: "The babysitter page link has been copied to your clipboard.",
        });
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "The babysitter page link has been copied to your clipboard.",
      });
    }
  };

  if (isLoadingChildren) {
    return (
      <div className="min-h-screen flex flex-col bg-secondary-50">
        <AppHeader />
        <AppTabs />
        <main className="flex-grow container mx-auto px-4 py-6 pb-20 md:pb-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading...</p>
            </div>
          </div>
        </main>
        <AppFooter />
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-secondary-50">
      <AppHeader />
      <AppTabs />
      
      <main className="flex-grow container mx-auto px-4 py-6 pb-20 md:pb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Babysitter Mode</h1>
          <div className="flex gap-2">
            <Button onClick={handlePrint} variant="outline">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button onClick={handleShare}>
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
            <BabysitterRecordDialog 
              childId={selectedChild} 
              open={showAddRecordDialog} 
              onOpenChange={setShowAddRecordDialog} 
            />
          </div>
        </div>

        {babies.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Baby className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-bold mb-2">No Baby Profiles Yet</h2>
              <p className="text-muted-foreground">
                Create a baby profile first to use babysitter mode.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6" ref={printRef}>
            {/* Baby Selection */}
            {babies.length > 1 && (
              <Card className="print:hidden">
                <CardContent className="p-4">
                  <Label className="text-sm font-medium mb-2 block">Select Baby</Label>
                  <Select value={selectedChild?.toString()} onValueChange={(value) => setSelectedChild(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a baby profile" />
                    </SelectTrigger>
                    <SelectContent>
                      {babies.map((child) => (
                        <SelectItem key={child.id} value={child.id.toString()}>
                          {child.name || 'Unnamed Baby'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}

            {currentChild && (
              <>
                {/* Baby Info for Babysitter */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Baby className="w-5 h-5 mr-2" />
                      {currentChild.name}'s Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-medium">{currentChild.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Age</p>
                        <p className="font-medium">
                          {currentChild.birthDate ? 
                            Math.floor((new Date().getTime() - new Date(currentChild.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44)) + ' months' 
                            : 'Age not available'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Birth Date</p>
                        <p className="font-medium">{safeFormatDate(currentChild.birthDate)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Emergency Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
                      Emergency Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Parent Phone</p>
                        <p className="font-medium">+1 (555) 123-4567</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Emergency Contact</p>
                        <p className="font-medium">+1 (555) 987-6543</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Pediatrician</p>
                        <p className="font-medium">Dr. Smith: +1 (555) 456-7890</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Address</p>
                        <p className="font-medium">123 Main St, City, State 12345</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Care Instructions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Feeding Schedule */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Utensils className="w-5 h-5 mr-2" />
                        Feeding Schedule & Recent Records
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-sm mb-2">Typical Schedule</h4>
                          <ul className="text-sm space-y-1">
                            <li>• Every 3-4 hours</li>
                            <li>• 120ml formula or 15-20min breastfeeding</li>
                            <li>• Burp after feeding</li>
                          </ul>
                        </div>
                        
                        <Separator />
                        
                        {feedingRecords.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm mb-2">Recent Feedings</h4>
                            <div className="space-y-2">
                              {feedingRecords.slice(-3).map((record: any, index: number) => (
                                <div key={index} className="flex justify-between items-center p-2 bg-muted rounded text-sm">
                                  <span>{record.title}</span>
                                  <span className="text-muted-foreground">{safeFormatDate(record.date, 'MMM d, HH:mm')}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Diaper Changes */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <CircleDot className="w-5 h-5 mr-2" />
                        Diaper Changes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-sm mb-2">Instructions</h4>
                          <ul className="text-sm space-y-1">
                            <li>• Check every 2 hours</li>
                            <li>• Wipes and diapers in nursery</li>
                            <li>• Diaper cream if needed</li>
                          </ul>
                        </div>
                        
                        <Separator />
                        
                        {diaperRecords.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm mb-2">Recent Changes</h4>
                            <div className="space-y-2">
                              {diaperRecords.slice(-3).map((record: any, index: number) => (
                                <div key={index} className="flex justify-between items-center p-2 bg-muted rounded text-sm">
                                  <span>{record.title}</span>
                                  <span className="text-muted-foreground">{safeFormatDate(record.date, 'MMM d, HH:mm')}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sleep & Routine */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="w-5 h-5 mr-2" />
                      Sleep & Daily Routine
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-sm mb-2">Typical Nap Schedule</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Morning nap: 9:00 AM - 10:30 AM</li>
                          <li>• Afternoon nap: 1:00 PM - 3:00 PM</li>
                          <li>• Bedtime: 7:00 PM</li>
                          <li>• Sleep in crib with favorite blanket</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-2">Comfort Items</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Favorite teddy bear</li>
                          <li>• Soft music or white noise</li>
                          <li>• Room temperature: 68-70°F</li>
                          <li>• Pacifier for bedtime</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Important Notes */}
                {notes.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Heart className="w-5 h-5 mr-2" />
                        Important Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {notes.slice(-5).map((note: any, index: number) => (
                          <div key={index} className="p-3 bg-muted rounded">
                            <h5 className="font-medium text-sm">{note.title}</h5>
                            <p className="text-sm text-muted-foreground mt-1">{note.description}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Health Information */}
                {healthRecords.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        Health Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {healthRecords.slice(-3).map((record: any, index: number) => (
                          <div key={index} className="p-3 bg-muted rounded">
                            <h5 className="font-medium text-sm">{record.title}</h5>
                            <p className="text-sm text-muted-foreground mt-1">{record.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">{safeFormatDate(record.date)}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        )}
      </main>
      
      <AppFooter />
      <MobileNav />
    </div>
  );
}

// Dialog for babysitter to add records
function BabysitterRecordDialog({ childId, open, onOpenChange }: { childId: number | null, open: boolean, onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [recordType, setRecordType] = useState('feeding');
  
  const form = useForm({
    defaultValues: {
      type: 'bottle',
      amount: '',
      time: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
      notes: '',
      diaperType: 'wet',
    },
  });

  const addRecordMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!childId) throw new Error('No child selected');
      
      let title, description, category;
      
      if (recordType === 'feeding') {
        title = `${data.type.charAt(0).toUpperCase() + data.type.slice(1)} feeding`;
        description = `Type: ${data.type}, Amount: ${data.amount || 'N/A'}${data.notes ? `, Notes: ${data.notes}` : ''}`;
        category = 'feeding';
      } else if (recordType === 'diaper') {
        title = `Diaper change - ${data.diaperType}`;
        description = `Type: ${data.diaperType}${data.notes ? `, Notes: ${data.notes}` : ''}`;
        category = 'diaper';
      } else {
        title = 'Babysitter note';
        description = data.notes || 'General note from babysitter';
        category = 'notes';
      }
      
      return apiRequest(`/api/children/${childId}/milestones`, {
        method: "POST",
        body: JSON.stringify({
          title,
          category,
          date: new Date(data.time),
          description,
        }),
      });
    },
    onSuccess: () => {
      if (childId) {
        queryClient.invalidateQueries({ queryKey: [`/api/children/${childId}/milestones`] });
      }
      toast({
        title: "Success",
        description: "Record added successfully!",
      });
      onOpenChange(false);
      form.reset();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Record
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Care Record</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => addRecordMutation.mutate(data))} className="space-y-4">
            <div>
              <Label>Record Type</Label>
              <Select onValueChange={setRecordType} defaultValue="feeding">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feeding">Feeding</SelectItem>
                  <SelectItem value="diaper">Diaper Change</SelectItem>
                  <SelectItem value="note">General Note</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {recordType === 'feeding' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Feeding Type</Label>
                    <Select onValueChange={(value) => form.setValue('type', value)} defaultValue="bottle">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bottle">Bottle</SelectItem>
                        <SelectItem value="breastfeeding">Breastfeeding</SelectItem>
                        <SelectItem value="solid">Solid Food</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Amount (ml/oz)</Label>
                    <Input placeholder="120ml" {...form.register('amount')} />
                  </div>
                </div>
              </>
            )}

            {recordType === 'diaper' && (
              <div>
                <Label>Diaper Type</Label>
                <Select onValueChange={(value) => form.setValue('diaperType', value)} defaultValue="wet">
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
            )}

            <div>
              <Label>Time</Label>
              <Input type="datetime-local" {...form.register('time')} />
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea placeholder="Any observations or notes..." {...form.register('notes')} />
            </div>

            <Button type="submit" className="w-full">Save Record</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}