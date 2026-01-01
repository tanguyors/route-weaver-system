import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import PartnersSection from "@/components/PartnersSection";
import ProductsSection from "@/components/ProductsSection";
import DirectBookingCTA from "@/components/DirectBookingCTA";
import PaymentSection from "@/components/PaymentSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import BenefitsSection from "@/components/BenefitsSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <PartnersSection />
        <ProductsSection />
        <DirectBookingCTA />
        <PaymentSection />
        <TestimonialsSection />
        <BenefitsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
