import { Link, useLocation } from "wouter";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function Navbar() {
  const [location] = useLocation();
  const { user } = useAuth();

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center" data-testid="nav-logo">
              <Shield className="h-6 w-6 text-primary mr-3" />
              <span className="text-xl font-semibold text-foreground">SafeReport</span>
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link href="/" data-testid="nav-report">
                <Button 
                  variant={location === "/" ? "default" : "ghost"}
                  size="sm"
                >
                  Submit Report
                </Button>
              </Link>
              {user ? (
                <Link href="/admin" data-testid="nav-admin">
                  <Button 
                    variant={location.startsWith("/admin") ? "default" : "ghost"}
                    size="sm"
                  >
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <Link href="/auth" data-testid="nav-admin">
                  <Button 
                    variant={location === "/auth" ? "default" : "ghost"}
                    size="sm"
                  >
                    Admin Portal
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
