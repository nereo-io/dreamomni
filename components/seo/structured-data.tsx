interface StructuredDataProps {
  type: 'organization' | 'website' | 'product' | 'article' | 'faq';
  data: any;
}

const site = {
  name: 'DreamOmni',
  url: 'https://dreamomni.ai',
  logo: 'https://dreamomni.ai/logo.png',
  supportEmail: 'support@dreamomni.ai',
};

export default function StructuredData({ type, data }: StructuredDataProps) {
  let structuredData = {};

  switch (type) {
    case 'organization':
      structuredData = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: site.name,
        url: site.url,
        logo: site.logo,
        description: data.description || "DreamOmni is an independent AI video generator for creating cinematic videos from prompts and images.",
        foundingDate: "2024",
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer service",
          email: site.supportEmail
        },
        sameAs: [
          // Add social media URLs when available
        ]
      };
      break;

    case 'website':
      structuredData = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: site.name,
        url: site.url,
        description: data.description,
      };
      break;

    case 'product':
      structuredData = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "DreamOmni AI Video Generator",
        applicationCategory: "MultimediaApplication",
        operatingSystem: "Web Browser",
        url: site.url,
        description: data.description,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock"
        },
        aggregateRating: data.rating && {
          "@type": "AggregateRating",
          ratingValue: data.rating.value,
          reviewCount: data.rating.count
        }
      };
      break;

    case 'faq':
      structuredData = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: data.questions.map((q: any) => ({
          "@type": "Question",
          name: q.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: q.answer
          }
        }))
      };
      break;

    case 'article':
      structuredData = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: data.title,
        description: data.description,
        author: {
          "@type": "Organization",
          name: site.name
        },
        publisher: {
          "@type": "Organization",
          name: site.name,
          logo: {
            "@type": "ImageObject",
            url: site.logo
          }
        },
        datePublished: data.publishedDate,
        dateModified: data.modifiedDate || data.publishedDate
      };
      break;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
