// ─── AI Edit Mock Scenarios ───────────────────────────────────────────────────
// Each scenario has:
//   promptMatch: keywords to look for in the user's prompt
//   delayMs:     simulated LLM latency
//   delta:       full letter HTML with <del>/<ins> tracked-change markup
//
// Del/ins inline styles
const D = 'style="color:#B91C1C;background-color:#FEF2F2;text-decoration:line-through;border-radius:2px;padding:0 1px"';
const I = 'style="color:#166534;background-color:#F0FDF4;text-decoration:none;border-radius:2px;padding:0 1px"';

// Annotation span (unchanged AI-highlighted text from prior versions)
const ANN = 'style="background-color:#E3F2FD; border-radius:2px; padding:0 2px"';

// ─── Shared letter header/footer (unchanged across all deltas) ────────────────

const LETTER_HEADER = `<p>Sunny Valley Hospital<br>
1234 Sunshine Boulevard<br>
Pleasantville, ST 12345</p>

<p>03/17/2026</p>

<p>Wellcare<br>
Wellcare Medicare Advantage<br>
Grievance and Appeals Department<br>
P.O. Box 4000<br>
Farmington, MO 63640</p>

<p>Dear Reviewer,</p>`;

const LETTER_IDENTIFIERS = `<p>Beneficiary Name: Susan A. Smith<br>
Date of Birth: 01/15/1965<br>
Member ID Number: ABC123456789<br>
Claim Number: 1234567890<br>
Patient Account Number: 1010026790<br>
Claim Dates of Service: 06/01/2024 to 06/05/2024<br>
Diagnosis in Question: ICD-10-CM codes A41.9, R65.20, J96.21</p>

<p>Reason(s) for Denial: Insufficient clinical documentation to support diagnosis.<br>
DRG Change: Reassignment from DRG 871 to DRG 194.</p>`;

const LETTER_FOOTER = `<p>Respectfully,</p>

<p>Dr. Jane Smith<br>
Medical Director<br>
Sunny Valley Hospital<br>
Phone: (123) 456-7890<br>
Email: jane.smith@sunnyvalleyhospital.com</p>

<p>Please return all correspondence to<br>
Sunny Valley Hospital<br>
1234 Sunshine Boulevard<br>
Pleasantville, ST 12345</p>`;

// ─── Delta 1: Address payer's argument ────────────────────────────────────────
// Triggered by: "stronger", "payer", "address", "argument", "counter"
// Adds a direct rebuttal block countering each of Wellcare's stated criteria.

const DELTA_ADDRESS_PAYER = `${LETTER_HEADER}

<p>This is a request for reconsideration of Ms. Susan A. Smith's denied claim for services provided at Sunny Valley Hospital. The following response addresses the denial issued by Wellcare, specifically the reassignment of DRG 871 to 194, and substantiates the ICD-10-CM codes that support the appropriate DRG assignment.</p>

${LETTER_IDENTIFIERS}

<p>Sunny Valley Hospital respectfully disagrees with the reviewer's conclusion disputing the appropriateness of the principal and secondary diagnoses of A41.9, R65.20, and J96.21, prompting a reassignment of the DRG.</p>

<p><ins ${I}><strong>Direct Response to Payer's Stated Denial Criteria:</strong> Wellcare's denial asserts that Ms. Smith did not meet the Sepsis-3 SOFA score threshold of ≥2 points, that no MAP below 70 mmHg was documented, that platelet count was not below 150, and that her COPD history accounted for her oxygen requirement. Sunny Valley Hospital directly refutes each of these points as follows:</ins></p>

<p><ins ${I}><strong>SOFA Score:</strong> Ms. Smith's creatinine rose from 0.8 mg/dL (baseline) to 1.6 mg/dL during admission — an increase meeting AKI Stage 1 criteria and conferring Renal SOFA +1. Her need for 5 L/min supplemental oxygen to maintain SpO2 ≥90% confirms Respiratory SOFA +1. Combined, these represent a minimum SOFA increment of +2 from baseline, satisfying the Sepsis-3 definition for sepsis-associated organ dysfunction. The payer's assertion that SOFA did not increase is not supported by the documented clinical data.</ins></p>

<p><ins ${I}><strong>COPD and Baseline Oxygenation:</strong> The reviewer cites Ms. Smith's COPD history as an alternative explanation for her oxygen requirements. However, her documented baseline SpO2 prior to this admission was 96% on room air. The acute drop to 90% requiring supplemental oxygen during this hospitalization represents a clinically meaningful deviation from her personal baseline — not a continuation of her chronic baseline — and is directly attributable to her septic process.</ins></p>

<p><span ${ANN}>Ms. Smith, a 64-year-old female, was admitted to Sunny Valley Hospital with suspected sepsis necessitating broad-spectrum IV antibiotics, including vancomycin, cefepime, and metronidazole</span>. During her hospitalization, Ms. Smith displayed clear clinical signs and symptoms consistent with sepsis, severe sepsis, and acute respiratory failure.</p>

<p>Argument 1: The Principal Diagnosis of Sepsis (A41.9) is Clinically Validated</p>

<p><span ${ANN}>Ms. Smith's urine culture confirmed the presence of infection; she exhibited multiple SIRS criteria: temperature dysregulation (Temp: 38.1°C and 35.6°C) and persistent tachypnea (Resp: 24–25), alongside elevated leukocytosis (WBC consistently >12,000/mm³)</span>.</p>

<p>Conclusion for Sepsis: The documented confirmed infection and systemic response clinically validate the sepsis diagnosis as the primary reason for admission.</p>

<p>Argument 2: The Secondary Diagnosis of Severe Sepsis (R65.20) is Supported by Clear Evidence of Acute Organ Dysfunction</p>

<p><span ${ANN}>Ms. Smith's serum creatinine increased from baseline, indicating AKI. Ms. Smith required significant oxygen support (5 L/min via simple face mask) to maintain SpO2 at 90%, confirming acute hypoxemic respiratory failure and further contributing to a SOFA score of +1 to +2 points</span>.</p>

<p>Conclusion for Severe Sepsis: The coexistence of AKI and acute respiratory failure demonstrates a SOFA score increase of at least 2 points, confirming severe sepsis.</p>

<p>Argument 3: The Secondary Diagnosis of Acute and Chronic Respiratory Failure with Hypoxia (J96.21) is Clinically Evident</p>

<p><span ${ANN}>Continuous, high-flow oxygen was necessary to prevent desaturation. This clinical necessity, not attributable solely to pneumonia or COPD, indicates acute hypoxemic respiratory failure, directly correlating with the septic process</span>.</p>

<p>Conclusion for Acute and Chronic Respiratory Failure: The need for high-flow oxygen therapy signifies organ dysfunction due to sepsis, substantiating the diagnosis of J96.21.</p>

<p>Conclusion</p>

<p><del ${D}>Based on the patient's documented clinical course and supporting evidence, the diagnoses of A41.9, R65.20, and J96.21 were appropriately assigned. We respectfully request the reconsideration of this claim under the originally submitted DRG 871.</del> <ins ${I}>Based on the patient's documented clinical course and the point-by-point rebuttal of the payer's stated denial criteria above, the diagnoses of A41.9, R65.20, and J96.21 were appropriately assigned. The DRG should remain as DRG 871, as initially coded. We respectfully request the reconsideration of this claim under the originally submitted DRG 871.</ins></p>

${LETTER_FOOTER}`;

// ─── Delta 2: Apply uploaded criteria ────────────────────────────────────────
// Triggered by: "criteria", "interqual", "mcg", "uploaded", "guidelines"
// Strengthens arguments by incorporating payer-published criteria language.

const DELTA_APPLY_CRITERIA = `${LETTER_HEADER}

<p>This is a request for reconsideration of Ms. Susan A. Smith's denied claim for services provided at Sunny Valley Hospital. The following response addresses the denial issued by Wellcare, specifically the reassignment of DRG 871 to 194, and substantiates the ICD-10-CM codes that support the appropriate DRG assignment.</p>

${LETTER_IDENTIFIERS}

<p>Sunny Valley Hospital respectfully disagrees with the reviewer's conclusion disputing the appropriateness of the principal and secondary diagnoses of A41.9, R65.20, and J96.21, prompting a reassignment of the DRG.</p>

<p><span ${ANN}>Ms. Smith, a 64-year-old female, was admitted to Sunny Valley Hospital with suspected sepsis necessitating broad-spectrum IV antibiotics, including vancomycin, cefepime, and metronidazole</span>. During her hospitalization, Ms. Smith displayed clear clinical signs and symptoms consistent with sepsis, severe sepsis, and acute respiratory failure.</p>

<p>Argument 1: The Principal Diagnosis of Sepsis (A41.9) is Clinically Validated</p>

<p><ins ${I}>Per the InterQual 2024 criteria for Acute Medical Care — Infectious Disease, inpatient admission for sepsis is indicated when there is a confirmed or suspected infection accompanied by two or more SIRS criteria requiring IV antimicrobial therapy and clinical monitoring not safely provided in a lower level of care. Ms. Smith met all of these criteria on admission: positive urine culture, temperature 38.1°C, leukocytosis with WBC >12,000/mm³, tachypnea (RR 24–25 breaths/min), and immediate initiation of triple-agent IV antibiotics (vancomycin, cefepime, metronidazole).</ins></p>

<p><span ${ANN}>Ms. Smith's urine culture confirmed the presence of infection; she exhibited multiple SIRS criteria: temperature dysregulation (Temp: 38.1°C and 35.6°C) and persistent tachypnea (Resp: 24–25), alongside elevated leukocytosis (WBC consistently >12,000/mm³)</span>.</p>

<p><del ${D}>Conclusion for Sepsis: The documented confirmed infection and systemic response clinically validate the sepsis diagnosis as the primary reason for admission.</del> <ins ${I}>Conclusion for Sepsis: The documented confirmed infection and systemic response clinically validate the sepsis diagnosis as the primary reason for admission and satisfy published criteria for inpatient-level care.</ins></p>

<p>Argument 2: The Secondary Diagnosis of Severe Sepsis (R65.20) is Supported by Clear Evidence of Acute Organ Dysfunction</p>

<p><ins ${I}>The Surviving Sepsis Campaign (SSC) 2021 guidelines define severe sepsis through the Sepsis-3 framework: life-threatening organ dysfunction caused by a dysregulated host response to infection, quantified as an acute SOFA score increase of ≥2 points from baseline. Ms. Smith's documented creatinine rise (0.8 → 1.6 mg/dL, AKI Stage 1) contributed Renal SOFA +1, and her acute hypoxemic respiratory failure requiring 5 L/min supplemental oxygen contributed Respiratory SOFA +1. The total acute SOFA increment of +2 meets the SSC threshold for severe sepsis, independent of MAP or platelet criteria.</ins></p>

<p><span ${ANN}>Ms. Smith's serum creatinine increased from baseline, indicating AKI. Ms. Smith required significant oxygen support (5 L/min via simple face mask) to maintain SpO2 at 90%, confirming acute hypoxemic respiratory failure and further contributing to a SOFA score of +1 to +2 points</span>.</p>

<p><del ${D}>Conclusion for Severe Sepsis: The coexistence of AKI and acute respiratory failure demonstrates a SOFA score increase of at least 2 points, confirming severe sepsis.</del> <ins ${I}>Conclusion for Severe Sepsis: Application of the SSC 2021 criteria confirms that Ms. Smith met the threshold for severe sepsis through documented renal and respiratory organ dysfunction.</ins></p>

<p>Argument 3: The Secondary Diagnosis of Acute and Chronic Respiratory Failure with Hypoxia (J96.21) is Clinically Evident</p>

<p><span ${ANN}>Continuous, high-flow oxygen was necessary to prevent desaturation. This clinical necessity, not attributable solely to pneumonia or COPD, indicates acute hypoxemic respiratory failure, directly correlating with the septic process</span>.</p>

<p>Conclusion for Acute and Chronic Respiratory Failure: The need for high-flow oxygen therapy signifies organ dysfunction due to sepsis, substantiating the diagnosis of J96.21.</p>

<p>Conclusion</p>

<p><del ${D}>Based on the patient's documented clinical course and supporting evidence, the diagnoses of A41.9, R65.20, and J96.21 were appropriately assigned. We respectfully request the reconsideration of this claim under the originally submitted DRG 871.</del> <ins ${I}>Based on the patient's documented clinical course and the application of published InterQual 2024 and Surviving Sepsis Campaign 2021 criteria, the diagnoses of A41.9, R65.20, and J96.21 were appropriately assigned. Therefore, the DRG should remain as DRG 871, as initially coded. We respectfully request the reconsideration of this claim under the originally submitted DRG 871.</ins></p>

${LETTER_FOOTER}`;

// ─── Delta 3: Tighten the opening ─────────────────────────────────────────────
// Triggered by: "tighten", "opening", "direct", "assertive", "concise"
// Rewrites introductory paragraphs to lead with the strongest clinical argument.

const DELTA_TIGHTEN_OPENING = `${LETTER_HEADER}

<p><del ${D}>This is a request for reconsideration of Ms. Susan A. Smith's denied claim for services provided at Sunny Valley Hospital. The following response addresses the denial issued by Wellcare, specifically the reassignment of DRG 871 to 194, and substantiates the ICD-10-CM codes that support the appropriate DRG assignment.</del> <ins ${I}>Sunny Valley Hospital disputes Wellcare's reassignment of DRG 871 to DRG 194 for Ms. Susan A. Smith's June 2024 admission. The medical record clearly documents sepsis with acute organ dysfunction meeting established clinical criteria. This letter presents the clinical evidence supporting the originally assigned diagnoses of A41.9 (Sepsis), R65.20 (Severe Sepsis), and J96.21 (Acute and Chronic Respiratory Failure with Hypoxia), and requests immediate reinstatement of DRG 871.</ins></p>

${LETTER_IDENTIFIERS}

<p><ins ${I}>The reassignment of DRG 871 to DRG 194 is clinically unsupported. Ms. Smith's presentation — confirmed infection, systemic inflammatory response, and acute organ dysfunction requiring inpatient-level monitoring and IV antimicrobial therapy — is not consistent with simple pneumonia and pleurisy. The following arguments address each disputed diagnosis in turn.</ins></p>

<p><span ${ANN}>Ms. Smith, a 64-year-old female, was admitted to Sunny Valley Hospital with suspected sepsis necessitating broad-spectrum IV antibiotics, including vancomycin, cefepime, and metronidazole</span>. During her hospitalization, Ms. Smith displayed clear clinical signs and symptoms consistent with sepsis, severe sepsis, and acute respiratory failure.</p>

<p>Argument 1: The Principal Diagnosis of Sepsis (A41.9) is Clinically Validated</p>

<p><span ${ANN}>Ms. Smith's urine culture confirmed the presence of infection; she exhibited multiple SIRS criteria: temperature dysregulation (Temp: 38.1°C and 35.6°C) and persistent tachypnea (Resp: 24–25), alongside elevated leukocytosis (WBC consistently >12,000/mm³)</span>.</p>

<p>Conclusion for Sepsis: The documented confirmed infection and systemic response clinically validate the sepsis diagnosis as the primary reason for admission.</p>

<p>Argument 2: The Secondary Diagnosis of Severe Sepsis (R65.20) is Supported by Clear Evidence of Acute Organ Dysfunction</p>

<p><span ${ANN}>Ms. Smith's serum creatinine increased from baseline, indicating AKI. Ms. Smith required significant oxygen support (5 L/min via simple face mask) to maintain SpO2 at 90%, confirming acute hypoxemic respiratory failure and further contributing to a SOFA score of +1 to +2 points</span>.</p>

<p>Conclusion for Severe Sepsis: The coexistence of AKI and acute respiratory failure demonstrates a SOFA score increase of at least 2 points, confirming severe sepsis.</p>

<p>Argument 3: The Secondary Diagnosis of Acute and Chronic Respiratory Failure with Hypoxia (J96.21) is Clinically Evident</p>

<p><span ${ANN}>Continuous, high-flow oxygen was necessary to prevent desaturation. This clinical necessity, not attributable solely to pneumonia or COPD, indicates acute hypoxemic respiratory failure, directly correlating with the septic process</span>.</p>

<p>Conclusion for Acute and Chronic Respiratory Failure: The need for high-flow oxygen therapy signifies organ dysfunction due to sepsis, substantiating the diagnosis of J96.21.</p>

<p>Conclusion</p>

<p><del ${D}>Based on the patient's documented clinical course and supporting evidence, the diagnoses of A41.9, R65.20, and J96.21 were appropriately assigned. We respectfully request the reconsideration of this claim under the originally submitted DRG 871.</del> <ins ${I}>The clinical evidence is unambiguous: A41.9, R65.20, and J96.21 were appropriately assigned based on Ms. Smith's documented presentation, laboratory findings, and clinical course. Reassignment to DRG 194 does not reflect the severity of illness or the complexity of care required. We respectfully demand reinstatement of DRG 871 and request a peer-to-peer clinical review if the claim is not approved upon reconsideration.</ins></p>

${LETTER_FOOTER}`;

// ─── Delta 4: Generic strengthen (default) ────────────────────────────────────
// Triggered by: fallback when no other keywords match
// Strengthens Argument 2 (severe sepsis) with specific lab values, clinical
// timeline, and explicit SOFA scoring documentation.

const DELTA_GENERIC_STRENGTHEN = `${LETTER_HEADER}

<p>This is a request for reconsideration of Ms. Susan A. Smith's denied claim for services provided at Sunny Valley Hospital. The following response addresses the denial issued by Wellcare, specifically the reassignment of DRG 871 to 194, and substantiates the ICD-10-CM codes that support the appropriate DRG assignment.</p>

${LETTER_IDENTIFIERS}

<p>Sunny Valley Hospital respectfully disagrees with the reviewer's conclusion disputing the appropriateness of the principal and secondary diagnoses of A41.9, R65.20, and J96.21, prompting a reassignment of the DRG.</p>

<p><span ${ANN}>Ms. Smith, a 64-year-old female, was admitted to Sunny Valley Hospital with suspected sepsis necessitating broad-spectrum IV antibiotics, including vancomycin, cefepime, and metronidazole</span>. During her hospitalization, Ms. Smith displayed clear clinical signs and symptoms consistent with sepsis, severe sepsis, and acute respiratory failure.</p>

<p>Argument 1: The Principal Diagnosis of Sepsis (A41.9) is Clinically Validated</p>

<p><span ${ANN}>Ms. Smith's urine culture confirmed the presence of infection; she exhibited multiple SIRS criteria: temperature dysregulation (Temp: 38.1°C and 35.6°C) and persistent tachypnea (Resp: 24–25), alongside elevated leukocytosis (WBC consistently >12,000/mm³)</span>.</p>

<p>Conclusion for Sepsis: The documented confirmed infection and systemic response clinically validate the sepsis diagnosis as the primary reason for admission.</p>

<p>Argument 2: The Secondary Diagnosis of Severe Sepsis (R65.20) is Supported by Clear Evidence of Acute Organ Dysfunction</p>

<p><del ${D}>Ms. Smith's serum creatinine increased from baseline, indicating AKI. Ms. Smith required significant oxygen support (5 L/min via simple face mask) to maintain SpO2 at 90%, confirming acute hypoxemic respiratory failure and further contributing to a SOFA score of +1 to +2 points.</del></p>

<p><ins ${I}>The Sepsis-3 definition requires an acute SOFA score increase of ≥2 points from baseline, reflecting life-threatening organ dysfunction. Ms. Smith's clinical course demonstrates multi-organ involvement across two organ systems:</ins></p>

<p><ins ${I}><strong>Renal dysfunction (SOFA +1):</strong> Serum creatinine rose from a documented baseline of 0.8 mg/dL to a peak of 1.6 mg/dL on Day 2, representing a 100% increase and meeting the KDIGO definition of AKI Stage 1. Serial creatinine monitoring was initiated with IV hydration. Creatinine did not return to baseline until Day 4, indicating sustained renal compromise throughout the acute illness.</ins></p>

<p><ins ${I}><strong>Respiratory dysfunction (SOFA +1):</strong> Ms. Smith required continuous supplemental oxygen at 5 L/min via simple face mask to maintain SpO2 ≥90%. Her documented pre-admission baseline SpO2 was 96% on room air. This represents a clinically significant acute deviation from her individual respiratory baseline, not attributable to her stable, well-compensated COPD.</ins></p>

<p><ins ${I}>Combined, these two domains yield an acute SOFA increment of +2 points, satisfying the Sepsis-3 threshold for severe sepsis with acute organ dysfunction. The physician's attestation in the discharge summary explicitly documents the causal relationship between the confirmed sepsis and the observed organ dysfunction.</ins></p>

<p><del ${D}>Conclusion for Severe Sepsis: The coexistence of AKI and acute respiratory failure demonstrates a SOFA score increase of at least 2 points, confirming severe sepsis.</del> <ins ${I}>Conclusion for Severe Sepsis: The coexistence of documented AKI (Renal SOFA +1) and acute hypoxemic respiratory failure (Respiratory SOFA +1) confirms a SOFA score increase of ≥2 points, meeting the clinical definition of severe sepsis under both Sepsis-2 and Sepsis-3 frameworks.</ins></p>

<p>[Argument 3 — in progress]</p>

<p>Based on the patient's documented clinical course and supporting evidence, the diagnoses of A41.9, R65.20, and J96.21 were appropriately assigned. We respectfully request the reconsideration of this claim under the originally submitted DRG 871.</p>

${LETTER_FOOTER}`;

// ─── Scope transforms ────────────────────────────────────────────────────────
// Used when the user has selected text: modify only the matching paragraph.
// match: first ~55 chars of paragraph plain-text (used for lookup)
// intents: keyed by detected prompt intent

export const DEL_STYLE = 'color:#B91C1C;background-color:#FEF2F2;text-decoration:line-through;border-radius:2px;padding:0 1px';
export const INS_STYLE = 'color:#166534;background-color:#F0FDF4;text-decoration:none;border-radius:2px;padding:0 1px';

export const SCOPE_TRANSFORMS = [
  {
    match: "This is a request for reconsideration of Ms. Susan A. Smith",
    intents: {
      shorter:   "Sunny Valley Hospital requests reconsideration of Ms. Susan A. Smith's denied claim and disputes Wellcare's reassignment of DRG 871 to 194.",
      stronger:  "Sunny Valley Hospital formally disputes Wellcare's denial and demands reinstatement of DRG 871. The clinical record clearly supports the originally assigned diagnoses of A41.9, R65.20, and J96.21.",
      emphasize: "Sunny Valley Hospital strongly contests the reassignment of DRG 871 to DRG 194. This letter presents definitive clinical evidence supporting all three disputed diagnoses and requests immediate reinstatement.",
      rewrite:   "On behalf of Ms. Susan A. Smith, Sunny Valley Hospital requests reconsideration of Wellcare's DRG reassignment from 871 to 194, with clinical substantiation for each disputed ICD-10-CM code.",
    },
  },
  {
    match: "Sunny Valley Hospital respectfully disagrees with the reviewer",
    intents: {
      shorter:   "Sunny Valley Hospital disputes the reassignment of DRG 871 to DRG 194.",
      stronger:  "Sunny Valley Hospital firmly disputes Wellcare's determination. The clinical evidence does not support reassignment of these diagnoses, and DRG 871 must be reinstated.",
      emphasize: "Sunny Valley Hospital unequivocally rejects the reviewer's conclusion. The diagnoses of A41.9, R65.20, and J96.21 are each independently supported by documented clinical findings.",
      rewrite:   "This letter formally disputes the reassignment of DRG 871 to 194. The principal and secondary diagnoses are clinically validated and should not have been reassigned.",
    },
  },
  {
    match: "Ms. Smith, a 64-year-old female, was admitted",
    intents: {
      shorter:   "Ms. Smith was admitted with suspected sepsis requiring broad-spectrum IV antibiotics. Her hospitalization documented signs consistent with sepsis, severe sepsis, and acute respiratory failure.",
      stronger:  "Ms. Smith, a 64-year-old female, required urgent inpatient admission for confirmed sepsis, receiving triple-agent IV antibiotic therapy (vancomycin, cefepime, metronidazole). Her documented clinical course unambiguously confirmed sepsis, severe sepsis, and acute respiratory failure — each requiring inpatient-level monitoring and intervention.",
      emphasize: "Ms. Smith's presentation was unambiguous: inpatient admission was immediately required for sepsis management including triple-agent IV antibiotics. Her clinical course documented progressive sepsis, severe sepsis, and acute respiratory failure across her entire hospitalization.",
      rewrite:   "A 64-year-old female, Ms. Smith was hospitalized for suspected sepsis and initiated on broad-spectrum IV antibiotics. Clinical findings confirmed sepsis, severe sepsis, and acute respiratory failure throughout her admission.",
    },
  },
  {
    match: "Ms. Smith's urine culture confirmed the presence of infection",
    intents: {
      shorter:   "Ms. Smith had a confirmed urinary infection with fever (38.1°C), WBC >12,000/mm³, and tachypnea (RR 24–25) — satisfying multiple SIRS criteria for sepsis.",
      stronger:  "The sepsis diagnosis is clinically conclusive: positive urine culture, temperature dysregulation (38.1°C and 35.6°C), sustained leukocytosis (WBC >12,000/mm³), and persistent tachypnea (RR 24–25 breaths/min). Each finding independently satisfies a SIRS criterion, and together they leave no reasonable clinical doubt regarding the sepsis diagnosis.",
      emphasize: "The sepsis diagnosis is irrefutable: confirmed urinary infection, sustained SIRS criteria including fever, leukocytosis (WBC >12,000/mm³), and tachypnea. These findings were consistently documented across multiple days of hospitalization — not isolated observations.",
      rewrite:   "Positive urine culture confirmed infection. Throughout her stay, Ms. Smith exhibited SIRS criteria: temperature instability (38.1°C and 35.6°C), WBC consistently >12,000/mm³, and respiratory rate of 24–25 breaths/min.",
    },
  },
  {
    match: "Ms. Smith's serum creatinine increased from baseline",
    intents: {
      shorter:   "Ms. Smith developed AKI (creatinine rise above baseline) and required 5 L/min supplemental O₂ to maintain SpO2 at 90%, representing a SOFA increment of +1 to +2.",
      stronger:  "Ms. Smith's organ dysfunction was objectively documented: creatinine rose from baseline indicating AKI Stage 1, and 5 L/min supplemental oxygen was required to maintain SpO2 at 90% — an acute deviation from her documented 96% room-air baseline. These findings confirm an acute SOFA increment of +2 points, meeting the Sepsis-3 threshold for severe sepsis.",
      emphasize: "Organ dysfunction across two systems is clearly evidenced: renal dysfunction via AKI (rising creatinine) and respiratory failure requiring continuous supplemental oxygen. Together, these findings yield a SOFA increment of +2 — independently confirming severe sepsis under both Sepsis-2 and Sepsis-3 frameworks.",
      rewrite:   "AKI is evidenced by creatinine rising above baseline. Acute respiratory failure required 5 L/min supplemental oxygen to maintain SpO2 at 90%, contributing a cumulative SOFA score of +1 to +2 points.",
    },
  },
  {
    match: "Based on the patient's documented clinical course and supporting evidence",
    intents: {
      shorter:   "The diagnoses of A41.9, R65.20, and J96.21 were appropriately assigned. We request reconsideration of this claim under DRG 871.",
      stronger:  "The clinical evidence is unambiguous: A41.9, R65.20, and J96.21 were correctly assigned based on Ms. Smith's documented presentation, laboratory values, and clinical course. Reassignment to DRG 194 does not reflect the severity or complexity of care required. We demand reinstatement of DRG 871 and request peer-to-peer review if this claim is not approved.",
      emphasize: "Sunny Valley Hospital respectfully but firmly requests reconsideration. The diagnoses of A41.9, R65.20, and J96.21 are each supported by documented clinical evidence. The reassignment of DRG 871 to 194 is clinically inappropriate and should be reversed.",
      rewrite:   "The diagnoses of A41.9, R65.20, and J96.21 are each clinically documented and appropriately assigned. This claim should be reviewed and reconsidered under the originally submitted DRG 871.",
    },
  },
  {
    match: "Conclusion for Sepsis:",
    intents: {
      shorter:   "Conclusion: Confirmed infection with SIRS criteria validates the sepsis diagnosis.",
      stronger:  "Conclusion for Sepsis: The documented infection and multi-criterion SIRS response conclusively validate A41.9 as the primary reason for inpatient admission. No alternative diagnosis accounts for the observed clinical presentation.",
      emphasize: "Conclusion for Sepsis: The clinical evidence is unambiguous. Confirmed infection, fever, leukocytosis, and tachypnea together satisfy every criterion required for a sepsis diagnosis under both SIRS and Sepsis-3 definitions.",
      rewrite:   "Conclusion — Sepsis (A41.9): Confirmed urinary infection combined with documented SIRS criteria validates this diagnosis as the primary driver of the inpatient admission.",
    },
  },
  {
    match: "Conclusion for Severe Sepsis:",
    intents: {
      shorter:   "Conclusion: AKI and acute respiratory failure confirm a SOFA score increase of ≥2 points, meeting the threshold for severe sepsis.",
      stronger:  "Conclusion for Severe Sepsis: Multi-organ dysfunction — confirmed AKI and acute hypoxemic respiratory failure — yields an acute SOFA increment of +2, satisfying the Sepsis-3 definition of severe sepsis. This finding is supported by serial lab values and clinical documentation throughout the admission.",
      emphasize: "Conclusion for Severe Sepsis: The organ dysfunction is documented, measurable, and causally linked to the confirmed septic process. Both AKI and acute respiratory failure are independently supported by the clinical record.",
      rewrite:   "Conclusion — Severe Sepsis (R65.20): Concurrent AKI and acute respiratory failure establish a SOFA score increase meeting or exceeding the +2 threshold required under the Sepsis-3 framework.",
    },
  },
];

// ─── Scenarios export ─────────────────────────────────────────────────────────

export const AI_EDIT_SCENARIOS = [
  {
    promptMatch: ['stronger', 'payer', 'address', 'argument', 'counter', 'denial', 'wellcare'],
    delayMs: 2800,
    delta: DELTA_ADDRESS_PAYER,
  },
  {
    promptMatch: ['criteria', 'interqual', 'mcg', 'uploaded', 'guidelines', 'published'],
    delayMs: 3200,
    delta: DELTA_APPLY_CRITERIA,
  },
  {
    promptMatch: ['tighten', 'opening', 'direct', 'assertive', 'concise', 'lead'],
    delayMs: 2200,
    delta: DELTA_TIGHTEN_OPENING,
  },
  {
    // Default fallback
    promptMatch: [],
    delayMs: 2500,
    delta: DELTA_GENERIC_STRENGTHEN,
  },
];

// ─── Quick action prefills ────────────────────────────────────────────────────

export const QUICK_ACTIONS = [
  {
    label: "Address payer's argument",
    text: "The payer denied this claim arguing the patient didn't meet inpatient criteria. Address this argument directly and counter it using the clinical documentation from the chart.",
    requiresDocs: false,
  },
  {
    label: 'Apply uploaded criteria',
    text: 'Using the uploaded criteria document, strengthen the argument that inpatient level of care was medically necessary and the patient met the clinical criteria.',
    requiresDocs: true,
  },
  {
    label: 'Tighten the opening',
    text: 'Rewrite the opening paragraph to be more direct and assertive. Remove filler phrases and lead with the strongest clinical argument.',
    requiresDocs: false,
  },
  {
    label: 'Make this stronger',
    text: 'Strengthen the clinical arguments. Add more specific evidence from the chart to support each diagnosis, including specific values, dates, and findings.',
    requiresDocs: false,
  },
];
