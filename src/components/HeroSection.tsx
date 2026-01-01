import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Ship, MapPin, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden bg-gradient-hero">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float animation-delay-300" />
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-up">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-sm font-medium text-primary">Reservation System for Sri Lanka Tourism</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 animate-fade-up animation-delay-100 leading-tight">
            The Complete Booking Platform for <span className="text-gradient-sribooking">Sri Lanka Tourism</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-up animation-delay-200">
            Manage fastboat transfers, tours, and activities with one powerful platform. Embeddable widgets, QR tickets, and seamless payments.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-up animation-delay-300">
            <Button variant="hero" size="lg" asChild>
              <Link to="/auth">Start Free Trial <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
            <Button variant="outline" size="lg" className="border-primary/30 hover:bg-primary/5">
              <Play className="w-4 h-4 mr-2" /> Watch Demo
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto animate-fade-up animation-delay-400">
            {[
              { icon: Ship, value: "50+", label: "Operators" },
              { icon: MapPin, value: "200+", label: "Routes" },
              { icon: Calendar, value: "10K+", label: "Bookings" },
              { value: "99.9%", label: "Uptime" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
