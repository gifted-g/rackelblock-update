import { motion } from "framer-motion";
import { RefreshCcw, ShieldCheck, TrendingUp } from "lucide-react";

const features = [
  {
    icon: RefreshCcw,
    title: "Automated Reconciliation",
    description:
      "Sync your physical asset inventory with your financial systems in real-time. No more manual data entry or mismatched records.",
    gradient: "from-accent/20 to-accent/5",
  },
  {
    icon: ShieldCheck,
    title: "Audit-Ready, Always",
    description:
      "Generate compliance reports in seconds. Every asset change is tracked, timestamped, and ready for scrutiny.",
    gradient: "from-emerald-500/20 to-emerald-500/5",
  },
  {
    icon: TrendingUp,
    title: "Lifecycle Intelligence",
    description:
      "Understand the true cost of ownership. Track depreciation, predict maintenance, and optimize refresh cycles.",
    gradient: "from-purple-500/20 to-purple-500/5",
  },
];

export function SolutionFeatures() {
  return (
    <section className="py-20 lg:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            The Solution
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Your Infrastructure, Finally Visible
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Rackledger brings clarity to chaos with intelligent automation.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative"
            >
              <div className="relative bg-card border border-border rounded-2xl p-8 h-full overflow-hidden transition-all duration-300 hover:border-accent/50 hover:shadow-xl hover:shadow-accent/5 hover:-translate-y-1">
                {/* Gradient background on hover */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                />

                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                    <feature.icon className="w-7 h-7 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
