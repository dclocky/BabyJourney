import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { AppTabs } from "@/components/app-tabs";
import { MobileNav } from "@/components/mobile-nav";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Child } from "@shared/schema";
import { Loader2 } from "lucide-react";

export default function PregnancyPage() {
  const { data: children, isLoading } = useQuery<Child[]>({
    queryKey: ["/api/children"],
  });

  const pregnancy = children?.find(child => child.isPregnancy);

  return (
    <div className="min-h-screen flex flex-col bg-secondary-50">
      <AppHeader />
      <AppTabs />
      
      <main className="flex-grow container mx-auto px-4 py-6 pb-20 md:pb-6">
        <h1 className="text-2xl font-bold mb-6">Pregnancy Tracker</h1>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : !pregnancy ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h2 className="text-xl font-bold mb-4">No Pregnancy Tracked Yet</h2>
            <p className="text-muted-foreground mb-6">
              Start tracking your pregnancy journey to get week-by-week updates, symptom tracking, and more.
            </p>
            <Button>Add Pregnancy</Button>
          </div>
        ) : (
          <div className="space-y-6">
            <WeeklyTrackerCard pregnancy={pregnancy} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <WeeklyJournalCard pregnancy={pregnancy} />
              <SymptomTrackerCard pregnancy={pregnancy} />
            </div>
          </div>
        )}
      </main>
      
      <AppFooter />
      <MobileNav />
    </div>
  );
}

function WeeklyTrackerCard({ pregnancy }: { pregnancy: Child }) {
  // For MVP, just show static week
  const currentWeek = 24;
  const totalWeeks = 40;
  
  // Create an array of week numbers
  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">Week {currentWeek} of {totalWeeks}</h2>
          <p className="text-muted-foreground">
            {pregnancy.dueDate 
              ? `Due date: ${new Date(pregnancy.dueDate).toLocaleDateString()}`
              : "Due date not set"
            }
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <Button variant="outline">Previous Week</Button>
          <Button variant="outline">Next Week</Button>
        </div>
      </div>
      
      <div className="overflow-x-auto pb-2">
        <div className="flex space-x-2 min-w-max">
          {weeks.map(week => (
            <button 
              key={week} 
              className={`
                w-10 h-10 rounded-full flex items-center justify-center text-sm
                ${currentWeek === week 
                  ? 'bg-primary-500 text-white' 
                  : week < currentWeek 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'bg-gray-100 text-gray-400'
                }
              `}
            >
              {week}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function WeeklyJournalCard({ pregnancy }: { pregnancy: Child }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-bold mb-4">Your Pregnancy Journal</h3>
      
      <div className="border rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium">Week 24 Notes</h4>
          <span className="text-xs text-muted-foreground">May 10, 2023</span>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Started feeling stronger kicks this week! Baby seems more active in the evenings after dinner.
          My back pain is getting a bit better with the pregnancy pillow.
        </p>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">Edit</Button>
        </div>
      </div>
      
      <Button className="w-full">Add Journal Entry</Button>
    </div>
  );
}

function SymptomTrackerCard({ pregnancy }: { pregnancy: Child }) {
  // Mock symptoms for MVP
  const symptoms = [
    { name: "Back Pain", severity: 2, date: "May 9, 2023" },
    { name: "Increased Energy", severity: 4, date: "May 8, 2023" },
    { name: "Heartburn", severity: 3, date: "May 6, 2023" },
  ];
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Symptom Tracker</h3>
        <Button variant="outline" size="sm">Add Symptom</Button>
      </div>
      
      <div className="space-y-3">
        {symptoms.map((symptom, index) => (
          <div key={index} className="border rounded-lg p-3">
            <div className="flex justify-between">
              <span className="font-medium">{symptom.name}</span>
              <span className="text-xs text-muted-foreground">{symptom.date}</span>
            </div>
            <div className="mt-2 flex items-center">
              <span className="text-xs text-muted-foreground mr-2">Severity:</span>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map(level => (
                  <div 
                    key={level} 
                    className={`w-4 h-2 rounded-sm ${
                      level <= symptom.severity ? 'bg-primary-500' : 'bg-gray-200'
                    }`}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
