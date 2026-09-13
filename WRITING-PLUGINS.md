# Writing plugins user guide

This fork includes Plain English, STE-inspired and Action-first at the router.
All three are **on by default**, with separate switches in
**Dashboard → Token Saver**. Clients using this router do not need to install
the source skills individually. These features are on `codex/writing-plugins`;
use an image built with these changes, such as the writing.2 edition.

## Plain English

Plain English asks the model to lead with the answer, outcome or blocker, use
familiar words, explain necessary technical terms and remove filler. It retains
requested detail, conditions, uncertainty and the distinction between work
attempted, completed and verified.

Illustrative wording, not a guaranteed model response:

> Before: It would appear that the service may be experiencing an inability to
> establish connectivity with the database.
>
> After: The service may be unable to connect to the database.

## STE-inspired

STE-inspired focuses on generated English technical prose: procedures, error
explanations, tool descriptions and instructions handed to another agent. It
asks for named actors, conditions before their instructions, one instruction
per sentence, consistent terminology and numbered sequences.

It targets 20 words per procedural sentence and 25 per descriptive sentence,
while keeping necessary qualifications and precise meaning. These are writing
targets, not enforced limits.

Illustrative wording:

> Before: After checking that the backup completed, restart the service and
> check its health endpoint.
>
> After:
> 1. Verify that the backup completed.
> 2. If the backup completed, restart the service.
> 3. Check the service's health endpoint after the restart.

The plugin does not include the official ASD-STE100 dictionary, validate
compliance or issue compliance reports.

## Action-first

Action-first adapts the i-have-adhd skill into presentation guidance. It asks the
model to put the useful answer, outcome, blocker or smallest relevant next
action first. Multi-step work uses bounded steps and brief progress updates
when useful. The model should complete work it can perform and ask the reader
only for information or action that requires them.

When the reader has work left, the response should identify one concrete next
action. When the task is complete, it should stop without inventing a follow-up
task. Causes, completion claims and estimates must be supported. This is a
writing style, not an assessment or diagnosis of the reader.

## Controls and scope

Each switch saves independently and persists across restarts. Existing
installations get the default-on behavior when a new setting is absent; an
explicitly saved off value stays off. The dashboard displays an error and
retains the saved state if a change fails to save.

These settings apply across requests handled by this router. They are not
per-client skill installations or per-model preferences. The three new plugins
have on/off controls only; they do not have intensity levels.

Administrators can also use the existing authenticated `/api/settings` endpoint:

| Plugin | GET/PATCH field | Default when absent |
| --- | --- | --- |
| Plain English | `plainEnglishEnabled` | `true` |
| STE-inspired | `steEnabled` | `true` |
| Action-first | `actionFirstEnabled` | `true` |

For example, this PATCH body disables only STE-inspired:

```json
{"steEnabled": false}
```

Use JSON booleans. Strings such as `"false"`, numbers and null are rejected for
these fields. Existing dashboard authentication requirements still apply.

To bypass the plugins for one model request, send this HTTP header:

```http
x-9router-token-saver: off
```

This is the existing shared bypass: it also bypasses Caveman, Ponytail and other
token savers. It does not change saved settings. There is no new per-plugin
request header.

## How the independent plugins work together

Caveman controls output terseness. Ponytail guides implementation simplicity.
Plain English guides explanations, STE-inspired guides technical instructions,
and Action-first guides presentation. Switching one off does not switch any
other plugin off or change its level. Laconic is not included.

When enabled styles conflict, additional guidance asks the model to retain
grammar, meaningful uncertainty, required detail and requested output formats.
For example, Caveman's compression should not remove a prerequisite from an
STE-inspired procedure; Ponytail's short explanations should not hide required
evidence. Turning off all three new plugins restores the original
Caveman/Ponytail behavior with their current settings.

## What to expect

The router adds writing instructions to the model request. It does not make an
extra model call, rewrite the incoming task or post-process the model's answer.
It can guide clearer instructions the model generates for another person or
agent; it does not automatically rewrite instructions supplied by a client or
existing tool definitions.

The prompts ask the model to preserve code, commands, paths, identifiers, quoted
errors, evidence and machine-readable formats. They retain the requested
response language and do not require translation into English. Model adherence
varies; these prompts are not validators or guarantees of exact output.
They add input tokens, and no token-saving percentage has been established for
these three plugins.

The adapted source revisions and licenses are recorded in
[source notices](open-sse/rtk/writing-plugin-NOTICES.txt). For code locations,
tests and future updates, see [fork maintenance](FORK-MAINTENANCE.md).
