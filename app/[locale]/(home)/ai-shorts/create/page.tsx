/**
 * Create Agent Job Page
 * Page for creating new intelligent video orchestration jobs
 */

// TODO: Phase 5 - Implement AgentCreateForm component
// import { AgentCreateForm } from '@/components/blocks/agent/AgentCreateForm';

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
    <div className="bg-gray-900 rounded-xl shadow-lg min-h-[600px] flex items-center justify-center">
      <div className="text-center text-gray-400">
        <h2 className="text-2xl font-bold mb-4">Agent Create - Coming Soon</h2>
        <p>This feature is under development (Phase 5)</p>
      </div>
    </div>
  );
}
