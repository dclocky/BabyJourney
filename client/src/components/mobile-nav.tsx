import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { FileHeart, Heart, Smile, Calendar, Menu } from "lucide-react";
import { PremiumBadge } from "@/components/premium-badge";
import { useAuth } from "@/hooks/use-auth";

export function MobileNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  if (!user) return null;
  
  const isPremium = user.isPremium;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-secondary-100 py-2 md:hidden z-10">
      <div className="flex justify-around">
        <NavButton 
          icon={<FileHeart className="h-5 w-5" />}
          label="Home"
          href="/"
          isActive={location === "/"}
        />
        <NavButton 
          icon={<Heart className="h-5 w-5" />}
          label="Pregnancy"
          href="/pregnancy"
          isActive={location === "/pregnancy"}
        />
        <NavButton 
          icon={<Smile className="h-5 w-5" />}
          label="Baby"
          href="/baby"
          isActive={location === "/baby"}
        />
        <NavButton 
          icon={<Calendar className="h-5 w-5" />}
          label="Calendar"
          href="/appointments"
          isActive={location === "/appointments"}
        />
        <NavButton 
          icon={<Menu className="h-5 w-5" />}
          label="More"
          href="/memories"
          isActive={location === "/memories" || location === "/milestones" || location === "/family"}
          isPremium={!isPremium && location === "/memories"}
        />
      </div>
    </div>
  );
}

function NavButton({ 
  icon, 
  label, 
  href, 
  isActive,
  isPremium = false
}: { 
  icon: React.ReactNode, 
  label: string, 
  href: string, 
  isActive: boolean,
  isPremium?: boolean
}) {
  return (
    <Link href={href}>
      <div className={cn(
        "flex flex-col items-center px-4 py-1 cursor-pointer",
        isActive ? "text-primary-500" : "text-muted-foreground"
      )}>
        {icon}
        <span className="text-xs mt-1 flex items-center">
          {label}
          {isPremium && <PremiumBadge className="ml-1" />}
        </span>
      </div>
    </Link>
  );
}
