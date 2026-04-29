import { PipelineDetail } from "@/features/voice/components/pipelines/pipeline-detail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PipelineDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <div className="flex flex-col h-full">
      <PipelineDetail numberId={id} />
    </div>
  );
}
