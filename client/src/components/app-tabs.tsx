import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { PremiumBadge } from "@/components/premium-badge";
import { useAuth } from "@/hooks/use-auth";

interface AppTabsProps {
  activeTab?: string;
}

export function AppTabs({ activeTab }: AppTabsProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  
  if (!user) return null;

  const isPremium = user.isPremium;
  
  // Determine active tab from location or prop
  const getIsActive = (path: string) => {
    if (activeTab) {
      return path.replace('/', '') === activeTab;
    }
    
    if (path === '/' && location === '/') {
      return true;
    }
    
    if (path !== '/' && location.startsWith(path)) {
      return true;
    }
    
    return location === path;
  };
  
  const tabs = [
    { name: "Dashboard", path: "/" },
    { name: "Pregnancy", path: "/pregnancy" },
    { name: "Baby", path: "/baby" },
    { name: "Milestones", path: "/milestones" },
    { name: "Appointments", path: "/appointments" },
    { name: "Memories", path: "/memories", premium: !isPremium },
    { name: "Family", path: "/family" },
    { name: "Registry", path: "/registry" }
  ];

  return (
    <div className="bg-white border-b border-secondary-100">
      <div className="container mx-auto px-4 hidden md:block">
        <div className="flex overflow-x-auto hide-scrollbar" id="main-tabs">
          {tabs.map((tab) => (
            <Link key={tab.path} href={tab.path}>
              <div className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 flex items-center",
                getIsActive(tab.path) 
                  ? "border-primary-500 text-primary-500" 
                  : "border-transparent hover:text-primary-400"
              )}>
                {tab.name}
                {tab.premium && <PremiumBadge className="ml-1" />}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
