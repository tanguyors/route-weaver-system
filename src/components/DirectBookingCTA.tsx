import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Code2, ArrowRight } from "lucide-react";

const DirectBookingCTA = () => {
  return (
    <section className="py-20 bg-gradient-dark text-primary-foreground overflow-hidden relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 right-20 w-40 h-40 border-2 border-current rounded-full" />
        <div className="absolute bottom-10 left-20 w-32 h-32 border-2 border-current rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-current rounded-full" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Transformez votre site en machine à réservations
              </h2>
              <p className="text-primary-foreground/80 mb-6">
                Intégrez notre widget en 5 minutes. Vos clients réservent directement 
                sur votre site, vous gardez le contrôle total de votre marque.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg"
                  className="rounded-full px-8 bg-gradient-accent hover:opacity-90 text-foreground font-semibold"
                  asChild
                >
                  <Link to="/auth">
                    Créer mon widget
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Code Preview */}
            <div className="bg-foreground/10 backdrop-blur rounded-2xl p-6 border border-primary-foreground/20">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-4 text-xs text-primary-foreground/60">embed-code.html</span>
              </div>
              <div className="font-mono text-sm space-y-1">
                <p className="text-primary-foreground/60">&lt;!-- Widget SriBooking --&gt;</p>
                <p><span className="text-accent">&lt;script</span> <span className="text-green-300">src</span>=<span className="text-yellow-300">"sribooking.js"</span><span className="text-accent">&gt;&lt;/script&gt;</span></p>
                <p><span className="text-accent">&lt;div</span> <span className="text-green-300">id</span>=<span className="text-yellow-300">"booking-widget"</span><span className="text-accent">&gt;&lt;/div&gt;</span></p>
              </div>
              <div className="mt-4 pt-4 border-t border-primary-foreground/20 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-accent" />
                <span className="text-xs text-primary-foreground/60">Copiez-collez sur votre site</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DirectBookingCTA;
