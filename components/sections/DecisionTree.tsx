import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Database, Globe, Calculator, ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface Challenge {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  titleKey: string;
  descriptionKey: string;
  solutionKey: string;
  solutionLink: string;
  color: string;
}

const challenges: Challenge[] = [
  {
    id: "messy-data",
    icon: Database,
    titleKey: "decision.messyData.title",
    descriptionKey: "decision.messyData.description",
    solutionKey: "decision.messyData.solution",
    solutionLink: "/services/low-code",
    color: "from-blue-500/20 to-purple-500/20",
  },
  {
    id: "sales",
    icon: Globe,
    titleKey: "decision.sales.title",
    descriptionKey: "decision.sales.description",
    solutionKey: "decision.sales.solution",
    solutionLink: "/services/web-development",
    color: "from-green-500/20 to-teal-500/20",
  },
  {
    id: "admin",
    icon: Calculator,
    titleKey: "decision.admin.title",
    descriptionKey: "decision.admin.description",
    solutionKey: "decision.admin.solution",
    solutionLink: "/products/rackleledger",
    color: "from-orange-500/20 to-red-500/20",
  },
];

export function DecisionTree() {
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const { t } = useLanguage();

  const handleReset = () => {
    setSelectedChallenge(null);
  };

  return (
    <section className="py-20 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 lg:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {t("decision.title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("decision.subtitle")}
          </p>
        </motion.div>

        {/* Decision Cards */}
        <AnimatePresence mode="wait">
          {!selectedChallenge ? (
            <motion.div
              key="cards"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
            >
              {challenges.map((challenge, index) => (
                <motion.button
                  key={challenge.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedChallenge(challenge)}
                  className={`group relative p-8 rounded-2xl bg-gradient-to-br ${challenge.color} border border-border hover:border-accent/50 transition-all duration-300 text-left`}
                >
                  <div className="absolute inset-0 rounded-2xl bg-card/80 backdrop-blur-sm" />
                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                      <challenge.icon className="w-7 h-7 text-accent" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">
                      {t(challenge.titleKey)}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {t(challenge.descriptionKey)}
                    </p>
                    <div className="mt-6 flex items-center text-accent text-sm font-medium">
                      <span>Learn more</span>
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="solution"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto"
            >
              <div className="relative p-8 lg:p-12 rounded-2xl bg-card border border-accent/30 shadow-lg">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent/5 to-transparent" />
                <div className="relative z-10 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
                    <selectedChallenge.icon className="w-10 h-10 text-accent" />
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                    {t(selectedChallenge.titleKey)}
                  </h3>
                  <p className="text-muted-foreground mb-2">
                    {t(selectedChallenge.descriptionKey)}
                  </p>
                  <div className="inline-block px-4 py-2 rounded-full bg-accent/10 text-accent font-medium mb-8">
                    Recommended: {t(selectedChallenge.solutionKey)}
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button
                      asChild
                      size="lg"
                      className="bg-accent text-accent-foreground hover:bg-accent/90 group"
                    >
                      <Link to={selectedChallenge.solutionLink}>
                        Explore {t(selectedChallenge.solutionKey)}
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleReset}
                      className="group"
                    >
                      <RotateCcw className="mr-2 h-4 w-4 group-hover:rotate-[-45deg] transition-transform" />
                      Choose Again
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
