import { Anchor, Compass, Car, Ship, Bike, Mountain } from "lucide-react";

const PartnersSection = () => {
  const partnerTypes = [
    { icon: Ship, label: "Fast Boats" },
    { icon: Anchor, label: "Ferries" },
    { icon: Compass, label: "Tours" },
    { icon: Mountain, label: "Activities" },
    { icon: Car, label: "Transfers" },
    { icon: Bike, label: "Rentals" },
  ];

  return (
    <section className="py-16 bg-background border-y border-border">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <p className="text-muted-foreground mb-2">Built for tourism operators</p>
          <h3 className="text-xl font-semibold text-foreground">
            Boats, Tours, Activities & more
          </h3>
        </div>
        
        {/* Partner Types */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-10">
          {partnerTypes.map((type, index) => (
            <div 
              key={index}
              className="flex items-center gap-3 px-5 py-3 bg-card rounded-full border border-border hover:border-primary/30 hover:shadow-md transition-all"
            >
              <type.icon className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-foreground">{type.label}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-muted-foreground">
          More than <strong className="text-foreground">400+ operators</strong> trust us across Bali and Indonesia
        </p>
      </div>
    </section>
  );
};

export default PartnersSection;
