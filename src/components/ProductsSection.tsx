import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const ProductsSection = () => {
  const products = [
    {
      title: "Booking Engine System",
      subtitle: "Direct booking, hassle-free.",
      features: [
        "Website widget",
        "Real-time availability",
        "Multi-language & currency support",
        "Accept direct payments",
        "Automated invoicing",
      ],
      description: "An online booking tool that lets guests book directly through your website fast, simple, and commission-free.",
    },
    {
      title: "Channel Manager System",
      subtitle: "One click, multiple channels.",
      features: [
        "OTA synchronization",
        "Prevent double bookings",
        "Update prices & inventory",
        "Performance analytics",
        "Connected to PMS",
      ],
      description: "Easily manage rates and availability across all OTAs in real-time, avoiding double bookings.",
    },
    {
      title: "Central Reservation System",
      subtitle: "All reservations in one place.",
      features: [
        "Management System for Activities company",
        "Multi-team Seamless process",
        "Custom Rates for Agent",
        "Magnificent Reports",
        "Fully integrated",
      ],
      description: "Centralized platform to manage bookings and properties perfect for multi-property setups.",
    },
    {
      title: "Property Management System",
      subtitle: "Simplify your property operations.",
      features: [
        "Digital check-in/out",
        "Housekeeping scheduling",
        "Billing & payments",
        "Real-time room control",
        "Full system integration",
      ],
      description: "Integrated system for managing check-in, housekeeping, and billing in one dashboard.",
    },
  ];

  return (
    <section id="products" className="py-20 bg-gradient-hero">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
            Our Amazing Product
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            SriBooking Products
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            A Solution for your tourism industry business meets the needs
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <div 
              key={index}
              className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg transition-shadow flex flex-col"
            >
              <h3 className="text-lg font-bold text-foreground mb-1">
                {product.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {product.subtitle}
              </p>

              <Button 
                variant="outline" 
                className="w-full rounded-full mb-6"
                asChild
              >
                <Link to="/auth">Get Started</Link>
              </Button>

              <ul className="space-y-3 mb-6 flex-1">
                {product.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <p className="text-xs text-muted-foreground">
                {product.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;
