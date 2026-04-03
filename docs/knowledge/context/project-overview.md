# Project Overview: Denials Management Prototype

Last Reviewed: 2026-04-02

## What This Is

A prototype for a denials management solution in the RCM (Revenue Cycle Management) space. This is not a production system — it demonstrates the core workflow and UX for a real product.

## Core Workflow

1. **Ingest** — Accept payer signals in two formats:
   - 835 EDI files (Electronic Remittance Advice / ERA)
   - PDFs (Explanation of Benefits, denial letters)

2. **Resolve** — Match each signal to:
   - The correct patient (demographic + insurance matching)
   - The originating 837 claim

3. **Structure** — Convert raw signals into normalized denial instances with:
   - Denial reason codes (CARC / RARC)
   - Payer, provider, dates, amounts
   - Claim line detail where applicable

4. **Route** — Apply configurable logic to assign denials to the right queue/worklist/user

5. **Work** — Enable RCM specialists to take action: appeal, correct, resubmit, write off, escalate

6. **Track** — Monitor status, aging, outcomes, and performance metrics through to resolution

## Integrations (Stubbed in Prototype)

These will appear in the UI but will not be functional:
- ROI (Release of Information) vendors
- Submission channels (payer portals, clearinghouses)
- Agentic / AI-assisted workflows

## User Persona

RCM specialists. Deeply familiar with:
- 835 / 837 EDI transaction sets
- CARC (Claim Adjustment Reason Codes) and RARC (Remittance Advice Remark Codes)
- Payer-specific denial behavior and appeal requirements
- Timely filing limits, coordination of benefits, authorization rules
- Appeals, reconsiderations, corrected claims, and write-offs

## Design Language

**Clinical, precise, trust-first.**
- Data density over decoration
- Transparency over abstraction — show users what the system knows and why it decided what it did
- Accuracy is a trust signal — wrong data destroys credibility instantly
- Use standard RCM terminology throughout
