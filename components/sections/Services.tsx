import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Briefcase,
  Code2,
  Megaphone,
  Palette,
  PenTool,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export function Services() {
  const { t } = useLanguage();

  const services = [
    {
      icon: Briefcase,
      titleKey: "services.consulting.title",
      descriptionKey: "services.consulting.description",
      href: "/services#consulting",
    },
    {
      icon: Code2,
      titleKey: "services.development.title",
      descriptionKey: "services.development.description",
      href: "/services#development",
    },
    {
      icon: Megaphone,
      titleKey: "services.marketing.title",
      descriptionKey: "services.marketing.description",
      href: "/services#marketing",
    },
    {
      icon: Palette,
      titleKey: "services.branding.title",
      descriptionKey: "services.branding.description",
      href: "/services#branding",
    },
    {
      icon: PenTool,
      titleKey: "services.design.title",
      descriptionKey: "services.design.description",
      href: "/services#design",
    },
  ];

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
            {t("services.title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("services.subtitle")}
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.titleKey}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link to={service.href} className="block h-full group">
                <Card className="h-full bg-card border-border hover:border-accent transition-all duration-300 hover:shadow-lg hover:shadow-accent/10">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                      <service.icon className="w-6 h-6 text-accent" />
                    </div>
                    <CardTitle className="text-xl text-foreground group-hover:text-accent transition-colors">
                      {t(service.titleKey)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {t(service.descriptionKey)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center mt-12"
        >
          <Button asChild variant="outline" size="lg" className="group">
            <Link to="/services">
              {t("services.viewAll")}
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
