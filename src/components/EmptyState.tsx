import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; to: string } | { label: string; onClick: () => void };
  className?: string;
}

export default function EmptyState({ icon: Icon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div className={`mx-auto flex max-w-md flex-col items-center justify-center rounded-2xl glass-card p-10 text-center ${className}`}>
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </div>
      <h3 className="mt-5 font-display text-lg font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
      {action && (
        <div className="mt-6">
          {"to" in action ? (
            <Link to={action.to}>
              <Button className="rounded-xl bg-primary font-display font-semibold text-primary-foreground shadow-warm hover:shadow-glow">
                {action.label}
              </Button>
            </Link>
          ) : (
            <Button
              onClick={action.onClick}
              className="rounded-xl bg-primary font-display font-semibold text-primary-foreground shadow-warm hover:shadow-glow"
            >
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
