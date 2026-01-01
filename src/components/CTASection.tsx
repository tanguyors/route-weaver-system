import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const benefits = [
  "Free 14-day trial with full features",
  "No setup fees or hidden costs",
  "Dedicated onboarding support",
  "Customizable booking widgets",
  "Real-time analytics dashboard",
];

const CTASection = () => {
  return (
    <section id="partners" className="py-24 bg-gradient-hero relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl bg-gradient-sribooking p-1 shadow-glow">
            <div className="rounded-[calc(1.5rem-4px)] bg-card p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <span className="text-sm font-semibold text-primary uppercase tracking-wider mb-4 block">Join Our Network</span>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Ready to Transform Your Business?</h2>
                  <p className="text-muted-foreground mb-6">Join 50+ tourism operators in Sri Lanka who trust SriBooking.com to manage their reservations.</p>
                  <Button variant="hero" size="lg" asChild>
                    <Link to="/auth">Become a Partner <ArrowRight className="w-4 h-4 ml-2" /></Link>
                  </Button>
                </div>
                <div className="space-y-3">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
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
