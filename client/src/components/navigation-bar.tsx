import { Link, useLocation } from "wouter";
import { Baby, Car } from "lucide-react";

interface NavigationBarProps {
  currentPage?: string;
}

export function NavigationBar({ currentPage }: NavigationBarProps) {
  const [location] = useLocation();

  const navItems = [
    { name: "Dashboard", path: "/" },
    { name: "Pregnancy", path: "/pregnancy" },
    { name: "Baby", path: "/baby" },
    { name: "Milestones", path: "/milestones" },
    { name: "Appointments", path: "/appointments" },
    { name: "Memories", path: "/memories" },
    { name: "Family", path: "/family-members" },
    { name: "Extras", path: "/extras" }
  ];

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Car className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-gray-900">BabyJourney</span>
          </div>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link key={item.name} href={item.path}>
                <span
                  className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
                    isActive(item.path)
                      ? "text-primary border-b-2 border-primary pb-4"
                      : "text-gray-700"
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            ))}
          </div>

          {/* Mobile menu placeholder */}
          <div className="md:hidden">
            <Baby className="h-6 w-6 text-primary" />
          </div>
        </div>
      </div>
    </nav>
  );
}