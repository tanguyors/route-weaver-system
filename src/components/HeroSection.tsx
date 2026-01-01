import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Mail, 
  Tag, 
  Database, 
  Package, 
  Receipt, 
  Megaphone, 
  HardDrive,
  TrendingUp,
  BarChart3
} from "lucide-react";

const HeroSection = () => {
  const leftFeatures = [
    { icon: Mail, label: "Emailing" },
    { icon: Tag, label: "Discount" },
    { icon: Database, label: "Data" },
    { icon: Package, label: "Product" },
    { icon: Receipt, label: "Billing" },
  ];

  const centerFeatures = [
    { icon: HardDrive, label: "Storage" },
    { icon: Megaphone, label: "Marketing" },
  ];

  return (
    <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-hero">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Main heading */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            <span className="text-gradient-primary">Solution</span> to well managed booking
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            and reservation and get more bookings by connecting more agent and reseller
          </p>
          <Button 
            size="lg" 
            className="rounded-full px-8 py-6 text-base bg-primary hover:bg-primary/90"
            asChild
          >
            <Link to="/auth">Sign Up</Link>
          </Button>
        </div>

        {/* Features Visual */}
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
            {/* Left Features */}
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                {leftFeatures.slice(0, 2).map((feature, index) => (
                  <div 
                    key={index}
                    className="flex flex-col items-center gap-2 p-4 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <feature.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-foreground">{feature.label}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {leftFeatures.slice(2, 4).map((feature, index) => (
                  <div 
                    key={index}
                    className="flex flex-col items-center gap-2 p-4 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <feature.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-foreground">{feature.label}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-center">
                <div className="flex flex-col items-center gap-2 p-4 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-foreground">15+ More Features</span>
                </div>
              </div>
            </div>

            {/* Center Hub with Connection Lines */}
            <div className="flex flex-col items-center gap-4">
              {centerFeatures.map((feature, index) => (
                <div 
                  key={index}
                  className="flex flex-col items-center gap-2 p-4 bg-card rounded-xl border border-border shadow-sm"
                >
                  <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-accent" />
                  </div>
                  <span className="text-xs font-medium text-foreground">{feature.label}</span>
                </div>
              ))}
              
              {/* Central Logo/Icon */}
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-primary shadow-glow flex items-center justify-center">
                  <TrendingUp className="w-10 h-10 text-primary-foreground" />
                </div>
              </div>
            </div>

            {/* Right - Business Growth Chart */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-primary" />
                </div>
                <span className="font-semibold text-foreground">Business Growth</span>
              </div>
              
              {/* Mini Chart */}
              <div className="flex items-end gap-2 h-24 mb-2">
                {[40, 60, 45, 85, 70, 95].map((height, index) => (
                  <div 
                    key={index}
                    className="w-6 rounded-t-md bg-primary/20 hover:bg-primary/40 transition-colors"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              
              {/* Chart Labels */}
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>5 Sept</span>
                <span>12 Sept</span>
                <span className="text-primary font-medium">19 Sept</span>
                <span>26 Sept</span>
              </div>
              
              {/* Trend Line */}
              <div className="mt-4 h-8 relative">
                <svg className="w-full h-full" viewBox="0 0 200 30">
                  <path 
                    d="M0 25 Q50 20 100 15 T200 5" 
                    fill="none" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
