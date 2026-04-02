import { AgentDetail } from "@/features/agents/components/agent-detail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AgentDetailPage({ params }: Props) {
  const { id } = await params;
  return <AgentDetail agentId={id} />;
}
