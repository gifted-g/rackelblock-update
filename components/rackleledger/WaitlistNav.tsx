import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function WaitlistNav() {
  const scrollToForm = () => {
    const form = document.getElementById("waitlist-form");
    if (form) {
      form.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-accent-foreground font-bold text-sm">RL</span>
            </div>
            <span className="font-bold text-xl text-foreground">Rackledger</span>
          </div>

          {/* CTA Button */}
          <Button
            onClick={scrollToForm}
            className="bg-accent text-accent-foreground hover:bg-accent/90 hidden sm:inline-flex"
          >
            Join Waitlist
          </Button>
        </div>
      </div>
    </motion.nav>
  );
}
