# Denials Management MVP Feature Set

Source: https://www.notion.so/334245f779a580af9723dbca89c5932e
Last Reviewed: 2026-04-02

---

## Objective

Build a system that ingests payer signals (PDFs and 835s), resolves them to the correct patient and 837 claim, and converts them into structured denial instances that can be automatically routed, worked, and tracked through to resolution—while integrating with ROI vendors, submission channels, and agent workflows, and providing configurable logic and analytics to drive performance.

---

## Core System Model

- **Signals (PDFs, 835s)** → inbound evidence
- **837 Claims (Source of Truth)** → canonical claim context
- **Patient / Claim Linking** → identity resolution
- **Denial Instances** → unit of work
- **Workflow Layer** → execution (appeals, records, submissions)
- **Client Configuration Layer** → templates, policies, routing
- **Integration Layer** → ESMD, EMDR, HealthSource, ThoughtfulAI
- **Analytics Layer** → performance + insights

---

## End-to-End Flow

```
Ingest Signal (PDF / 835)
   ↓
Deduplicate + Split
   ↓
Extract + Classify
   ↓
Link to Patient
   ↓
Match to 837 Claim
   ↓
Match or Create Instance
   ↓
Apply Client Configuration (routing, templates, policies)
   ↓
Assemble Appeal Packet / Route to Workflow
   ↓
Submit via ESMD / Portal / Agent
   ↓
Track Status via Agents + Signals
   ↓
Capture Outcomes + Financials
   ↓
Analytics + Feedback Loop
```

---

## Signal Ingestion

### PDF Ingestion
- Ingest via SFTP, upload, or eMDR Mailbox
- Deduplicate files
- OCR + text extraction
- Split multi-document packets into individual documents

### 835 Ingestion
- Parse payment, claim, and service-line data
- Extract: payer claim control number (ICN), patient control number, CARC/RARC codes, payment and adjustment amounts
- Generate structured remit events: denial, recoupment, underpayment candidate

---

## Extraction & Classification

### PDF Classification
Types: ADR, denial determination, recoupment/overpayment, correction required, determination letter

Extract: patient and claim identifiers, payer and provider, dates and deadlines, financial exposure, DRG / denial reason

### 835 Classification
- Map CARC/RARC to denial categories: DRG downgrade, medical necessity, coding, authorization, eligibility, administrative
- Filter non-actionable contractual adjustments
- Identify actionable denial and recoupment events

---

## Patient & Claim Linking

### Patient Matching
- Deterministic: MRN, member ID, patient control number
- Fallback: name + DOB + DOS

### 837 Claim Matching (Source of Truth)
- Match via: ICN, patient control number, HAR/account, DOS
- Normalize: billed vs paid, DRG billed vs DRG paid, service-line comparisons
- Anchors every signal to what was actually submitted

---

## Instance Creation & Matching

### Instance Creation
- Triggered by: PDFs (denials, ADRs, recoupments) or 835 events (denials, recoupments)
- Each instance: anchored to patient + 837 claim, defined by issue type + review context, associated with financial exposure, tracked via state and status

### Matching Engine
- Match incoming signals to existing instances using: claim identifiers, patient, denial category, financial similarity

### Signal Timeline
- Attach all documents, remits, submissions, and agent updates
- Maintain complete audit trail

---

## Workflow & State Management

### State Model
`Intake → Active → Submitted → Resolved → Closed`

### Status Layer
Operational detail: appeal drafting, records requested, pending payer response, overturned / upheld / will not appeal

### Needs Attention Flag
Highlights: low-confidence matching, missing data, submission failures, deadline risks

### Work Queues
- Filter by payer, denial type, owner, state
- Prioritize by financial impact and urgency

---

## Client-Level Configuration

### Letter Templates
Configure by: denial type, payer, appeal level

### Payer Policy Library
Store payer-specific rules: medical necessity criteria, DRG guidance, documentation requirements
Feeds into appeal generation and decision support

### Routing Logic
Define routing based on payer and denial type:
- ADR → HealthSource (ROI)
- Medicare audit → ESMD
- Commercial payer → portal or fax
- Specific payer → ThoughtfulAI agent

### Submission Rules
Configure allowed submission channels per payer

### Configurable Business Rules (reach)
Define what is actionable; configure thresholds and automation behavior

---

## Appeal Packet Assembly

- Manually assemble packets: appeal letter (from templates + policies), supporting clinical documentation, prior correspondence
- Source materials: internal medical records, uploaded/historical documents
- Organize into payer-compliant formats: cover letter + supporting documentation
- Tools: reorder documents, preview packet structure
- Output: submission-ready packet for ESMD, portal upload, or fax

---

## Action Layer (Integrations — Stubbed in Prototype)

- **Appeal Workflow** — generate appeals using templates, payer policies, clinical + claim data
- **ADR / ROI Workflow (HealthSource)** — send ADR + metadata, receive record retrieval status, update instance
- **ESMD Integration (via HealthSource)** — submit medical records and appeal packets, track delivery
- **EMDR Integration (via HealthSource)** — ingest ADRs and audit determinations, auto-create/update instances
- **ThoughtfulAI Integration** — agents retrieve documents, submit appeals, check payer status; update system via API

---

## Outcome & Financial Tracking

### Outcome Capture
Values: overturned, partially overturned, upheld, will not appeal
Sources: PDFs, 835 updates, agent activity

### Financial Reconciliation
- Compare billed (837) vs paid (835)
- Track: recovery, recoupments, expected vs actual outcomes

---

## Analytics Layer

- **Operational** — workload, queue visibility, aging, SLA tracking
- **Performance** — % denials worked, % overturned, time to submission, time to resolution, net recovery
- **Denial Analysis** — by payer, by type, by facility
- **Financial** — recovery trends, revenue leakage, recoupment patterns
- **Feedback Loop (reach)** — identify recurring patterns, inform coding / prebill / authorization
