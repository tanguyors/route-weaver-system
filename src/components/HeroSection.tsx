import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Code2, 
  Globe, 
  Users, 
  Share2,
  ArrowRight,
  Check,
  Percent
} from "lucide-react";

const HeroSection = () => {
  const channels = [
    { icon: Globe, label: "Your Website", desc: "Embedded widget" },
    { icon: Users, label: "Travel Agents", desc: "Partner network" },
    { icon: Share2, label: "OTAs & Resellers", desc: "Multi-channel" },
    { icon: Code2, label: "Any Website", desc: "Embed anywhere" },
  ];

  const features = [
    "Customizable booking widget",
    "Real-time synchronization",
    "Multi-channel management",
    "Zero setup fees",
  ];

  return (
    <section className="relative pt-32 pb-24 overflow-hidden bg-gradient-hero">
      {/* Background decorations */}
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/15 border border-accent/30">
              <Percent className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-foreground">
                100% Free • We only earn a small % on your sales
              </span>
            </div>
          </div>

          {/* Main heading */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              The <span className="text-gradient-primary">Booking Widget</span>
              <br />That Connects Everywhere
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Embed our booking widget on <strong className="text-foreground">any website</strong>. 
              Manage your boats, tours & activities across Bali and Indonesia from a single dashboard. 
              <strong className="text-foreground"> No setup fees, no monthly costs.</strong>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button size="lg" className="rounded-full px-8 text-base" asChild>
                <Link to="/auth">
                  Start Free Today
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="rounded-full px-8 text-base" asChild>
                <a href="#products">Discover Features</a>
              </Button>
            </div>
          </div>

          {/* Widget Connectivity Visual */}
          <div className="relative max-w-4xl mx-auto">
            {/* Central Widget Hub */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                {/* Animated rings */}
                <div className="absolute inset-0 w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-primary/20 animate-pulse" style={{ transform: 'scale(1.2)' }} />
                <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-gradient-primary shadow-glow flex flex-col items-center justify-center">
                  <Code2 className="w-12 h-12 md:w-16 md:h-16 text-primary-foreground mb-2" />
                  <span className="text-xs md:text-sm font-bold text-primary-foreground">WIDGET</span>
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-accent text-accent-foreground text-xs font-bold rounded-full whitespace-nowrap shadow-lg">
                  Your Booking Engine
                </div>
              </div>
            </div>

            {/* Connection lines and channels */}
            <div className="relative">
              {/* Dotted lines to channels */}
              <svg className="absolute inset-0 w-full h-16 hidden md:block" style={{ top: '-60px' }}>
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--primary))" />
                  </marker>
                </defs>
                {/* Lines from center to each card */}
                <line x1="50%" y1="0" x2="12.5%" y2="60" stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="6,4" opacity="0.4" />
                <line x1="50%" y1="0" x2="37.5%" y2="60" stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="6,4" opacity="0.4" />
                <line x1="50%" y1="0" x2="62.5%" y2="60" stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="6,4" opacity="0.4" />
                <line x1="50%" y1="0" x2="87.5%" y2="60" stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="6,4" opacity="0.4" />
              </svg>

              {/* Channel Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-8">
                {channels.map((channel, index) => (
                  <div 
                    key={index} 
                    className="group p-5 md:p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all text-center"
                  >
                    <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <channel.icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-bold text-foreground text-sm md:text-base mb-1">{channel.label}</h3>
                    <p className="text-xs text-muted-foreground">{channel.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Features list */}
            <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-16 grid grid-cols-3 gap-4 md:gap-8 max-w-2xl mx-auto">
            <div className="text-center p-4 md:p-6 rounded-2xl bg-card border border-border">
              <div className="text-2xl md:text-4xl font-bold text-primary">$0</div>
              <div className="text-xs md:text-sm text-muted-foreground mt-1">Setup Fees</div>
            </div>
            <div className="text-center p-4 md:p-6 rounded-2xl bg-card border border-border">
              <div className="text-2xl md:text-4xl font-bold text-primary">$0</div>
              <div className="text-xs md:text-sm text-muted-foreground mt-1">Monthly Cost</div>
            </div>
            <div className="text-center p-4 md:p-6 rounded-2xl bg-card border border-border">
              <div className="text-xl md:text-3xl font-bold text-accent">Small %</div>
              <div className="text-xs md:text-sm text-muted-foreground mt-1">Commission Only</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
