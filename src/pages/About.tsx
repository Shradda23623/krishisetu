import SmartNavbar from "@/components/SmartNavbar";
import Footer from "@/components/Footer";
import { useI18n } from "@/context/I18nContext";
import { Users, Target, Heart, Award, Leaf, TrendingUp, MapPin, ShieldCheck } from "lucide-react";

export default function About() {
  const { t } = useI18n();

  const values = [
    { icon: Heart, title: "Empowering Farmers", desc: "We bridge the gap between farmers and consumers, ensuring fair prices for quality produce." },
    { icon: Target, title: "Our Mission", desc: "To revolutionize India's agricultural supply chain by connecting farms directly to families." },
    { icon: Users, title: "Community First", desc: "Building a community of 10,000+ farmers and 1M+ happy customers across India." },
    { icon: Award, title: "Quality Promise", desc: "Every product is verified for freshness, purity, and organic authenticity." },
  ];

  const stats = [
    { value: "10,000+", label: "Farmers Onboarded", icon: Users },
    { value: "28", label: "States Covered", icon: MapPin },
    { value: "1M+", label: "Happy Customers", icon: TrendingUp },
    { value: "100%", label: "Quality Verified", icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SmartNavbar />

      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-pattern-dots opacity-30" />
        <div className="container relative">
          <div className="text-center">
            <span className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              {t("nav_about")}
            </span>
            <h1 className="mt-4 font-display text-4xl font-bold text-foreground md:text-6xl">
              Farm Fresh, <span className="text-gradient-hero">Fair Trade</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              KrishiSetu (कृषिसेतु) means "Agriculture Bridge" — we are the bridge that connects 
              Indian farmers directly to your kitchen, eliminating middlemen and ensuring everyone wins.
            </p>
          </div>

          {/* Stats banner replacing the animated farmer */}
          <div className="mx-auto mt-16 max-w-4xl">
            <div className="glass-card overflow-hidden rounded-2xl p-8">
              <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                {stats.map((s) => (
                  <div key={s.label} className="text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
                      <s.icon className="h-5 w-5 text-primary" />
                    </div>
                    <p className="font-display text-2xl font-bold text-foreground md:text-3xl">{s.value}</p>
                    <p className="mt-1 text-xs font-medium text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-primary">
                <Leaf className="h-4 w-4" />
                <span className="font-semibold">From Farm to Table — No Middlemen</span>
              </div>
            </div>
          </div>

          <div className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div
                key={v.title}
                className="glass-card rounded-xl p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
                  <v.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-foreground">{v.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-20 glass-card rounded-2xl p-10 text-center">
            <h2 className="font-display text-2xl font-bold text-foreground">Our Story</h2>
            <p className="mx-auto mt-4 max-w-3xl text-muted-foreground leading-relaxed">
              Born from the heart of rural India, KrishiSetu started with a simple idea — what if farmers could 
              sell their produce directly to consumers? No middlemen taking cuts, no quality loss in transit, 
              no unfair pricing. Today, we serve millions of families with farm-fresh vegetables, fruits, dairy, 
              spices, pickles, jaggery, and cold-pressed oils — all sourced directly from verified farmers 
              across every state of India.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
