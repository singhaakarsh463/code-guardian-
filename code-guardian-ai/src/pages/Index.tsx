import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { HeroBackground } from "@/components/HeroBackground";
import { CodeScanner } from "@/components/CodeScanner";
import { FeatureCard } from "@/components/FeatureCard";
import { StatCard } from "@/components/StatCard";
import { Footer } from "@/components/Footer";
import {
  Shield,
  Zap,
  GitBranch,
  Code2,
  Lock,
  Cpu,
  ArrowRight,
  Check,
  Terminal,
} from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-16">
        <HeroBackground />
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-8">
              <Cpu className="w-4 h-4" />
              <span>Powered by Advanced ML Models</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Catch Vulnerabilities
              <br />
              <span className="gradient-text">Before Hackers Do</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              AI-powered static analysis that detects bugs, security flaws, and
              poor practices in your code — then suggests context-aware fixes
              automatically.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button variant="hero" size="xl" onClick={() => window.location.href = '/auth'}>
                Start Free Analysis
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button variant="heroOutline" size="xl" onClick={() => window.location.href = '/dashboard'}>
                <Terminal className="w-5 h-5" />
                Go to Dashboard
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                <span>Free for open source</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                <span>SOC 2 compliant</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-border bg-card/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
            <StatCard value="150+" label="CWE Types Detected" />
            <StatCard value="5M" suffix="+" label="Scans Completed" />
            <StatCard value="98" suffix="%" label="Fix Accuracy" />
            <StatCard value="<2s" label="Avg. Scan Time" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Enterprise-Grade Security,
              <br />
              <span className="gradient-text">Developer-Friendly UX</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built on transformer models trained on real vulnerabilities from
              7,500+ commits across 295 open-source projects.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={Shield}
              title="Vulnerability Detection"
              description="Identifies SQL injection, XSS, buffer overflows, and 150+ CWE types with ML-powered semantic analysis."
              highlight="18,945+ training samples"
            />
            <FeatureCard
              icon={Zap}
              title="AI-Generated Fixes"
              description="Get contextual code patches that actually work. Our CodeT5 model generates accurate fixes, not generic suggestions."
              highlight="87% recall rate"
            />
            <FeatureCard
              icon={GitBranch}
              title="CI/CD Integration"
              description="Native GitHub Actions and GitLab CI support. Block vulnerable code before it reaches production."
              highlight="Zero-config setup"
            />
            <FeatureCard
              icon={Code2}
              title="Multi-Language Support"
              description="Analyze Python, JavaScript, TypeScript, Java, C++, Go, and more with language-aware AST parsing."
              highlight="8+ languages"
            />
            <FeatureCard
              icon={Lock}
              title="Secrets Detection"
              description="Catch hardcoded API keys, tokens, and credentials before they leak. Integrates with secret managers."
              highlight="Real-time scanning"
            />
            <FeatureCard
              icon={Cpu}
              title="IDE Plugins"
              description="VS Code and JetBrains extensions for instant feedback as you code. No context switching needed."
              highlight="Coming soon"
            />
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-24 bg-card/30 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              See It In Action
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Watch as our AI scans vulnerable code, identifies security issues,
              and generates production-ready fixes in real-time.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <CodeScanner />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="relative p-12 rounded-2xl gradient-border bg-card overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
              <div className="relative">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Start Securing Your Code Today
                </h2>
                <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                  Join thousands of developers who trust CodeGuard AI to catch
                  vulnerabilities before they become breaches.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button variant="hero" size="lg" onClick={() => window.location.href = '/auth'}>
                    Start Free Trial
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => window.location.href = '/pricing'}>
                    View Pricing
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
