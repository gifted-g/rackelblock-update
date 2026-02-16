import { motion } from "framer-motion";

const clients = [
  { name: "TechStart Inc.", initials: "TS" },
  { name: "LogiFlow", initials: "LF" },
  { name: "Bella Design", initials: "BD" },
  { name: "Alpine Solutions", initials: "AS" },
  { name: "Nova Finance", initials: "NF" },
  { name: "Quantum Labs", initials: "QL" },
  { name: "Verde Organics", initials: "VO" },
  { name: "Meridian Group", initials: "MG" },
];

export function ClientLogos() {
  return (
    <section className="py-16 lg:py-24 bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center text-sm uppercase tracking-widest text-muted-foreground mb-10"
        >
          Trusted by innovative companies
        </motion.p>
      </div>

      {/* Infinite scrolling logos */}
      <div className="relative">
        <div className="flex animate-marquee">
          {[...clients, ...clients].map((client, index) => (
            <div
              key={`${client.name}-${index}`}
              className="flex-shrink-0 mx-8 lg:mx-12"
            >
              <div className="w-24 h-12 lg:w-32 lg:h-16 rounded-lg bg-card border border-border flex items-center justify-center hover:border-accent/50 transition-colors">
                <span className="text-lg lg:text-xl font-bold text-muted-foreground">
                  {client.initials}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}
