/**
 * Agent Job Detail Page
 * Display detailed information about a specific Agent job
 */

import { AgentJobDetail } from '@/components/blocks/agent/AgentJobDetail';
import { notFound } from 'next/navigation';

export async function generateMetadata({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/ai-shorts/${id}`;

  if (locale !== 'en') {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/ai-shorts/${id}`;
  }

  return {
    title: 'Agent Job Details - Intelligent Video Orchestration',
    description: 'View detailed information about your AI-powered video generation job',
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default function AgentJobDetailPage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  if (process.env.NEXT_PUBLIC_AI_SHORTS_ENABLED !== 'true') {
    notFound();
  }

  return (
    <div className="bg-gray-900 rounded-xl shadow-lg min-h-[600px]">
      <AgentJobDetail jobId={id} locale={locale} />
    </div>
  );
}
