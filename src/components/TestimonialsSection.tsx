import { CheckCircle2 } from "lucide-react";

const TestimonialsSection = () => {
  const testimonials = [
    {
      company: "Be Bali Hut Farm Stay",
      date: "13 Feb 2025",
      content: "The booking process is so easy for our guests. The payment options are very convenient and simple to use.",
      avatar: "🏡",
    },
    {
      company: "Lembongan Water Sport",
      date: "13 Jan 2025",
      content: "Since using SriBooking, I am extremely satisfied because everything is so practical. Customers find it very easy to book activities they want, and the payment system is equally smooth.",
      avatar: "🏄",
    },
  ];

  return (
    <section className="py-20 bg-gradient-hero">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            What Our Clients Say About Us
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Hear from our clients: real stories of success and satisfaction with SriBooking
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg transition-shadow"
            >
              {/* Company Info */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-foreground">{testimonial.company}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{testimonial.date}</span>
                </div>
              </div>
              
              {/* Content */}
              <p className="text-muted-foreground text-sm leading-relaxed">
                {testimonial.content}
              </p>
            </div>
          ))}
        </div>

        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mt-8">
          <div className="w-2 h-2 rounded-full bg-muted" />
          <div className="w-2 h-2 rounded-full bg-muted" />
          <div className="w-2 h-2 rounded-full bg-primary" />
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
