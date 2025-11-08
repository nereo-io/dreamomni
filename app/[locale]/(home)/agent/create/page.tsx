/**
 * Create Agent Job Page
 * Page for creating new intelligent video orchestration jobs
 */

import { AgentCreateForm } from '@/components/blocks/agent/AgentCreateForm';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/agent/create`;

  if (locale !== 'en') {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/agent/create`;
  }

  return {
    title: 'Create Agent Job - Intelligent Video Orchestration',
    description: 'Create a new AI-powered multi-shot video generation job',
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default function CreateAgentJobPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return (
    <div className="bg-gray-900 rounded-xl shadow-lg min-h-[600px]">
      <AgentCreateForm locale={locale} />
    </div>
  );
}
