import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useProductReviews } from "@/hooks/useReviews";

interface Props {
  productId: string;
}

export default function ProductReviews({ productId }: Props) {
  const { data: reviews = [], isLoading } = useProductReviews(productId);

  const avg = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  return (
    <section className="mt-12">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-foreground">Customer Reviews</h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map(n => (
                <Star
                  key={n}
                  className={`h-5 w-5 ${n <= Math.round(avg) ? "fill-secondary text-secondary" : "text-muted-foreground/30"}`}
                />
              ))}
            </div>
            <span className="font-display font-semibold text-foreground">{avg.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">({reviews.length})</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <Card className="glass-card border-0 rounded-xl">
          <CardContent className="py-10 text-center text-muted-foreground">
            <Star className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
            <p>No reviews yet. Be the first to review after purchase!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {reviews.map(r => (
            <Card key={r.id} className="glass-card border-0 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="font-display font-semibold text-foreground">{r.customer_name}</p>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star
                        key={n}
                        className={`h-4 w-4 ${n <= r.rating ? "fill-secondary text-secondary" : "text-muted-foreground/30"}`}
                      />
                    ))}
                  </div>
                </div>
                {r.comment && <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>}
                <p className="mt-2 text-xs text-muted-foreground/70">
                  {new Date(r.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
