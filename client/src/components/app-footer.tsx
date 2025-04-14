import { Link } from "wouter";

export function AppFooter() {
  return (
    <footer className="bg-white border-t border-secondary-100 py-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-muted-foreground mb-4 md:mb-0">
            © {new Date().getFullYear()} BabyJourney. All rights reserved.
          </div>
          <div className="flex space-x-6">
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary-500">
              Privacy Policy
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary-500">
              Terms of Service
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary-500">
              Help Center
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
