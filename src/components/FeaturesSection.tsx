import { 
  Code2, 
  QrCode, 
  CreditCard, 
  BarChart3, 
  Users, 
  Shield,
  Smartphone,
  Globe,
  Ship,
  Compass
} from "lucide-react";

const features = [
  {
    icon: Ship,
    title: "Boat & Ferry Bookings",
    description: "Manage fastboat transfers between islands with real-time capacity and schedules.",
  },
  {
    icon: Compass,
    title: "Tours & Activities",
    description: "Sell excursions, day trips, and experiences with flexible pricing tiers.",
  },
  {
    icon: Code2,
    title: "Embeddable Widgets",
    description: "Drop our booking widget into any website. Fully customizable to match your brand.",
  },
  {
    icon: QrCode,
    title: "QR Ticketing",
    description: "Generate unique QR codes for every booking. Scan at boarding for instant validation.",
  },
  {
    icon: CreditCard,
    title: "Integrated Payments",
    description: "Accept payments online with automatic commission handling and transparent tracking.",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description: "Track bookings, revenue, and capacity in real-time with beautiful dashboards.",
  },
  {
    icon: Users,
    title: "Multi-user Access",
    description: "Invite staff with custom permissions. Control who can book, scan, or manage finances.",
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    description: "Enterprise-grade security with 99.9% uptime. Your data is always protected.",
  },
  {
    icon: Smartphone,
    title: "Mobile-First PWA",
    description: "Works perfectly on any device. Install as an app without app stores.",
  },
  {
    icon: Globe,
    title: "Offline Bookings",
    description: "Handle walk-ins, phone calls, and agency bookings with the same powerful system.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-background relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider mb-4 block">
            Features
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need to Grow Your Tourism Business
          </h2>
          <p className="text-muted-foreground text-lg">
            From boats to tours, we've got every step covered with powerful, easy-to-use tools tailored for Sri Lanka tourism.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 rounded-2xl bg-gradient-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-gradient-sribooking group-hover:shadow-glow transition-all duration-300">
                <feature.icon className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
