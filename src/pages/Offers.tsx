import SmartNavbar from "@/components/SmartNavbar";
import Footer from "@/components/Footer";
import { useI18n } from "@/context/I18nContext";
import { motion } from "framer-motion";
import { Tag, Clock, Percent, Gift, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const offers = [
  {
    title: "Fresh Fruit Fiesta 🥭",
    discount: "25% OFF",
    desc: "On all seasonal fruits — mangoes, guavas, pomegranates & more!",
    code: "FRUIT25",
    color: "from-orange-500/20 to-yellow-500/20",
    border: "border-orange-500/30",
    validTill: "Apr 30, 2026",
  },
  {
    title: "Spice Season Sale 🌶️",
    discount: "30% OFF",
    desc: "Premium Kashmiri chillies, turmeric, and whole spice combos.",
    code: "SPICE30",
    color: "from-red-500/20 to-orange-500/20",
    border: "border-red-500/30",
    validTill: "May 15, 2026",
  },
  {
    title: "First Order Bonus 🎁",
    discount: "₹100 OFF",
    desc: "New to KrishiSetu? Get ₹100 off your first order above ₹499.",
    code: "WELCOME100",
    color: "from-primary/20 to-secondary/20",
    border: "border-primary/30",
    validTill: "Ongoing",
  },
  {
    title: "Organic Bundle 🌿",
    discount: "Buy 3 Get 1",
    desc: "Buy any 3 organic products and get the 4th one absolutely free!",
    code: "ORGANIC4",
    color: "from-green-500/20 to-emerald-500/20",
    border: "border-green-500/30",
    validTill: "May 31, 2026",
  },
  {
    title: "Dairy Delight 🥛",
    discount: "15% OFF",
    desc: "Pure A2 cow ghee, paneer, curd & fresh milk — farm delivered!",
    code: "DAIRY15",
    color: "from-blue-500/20 to-cyan-500/20",
    border: "border-blue-500/30",
    validTill: "Apr 20, 2026",
  },
  {
    title: "Weekend Special ⚡",
    discount: "Flat ₹50 OFF",
    desc: "Every Saturday & Sunday on orders above ₹299. No code needed!",
    code: "AUTO-APPLIED",
    color: "from-purple-500/20 to-pink-500/20",
    border: "border-purple-500/30",
    validTill: "Every Weekend",
  },
];

export default function Offers() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background">
      <SmartNavbar />

      <section className="relative py-20">
        <div className="absolute inset-0 bg-pattern-dots opacity-30" />
        <div className="container relative">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <span className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              {t("nav_offers")}
            </span>
            <h1 className="mt-4 font-display text-4xl font-bold text-foreground md:text-5xl">
              Hot <span className="text-gradient-hero">Deals</span> & Offers
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              Save big on farm-fresh products. Use coupon codes at checkout!
            </p>
          </motion.div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((offer, i) => (
              <motion.div
                key={offer.code}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * i }}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`glass-card relative overflow-hidden rounded-2xl border ${offer.border} p-6 transition-all duration-300`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${offer.color} opacity-50`} />
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-2xl font-bold text-primary">{offer.discount}</span>
                    <Tag className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <h3 className="mt-3 font-display text-lg font-semibold text-foreground">{offer.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{offer.desc}</p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Valid till: {offer.validTill}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <code className="rounded-lg bg-background/60 px-3 py-1.5 font-mono text-xs font-bold text-primary ring-1 ring-primary/20">
                      {offer.code}
                    </code>
                    <Link to="/products">
                      <Button size="sm" variant="ghost" className="text-primary text-xs">
                        Shop Now <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
