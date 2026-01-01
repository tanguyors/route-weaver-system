import { Megaphone, Eye, TrendingUp, Users } from "lucide-react";

const BenefitsSection = () => {
  const benefits = [
    {
      icon: Megaphone,
      tag: "Advertising",
      title: "Cost-effective advertising",
      description: "Maximize your budget with cost-effective ads that deliver results.",
    },
    {
      icon: Eye,
      tag: "Exposure",
      title: "Reach millions with SriBooking",
      description: "Reach millions globally with SriBooking for optimal exposure.",
    },
    {
      icon: TrendingUp,
      tag: "Growth",
      title: "Scale your business",
      description: "Grow your business with powerful tools and analytics.",
    },
    {
      icon: Users,
      tag: "Network",
      title: "Connect with agents",
      description: "Build a strong network of travel agents and resellers.",
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Image placeholder */}
          <div className="relative">
            <div className="aspect-[4/3] bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🧳✈️🌴</div>
                <p className="text-muted-foreground">Travel with SriBooking</p>
              </div>
            </div>
          </div>

          {/* Benefits List */}
          <div>
            <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
              Benefits
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
              Happening Cities
            </h2>

            <div className="space-y-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <span className="inline-block px-2 py-0.5 bg-muted text-muted-foreground text-xs font-medium rounded mb-2">
                      {benefit.tag}
                    </span>
                    <h3 className="font-semibold text-foreground mb-1">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
