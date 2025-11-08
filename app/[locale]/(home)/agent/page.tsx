/**
 * Agent Jobs List Page
 * Display all Agent video orchestration jobs for the current user
 */

import { AgentJobList } from '@/components/blocks/agent/AgentJobList';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/agent`;

  if (locale !== 'en') {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/agent`;
  }

  return {
    title: 'Agent Jobs - Intelligent Video Orchestration',
    description: 'View and manage your AI-powered multi-shot video generation jobs',
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default function AgentJobsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return (
    <div className="bg-gray-900 rounded-xl shadow-lg min-h-[600px]">
      <AgentJobList locale={locale} />
    </div>
  );
}
