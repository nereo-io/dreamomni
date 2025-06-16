interface StructuredDataProps {
  type: 'organization' | 'website' | 'product' | 'article' | 'faq';
  data: any;
}

export default function StructuredData({ type, data }: StructuredDataProps) {
  let structuredData = {};

  switch (type) {
    case 'organization':
      structuredData = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Seedance",
        url: "https://www.seedance.tv",
        logo: "https://www.seedance.tv/logo.png",
        description: data.description || "Professional AI Video Generator - Create stunning 1080p videos with advanced AI technology",
        foundingDate: "2024",
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer service",
          email: "support@seedance.tv"
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
        name: "Seedance",
        url: "https://www.seedance.tv",
        description: data.description,
        potentialAction: {
          "@type": "SearchAction",
          target: "https://www.seedance.tv/search?q={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      };
      break;

    case 'product':
      structuredData = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Seedance AI Video Generator",
        applicationCategory: "MultimediaApplication",
        operatingSystem: "Web Browser",
        url: "https://www.seedance.tv",
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
          name: "Seedance"
        },
        publisher: {
          "@type": "Organization",
          name: "Seedance",
          logo: {
            "@type": "ImageObject",
            url: "https://www.seedance.tv/logo.png"
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