import { motion } from "framer-motion";
import { Sparkles, Percent, Map, ArrowRight } from "lucide-react";

const perks = [
  {
    icon: Sparkles,
    title: "Alpha Access",
    description: "Be the first to test new features before public release.",
  },
  {
    icon: Percent,
    title: "Lifetime Discount",
    description: "Lock in founding member pricing—forever.",
  },
  {
    icon: Map,
    title: "Roadmap Influence",
    description: "Direct input on features and priorities.",
  },
];

interface FoundingMemberPerksProps {
  onScrollToForm: () => void;
}

export function FoundingMemberPerks({ onScrollToForm }: FoundingMemberPerksProps) {
  return (
    <section className="py-20 lg:py-28 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="relative overflow-hidden rounded-3xl border border-accent/30 bg-gradient-to-br from-accent/10 via-card to-card p-8 sm:p-12">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="px-3 py-1 rounded-full bg-accent/20 text-accent text-sm font-medium">
                  ✨ Early Bird Exclusive
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Become a Founding Member
              </h2>
              <p className="text-muted-foreground mb-8 max-w-2xl">
                Join the waitlist today and unlock exclusive benefits that will
                never be available again.
              </p>

              <div className="grid sm:grid-cols-3 gap-6 mb-8">
                {perks.map((perk, index) => (
                  <motion.div
                    key={perk.title}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                      <perk.icon className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">
                        {perk.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {perk.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <button
                onClick={onScrollToForm}
                className="inline-flex items-center gap-2 text-accent font-medium hover:underline group"
              >
                Claim your spot now
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
