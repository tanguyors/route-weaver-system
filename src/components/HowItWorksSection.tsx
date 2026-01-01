import { ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Sign Up & Configure",
    description: "Create your partner account, set up your routes or activities, define schedules and pricing.",
    color: "from-primary to-primary-glow",
  },
  {
    number: "02",
    title: "Embed the Widget",
    description: "Copy a simple code snippet and paste it into your website. The widget handles everything.",
    color: "from-primary-glow to-accent",
  },
  {
    number: "03",
    title: "Receive Bookings",
    description: "Customers book directly on your site. Tickets with QR codes are generated automatically.",
    color: "from-accent to-accent",
  },
  {
    number: "04",
    title: "Get Paid",
    description: "Payments are processed automatically. Track revenue and receive payouts seamlessly.",
    color: "from-accent to-primary",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 bg-muted/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider mb-4 block">
            How It Works
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Get Started in Four Simple Steps
          </h2>
          <p className="text-muted-foreground text-lg">
            No technical knowledge required. We've made it as simple as possible to start selling tickets.
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-border to-transparent z-0">
                    <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                  </div>
                )}
                
                <div className="relative z-10 text-center md:text-left">
                  {/* Step number */}
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} text-primary-foreground text-xl font-bold mb-6 shadow-lg`}>
                    {step.number}
                  </div>
                  
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {step.title}
                  </h3>
                  
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
