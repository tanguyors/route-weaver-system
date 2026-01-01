import { Button } from "@/components/ui/button";
import { Check, Code2, RefreshCw, BarChart3, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

const ProductsSection = () => {
  const products = [
    {
      icon: Code2,
      title: "Booking Widget",
      subtitle: "Embeddable on any website",
      features: [
        "Simple copy-paste embed code",
        "Customizable design",
        "Works with any CMS (WordPress, Wix...)",
        "Responsive mobile & desktop",
        "Integrated payments",
      ],
      description: "A booking widget your partners can embed on their website in minutes. 24/7 reservations without intervention.",
      highlight: true,
    },
    {
      icon: RefreshCw,
      title: "Channel Manager",
      subtitle: "One dashboard, all your channels",
      features: [
        "Real-time OTA synchronization",
        "Prevent double-bookings",
        "Update prices & availability",
        "Manage agents & resellers",
        "Automatic notifications",
      ],
      description: "Manage all your reservations from one place. Widget, agents, OTAs - everything synced automatically.",
      highlight: true,
    },
    {
      icon: Calendar,
      title: "Departure Management",
      subtitle: "Smart calendar",
      features: [
        "Visual departure planning",
        "Capacity management",
        "QR code check-in",
        "Passenger manifest",
        "Fill rate alerts",
      ],
      description: "Organize your departures, manage capacity and track your bookings with an intuitive calendar.",
    },
    {
      icon: BarChart3,
      title: "Reports & Analytics",
      subtitle: "Real-time data",
      features: [
        "Performance dashboard",
        "Revenue by channel",
        "Conversion rates",
        "Custom reports",
        "Data export",
      ],
      description: "Analyze your performance, identify your best channels and optimize your business.",
    },
  ];

  return (
    <section id="products" className="py-24 bg-gradient-hero">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
            Our Solutions
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything you need to sell online
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A complete reservation system designed for tourism operators in Indonesia
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {products.map((product, index) => (
            <div 
              key={index}
              className={`bg-card rounded-2xl border p-6 md:p-8 hover:shadow-lg transition-shadow flex flex-col ${
                product.highlight ? 'border-primary/30 shadow-md' : 'border-border'
              }`}
            >
              {product.highlight && (
                <span className="inline-block px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full mb-4 self-start">
                  Popular
                </span>
              )}
              
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  product.highlight ? 'bg-primary text-primary-foreground' : 'bg-primary/10'
                }`}>
                  <product.icon className={`w-6 h-6 ${product.highlight ? '' : 'text-primary'}`} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">{product.title}</h3>
                  <p className="text-sm text-muted-foreground">{product.subtitle}</p>
                </div>
              </div>

              <ul className="space-y-3 mb-6 flex-1">
                {product.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <p className="text-sm text-muted-foreground mb-6">
                {product.description}
              </p>

              <Button 
                variant={product.highlight ? "default" : "outline"}
                className="w-full rounded-full"
                asChild
              >
                <Link to="/auth">Get Started</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;
