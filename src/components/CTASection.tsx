import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section id="contact" className="py-20 bg-gradient-hero relative overflow-hidden">
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Don&apos;t Miss Out! Join Us Today!
          </h2>
          <Button size="lg" className="rounded-full px-10 py-6 text-base bg-gradient-accent hover:opacity-90 font-semibold" asChild>
            <Link to="/auth">Contact Our Sales Now</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
