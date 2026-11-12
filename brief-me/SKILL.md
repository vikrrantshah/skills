---
name: brief-me
description: Explain the goal, current state, and remaining work in concise ASD-STE100 style.
argument-hint: "Optional: ticket, goal, or workstream to explain"
disable-model-invocation: true
---

# Brief me

Help the user understand the work before they continue. Use one approach for all context, whether it comes from a ticket, conversation, or both.
Keep this read-only: explain the work without implementing it, running checks, changing files, or updating the tracker.

## Establish the context

1. Use the user's explicit target. Otherwise, use the current conversation and workstream.
   Recover the latest agreed goal, its reason, acceptance criteria, confirmed results, remaining work, and blockers.
   Use the user's latest corrections. A ticket is supporting context, not a required input.
2. Resolve important gaps with the smallest relevant read-only lookup. Read the ticket description and relevant comments when needed.
   Follow links only when they explain the goal, a scope decision, or completion evidence.
   Use available context before asking the user. Ask one focused question only if the target is still ambiguous.
3. Separate intended outcomes, proposed work, implemented changes, and verified results.
   Plans, tracker status, and unsupported agent claims do not prove completion. Describe evidence only at the level it supports.
   Preserve the agreed scope. Do not add review, deployment, or other requirements unless the goal requires them.
   If sources conflict, name the conflict instead of silently combining them.
4. Select facts that answer the user's need to understand the work. Explain the change from the current behavior to the desired behavior.
   Include current progress and remaining work when relevant, especially when the user asks to recall or resume the work.
   If progress is unknown, say so. Missing evidence does not mean work has not started.

## Write in ASD-STE100 style

Apply the writing rules in [ASD-STE100, Issue 9](https://www.asd-ste100.org/assets/files/ASD-STE100_ISSUE9.pdf):

- Use one subject per sentence and one topic per paragraph. Give each sentence one clear purpose.
- Use a maximum of 25 words in a descriptive sentence. Use a maximum of 20 words in an instruction.
- Use the active voice. In descriptive text, use the passive voice only when the actor is unknown.
- Use simple verb forms, direct statements, and the same term for the same concept.
- Use approved dictionary words with their approved meanings and parts of speech. Retain necessary technical nouns and technical verbs.
  Keep identifiers, paths, commands, and product names exact. Explain an unfamiliar technical term on first use.
- Replace idioms, vague pronouns, long noun groups, and abstract wording with concrete subjects and verbs.
- Preserve conditions, exclusions, uncertainty, and technical meaning when you shorten the text.

These rules are not a complete compliance check. Claim ASD-STE100 compliance only after checking the full applicable rules and dictionary.
When that check is unavailable, use the style without a compliance claim. Do not add a standards disclaimer to an ordinary context explanation.

## Reply

Start with an **unlabelled, one-to-three-line goal explanation**, before any heading, ticket ID, status, or other detail.
Use one short sentence per logical line. Explain the overall outcome and why it matters; do not copy or merely rephrase the ticket title.
The opening must make sense without knowledge of the ticket or the conversation. It describes the goal, not the latest implementation step.

After the opening, include only the details the user needs, in this order:

- **Context:** The problem, desired behavior, and important scope limits not already clear from the opening.
- **Where we are:** Confirmed results and work in progress. Distinguish implementation from verification.
- **What remains:** Unmet acceptance criteria and unfinished work, in dependency order. Include any required human work.
- **Blocked / unknown:** A constraint or missing fact that affects progress, with its effect on the goal.

Use short bullets or single sentences. Omit empty or redundant sections; these labels are not a required form.
Attach evidence links or paths to the facts they support. State each fact once. Include implementation details only when they help explain the outcome or current state.
For a simple explanation, the opening can be the whole reply. For a progress recall, include the current state and remaining work, even if either is unknown.
If the goal is complete, state that no required work remains. Keep optional work separate from required work.
Match the detail to the question. Include progress only when the user asks for it or it changes their understanding of the goal.
Do not fill every section by default or append statements about taking no action.
Aim for at most 180 words unless the requested scope needs more. Stop after the explanation; do not resume execution unless the user also asks you to proceed.
