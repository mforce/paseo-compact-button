import type { PluginButtonRegistration, PluginClientContext } from "@getpaseo/plugin/client";

/** Fields this plugin reads from a wire agent record. */
type DirectoryAgent = {
  id: string;
  workspaceId?: string | null;
  status: string | null;
};

export default function contribute(client: PluginClientContext) {
  const pills = new Map<string, PluginButtonRegistration>();
  const lifetime = new AbortController();

  const register = (agent: DirectoryAgent) => {
    if (lifetime.signal.aborted || !agent.workspaceId) return;
    const agentId = agent.id;
    const workspaceId = agent.workspaceId;
    pills.get(agentId)?.remove();
    pills.set(
      agentId,
      client.addComposerPill({
        id: "compact",
        workspaceId,
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

  // One owned subscription follows the agent directory; each upsert re-registers
  // the pill so the disabled state tracks the agent's current status.
  void client.paseo.agents
    .list({ subscribe: {}, signal: lifetime.signal })
    .then(({ subscription }) => {
      subscription.subscribe({
        snapshot: ({ entries }) => {
          for (const pill of pills.values()) pill.remove();
          pills.clear();
          for (const { agent } of entries) register(agent);
        },
        update: (message) => {
          if (message.type !== "agent_update") return;
          const update = message.payload;
          if (update.kind === "upsert") return register(update.agent);
          pills.get(update.agentId)?.remove();
          pills.delete(update.agentId);
        },
      });
      return undefined;
    })
    .catch((error) => {
      if (!lifetime.signal.aborted) console.error("Agent observation failed", error);
    });

  return () => {
    lifetime.abort();
    for (const pill of pills.values()) pill.remove();
    pills.clear();
  };
}
