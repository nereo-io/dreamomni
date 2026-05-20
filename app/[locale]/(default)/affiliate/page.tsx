import {
  BadgeDollarSign,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Cookie,
  Globe2,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  WalletCards,
  XCircle,
} from 'lucide-react';
import { Metadata } from 'next';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const applyHref = 'https://seedance.firstpromoter.com/';

const affiliateHeroTitle =
  'Earn Up to 30% Commission with Seedance affiliate program';
const affiliateHeroDescription =
  'Unlock the earning potential of your channel by promoting an innovative and powerful AI video generator! You can earn a 30% commission on every first purchase, renewal or upgrade generated through your unique affiliate links.';
const affiliateHeroCta = 'Sign Up Now';
const modelSectionClass = 'w-full bg-gray-950 py-16 md:py-24';
const modelCardClass =
  'rounded-xl border border-white/10 bg-white/[0.08] p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-primary/70 hover:bg-white/[0.12]';
const modelIconClass =
  'mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-primary/40 text-primary';
const cardTitleClass = 'text-lg font-semibold text-white';
const cardBodyClass = 'mt-3 text-sm leading-6 text-white/80';

const programHighlights = [
  {
    title: '30% Commission',
    description:
      'Earn 30% recurring commission on qualified Seedance AI purchases you refer.',
    icon: BadgeDollarSign,
  },
  {
    title: '12-Month Duration',
    description:
      'Keep earning from each referred customer for up to 12 months after signup.',
    icon: CalendarClock,
  },
  {
    title: '90-Day Cookie',
    description:
      'Your referral link stays active for 90 days, giving creators time to decide.',
    icon: Cookie,
  },
  {
    title: 'PayPal Payouts',
    description:
      'Approved partners receive monthly commission payments through PayPal.',
    icon: WalletCards,
  },
];

const affiliateSteps = [
  {
    title: 'Apply to the Program',
    description:
      'Tell us about your audience, channels, and how you plan to promote Seedance AI.',
    icon: Send,
  },
  {
    title: 'Share Your Link',
    description:
      'Use your approved affiliate link in content, tutorials, newsletters, and creator resources.',
    icon: Share2,
  },
  {
    title: 'Earn Monthly Commissions',
    description:
      'Track qualified referrals and receive monthly payouts for eligible paid customers.',
    icon: CircleDollarSign,
  },
];

const partnerReasons = [
  {
    title: 'Creator-first product',
    description:
      'Seedance AI gives video creators practical tools for image-to-video, text-to-video, and AI media workflows.',
    icon: Sparkles,
  },
  {
    title: 'High-intent audience fit',
    description:
      'Promote to creators, marketers, agencies, and AI enthusiasts who already understand the value of fast visual generation.',
    icon: Globe2,
  },
  {
    title: 'Clear earning model',
    description:
      'A simple recurring commission structure makes it easy to explain the program and forecast partner revenue.',
    icon: BarChart3,
  },
  {
    title: 'Responsible growth',
    description:
      'We prefer partners who educate honestly, disclose affiliate relationships, and help users choose the right tool.',
    icon: ShieldCheck,
  },
];

const dos = [
  'Create honest tutorials, comparisons, and workflow examples.',
  'Disclose that your link is an affiliate link.',
  'Send users to Seedance AI pages that match their intent.',
  'Use approved screenshots, demos, and accurate product descriptions.',
];

const donts = [
  'Do not spam communities, comments, inboxes, or unrelated forums.',
  'Do not promise guaranteed results, income, discounts, or official endorsements.',
  'Do not use misleading ads, fake reviews, or copied creator content.',
  'Do not bid on Seedance branded terms or impersonate Seedance AI.',
];

const faqs = [
  {
    question: 'Who can join the Seedance AI affiliate program?',
    answer:
      'Creators, educators, publishers, agencies, and community owners can apply. We review each application for audience fit and promotion quality.',
  },
  {
    question: 'How much commission can I earn?',
    answer:
      'Approved affiliates can earn 30% commission on eligible purchases generated through their referral links.',
  },
  {
    question: 'How long do commissions last?',
    answer:
      'Eligible referred customers can generate commissions for up to 12 months, subject to program rules and account standing.',
  },
  {
    question: 'How does the cookie window work?',
    answer:
      'Seedance AI uses a 90-day cookie window. If a qualified visitor purchases within that period, the referral can be attributed to you.',
  },
  {
    question: 'When are payouts sent?',
    answer:
      'Affiliate commissions are reviewed monthly and paid through PayPal after validation and any required fraud checks.',
  },
  {
    question: 'Can I promote Seedance AI with paid ads?',
    answer:
      'Paid promotion may be allowed after approval, but brand-term bidding, impersonation, and misleading ad claims are not allowed.',
  },
];

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/affiliate`;

  if (locale !== 'en') {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/affiliate`;
  }

  return {
    title: 'Seedance AI Affiliate Program',
    description: affiliateHeroDescription,
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
}) {
  return (
    <div
      className={cn(
        'mx-auto mb-12 max-w-4xl',
        align === 'center' ? 'text-center' : 'text-left'
      )}
    >
      {eyebrow && (
        <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-primary">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl font-black text-foreground md:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mx-auto mt-5 max-w-4xl text-base leading-relaxed text-muted-foreground md:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}

export default function AffiliatePage() {
  return (
    <div className="flex flex-col items-center text-foreground">
      <div className='fixed inset-0 -z-10 bg-[url("/imgs/cta-bg.png")] bg-cover bg-center bg-no-repeat'>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      </div>

      <section className="relative w-full overflow-hidden border-b border-border/70 pb-20 pt-20 md:pb-28 md:pt-28">
        <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-4 text-center md:px-0">
          <h1 className="text-4xl font-extrabold leading-tight text-foreground md:text-5xl">
            {affiliateHeroTitle}
          </h1>
          <p className="mt-5 max-w-5xl text-base leading-7 text-foreground md:text-lg md:leading-8">
            {affiliateHeroDescription}
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 rounded-lg px-8 py-6 font-medium transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/30"
          >
            <a href={applyHref} target="_blank" rel="noopener noreferrer">
              {affiliateHeroCta}
            </a>
          </Button>
        </div>
      </section>

      <section id="program-details" className={modelSectionClass}>
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <SectionHeading
            eyebrow="Program Details"
            title="Simple terms for long-term partnerships"
            description="Seedance AI affiliates get a clear commission model, a generous attribution window, and straightforward monthly PayPal payouts."
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {programHighlights.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className={modelCardClass}
                >
                  <div className={modelIconClass}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className={cardTitleClass}>
                    {item.title}
                  </h3>
                  <p className={cardBodyClass}>
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="affiliate-steps" className={modelSectionClass}>
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <SectionHeading
            eyebrow="How to Affiliate"
            title="Three steps from application to payout"
            description="Apply once, share your approved link, and earn monthly commissions from qualified paid customers."
          />
          <div className="grid gap-4 md:grid-cols-3">
            {affiliateSteps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.title}
                  className={modelCardClass}
                >
                  <div className="mb-5 flex items-center justify-between">
                    <div className={modelIconClass}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-semibold text-white/70">
                      Step {index + 1}
                    </span>
                  </div>
                  <h3 className={cardTitleClass}>
                    {step.title}
                  </h3>
                  <p className={cardBodyClass}>
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="mt-10 text-center">
            <Button
              asChild
              size="lg"
              className="rounded-lg px-8 py-6 font-medium transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/30"
            >
              <a href={applyHref} target="_blank" rel="noopener noreferrer">
                {affiliateHeroCta}
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section id="why-partner" className={modelSectionClass}>
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <SectionHeading
            eyebrow="Why"
            title="Why Partner with Seedance?"
            description="Seedance AI is built for creators who want practical AI media workflows, making it easier for partners to promote with real use cases."
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {partnerReasons.map((reason) => {
              const Icon = reason.icon;

              return (
                <div
                  key={reason.title}
                  className={modelCardClass}
                >
                  <div className={modelIconClass}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className={cardTitleClass}>
                    {reason.title}
                  </h3>
                  <p className={cardBodyClass}>
                    {reason.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="promotion-rules" className="w-full bg-gray-950 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <SectionHeading
            eyebrow="Promotion Rules"
            title="Dos and Don'ts for Promoting Seedance AI"
            description="We welcome high-quality promotion that helps users make informed decisions. Keep claims accurate, transparent, and respectful."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="overflow-hidden rounded-xl bg-white/[0.08] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.12]">
              <div className="bg-white/[0.08] px-6 py-5">
                <h3 className="text-xl font-semibold text-emerald-400">
                  Dos
                </h3>
              </div>
              <ul className="space-y-4 p-6">
                {dos.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-white/80">
                    <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="overflow-hidden rounded-xl bg-white/[0.08] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.12]">
              <div className="bg-white/[0.08] px-6 py-5">
                <h3 className="text-xl font-semibold text-orange-400">
                  Don&apos;ts
                </h3>
              </div>
              <ul className="space-y-4 p-6">
                {donts.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-white/80">
                    <XCircle className="mt-1 h-5 w-5 shrink-0 text-orange-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-gray-950 py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 md:px-8">
          <SectionHeading
            eyebrow="FAQs"
            title="Affiliate Program FAQs"
            description="Answers to common questions about joining, referrals, commissions, and payouts."
          />
          <Accordion
            type="single"
            collapsible
            className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-6 backdrop-blur-sm"
          >
            {faqs.map((faq, index) => (
              <AccordionItem
                key={faq.question}
                value={`faq-${index}`}
                className="border-white/10"
              >
                <AccordionTrigger className="text-left text-base text-foreground hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-6 text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="relative w-full overflow-hidden transition-all duration-300">
        <div className='relative flex min-h-[400px] items-center justify-center bg-[url("/imgs/cta-bg.png")] bg-cover bg-center bg-no-repeat py-20 text-center'>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative z-10 mx-auto max-w-4xl px-8">
            <h2 className="mb-6 text-balance text-3xl font-bold leading-tight tracking-tight text-white md:text-4xl lg:text-5xl">
              Ready to partner with Seedance AI?
            </h2>
            <p className="mx-auto max-w-2xl text-base leading-7 text-white/80 md:text-lg">
              Send your application and we will review your audience fit,
              content quality, and promotion plan.
            </p>
            <div className="mt-8">
              <Button
                asChild
                size="lg"
                className="rounded-lg px-8 py-6 font-medium transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/30"
              >
                <a href={applyHref} target="_blank" rel="noopener noreferrer">
                  Apply for the Affiliate Program
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
