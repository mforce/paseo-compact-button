import type { PluginButtonRegistration, PluginClientContext } from "@getpaseo/plugin/client";

/** Fields this plugin reads from a wire agent record (AGENT_LIFECYCLE_STATUSES in @getpaseo/protocol). */
type DirectoryAgent = {
  id: string;
  workspaceId?: string;
  status: "initializing" | "idle" | "running" | "error" | "closed";
};

export default function contribute(client: PluginClientContext) {
  const pills = new Map<string, PluginButtonRegistration>();
  const lifetime = new AbortController();

  const upsert = (agent: DirectoryAgent) => {
    const existing = pills.get(agent.id);
    if (existing) {
      // Workspace membership is fixed at agent creation, so only the disabled
      // flag moves; update() patches in place and keeps composer order.
      existing.update({ disabled: agent.status === "running" });
      return;
    }
    if (!agent.workspaceId) return; // No workspace means no composer to host a pill.
    const agentId = agent.id;
    pills.set(
      agentId,
      client.addComposerPill({
        id: "compact",
        workspaceId: agent.workspaceId,
        agentId,
        button: {
          title: "Compact",
          icon: "Minimize2",
          label: "Compact",
          // Messages sent during a compaction can cancel it (paseo #5676, #6806).
          disabled: agent.status === "running",
          behavior: {
            kind: "action",
            onPress() {
              return client.paseo.agents.ref(agentId).send("/compact");
            },
          },
        },
      }),
    );
  };

  const clear = () => {
    for (const pill of pills.values()) pill.remove();
    pills.clear();
  };

  // One owned subscription follows the agent directory so the disabled state
  // tracks each agent's current status.
  void client.paseo.agents
    .list({ subscribe: {}, signal: lifetime.signal })
    .then(({ subscription }) => {
      subscription.subscribe({
        // The snapshot is authoritative, so rebuild the pill set from scratch.
        snapshot: ({ entries }) => {
          clear();
          for (const { agent } of entries) upsert(agent);
        },
        update: (message) => {
          if (message.type !== "agent_update") return;
          const update = message.payload;
          if (update.kind === "upsert") return upsert(update.agent);
          pills.get(update.agentId)?.remove();
          pills.delete(update.agentId);
        },
      });
    })
    .catch((error) => {
      if (!lifetime.signal.aborted) console.error("Agent observation failed", error);
    });

  return () => {
    lifetime.abort();
    clear();
  };
}
