import { CreditCard, Wallet, Building2, Smartphone } from "lucide-react";

const PaymentSection = () => {
  const paymentMethods = [
    { name: "DANA", icon: Wallet },
    { name: "Shopee Pay", icon: Wallet },
    { name: "Kredivo", icon: CreditCard },
    { name: "LinkAja", icon: Wallet },
    { name: "PayPal", icon: CreditCard },
    { name: "Mandiri", icon: Building2 },
    { name: "QRIS", icon: Smartphone },
    { name: "BCA", icon: Building2 },
    { name: "GoPay", icon: Wallet },
    { name: "OVO", icon: Wallet },
    { name: "VISA", icon: CreditCard },
    { name: "MasterCard", icon: CreditCard },
    { name: "JCB", icon: CreditCard },
    { name: "Alfamart", icon: Building2 },
    { name: "BRI", icon: Building2 },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Payment Icons Grid */}
          <div className="grid grid-cols-5 gap-3">
            {paymentMethods.map((method, index) => (
              <div 
                key={index}
                className="aspect-square flex flex-col items-center justify-center p-3 bg-card rounded-xl border border-border hover:shadow-md transition-shadow"
              >
                <method.icon className="w-6 h-6 text-primary mb-1" />
                <span className="text-[10px] font-medium text-muted-foreground text-center">
                  {method.name}
                </span>
              </div>
            ))}
          </div>

          {/* Content */}
          <div>
            <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
              Payment Gateway
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              The Smarter Way to Pay for Travel
            </h2>
            <p className="text-muted-foreground">
              We make payments easy. Choose from a variety of trusted methods. 
              From bank transfers to digital wallets all secured with the latest 
              encryption technology. Book with confidence, pay with convenience.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PaymentSection;
