import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

interface SEOHeadProps {
  title: string;
  description: string;
  image?: string;
  schemaMarkup?: object;
  noIndex?: boolean;
}

export function SEOHead({
  title,
  description,
  image = "https://lovable.dev/opengraph-image-p98pqg.png",
  schemaMarkup,
  noIndex = false,
}: SEOHeadProps) {
  const location = useLocation();
  const { language } = useLanguage();

  const baseUrl = "https://rackleblock.com"; // Update with actual domain
  const currentUrl = `${baseUrl}${location.pathname}`;

  // Generate hreflang URLs
  const hreflangUrls = {
    en: location.pathname.replace(/^\/(de|it)/, "") || "/",
    de: `/de${location.pathname.replace(/^\/(de|it)/, "") || ""}`,
    it: `/it${location.pathname.replace(/^\/(de|it)/, "") || ""}`,
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content={language === "en" ? "en_US" : language === "de" ? "de_DE" : "it_IT"} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Hreflang Tags for Multilingual SEO */}
      <link rel="alternate" hrefLang="en" href={`${baseUrl}${hreflangUrls.en}`} />
      <link rel="alternate" hrefLang="de" href={`${baseUrl}${hreflangUrls.de}`} />
      <link rel="alternate" hrefLang="it" href={`${baseUrl}${hreflangUrls.it}`} />
      <link rel="alternate" hrefLang="x-default" href={`${baseUrl}${hreflangUrls.en}`} />

      {/* Canonical URL */}
      <link rel="canonical" href={currentUrl} />

      {/* Schema.org Markup */}
      {schemaMarkup && (
        <script type="application/ld+json">
          {JSON.stringify(schemaMarkup)}
        </script>
      )}
    </Helmet>
  );
}
