import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import SmartNavbar from "@/components/SmartNavbar";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async () => {
    if (password.length < 6) {
      toast({ title: "Too short", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Mismatch", description: "Passwords don't match.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated!", description: "You can now log in with your new password." });
      navigate("/auth");
    }
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen bg-background">
        <SmartNavbar />
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">Invalid or expired reset link. Please request a new one.</p>
          <Button className="mt-4 rounded-xl bg-primary" onClick={() => navigate("/auth")}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SmartNavbar />
      <div className="container flex items-center justify-center py-20">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Set New Password</h1>
            <p className="mt-2 text-muted-foreground">Enter your new password below.</p>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="font-medium text-muted-foreground">New Password</Label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 h-11 rounded-xl border-border/50 bg-muted/30"
              />
            </div>
            <div>
              <Label className="font-medium text-muted-foreground">Confirm Password</Label>
              <Input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 h-11 rounded-xl border-border/50 bg-muted/30"
              />
            </div>
            <Button
              onClick={handleReset}
              disabled={loading}
              className="w-full h-12 rounded-xl bg-primary font-display font-semibold text-primary-foreground shadow-warm hover:shadow-glow transition-all"
            >
              {loading ? "Updating…" : "Update Password"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
