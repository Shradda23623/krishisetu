import { useState } from "react";
import { Wheat, Mail, Lock, User, Phone, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate } from "react-router-dom";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const [role, setRole] = useState<"customer" | "farmer">("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();
  const { signUp, signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Welcome back!" });
      // Role will be fetched by AuthContext, redirect handled after
      navigate("/");
    }
  };

  const [confirmationSentTo, setConfirmationSentTo] = useState<string | null>(null);

  const handleSignup = async () => {
    if (!name || !email || !password) {
      toast({ title: "Missing fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error, needsEmailConfirmation } = await signUp(email, password, name, phone, role);
    setLoading(false);
    if (error) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      return;
    }
    if (needsEmailConfirmation) {
      // Supabase has dispatched a confirmation email — surface that clearly.
      setConfirmationSentTo(email);
      toast({
        title: "Confirmation email sent",
        description: `We've sent a confirmation link to ${email}. Please check your inbox (and spam folder) to verify your account before logging in.`,
        duration: 8000,
      });
      // Keep the user on the auth page so they can read the banner.
      return;
    }
    toast({ title: "Account created!", description: "You are now logged in." });
    navigate(role === "farmer" ? "/farmer/dashboard" : "/");
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 items-center justify-center bg-card lg:flex relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern-grid" />
        <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-secondary/10 blur-[80px]" />
        <div className="relative max-w-md px-12 text-center">
          <div className="mx-auto h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
            <Wheat className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mt-8 font-display text-3xl font-bold text-foreground">{t("auth_welcome")}</h2>
          <p className="mt-3 text-muted-foreground">{t("auth_desc")}</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-background p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center gap-2 font-display text-xl font-bold text-gradient-hero lg:hidden">
            <Wheat className="h-6 w-6 text-primary" /> KrishiSetu
          </Link>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-xl bg-muted/50">
              <TabsTrigger value="login" className="rounded-lg font-display font-medium">{t("auth_login")}</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-lg font-display font-medium">{t("auth_signup")}</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6 space-y-4">
              <div>
                <Label className="font-medium text-muted-foreground">{t("auth_email")}</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                  <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="h-11 rounded-xl border-border/50 bg-muted/30 pl-10" />
                </div>
              </div>
              <div>
                <Label className="font-medium text-muted-foreground">{t("auth_password")}</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="h-11 rounded-xl border-border/50 bg-muted/30 pl-10" />
                </div>
              </div>
              <Button onClick={handleLogin} disabled={loading} className="w-full h-12 rounded-xl bg-primary font-display font-semibold text-primary-foreground shadow-warm hover:shadow-glow transition-all" size="lg">
                {loading ? "Logging in..." : t("auth_login")}
              </Button>
              <button
                type="button"
                onClick={async () => {
                  if (!email) {
                    toast({ title: "Enter your email", description: "We need your email to send a reset link.", variant: "destructive" });
                    return;
                  }
                  const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password`,
                  });
                  if (error) {
                    toast({ title: "Error", description: error.message, variant: "destructive" });
                  } else {
                    toast({ title: "Check your email", description: "We've sent a password reset link." });
                  }
                }}
                className="w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Forgot your password?
              </button>
            </TabsContent>

            <TabsContent value="signup" className="mt-6 space-y-4">
              {confirmationSentTo && (
                <div
                  role="status"
                  aria-live="polite"
                  className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm"
                >
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                    <div className="space-y-1">
                      <p className="font-display font-semibold text-foreground">
                        Confirmation email sent
                      </p>
                      <p className="text-muted-foreground">
                        We sent a confirmation link to{" "}
                        <span className="font-medium text-foreground">{confirmationSentTo}</span>.
                        Open it to verify your email and finish creating your account.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Didn't get it? Check your spam folder, or try signing up again in a minute.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <Label className="font-medium text-muted-foreground">{t("auth_name")}</Label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder={t("auth_name")} className="h-11 rounded-xl border-border/50 bg-muted/30 pl-10" />
                </div>
              </div>
              <div>
                <Label className="font-medium text-muted-foreground">{t("auth_phone")}</Label>
                <div className="relative mt-1.5">
                  <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                  <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" className="h-11 rounded-xl border-border/50 bg-muted/30 pl-10" />
                </div>
              </div>
              <div>
                <Label className="font-medium text-muted-foreground">{t("auth_email")}</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                  <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="h-11 rounded-xl border-border/50 bg-muted/30 pl-10" />
                </div>
              </div>
              <div>
                <Label className="font-medium text-muted-foreground">{t("auth_password")}</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="h-11 rounded-xl border-border/50 bg-muted/30 pl-10" />
                </div>
              </div>
              <div>
                <Label className="font-medium text-muted-foreground">{t("auth_role")}</Label>
                <div className="mt-1.5 grid grid-cols-2 gap-3">
                  <Button type="button" variant={role === "customer" ? "default" : "outline"} className={`rounded-xl h-11 font-display ${role === "customer" ? "bg-primary text-primary-foreground shadow-warm" : "border-border/50"}`} onClick={() => setRole("customer")}>
                    🛒 {t("auth_buyer")}
                  </Button>
                  <Button type="button" variant={role === "farmer" ? "default" : "outline"} className={`rounded-xl h-11 font-display ${role === "farmer" ? "bg-primary text-primary-foreground shadow-warm" : "border-border/50"}`} onClick={() => setRole("farmer")}>
                    🧑‍🌾 {t("auth_farmer")}
                  </Button>
                </div>
              </div>
              <Button onClick={handleSignup} disabled={loading} className="w-full h-12 rounded-xl bg-primary font-display font-semibold text-primary-foreground shadow-warm hover:shadow-glow transition-all" size="lg">
                {loading ? "Creating account..." : t("auth_create")}
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
