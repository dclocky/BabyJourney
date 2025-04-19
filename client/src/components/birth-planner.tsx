import { useState } from "react";
import { Check, MapPin, Thermometer, Heart, Clock, Users, Clipboard, Package, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

type ChecklistItem = {
  id: string;
  label: string;
  checked: boolean;
  category: string;
};

export function BirthPlanner() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("location");
  
  // Hospital bag checklist
  const [hospitalBagItems, setHospitalBagItems] = useState<ChecklistItem[]>([
    // For you
    { id: "id-card", label: "ID and insurance card", checked: false, category: "for-you" },
    { id: "birth-plan", label: "Birth plan document", checked: false, category: "for-you" },
    { id: "robe", label: "Bathrobe", checked: false, category: "for-you" },
    { id: "slippers", label: "Slippers", checked: false, category: "for-you" },
    { id: "socks", label: "Warm socks", checked: false, category: "for-you" },
    { id: "nursing-bras", label: "Nursing bras", checked: false, category: "for-you" },
    { id: "nightgown", label: "Comfortable nightgown", checked: false, category: "for-you" },
    { id: "toiletries", label: "Toiletries", checked: false, category: "for-you" },
    { id: "hair-ties", label: "Hair ties/clips", checked: false, category: "for-you" },
    { id: "going-home-outfit", label: "Going home outfit", checked: false, category: "for-you" },
    { id: "phone-charger", label: "Phone charger", checked: false, category: "for-you" },
    { id: "snacks", label: "Snacks and drinks", checked: false, category: "for-you" },
    { id: "nipple-cream", label: "Nipple cream", checked: false, category: "for-you" },
    { id: "maternity-pads", label: "Maternity pads", checked: false, category: "for-you" },
    
    // For baby
    { id: "going-home-outfit-baby", label: "Going home outfit", checked: false, category: "for-baby" },
    { id: "diapers", label: "Diapers", checked: false, category: "for-baby" },
    { id: "wipes", label: "Baby wipes", checked: false, category: "for-baby" },
    { id: "swaddles", label: "Swaddles/blankets", checked: false, category: "for-baby" },
    { id: "hat", label: "Baby hat", checked: false, category: "for-baby" },
    { id: "socks", label: "Baby socks", checked: false, category: "for-baby" },
    { id: "car-seat", label: "Car seat (installed)", checked: false, category: "for-baby" },
    
    // For partner
    { id: "clothes-partner", label: "Change of clothes", checked: false, category: "for-partner" },
    { id: "toiletries-partner", label: "Toiletries", checked: false, category: "for-partner" },
    { id: "snacks-partner", label: "Snacks and drinks", checked: false, category: "for-partner" },
    { id: "entertainment", label: "Books/tablet/entertainment", checked: false, category: "for-partner" },
    { id: "cash", label: "Cash for vending machines", checked: false, category: "for-partner" },
    { id: "camera", label: "Camera", checked: false, category: "for-partner" },
  ]);

  const toggleCheckedItem = (id: string) => {
    setHospitalBagItems(
      hospitalBagItems.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const downloadBirthPlan = () => {
    // In a real implementation, this would generate a PDF or printable document
    toast({
      title: "Birth Plan Ready",
      description: "Your birth plan would be downloaded as a PDF in the real implementation.",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Birth Planner</CardTitle>
        <CardDescription>
          Plan and prepare for your delivery with this comprehensive guide
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="location" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 md:grid-cols-6 mb-4">
            <TabsTrigger value="location" className="flex items-center gap-1">
              <MapPin className="h-4 w-4" /> Location
            </TabsTrigger>
            <TabsTrigger value="pain-relief" className="flex items-center gap-1">
              <Thermometer className="h-4 w-4" /> Pain Relief
            </TabsTrigger>
            <TabsTrigger value="skin-to-skin" className="flex items-center gap-1">
              <Heart className="h-4 w-4" /> Skin-to-Skin
            </TabsTrigger>
            <TabsTrigger value="placenta" className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> Placenta
            </TabsTrigger>
            <TabsTrigger value="positions" className="flex items-center gap-1">
              <Users className="h-4 w-4" /> Positions
            </TabsTrigger>
            <TabsTrigger value="hospital-bag" className="flex items-center gap-1">
              <Package className="h-4 w-4" /> Packing
            </TabsTrigger>
          </TabsList>
          
          {/* Birth Location Options */}
          <TabsContent value="location" className="space-y-4">
            <h3 className="text-lg font-medium mb-2">Birth Location Options</h3>
            
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Hospital Birth</CardTitle>
                  <CardDescription>Most common option with full medical support</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                      <span>Access to emergency medical care</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                      <span>Pain relief options available (epidural, etc.)</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                      <span>NICU facilities if needed</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                      <span>Medical staff always present</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Birth Center</CardTitle>
                  <CardDescription>Home-like setting with midwife care</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                      <span>More natural birth environment</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                      <span>Less medical intervention</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                      <span>Water birth options often available</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                      <span>Midwife-led care</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Home Birth</CardTitle>
                  <CardDescription>Familiar environment with midwife support</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                      <span>Comfort of your own environment</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                      <span>More control over birth experience</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                      <span>No travel during labor</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                      <span>Recovery in familiar surroundings</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-4 bg-amber-50 p-4 rounded-md border border-amber-200">
              <h4 className="text-sm font-medium text-amber-800 mb-2">Important Considerations</h4>
              <p className="text-sm text-amber-700">
                The best birth location depends on your health, pregnancy risks, personal preferences, and local options. 
                Discuss with your healthcare provider to make the safest choice for your situation.
              </p>
            </div>
          </TabsContent>
          
          {/* Pain Relief Options */}
          <TabsContent value="pain-relief" className="space-y-4">
            <h3 className="text-lg font-medium mb-2">Pain Relief Methods</h3>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="medication">
                <AccordionTrigger>Medication Options</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-base font-medium">Epidural</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        An injection in the lower back that numbs the lower half of the body.
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <h5 className="font-medium">Benefits:</h5>
                          <ul className="list-disc pl-5">
                            <li>Effective pain relief</li>
                            <li>Allows rest during long labor</li>
                            <li>You remain awake and alert</li>
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium">Considerations:</h5>
                          <ul className="list-disc pl-5">
                            <li>Limited mobility</li>
                            <li>May slow labor progress</li>
                            <li>Potential side effects like fever or headache</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="text-base font-medium">Nitrous Oxide (Laughing Gas)</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        A gas mixture that you breathe through a mask when needed.
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <h5 className="font-medium">Benefits:</h5>
                          <ul className="list-disc pl-5">
                            <li>Self-administered as needed</li>
                            <li>Takes effect quickly</li>
                            <li>Clears from system rapidly</li>
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium">Considerations:</h5>
                          <ul className="list-disc pl-5">
                            <li>Less effective than epidural</li>
                            <li>May cause dizziness or nausea</li>
                            <li>Not available at all hospitals</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="text-base font-medium">Narcotic Pain Relievers</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Medications like morphine or fentanyl given through an IV or injection.
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <h5 className="font-medium">Benefits:</h5>
                          <ul className="list-disc pl-5">
                            <li>Reduces pain intensity</li>
                            <li>Allows some rest</li>
                            <li>Doesn't affect ability to push</li>
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium">Considerations:</h5>
                          <ul className="list-disc pl-5">
                            <li>May cause drowsiness</li>
                            <li>Can cause nausea</li>
                            <li>May affect baby if given close to delivery</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="natural">
                <AccordionTrigger>Natural Methods</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-base font-medium">Breathing Techniques</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Controlled breathing patterns to manage pain and stay focused.
                      </p>
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="bg-slate-50 p-3 rounded-md">
                          <h5 className="font-medium">Slow Breathing</h5>
                          <p>Deep breaths in through the nose, out through the mouth.</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-md">
                          <h5 className="font-medium">Patterned Breathing</h5>
                          <p>Short breaths followed by cleansing breaths (4-1-2 pattern).</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-md">
                          <h5 className="font-medium">Vocalization</h5>
                          <p>Low-pitched sounds during exhales to release tension.</p>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="text-base font-medium">Hydrotherapy</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Using water for pain relief during labor.
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <h5 className="font-medium">Benefits:</h5>
                          <ul className="list-disc pl-5">
                            <li>Reduces perception of pain</li>
                            <li>Promotes relaxation</li>
                            <li>Eases pressure on the body</li>
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium">Options:</h5>
                          <ul className="list-disc pl-5">
                            <li>Shower during early labor</li>
                            <li>Birthing tub for immersion</li>
                            <li>Warm compresses</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="text-base font-medium">Massage & Counter-Pressure</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Applying pressure to reduce pain sensations.
                      </p>
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="bg-slate-50 p-3 rounded-md">
                          <h5 className="font-medium">Lower Back Pressure</h5>
                          <p>Firm pressure applied to the lower back during contractions.</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-md">
                          <h5 className="font-medium">Hip Squeeze</h5>
                          <p>Pressure applied to both hips simultaneously during contractions.</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-md">
                          <h5 className="font-medium">Sacral Massage</h5>
                          <p>Circular massage at the base of the spine.</p>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="text-base font-medium">Other Natural Methods</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                        <Badge variant="outline" className="py-1.5 px-2.5 justify-center">TENS Machine</Badge>
                        <Badge variant="outline" className="py-1.5 px-2.5 justify-center">Acupressure</Badge>
                        <Badge variant="outline" className="py-1.5 px-2.5 justify-center">Hypnobirthing</Badge>
                        <Badge variant="outline" className="py-1.5 px-2.5 justify-center">Aromatherapy</Badge>
                        <Badge variant="outline" className="py-1.5 px-2.5 justify-center">Heat & Cold Therapy</Badge>
                        <Badge variant="outline" className="py-1.5 px-2.5 justify-center">Visualization</Badge>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <div className="mt-4 bg-blue-50 p-4 rounded-md border border-blue-200">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Remember</h4>
              <p className="text-sm text-blue-700">
                There's no right or wrong way to manage labor pain. Many women use a combination of methods, 
                and it's common to change your mind during labor. Discuss your preferences with your healthcare 
                provider, but stay flexible as labor progresses.
              </p>
            </div>
          </TabsContent>
          
          {/* Skin-to-Skin Benefits */}
          <TabsContent value="skin-to-skin" className="space-y-4">
            <h3 className="text-lg font-medium mb-2">Benefits of Skin-to-Skin Contact</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Benefits for Baby</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                      <div>
                        <span className="font-medium">Regulates Temperature</span>
                        <p className="text-xs text-muted-foreground">
                          Your body naturally adjusts to warm or cool your baby as needed.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                      <div>
                        <span className="font-medium">Stabilizes Heart Rate</span>
                        <p className="text-xs text-muted-foreground">
                          Helps normalize baby's heart rate and breathing patterns.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                      <div>
                        <span className="font-medium">Colonizes Beneficial Bacteria</span>
                        <p className="text-xs text-muted-foreground">
                          Exposes baby to normal parental bacteria, strengthening immunity.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                      <div>
                        <span className="font-medium">Reduces Stress</span>
                        <p className="text-xs text-muted-foreground">
                          Lowers cortisol levels and reduces crying.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                      <div>
                        <span className="font-medium">Enhances Breastfeeding</span>
                        <p className="text-xs text-muted-foreground">
                          Encourages natural latching and successful breastfeeding.
                        </p>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Benefits for Mother</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                      <div>
                        <span className="font-medium">Releases Oxytocin</span>
                        <p className="text-xs text-muted-foreground">
                          The "love hormone" helps with bonding and contracts the uterus.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                      <div>
                        <span className="font-medium">Reduces Postpartum Bleeding</span>
                        <p className="text-xs text-muted-foreground">
                          Helps the uterus contract, reducing bleeding risk.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                      <div>
                        <span className="font-medium">Increases Milk Production</span>
                        <p className="text-xs text-muted-foreground">
                          Stimulates prolactin release for better milk supply.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                      <div>
                        <span className="font-medium">Reduces Stress and Anxiety</span>
                        <p className="text-xs text-muted-foreground">
                          Lowers cortisol levels and enhances emotional well-being.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                      <div>
                        <span className="font-medium">Enhances Bonding</span>
                        <p className="text-xs text-muted-foreground">
                          Strengthens the maternal-infant connection.
                        </p>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Implementing Skin-to-Skin Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-slate-50 p-3 rounded-md">
                    <h4 className="text-sm font-medium">Immediately After Birth</h4>
                    <p className="text-sm text-muted-foreground">
                      Request immediate skin-to-skin contact after delivery if medically possible. 
                      Routine procedures like weighing can often be delayed for 1-2 hours.
                    </p>
                  </div>
                  
                  <div className="bg-slate-50 p-3 rounded-md">
                    <h4 className="text-sm font-medium">C-Section Births</h4>
                    <p className="text-sm text-muted-foreground">
                      Skin-to-skin is still possible with cesarean births. If you're unable, 
                      your partner can provide skin-to-skin contact while you recover.
                    </p>
                  </div>
                  
                  <div className="bg-slate-50 p-3 rounded-md">
                    <h4 className="text-sm font-medium">Golden Hour</h4>
                    <p className="text-sm text-muted-foreground">
                      The first hour after birth is critical for bonding and establishing breastfeeding. 
                      Try to maintain uninterrupted skin-to-skin during this time.
                    </p>
                  </div>
                  
                  <div className="bg-slate-50 p-3 rounded-md">
                    <h4 className="text-sm font-medium">Ongoing Practice</h4>
                    <p className="text-sm text-muted-foreground">
                      Continue skin-to-skin contact regularly in the days and weeks after birth. 
                      It's beneficial beyond the initial period.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Placenta Attachment */}
          <TabsContent value="placenta" className="space-y-4">
            <h3 className="text-lg font-medium mb-2">Placenta and Umbilical Cord Options</h3>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Delayed Cord Clamping</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Delayed cord clamping is the practice of waiting to clamp and cut the umbilical cord 
                    after birth, allowing blood to continue flowing from the placenta to the baby.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium">Recommended Timing:</h4>
                      <ul className="mt-2 space-y-2">
                        <li className="flex items-start">
                          <Badge className="mt-0.5 mr-2">Full-Term</Badge>
                          <span className="text-sm">At least 1-3 minutes after birth</span>
                        </li>
                        <li className="flex items-start">
                          <Badge className="mt-0.5 mr-2">Preterm</Badge>
                          <span className="text-sm">At least 30-60 seconds after birth</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium">Benefits:</h4>
                      <ul className="mt-2 space-y-1 text-sm list-disc pl-5">
                        <li>Increases baby's blood volume</li>
                        <li>Provides additional iron stores, reducing anemia risk</li>
                        <li>Improves transitional circulation</li>
                        <li>Better blood pressure stabilization</li>
                        <li>Enhanced stem cell transfer</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                    <h4 className="text-sm font-medium text-blue-800">Medical Note</h4>
                    <p className="text-sm text-blue-700">
                      The World Health Organization recommends delayed cord clamping for all births. 
                      Discuss this option with your healthcare provider to determine if it's appropriate 
                      for your situation.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Lotus Birth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Lotus birth is the practice of leaving the umbilical cord uncut after birth, allowing 
                    the cord and placenta to remain attached to the baby until they naturally separate.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium">Timing & Process:</h4>
                      <ul className="mt-2 space-y-1 text-sm list-disc pl-5">
                        <li>Natural separation usually occurs 3-10 days after birth</li>
                        <li>The placenta is typically wrapped in cloth and salt</li>
                        <li>The cloth is changed daily to keep the placenta clean and dry</li>
                        <li>Special care is needed to prevent infection</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium">Considerations:</h4>
                      <ul className="mt-2 space-y-1 text-sm list-disc pl-5">
                        <li>Limited scientific research on benefits or risks</li>
                        <li>Requires careful hygiene practices</li>
                        <li>May limit mobility with newborn</li>
                        <li>May be difficult to arrange in hospital settings</li>
                        <li>Cultural and spiritual significance for some families</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="bg-amber-50 p-3 rounded-md border border-amber-100">
                    <h4 className="text-sm font-medium text-amber-800">Important</h4>
                    <p className="text-sm text-amber-700">
                      Lotus birth is not common in mainstream medical practice and is not supported by 
                      major medical organizations. If you're interested in this option, discuss it with 
                      your healthcare provider well before delivery.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Cord Blood Banking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Cord blood banking involves collecting and storing the blood from the umbilical cord and 
                    placenta after birth, which contains valuable stem cells.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium">Private Banking:</h4>
                      <ul className="mt-2 space-y-1 text-sm list-disc pl-5">
                        <li>Stored for exclusive family use</li>
                        <li>One-time collection fee ($1,500-$2,500)</li>
                        <li>Annual storage fees ($100-$300)</li>
                        <li>Available if needed for family members</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium">Public Donation:</h4>
                      <ul className="mt-2 space-y-1 text-sm list-disc pl-5">
                        <li>Free donation to public banks</li>
                        <li>Available to anyone in need</li>
                        <li>No guaranteed access for the donor family</li>
                        <li>Contributes to research and treatment for others</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                    <h4 className="text-sm font-medium text-blue-800">Medical Uses</h4>
                    <p className="text-sm text-blue-700">
                      Cord blood stem cells are currently used to treat certain blood disorders, immune 
                      system disorders, and some metabolic disorders. Research continues for potential 
                      future applications. Discuss with your healthcare provider if your family has a 
                      history of conditions treatable with stem cells.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Birthing Positions */}
          <TabsContent value="positions" className="space-y-4">
            <h3 className="text-lg font-medium mb-2">Birthing Positions and Their Benefits</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Upright Positions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium">Standing/Leaning Forward</h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        Standing while leaning on a partner, bed, or wall for support.
                      </p>
                      <Badge className="mr-1">Gravity-assisted</Badge>
                      <Badge className="mr-1">Reduces back pain</Badge>
                      <Badge>Encourages descent</Badge>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="text-sm font-medium">Squatting</h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        Full or supported squat position with knees wide apart.
                      </p>
                      <Badge className="mr-1">Opens pelvis</Badge>
                      <Badge className="mr-1">Strongest gravity effect</Badge>
                      <Badge>Can speed pushing stage</Badge>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="text-sm font-medium">Kneeling</h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        On knees leaning forward onto bed or birth ball.
                      </p>
                      <Badge className="mr-1">Reduces back pressure</Badge>
                      <Badge className="mr-1">Less tiring than squatting</Badge>
                      <Badge>Good for back labor</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Side-Lying & Reclined Positions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium">Side-Lying</h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        Lying on side with upper leg supported.
                      </p>
                      <Badge className="mr-1">Restful position</Badge>
                      <Badge className="mr-1">Good for epidural</Badge>
                      <Badge>Slows rapid labor</Badge>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="text-sm font-medium">Semi-Sitting/Reclined</h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        Sitting up supported by pillows or a bed.
                      </p>
                      <Badge className="mr-1">Good for monitoring</Badge>
                      <Badge className="mr-1">Some gravity benefit</Badge>
                      <Badge>Comfortable for long labors</Badge>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="text-sm font-medium">Hands and Knees</h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        On all fours with knees and hands on the bed.
                      </p>
                      <Badge className="mr-1">Optimal fetal rotation</Badge>
                      <Badge className="mr-1">Reduces back pain</Badge>
                      <Badge>Helps position posterior babies</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Evidence-Based Benefits of Movement in Labor</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                    <div>
                      <span className="font-medium">Shorter Labor Duration</span>
                      <p className="text-xs text-muted-foreground">
                        Studies show upright positions can shorten first stage labor by 1-2 hours.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                    <div>
                      <span className="font-medium">More Effective Contractions</span>
                      <p className="text-xs text-muted-foreground">
                        Upright positions align the baby with the birth canal and improve uterine blood flow.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                    <div>
                      <span className="font-medium">Reduced Pain Perception</span>
                      <p className="text-xs text-muted-foreground">
                        Movement releases endorphins and helps cope with contractions.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                    <div>
                      <span className="font-medium">Lower Intervention Rates</span>
                      <p className="text-xs text-muted-foreground">
                        Linked to fewer assisted deliveries and less need for pain medication.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                    <div>
                      <span className="font-medium">Increased Maternal Satisfaction</span>
                      <p className="text-xs text-muted-foreground">
                        Freedom of movement is associated with more positive birth experiences.
                      </p>
                    </div>
                  </li>
                </ul>
                
                <div className="mt-4 bg-blue-50 p-3 rounded-md border border-blue-100">
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">Tip:</span> You don't need to choose just one position. 
                    The best approach is to listen to your body and change positions as needed throughout labor. 
                    If you have an epidural, ask your provider about "peanut balls" and supported position changes.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Hospital Bag Checklist */}
          <TabsContent value="hospital-bag" className="space-y-4">
            <h3 className="text-lg font-medium mb-2">Hospital Bag Checklist</h3>
            
            <Tabs defaultValue="for-you" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="for-you">For You</TabsTrigger>
                <TabsTrigger value="for-baby">For Baby</TabsTrigger>
                <TabsTrigger value="for-partner">For Partner</TabsTrigger>
              </TabsList>
              
              <TabsContent value="for-you" className="space-y-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      {hospitalBagItems
                        .filter(item => item.category === "for-you")
                        .map(item => (
                          <div key={item.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={item.id} 
                              checked={item.checked}
                              onCheckedChange={() => toggleCheckedItem(item.id)}
                            />
                            <Label 
                              htmlFor={item.id} 
                              className={`${item.checked ? 'line-through text-muted-foreground' : ''}`}
                            >
                              {item.label}
                            </Label>
                          </div>
                        ))}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium mb-2">Don't Forget</h4>
                      <ul className="text-sm list-disc pl-5 space-y-1">
                        <li>Pack items at least two weeks before your due date</li>
                        <li>Keep all important documents in a waterproof folder</li>
                        <li>Bring more than you think you'll need for longer stays</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="for-baby" className="space-y-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      {hospitalBagItems
                        .filter(item => item.category === "for-baby")
                        .map(item => (
                          <div key={item.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={item.id} 
                              checked={item.checked}
                              onCheckedChange={() => toggleCheckedItem(item.id)}
                            />
                            <Label 
                              htmlFor={item.id} 
                              className={`${item.checked ? 'line-through text-muted-foreground' : ''}`}
                            >
                              {item.label}
                            </Label>
                          </div>
                        ))}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium mb-2">Baby Clothing Tips</h4>
                      <ul className="text-sm list-disc pl-5 space-y-1">
                        <li>Pack clothes in sizes 0-3 months (newborn may be too small)</li>
                        <li>Choose clothes with front openings for easier dressing</li>
                        <li>Remember, hospitals often provide basic items like diapers during your stay</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="for-partner" className="space-y-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      {hospitalBagItems
                        .filter(item => item.category === "for-partner")
                        .map(item => (
                          <div key={item.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={item.id} 
                              checked={item.checked}
                              onCheckedChange={() => toggleCheckedItem(item.id)}
                            />
                            <Label 
                              htmlFor={item.id} 
                              className={`${item.checked ? 'line-through text-muted-foreground' : ''}`}
                            >
                              {item.label}
                            </Label>
                          </div>
                        ))}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium mb-2">Partner Support Role</h4>
                      <ul className="text-sm list-disc pl-5 space-y-1">
                        <li>Keep track of important phone numbers and contact lists</li>
                        <li>Be prepared to advocate for the mother's birth preferences</li>
                        <li>Consider having a small "celebration" item like sparkling cider</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end">
              <Button onClick={downloadBirthPlan} className="flex items-center gap-2">
                <Clipboard className="h-4 w-4" />
                Download Complete Checklist
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}