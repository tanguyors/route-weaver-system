const PartnersSection = () => {
  const partners = [
    "Bali ATV Quad",
    "Rocky Adventure",
    "Wanderlust Cruise",
    "Semaya One",
    "SunTrip",
    "Bali Ocean Ferries",
    "Semara Hills",
    "Padang Bali Tour",
    "ATV Quad Bike",
    "BaliMade Tour",
    "Golden Queen",
    "Giligate",
    "Adrian Tour",
    "Nomads That Indonesia",
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <p className="text-center text-muted-foreground mb-8">Our Vendors:</p>
        
        {/* Partners Grid */}
        <div className="grid grid-cols-4 md:grid-cols-7 gap-4 md:gap-6 max-w-5xl mx-auto mb-8">
          {partners.map((partner, index) => (
            <div 
              key={index}
              className="flex items-center justify-center p-3 bg-card rounded-lg border border-border hover:shadow-md transition-shadow"
            >
              <span className="text-xs font-medium text-muted-foreground text-center leading-tight">
                {partner}
              </span>
            </div>
          ))}
        </div>

        <p className="text-center text-muted-foreground">
          And more than <strong className="text-foreground">400+ merchants</strong>
        </p>
      </div>
    </section>
  );
};

export default PartnersSection;
