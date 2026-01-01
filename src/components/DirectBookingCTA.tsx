import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const DirectBookingCTA = () => {
  return (
    <section className="py-16 bg-gradient-dark text-primary-foreground overflow-hidden relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 border border-current rounded-full transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 border border-current rounded-full transform -translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Get Real Potential Direct Booking from your Website.
          </h2>
          <p className="text-primary-foreground/80 mb-8">
            SriBooking is Booking Engine suited for Accommodation, Transport, & Things To Do
          </p>
          <Button 
            size="lg"
            className="rounded-full px-8 bg-gradient-accent hover:opacity-90 text-foreground font-semibold"
            asChild
          >
            <Link to="/auth">Join Us Now!</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default DirectBookingCTA;
