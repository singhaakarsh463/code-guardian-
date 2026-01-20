import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Zap, Shield, Code, Users, ArrowLeft, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out CodeGuard",
    scans: "10 scans/month",
    features: [
      { text: "10 scans per month", included: true },
      { text: "Basic vulnerability detection", included: true },
      { text: "Static + AI analysis", included: true },
      { text: "Scan history (7 days)", included: true },
      { text: "API access", included: false },
      { text: "GitHub integration", included: false },
      { text: "Priority support", included: false },
    ],
    buttonText: "Current Plan",
    buttonVariant: "outline" as const,
    popular: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For professional developers",
    scans: "1,000 scans/month",
    features: [
      { text: "1,000 scans per month", included: true },
      { text: "Advanced vulnerability detection", included: true },
      { text: "Static + AI analysis", included: true },
      { text: "Unlimited scan history", included: true },
      { text: "API access", included: true },
      { text: "GitHub integration (1 repo)", included: true },
      { text: "Email support", included: true },
    ],
    buttonText: "Upgrade to Pro",
    buttonVariant: "default" as const,
    popular: true,
  },
  {
    name: "Team",
    price: "$99",
    period: "/month",
    description: "For teams and organizations",
    scans: "Unlimited scans",
    features: [
      { text: "Unlimited scans", included: true },
      { text: "Advanced vulnerability detection", included: true },
      { text: "Static + AI analysis", included: true },
      { text: "Unlimited scan history", included: true },
      { text: "API access (unlimited)", included: true },
      { text: "GitHub integration (unlimited)", included: true },
      { text: "Priority support + SLA", included: true },
    ],
    buttonText: "Contact Sales",
    buttonVariant: "outline" as const,
    popular: false,
  },
];

const faqs = [
  {
    question: "What counts as a scan?",
    answer: "Each code analysis request counts as one scan, regardless of code size. Viewing history or reports doesn't count."
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes, you can cancel your subscription at any time. You'll retain access until the end of your billing period."
  },
  {
    question: "What languages are supported?",
    answer: "We support JavaScript, TypeScript, Python, Java, Go, Rust, PHP, Ruby, C#, C, and C++."
  },
  {
    question: "Is my code stored?",
    answer: "We only store a hash of your code for deduplication. The actual code is analyzed in memory and not persisted."
  }
];

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");

  const handleUpgrade = (tier: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    toast({
      title: "Coming Soon",
      description: `${tier} plan will be available soon. We'll notify you!`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold gradient-text">CodeGuard AI</span>
            </div>
          </div>
          {user ? (
            <Link to="/dashboard">
              <Button>Dashboard</Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button>Sign In</Button>
            </Link>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge className="mb-4" variant="outline">
            <Sparkles className="h-3 w-3 mr-1" /> Simple, transparent pricing
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Choose your <span className="gradient-text">security level</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Start free, upgrade when you need more power
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <Button
              variant={billingPeriod === "monthly" ? "default" : "ghost"}
              onClick={() => setBillingPeriod("monthly")}
            >
              Monthly
            </Button>
            <Button
              variant={billingPeriod === "annual" ? "default" : "ghost"}
              onClick={() => setBillingPeriod("annual")}
            >
              Annual <Badge variant="secondary" className="ml-2">Save 20%</Badge>
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            {tiers.map((tier) => (
              <Card 
                key={tier.name} 
                className={`border-border bg-card relative ${
                  tier.popular ? "border-primary ring-1 ring-primary/20" : ""
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold">
                      {billingPeriod === "annual" && tier.price !== "$0" 
                        ? `$${Math.round(parseInt(tier.price.slice(1)) * 0.8)}`
                        : tier.price}
                    </span>
                    <span className="text-muted-foreground">{tier.period}</span>
                  </div>
                  <Badge variant="secondary" className="mt-2">
                    {tier.scans}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        {feature.included ? (
                          <Check className="h-4 w-4 text-success flex-shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className={feature.included ? "" : "text-muted-foreground"}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={tier.buttonVariant}
                    onClick={() => handleUpgrade(tier.name)}
                    disabled={tier.name === "Free" && user !== null}
                  >
                    {tier.buttonText}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features comparison */}
      <section className="py-20 px-4 bg-card/30 border-y border-border">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">Why CodeGuard AI?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Hybrid Analysis</h3>
              <p className="text-muted-foreground text-sm">
                Static regex checks + AI reasoning for maximum accuracy
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Code className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Fix Suggestions</h3>
              <p className="text-muted-foreground text-sm">
                Get actionable fixes, not just vulnerability reports
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Adaptive Explanations</h3>
              <p className="text-muted-foreground text-sm">
                Junior, Senior, or Lead - get explanations at your level
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardContent className="py-12">
              <h2 className="text-3xl font-bold mb-4">Ready to secure your code?</h2>
              <p className="text-muted-foreground mb-6">
                Start with 10 free scans. No credit card required.
              </p>
              <Link to="/auth">
                <Button size="lg">
                  Get Started Free <Zap className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto text-center text-muted-foreground text-sm">
          © 2025 CodeGuard AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
