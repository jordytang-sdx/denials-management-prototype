# Denials Management — Market Validation Plan

**Status:** Draft
**Timeline:** 8 weeks
**Team:** Product lead + marketing
**Date:** April 2026

---

## 1. What We're Trying to Learn

This is not a sales process. It is a research and validation process that runs in parallel with the feasibility engineering work. The goal is to answer five questions before committing to a full build:

1. **Problem urgency:** Is end-to-end denials management — specifically ingestion, submission, and reconciliation — a painful enough problem that health systems will prioritize solving it?
2. **Design partner fit:** Which of our existing customers is the right co-development partner, and what does a net new design partner look like?
3. **Economic buyer:** Who actually owns denials management at a health system, and does that person overlap with who we sell to today?
4. **Pricing model:** Will customers accept attribution-based pricing, and do they have the data infrastructure to support it?
5. **Build direction:** Are we building the right thing — does our current framing of the problem (ingestion → appeal → submission → reconciliation) match how customers actually experience the pain?

---

## 2. Strategic Context

Before any customer conversations, the team needs to be aligned on this framing:

**We are not starting from zero.** Our appeal writer is already in use at 17 health systems. We know from our own experience that ingestion, submission, and reconciliation are under-served. The goal of these conversations is not to discover whether a problem exists — it's to validate severity, scope, buyer identity, and commercial model with enough rigor to justify building.

**The design partner conversation is also a commercial conversation.** Many of our existing customers are on free or low-cost pilots. Moving them to a full denials management product with attribution-based pricing is a significant relationship change. Design partner conversations should be framed as a partnership opportunity, not a product research call. Customers need to feel they are getting something valuable in return for their time and early access — co-development input, early pricing, direct access to the product team.

**Attribution pricing requires a new data relationship.** An attribution model means we need systematic access to 835 remit data to verify outcomes. This is more than a product feature — it requires the customer to share financial outcome data with us on an ongoing basis. This is something to explicitly test for willingness and feasibility in these conversations, not assume.

---

## 3. Validation Tracks

Run these four tracks in parallel starting week 1. They feed each other — findings from Track A inform Track B outreach, and Track C findings sharpen the design partner selection criteria.

| Track | What | Owner | Timeline |
|---|---|---|---|
| A | Existing customer design partner selection | Product lead | Weeks 1–7 |
| B | Net new customer identification and outreach | Marketing | Weeks 1–7 |
| C | Problem, pricing, and buyer validation | Both | Weeks 1–7 |
| D | Competitive and market landscape research | Marketing | Weeks 1–4 |

---

## 4. Track A — Existing Customer Design Partner

### 4.1 Candidate identification

You have identified 3 strong candidates from 17 existing customers. Before outreach, score each candidate on:

| Dimension | Questions to assess |
|---|---|
| Relationship strength | Is there a champion who trusts us and will give candid feedback? Have they been responsive to past outreach? |
| Denial volume | Do they have meaningful volume of med nec and DRG denials to validate against? Small critical access hospitals may not. |
| Data readiness | Do they have 835 remit data in a usable format? Would they be willing to share it with us for outcome tracking? |
| Operational maturity | Do they have a defined denials management workflow today, or is it ad hoc? A customer with no current process is harder to partner with. |
| Commercial readiness | Are they on a free pilot today? Are they in a position to consider a paid relationship in the next 6–12 months? |
| Audit team access | Do we have or can we get access to the team that handles DRG downgrades and ADRs specifically — not just revenue cycle? |

Assign each candidate a score (1–3) per dimension. Use this to rank them and determine outreach order. Don't reach out to all three simultaneously — start with your highest-confidence candidate so you can learn before approaching the others.

### 4.2 Outreach approach

**Do not send a generic research survey or interview request.** The framing matters. A message that says "we'd like your feedback on a new product" is easy to defer. A message that positions them as a named partner in building something they'll benefit from first is harder to say no to.

Suggested framing for initial outreach:

> "We're building out the next phase of the platform — moving beyond appeal writing to cover the full denials lifecycle, including ingestion, tracking, submission, and outcome reconciliation. We're selecting two health systems to work with closely during the build phase, and [X] came to mind immediately given [specific thing you know about their situation]. Would you be open to a 45-minute call to explore whether this could be a fit?"

**Who to involve on our side:** The product lead should be on every design partner call. Do not delegate this to marketing alone. Customers read involvement of the product lead as a signal that their input will actually matter.

### 4.3 Conversation structure (existing customers)

Run two calls with each candidate, spaced 1–2 weeks apart.

**Call 1 — Discovery (45 min):** Follow the interview framework in Section 6. The goal is to understand their current state, pain, and who owns what — not to pitch.

**Call 2 — Design partner proposal (30 min):** If call 1 confirms fit, present the design partner program. Be specific about what they get and what we're asking for. (See Section 7.)

---

## 5. Track B — Net New Customer Identification

### 5.1 Profile hypothesis

We don't yet have a firm profile for the net new customer. That's partly what this track is designed to discover. Start with a hypothesis and let conversation findings update it.

**Starting hypothesis:**

- Community or regional health system, 200–600 beds
- Not currently using an AI-assisted denials management tool (they may use a worklist tool like Waystar or Artiva, but not AI-assisted appeal writing or automation)
- Meaningful volume of commercial payer denials — at least $2M in annual denied revenue across med nec and DRG downgrade
- Has an in-house denials/appeals team (not fully outsourced to an RCM vendor)
- Revenue cycle leadership that is open to technology-forward approaches

**Why not large academic medical centers for net new?** Sales cycle length and IT procurement complexity make them poor net new design partners for an 8-week timeline. They're better as a second wave after you have a validated design partner reference.

### 5.2 Identification methods

Work these in parallel:

**Warm introductions:** Ask your 3 existing design partner candidates if they know peers at other health systems facing the same problem. A peer referral is worth 10 cold outreach attempts.

**Conference and event presence:** HFMA regional events, AAHAM, and revenue cycle-focused conferences are where your buyer spends time. Identify events happening in weeks 1–4 and plan targeted presence.

**LinkedIn targeting:** Revenue Cycle Directors, VP Revenue Cycle, Directors of Denials Management, CDI Directors at health systems matching the size profile above. Marketing should build a targeted list of 100–150 prospects for outreach.

**Industry analyst and association relationships:** HFMA, AHA, and state hospital associations sometimes facilitate introductions for research and peer collaboration. A "we're doing research on denials management practices" framing can open doors that a sales framing cannot.

**Content-driven inbound:** Publish one piece of substantive content in weeks 1–2 (a benchmark, a data point about denial rates, a short research piece) that gives the net new prospect a reason to engage. Even a brief "we surveyed 17 health systems on their denials workflow" post on LinkedIn gives you a reason to reach out and a credibility signal.

### 5.3 Net new outreach framing

The net new prospect doesn't know us. The opening message should not mention the product. It should open a conversation about the problem.

> "I'm doing research on how health systems are managing the increase in commercial payer denials, specifically around med nec and DRG downgrade. We work with a number of revenue cycle teams and are seeing some consistent patterns — I'd love 20 minutes to share what we're seeing and get your perspective in return."

This is a research call, not a sales call. If the conversation reveals strong fit, you transition to a design partner conversation in a follow-up.

---

## 6. Interview Framework

Use this for both existing customers (Call 1) and net new prospects. It is a guide, not a script. Let conversations go where they go — the most valuable insights usually come from unexpected directions.

### Section A — Current state (10 min)

- Walk me through how a denial comes in today. What's the first thing that happens when you get a med nec denial from [payer]?
- Who touches it? How many people are involved from denial to resolution?
- What systems are you working in — what does your tech stack look like for denials?
- How do you track where things stand? How do you know something is about to expire?

### Section B — Pain and impact (10 min)

- Where does the process break down most often?
- What keeps you up at night about your denials program right now?
- If I asked you to name the single most manual, painful, or error-prone step — what would it be?
- How much denied revenue are you working through in a given month? What's your current win rate?
- What happens to denials that don't get worked — is there visibility into that? Who owns that conversation?

*(For existing customers, add: You've been using [appeal writer] — where has it helped, and where has it fallen short? What's missing?)*

### Section C — Organizational structure (10 min)

- Who owns denials in your organization? Is it one team or multiple?
- Where do DRG downgrade denials specifically sit — is that revenue cycle, CDI, HIM, or a dedicated audit team?
- Who would be involved in a decision to bring in a new tool or vendor for denials management?
- Who controls the budget for this area?
- Are you currently under any pressure — from leadership, payers, or otherwise — to improve your denial performance?

### Section D — Pricing and data (10 min)

*(Approach this section carefully — frame as curiosity, not negotiation)*

- How do you currently pay for RCM tools — per seat, flat monthly, percentage of recovery?
- Have you worked with any vendors on an outcome-based or contingency model? What was that experience like?
- How do you currently track the outcome of your appeals — do you reconcile denial outcomes against remit data today?
- Would you have the ability to share remit data with a vendor to enable outcome tracking on your behalf?

### Section E — Design partner appetite (5 min)

*(Only if conversation has gone well and fit looks strong)*

- We're building out a more complete denials workflow and we're looking for 1–2 health systems to work closely with us — early access, direct input into what we build, and preferential terms. Would that be something worth exploring?
- What would you need to see from us to feel good about that kind of engagement?

---

## 7. Design Partner Program — What We're Offering and Asking

Be explicit about this with candidates. Ambiguity about the terms of a design partner relationship kills momentum.

### What the design partner gets

- Early access to the denials management product as it's built — before any other customers
- Monthly working sessions directly with the product team to shape features and workflow
- Preferential commercial terms on the full product (specific terms to be defined, but this should be meaningful — not just a minor discount)
- Co-marketing opportunity if desired (case study, conference presentation, reference)
- No obligation to continue if the product doesn't meet their needs

### What we're asking of the design partner

- Access to 2–3 staff members for periodic discovery sessions (not just leadership)
- Ability to observe their current denials workflow — ideally a working session where we watch how denials are processed today
- Sharing of representative denial letter samples (de-identified or under BAA) for product development
- Sharing of 835 remit outcome data to enable attribution tracking and validate outcomes
- Willingness to provide candid feedback on an ongoing basis, including when things don't work

### Selection criteria — what a good design partner looks like

A good design partner has all of the following:

- **Volume:** Enough med nec and DRG downgrade denials to generate meaningful signal (at minimum $1M denied annually in these two categories)
- **Champion:** One person who is genuinely excited about the partnership and has organizational influence to make things happen
- **Data access:** They can provide 835 remit data and are willing to do so under a BAA
- **Operational visibility:** We can get access to their actual workflow — not just executive-level buy-in
- **Commercial path:** They are in a position to become a paying customer within 12–18 months

A good design partner does NOT need to be a sophisticated tech buyer. Early stage design partners who struggle with the current state of denials are often more valuable than sophisticated ones who have already built workarounds — because they show you the real problem more clearly.

---

## 8. Track C — Pricing Model Validation

### 8.1 The attribution model and why it's hard to validate quickly

Attribution-based pricing (paying a % of recovered revenue) is the right long-term model but requires two things that are non-trivial to establish:

1. **Data infrastructure:** The customer must share 835 remit data systematically so we can identify which denials were worked through our system and subsequently paid.
2. **Attribution methodology agreement:** What counts as an overturn attributable to our platform? This needs to be defined clearly enough that both parties agree on it before money changes hands.

These take time to work through. An 8-week validation timeline can establish whether customers are open to the model in principle — it cannot close a pricing agreement.

### 8.2 What to validate in this timeline

**Willingness to share remit data:** Ask this directly in interviews (Section D). If customers won't share remit data, attribution pricing cannot work and you need a different model for early customers.

**Framing test:** Try two different pricing framings in conversations and note which resonates more:

- *Framing A — Access model:* "A monthly platform fee based on your organization's size or denial volume."
- *Framing B — Attribution model:* "No upfront cost. You pay a small percentage of the additional revenue recovered through the platform."

The reaction to Framing B tells you a lot. Enthusiasm without probing = surface interest. Immediate questions about "how do you measure that?" = genuine interest with appropriate skepticism. Resistance because "our finance team won't allow contingency models" = real blocker.

**Reference point:** What are they paying today for comparable tools — Waystar, Artiva, nThrive? Even a rough number anchors the conversation.

### 8.3 Proposed pricing model for design partners

Given that full attribution-based pricing is hard to structure quickly and may face procurement resistance, consider a bridge model for design partners:

- **Phase 1 (months 1–6):** No charge. Design partner gets full access in exchange for participation commitments.
- **Phase 2 (months 7–12):** Transition to a nominal platform fee (below market rate) plus outcome tracking with agreed attribution methodology. This phase exists to establish the data relationship and prove the attribution model works operationally before committing to full pricing.
- **Phase 3 (12+ months):** Full attribution-based model, with platform fee as floor and % of recovery above a threshold.

This approach lets you convert free pilot customers to a paid relationship incrementally rather than all at once — which is a more realistic ask given the relationship history.

---

## 9. Track D — Competitive Landscape

Marketing runs this track in weeks 1–4. Deliverable: a one-page competitive landscape map.

### Vendors to research

| Vendor | Category | What to assess |
|---|---|---|
| Waystar | Denial management platform | Workflow capabilities, pricing, AI features, market share |
| Nuveto / Artiva | RCM workflow | Denial tracking, payer rules engine |
| Optum / Change Healthcare | Large RCM suite | Denial analytics, claim editing |
| FinThrive | Denial management | AI-assisted denials, attribution model |
| Cohere Health | Prior auth / med nec | How they handle criteria matching |
| Omega Healthcare | Outsourced RCM | When do health systems outsource vs. use software? |
| Waystar Radiology / Experian Health | Claim editing and eligibility | Upstream prevention vs. downstream management |

### Questions to answer

- Who is winning deals against us today? (Ask customers directly.)
- What does an incumbent vendor look like at our target customers? What would we be displacing?
- Is there a "do nothing" option — are health systems managing this fully manually?
- What's the market pricing range for denials management tools? Per seat? % of recovery? Flat fee?
- Are there vendors offering AI-assisted appeal writing already? How is that positioned?

---

## 10. Week-by-Week Plan

| Week | Track A (Existing) | Track B (Net New) | Track C (Pricing/Problem) | Track D (Competitive) |
|---|---|---|---|---|
| 1 | Score 3 candidates; draft outreach | Build prospect list of 100–150; draft outreach copy | Finalize interview guide; align internally on pricing hypothesis | Begin desk research on 8 vendors |
| 2 | Send outreach to top candidate; prepare for call 1 | Begin LinkedIn outreach (20–30 contacts); publish content piece | — | Complete competitive landscape draft |
| 3 | Call 1 with top existing candidate | First net new conversations (aim for 3–5) | Synthesize findings from first calls | Share competitive landscape with team |
| 4 | Call 1 with candidates 2 and 3 | Continue net new outreach; 5–10 total conversations | Pricing framing test in all conversations | — |
| 5 | Call 2 (design partner proposal) with top candidate | Identify 2–3 net new finalists | Synthesize pricing signal across all conversations | — |
| 6 | Finalize existing design partner selection | Call 2 with net new finalists (design partner proposal) | — | — |
| 7 | Design partner kickoff planning | Finalize net new design partner selection | — | — |
| 8 | Synthesis and decision document | Synthesis and decision document | Synthesis and decision document | — |

**Target conversation volume:** By end of week 7, you should have completed:
- 6 conversations with existing customers (2 per candidate)
- 10–15 net new prospect conversations
- At least 3–5 conversations that went deep enough to test pricing framing

---

## 11. Decision Framework — Week 8 Outputs

At the end of 8 weeks, produce a two-page decision document covering:

### Design partner decision

- Who are the selected design partners (existing + net new)?
- What commitments have they made?
- What are the terms of the design partner relationship?
- Any red flags or risks in the relationship?

### Problem validation verdict

Answer each question with **Confirmed / Partially confirmed / Not confirmed:**

- Is end-to-end denials management an urgent, prioritized pain?
- Is our specific framing (ingestion → appeal → submission → reconciliation) the right one, or did customers reframe the problem?
- Is the economic buyer who we thought? Or did we discover a different champion/buyer dynamic?
- Is the problem bigger or smaller than we thought at entry?

### Pricing model verdict

- Are customers open to attribution-based pricing in principle?
- Are customers willing to share 835 remit data?
- What is the realistic pricing model for the first 12 months (bridge model)?
- What is the expected pricing model at scale?

### Build direction verdict

- Are we building the right thing?
- Are there features or workflow steps we missed entirely that customers surfaced?
- Is the sequence right — should we start with something different than ingestion?

---

## 12. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Existing customers are too polite to give critical feedback | Medium | High | Push for workflow observation sessions, not just interviews. People say nicer things than they show. |
| Design partner candidates stall on legal / BAA review | Medium | Medium | Start legal early — send draft BAA language in week 3, not week 7. |
| Net new outreach gets no traction in 8 weeks | Medium | Medium | If cold outreach isn't converting by week 3, shift to warm intro strategy aggressively. |
| Customers say they want attribution pricing but procurement won't approve it | Medium | High | Treat this as a blocking condition. Validate with finance stakeholder, not just revenue cycle lead. |
| DRG and med nec ownership is at a different team than our existing contact | Medium | Medium | Ask explicitly in call 1 who owns audit-related denials. Get an introduction if it's a different team. |
| 8 weeks is not enough to close a design partner agreement | Medium | Low | The goal is a verbal commitment and defined next steps, not a signed contract. Don't let legal timelines block the research phase. |

---

*This document is a working plan. Update findings weekly in a shared tracker so both team members stay aligned and can adjust priorities based on what's being learned.*
