"use client";

import type { Agent } from "@/types";
import { VoicePipelineForm } from "../voice-pipeline-form/voice-pipeline-form";
import { AgentPhoneNumbers } from "../agent-phone-numbers/agent-phone-numbers";

interface Props {
  agent: Agent;
}

export function VoiceTab({ agent }: Props) {
  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-2xl mx-auto py-8 px-6 space-y-10">
        {/* Pipeline configuration */}
        <section>
          <h2 className="text-base font-semibold mb-1">Voice Pipeline</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Configure the STT and TTS providers for this agent. Leave fields blank to use org-level
            defaults from Platform Settings.
          </p>
          <VoicePipelineForm agent={agent} />
        </section>

        <div className="border-t border-border" />

        {/* Phone numbers */}
        <section>
          <AgentPhoneNumbers agentId={agent.id} agentName={agent.name} />
        </section>
      </div>
    </div>
  );
}
