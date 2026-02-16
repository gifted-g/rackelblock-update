import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What does 'Consult-First' mean?",
    answer:
      "We start every project with a deep-dive consultation to understand your business, challenges, and goals. This ensures we build solutions that actually fit your needs—not just generic templates. You get a strategic partner, not just a vendor.",
  },
  {
    question: "How long does a typical project take?",
    answer:
      "Project timelines vary based on scope and complexity. A simple website might take 2-4 weeks, while a full business automation system could take 2-3 months. During our initial consultation, we'll provide a detailed timeline tailored to your specific project.",
  },
  {
    question: "Do you work with small businesses or just enterprises?",
    answer:
      "We work with businesses of all sizes—from startups and small businesses to established enterprises. Our solutions are scalable, meaning we can start small and grow with you as your business evolves.",
  },
  {
    question: "What technologies do you specialize in?",
    answer:
      "We're technology-agnostic and choose the best tools for each project. This includes modern web technologies (React, Next.js), low-code platforms (Bubble, Webflow), automation tools (Zapier, Make), and custom software development when needed.",
  },
  {
    question: "How much does a project typically cost?",
    answer:
      "Every project is unique, so we provide custom quotes after understanding your requirements. We offer flexible pricing models including fixed-price projects, retainer arrangements, and hourly consulting. Schedule a free audit to get a personalized estimate.",
  },
  {
    question: "Do you provide ongoing support after launch?",
    answer:
      "Absolutely. We offer maintenance packages, training, and ongoing support to ensure your systems continue running smoothly. Many clients choose our retainer plans for continuous improvements and dedicated support.",
  },
];

export function FAQs() {
  return (
    <section className="py-20 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Got questions? We've got answers. If you don't see what you're looking for, reach out to us directly.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-foreground hover:text-accent">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
