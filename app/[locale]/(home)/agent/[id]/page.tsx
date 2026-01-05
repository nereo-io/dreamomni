import { redirect } from 'next/navigation';

export default function AgentIdRedirect({ params }: { params: { id: string } }) {
  redirect(`/ai-shorts/${params.id}`);
}
