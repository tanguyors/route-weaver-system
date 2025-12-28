import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";

const benefits = [
  "No upfront costs or monthly fees",
  "Only 7% commission on successful bookings",
  "Full access to all features",
  "Dedicated partner support",
  "Custom branding for widgets",
  "Real-time analytics dashboard",
];

const CTASection = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl bg-gradient-ocean p-1 shadow-glow">
            <div className="rounded-[calc(1.5rem-4px)] bg-card p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Content */}
                <div>
                  <span className="text-sm font-semibold text-primary uppercase tracking-wider mb-4 block">
                    Join Our Network
                  </span>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                    Ready to Grow Your Business?
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Join hundreds of fastboat operators already using Sribooking to streamline their operations and increase bookings.
                  </p>
                  
                  <Button variant="hero" size="lg" className="group">
                    Become a Partner
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>

                {/* Benefits */}
                <div className="space-y-3">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-foreground">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
