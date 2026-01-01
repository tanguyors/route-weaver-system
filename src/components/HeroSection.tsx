import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Code2, Globe, Percent, CheckCircle, Zap, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden bg-gradient-hero">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float animation-delay-300" />
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Badge */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/30 animate-fade-up">
              <Percent className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-foreground">
                100% Free • We only earn a small % on your sales
              </span>
            </div>
          </div>

          {/* Main heading */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 animate-fade-up animation-delay-100 leading-tight">
              The Booking Widget That{" "}
              <span className="text-gradient-sribooking">Connects Everywhere</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto animate-fade-up animation-delay-200">
              Embed our powerful booking widget on any website. Manage fastboat transfers, tours & activities across Bali and Indonesia. 
              <strong className="text-foreground"> Zero setup fees, zero monthly costs</strong> — we only take a small commission on successful bookings.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-up animation-delay-300">
              <Button variant="hero" size="lg" asChild>
                <Link to="/auth">Start Free — No Risk <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
              <Button variant="outline" size="lg" className="border-primary/30 hover:bg-primary/5">
                <Play className="w-4 h-4 mr-2" /> Watch Demo
              </Button>
            </div>
          </div>

          {/* Widget Connectivity Visual */}
          <div className="animate-fade-up animation-delay-400">
            <div className="relative max-w-4xl mx-auto">
              {/* Central Hub */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-sribooking shadow-glow flex items-center justify-center">
                    <Code2 className="w-12 h-12 md:w-16 md:h-16 text-primary-foreground" />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded-full whitespace-nowrap">
                    Your Widget
                  </div>
                </div>
              </div>

              {/* Connection Lines & Sites */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {[
                  { icon: Globe, label: "Your Website", desc: "Direct integration" },
                  { icon: Zap, label: "Travel Agents", desc: "Partner network" },
                  { icon: BarChart3, label: "OTAs & Resellers", desc: "Multi-channel" },
                  { icon: CheckCircle, label: "Social Media", desc: "Link in bio" },
                ].map((item, index) => (
                  <div key={index} className="relative group">
                    {/* Connection line */}
                    <div className="absolute -top-8 left-1/2 w-px h-8 bg-gradient-to-b from-primary/50 to-transparent hidden md:block" />
                    
                    <div className="p-4 md:p-6 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all text-center">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <item.icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground text-sm md:text-base">{item.label}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-16 grid grid-cols-3 gap-4 md:gap-8 max-w-2xl mx-auto animate-fade-up animation-delay-500">
            <div className="text-center p-4 rounded-xl bg-card/50 border border-border/50">
              <div className="text-2xl md:text-3xl font-bold text-primary">0%</div>
              <div className="text-xs md:text-sm text-muted-foreground">Setup Fees</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-card/50 border border-border/50">
              <div className="text-2xl md:text-3xl font-bold text-primary">0$</div>
              <div className="text-xs md:text-sm text-muted-foreground">Monthly Cost</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-card/50 border border-border/50">
              <div className="text-2xl md:text-3xl font-bold text-accent">7%</div>
              <div className="text-xs md:text-sm text-muted-foreground">Commission Only</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
