import React from "react";

interface OrganizationSchemaProps {
  name: string;
  url: string;
  logo: string;
  description?: string;
  sameAs?: string[];
}

interface WebsiteSchemaProps {
  name: string;
  url: string;
  searchUrl?: string;
}

interface SoftwareApplicationSchemaProps {
  name: string;
  description: string;
  applicationCategory?: string;
  price?: string | number;
  priceCurrency?: string;
  operatingSystem?: string;
  featureList?: string[];
}

interface HowToStepProps {
  name: string;
  text: string;
  url?: string;
  image?: string;
}

interface HowToSchemaProps {
  name: string;
  description: string;
  steps: HowToStepProps[];
}

interface ServiceSchemaProps {
  name: string;
  description: string;
  serviceType?: string;
  provider?: {
    name: string;
    url?: string;
  };
}

interface FAQItemProps {
  question: string;
  answer: string;
}

interface FAQPageSchemaProps {
  faqs: FAQItemProps[];
}

interface BreadcrumbItemProps {
  name: string;
  item: string;
}

interface BreadcrumbListSchemaProps {
  items: BreadcrumbItemProps[];
}

export const OrganizationSchema = ({
  name,
  url,
  logo,
  description,
  sameAs,
}: OrganizationSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
    logo,
    description,
    sameAs,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

export const WebsiteSchema = ({ name, url, searchUrl }: WebsiteSchemaProps) => {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url,
  };

  if (searchUrl) {
    schema.potentialAction = {
      "@type": "SearchAction",
      target: `${searchUrl}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

export const SoftwareApplicationSchema = ({
  name,
  description,
  applicationCategory = "UtilitiesApplication",
  price = "0",
  priceCurrency = "CNY",
  operatingSystem = "Web",
  featureList,
}: SoftwareApplicationSchemaProps) => {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description,
    applicationCategory,
    operatingSystem,
    offers: {
      "@type": "Offer",
      price,
      priceCurrency,
    },
  };

  if (featureList && featureList.length > 0) {
    schema.featureList = featureList;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

export const HowToSchema = ({ name, description, steps }: HowToSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
      url: step.url,
      image: step.image,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

export const ServiceSchema = ({
  name,
  description,
  serviceType,
  provider,
}: ServiceSchemaProps) => {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
  };

  if (serviceType) {
    schema.serviceType = serviceType;
  }

  if (provider) {
    schema.provider = {
      "@type": "Organization",
      ...provider,
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

export const FAQPageSchema = ({ faqs }: FAQPageSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

export const BreadcrumbListSchema = ({ items }: BreadcrumbListSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.item,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};
