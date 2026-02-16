import { motion } from "framer-motion";
import { Ghost, FileWarning, EyeOff } from "lucide-react";

const painPoints = [
  {
    icon: Ghost,
    title: "Ghost Assets",
    description:
      "Hardware that exists in spreadsheets but not in reality—or worse, the other way around.",
  },
  {
    icon: FileWarning,
    title: "Audit Nightmares",
    description:
      "Scrambling to reconcile asset registers before every audit, hoping nothing slipped through.",
  },
  {
    icon: EyeOff,
    title: "Financial Blindspots",
    description:
      "No clear view of depreciation, maintenance costs, or true asset lifecycle value.",
  },
];

export function PainPoints() {
  return (
    <section className="py-20 lg:py-28 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Spreadsheets are where data goes to die.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Sound familiar? You're not alone.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {painPoints.map((point, index) => (
            <motion.div
              key={point.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative group"
            >
              <div className="bg-card border border-border rounded-2xl p-8 h-full transition-all duration-300 hover:border-destructive/50 hover:shadow-lg hover:shadow-destructive/5">
                <div className="w-14 h-14 rounded-xl bg-destructive/10 flex items-center justify-center mb-6 group-hover:bg-destructive/20 transition-colors">
                  <point.icon className="w-7 h-7 text-destructive" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {point.title}
                </h3>
                <p className="text-muted-foreground">{point.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
