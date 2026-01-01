import { Button } from "@/components/ui/button";
import { Check, Code2, RefreshCw, BarChart3, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

const ProductsSection = () => {
  const products = [
    {
      icon: Code2,
      title: "Widget de Réservation",
      subtitle: "Intégrable sur n'importe quel site",
      features: [
        "Code embed simple à copier-coller",
        "Design personnalisable",
        "Compatible tous CMS (WordPress, Wix...)",
        "Responsive mobile & desktop",
        "Paiements intégrés",
      ],
      description: "Un widget de booking que vos clients peuvent intégrer sur leur site en quelques minutes. Réservations 24/7 sans intervention.",
      highlight: true,
    },
    {
      icon: RefreshCw,
      title: "Channel Manager",
      subtitle: "Un dashboard, tous vos canaux",
      features: [
        "Synchronisation OTAs en temps réel",
        "Évite les double-bookings",
        "Mise à jour prix & disponibilités",
        "Gestion agents & resellers",
        "Notifications automatiques",
      ],
      description: "Gérez toutes vos réservations depuis un seul endroit. Widget, agents, OTAs - tout synchronisé automatiquement.",
      highlight: true,
    },
    {
      icon: Calendar,
      title: "Gestion des Départs",
      subtitle: "Calendrier intelligent",
      features: [
        "Planning visuel des départs",
        "Gestion de capacité",
        "Check-in QR code",
        "Manifeste passagers",
        "Alertes remplissage",
      ],
      description: "Organisez vos départs, gérez les capacités et suivez vos réservations avec un calendrier intuitif.",
    },
    {
      icon: BarChart3,
      title: "Rapports & Analytics",
      subtitle: "Données en temps réel",
      features: [
        "Dashboard de performance",
        "Revenus par canal",
        "Taux de conversion",
        "Rapports personnalisés",
        "Export des données",
      ],
      description: "Analysez vos performances, identifiez vos meilleurs canaux et optimisez votre business.",
    },
  ];

  return (
    <section id="products" className="py-24 bg-gradient-hero">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
            Nos Solutions
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Tout ce dont vous avez besoin pour vendre en ligne
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Un système complet de réservation conçu pour les opérateurs de tourisme en Indonésie
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
                  Populaire
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
                <Link to="/auth">Commencer</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;
