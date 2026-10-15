Compact adds a Compact button to the composer of every agent that has a workspace. Clicking it sends the `/compact` command to that agent, exactly as if you had typed it, so the provider runs its own compaction and the context meter drops.

The button disables itself while the agent has a turn in flight, because a message sent during a compaction can cancel it, and re-enables when the agent goes idle. It follows the agent directory live: new agents get a button, removed agents lose theirs.

No settings and no extra permissions. Verified with Claude Code and Codex agents.
