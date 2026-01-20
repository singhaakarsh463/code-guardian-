import { Shield, Menu, X } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-lg">CodeGuard</span>
            <span className="text-primary font-mono text-xs">AI</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#demo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Demo
            </a>
            <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link to="/dashboard">
                <Button variant="hero" size="sm">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button variant="hero" size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">
                Features
              </a>
              <a href="#demo" className="text-sm text-muted-foreground hover:text-foreground">
                Demo
              </a>
              <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground">
                Pricing
              </Link>
              <div className="flex gap-3 pt-4">
                {user ? (
                  <Link to="/dashboard" className="flex-1">
                    <Button variant="hero" size="sm" className="w-full">
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/auth" className="flex-1">
                      <Button variant="ghost" size="sm" className="w-full">
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/auth" className="flex-1">
                      <Button variant="hero" size="sm" className="w-full">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
