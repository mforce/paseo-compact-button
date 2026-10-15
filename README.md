# paseo-compact-button

A Paseo plugin that adds a Compact button to the composer of every agent that
has a workspace. Clicking it sends the `/compact` command to that agent,
exactly as if you had typed it.

## Behavior

- One pill per agent with a workspace, registered from the live agent
  directory: new agents get a button, removed agents lose theirs.
- The button disables while the agent has a turn in flight, because a message
  sent during a compaction can cancel it (paseo #5676, #6806). It re-enables
  when the agent goes idle.
- Clicks go through the same call the composer uses
  (`agents.ref(id).send("/compact")`), so the provider runs its own
  compaction and the compaction row and context meter appear in the timeline.

Verified with Claude Code and Codex agents: the pill disables during
compaction, and the context meter drops (38,756 to 6,274 tokens on a Claude
test agent, 21,706 to 6,483 on a Codex test agent).

## Install

```sh
paseo plugin install github.com/mforce/paseo-compact-button
```

Requires a Paseo daemon with plugin source installation (v0.8.0 or later). No
settings and no extra permissions.

## Development

```sh
npm install
npm run typecheck
```

The Paseo daemon compiles the plugin itself; `npm run typecheck` is for
development. `OVERVIEW.md` is the listing shown on the plugin page in Paseo.
