import SmartNavbar from "@/components/SmartNavbar";
import Footer from "@/components/Footer";
import { useI18n } from "@/context/I18nContext";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";

export default function Contact() {
  const { t } = useI18n();
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast.success("Message sent! We'll get back to you soon.");
    }, 1000);
  };

  const contactInfo = [
    { icon: Mail, label: "Email", value: "support@krishisetu.in" },
    { icon: Phone, label: "Phone", value: "+91 1800-KRISHI" },
    { icon: MapPin, label: "Address", value: "Pune, Maharashtra, India" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SmartNavbar />

      <section className="relative py-20">
        <div className="absolute inset-0 bg-pattern-dots opacity-30" />
        <div className="container relative">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <span className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              {t("nav_contact")}
            </span>
            <h1 className="mt-4 font-display text-4xl font-bold text-foreground md:text-5xl">
              Get in <span className="text-gradient-hero">Touch</span>
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              Have questions? We'd love to hear from you. Reach out and we'll respond as soon as possible.
            </p>
          </motion.div>

          <div className="mt-16 grid gap-10 lg:grid-cols-2">
            <motion.form
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              onSubmit={handleSubmit}
              className="glass-card space-y-5 rounded-2xl p-8"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Input placeholder="Your Name" required className="bg-background/50 border-border/50" />
                <Input placeholder="Email Address" type="email" required className="bg-background/50 border-border/50" />
              </div>
              <Input placeholder="Subject" required className="bg-background/50 border-border/50" />
              <Textarea placeholder="Your Message..." rows={5} required className="bg-background/50 border-border/50 resize-none" />
              <Button type="submit" disabled={sending} className="w-full rounded-xl bg-primary font-display font-semibold text-primary-foreground shadow-warm hover:shadow-glow transition-all">
                {sending ? "Sending..." : "Send Message"}
                <Send className="ml-2 h-4 w-4" />
              </Button>
            </motion.form>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col gap-6"
            >
              {contactInfo.map((c, i) => (
                <motion.div
                  key={c.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  whileHover={{ x: 6 }}
                  className="glass-card flex items-center gap-5 rounded-xl p-6 transition-all"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                    <c.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-display text-sm font-semibold text-foreground">{c.label}</p>
                    <p className="text-muted-foreground">{c.value}</p>
                  </div>
                </motion.div>
              ))}

              <div className="glass-card mt-auto rounded-xl p-6">
                <h3 className="font-display text-lg font-semibold text-foreground">Business Hours</h3>
                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                  <p>Monday – Saturday: 8:00 AM – 8:00 PM IST</p>
                  <p>Sunday: 10:00 AM – 4:00 PM IST</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
