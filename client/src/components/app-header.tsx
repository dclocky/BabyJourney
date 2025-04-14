import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sprout } from "lucide-react";

export function AppHeader() {
  const { user, logoutMutation, upgradeToPremiumMutation } = useAuth();
  
  const handleUpgrade = () => {
    upgradeToPremiumMutation.mutate();
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  if (!user) {
    return null;
  }
  
  // Get user initials for avatar
  const getInitials = () => {
    if (!user?.fullName) return "U";
    return user.fullName
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <div className="mr-2 text-primary-500 text-3xl">
            <Sprout />
          </div>
          <Link href="/">
            <h1 className="font-bold text-xl text-primary-500 cursor-pointer">BabyJourney</h1>
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          {!user.isPremium && (
            <Button
              variant="outline"
              className="hidden md:flex bg-accent-50 text-accent-500 hover:bg-accent-100 border-accent-100"
              onClick={handleUpgrade}
              disabled={upgradeToPremiumMutation.isPending}
            >
              Upgrade to Premium
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none">
              <div className="flex items-center space-x-2">
                <Avatar>
                  <AvatarFallback className="bg-primary-500 text-white">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline text-sm font-medium">{user.fullName}</span>
                <i className="ri-arrow-down-s-line"></i>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="cursor-pointer">
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                Family Members
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-destructive focus:text-destructive" 
                onClick={handleLogout}
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
