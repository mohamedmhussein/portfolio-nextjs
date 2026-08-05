/**
 * Person structured data describing Mohammad (Req 15.4).
 *
 * This lives in a non-route module so it can be imported by the App Router
 * layout (which only permits a fixed set of named exports) and injected as a
 * JSON-LD `<script>` tag, while remaining independently testable.
 */
import { siteConfig } from "@/lib/site";
import { contact } from "@/content/contact";
import { credibility } from "@/content/credibility";

export const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: siteConfig.name,
  // Name variants people actually search for — helps Google connect the
  // spellings and the Arabic form to the same entity.
  alternateName: ["Mohammad Elprince", "elprince-dev", "محمد البرنس"],
  url: siteConfig.url,
  image: `${siteConfig.url}${siteConfig.previewImage}`,
  email: `mailto:${contact.email}`,
  jobTitle: siteConfig.jobTitle,
  worksFor: {
    "@type": "Organization",
    name: credibility.employer,
  },
  sameAs: [siteConfig.linkedinUrl, siteConfig.githubUrl],
  knowsAbout: [
    "AI Engineering",
    "Agentic AI",
    "Software Engineering",
    "Backend Engineering",
    "Retrieval-Augmented Generation (RAG)",
    "LLM Applications",
    "Cloud Architecture",
    "AWS",
    "Serverless",
    "TypeScript",
    "Python",
  ],
} as const;

/**
 * WebSite structured data — tells Google the site's canonical name so search
 * results show "Mohammad El Prince" as the site name instead of a guessed
 * label, and ties the site entity to the Person entity above.
 */
export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteConfig.name,
  alternateName: "elprince.net",
  url: siteConfig.url,
  inLanguage: ["en", "ar"],
  publisher: {
    "@type": "Person",
    name: siteConfig.name,
    url: siteConfig.url,
  },
} as const;
