import { useReducer, useRef, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  Tooltip,
  ListItemIcon,
  ListItemText,
  Collapse,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Select,
  InputAdornment,
  CircularProgress,
  InputLabel,
  Switch,
  ButtonBase,
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import HistoryIcon from '@mui/icons-material/History';
import RestoreIcon from '@mui/icons-material/Restore';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SaveIcon from '@mui/icons-material/Save';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import PrintIcon from '@mui/icons-material/Print';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatAlignJustifyIcon from '@mui/icons-material/FormatAlignJustify';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PersonIcon from '@mui/icons-material/Person';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckIcon from '@mui/icons-material/Check';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import SubdirectoryArrowRightIcon from '@mui/icons-material/SubdirectoryArrowRight';
import {
  MOCK_CASE,
  MOCK_DRG_CODES,
  MOCK_EVIDENCE,
  MOCK_ACTIVITY_BY_LEVEL,
  MOCK_COMMENTS,
  MOCK_APPEAL_LETTER,
  MOCK_DENIAL_LETTER_HTML,
} from './mockData';
import { AI_EDIT_SCENARIOS, QUICK_ACTIONS, SCOPE_TRANSFORMS, DEL_STYLE, INS_STYLE } from './aiMockDeltas';
import CaseEditDenialDetailsPanel from './CaseEditDenialDetailsPanel';

// ─── CodeValue ────────────────────────────────────────────────────────────────

function CodeValue({ value, label, fontSize = '0.6875rem' }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, '&:hover .code-copy-icon': { opacity: 1 } }}>
      <Typography sx={{ fontSize, fontVariantNumeric: 'tabular-nums', color: '#475569', whiteSpace: 'nowrap' }}>
        {value}
      </Typography>
      <Tooltip title={copied ? 'Copied!' : `Copy ${label}`} placement="top">
        <IconButton
          className="code-copy-icon"
          size="small"
          aria-label={`Copy ${label} ${value}`}
          onClick={handleCopy}
          sx={{ p: 0.25, opacity: 0, transition: 'opacity 0.15s', color: copied ? '#16A34A' : 'text.disabled', '&:focus-visible': { opacity: 1 } }}
        >
          {copied ? <CheckIcon sx={{ fontSize: 11 }} /> : <ContentCopyIcon sx={{ fontSize: 11 }} />}
        </IconButton>
      </Tooltip>
    </Box>
  );
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  Generating:           { bg: '#E3F2FD', color: '#1565C0' },
  'Ready for Review':   { bg: '#E0F2F1', color: '#009688' },
  'Ready to Submit':    { bg: '#E0F2F1', color: '#009688' },
  Submitted:            { bg: '#E8F5E9', color: '#388E3C' },
  Overturned:           { bg: '#E8F5E9', color: '#2E7D32' },
  'Needs Information':  { bg: '#FFF3E0', color: '#E65100' },
  Failed:               { bg: '#FFEBEE', color: '#C62828' },
  'Will Not Submit':    { bg: '#F5F5F5', color: '#616161' },
  Archived:             { bg: '#F5F5F5', color: '#616161' },
};

const LEVEL_OPTIONS = ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5'];

const STATUS_WORKFLOW_ACTIONS = [
  'Submit',
  'Retry Letter',
  'Will Not Submit',
  'Archive',
  'Complete Review',
];

const WNS_REASONS = [
  'Denial appropriate',
  'Insufficient documentation',
  'Provider declined appeal',
  'No prior authorization',
  'Appeal deadline passed',
  'Case resolved another way',
  'Administrative reason',
  'Other (please specify)',
];

const RATING_LABELS = [
  'Needs Rating',
  'Did not use letter',
  'Only used parts of letter',
  'Some changes',
  'A few tweaks',
  'Sent as-is',
];

// ─── Version History Mock Data ────────────────────────────────────────────────

const MOCK_LETTER_V1 = `<p>Sunny Valley Hospital<br>
1234 Sunshine Boulevard<br>
Pleasantville, ST 12345</p>

<p>03/17/2026</p>

<p>Wellcare<br>
Wellcare Medicare Advantage<br>
Grievance and Appeals Department<br>
P.O. Box 4000<br>
Farmington, MO 63640</p>

<p>Dear Reviewer,</p>

<p>This is a request for reconsideration of Ms. Susan A. Smith's denied claim for services provided at Sunny Valley Hospital. The following response addresses the denial issued by Wellcare, specifically the reassignment of DRG 871 to 194.</p>

<p>Beneficiary Name: Susan A. Smith<br>
Date of Birth: 01/15/1965<br>
Member ID Number: ABC123456789<br>
Claim Number: 1234567890<br>
Patient Account Number: 1010026790<br>
Claim Dates of Service: 06/01/2024 to 06/05/2024<br>
Diagnosis in Question: ICD-10-CM codes A41.9, R65.20, J96.21</p>

<p>Reason(s) for Denial: Insufficient clinical documentation to support diagnosis.<br>
DRG Change: Reassignment from DRG 871 to DRG 194.</p>

<p>Sunny Valley Hospital respectfully disagrees with the reviewer's conclusion disputing the appropriateness of the principal and secondary diagnoses of A41.9, R65.20, and J96.21.</p>

<p>[DRAFT — clinical arguments under review. Supporting documentation will be attached upon completion.]</p>

<p>We respectfully request the reconsideration of this claim under the originally submitted DRG 871.</p>

<p>Respectfully,</p>

<p>Dr. Jane Smith<br>
Medical Director<br>
Sunny Valley Hospital<br>
Phone: (123) 456-7890<br>
Email: jane.smith@sunnyvalleyhospital.com</p>
`;

const MOCK_LETTER_V2 = `<p>Sunny Valley Hospital<br>
1234 Sunshine Boulevard<br>
Pleasantville, ST 12345</p>

<p>03/17/2026</p>

<p>Wellcare<br>
Wellcare Medicare Advantage<br>
Grievance and Appeals Department<br>
P.O. Box 4000<br>
Farmington, MO 63640</p>

<p>Dear Reviewer,</p>

<p>This is a request for reconsideration of Ms. Susan A. Smith's denied claim for services provided at Sunny Valley Hospital. The following response addresses the denial issued by Wellcare, specifically the reassignment of DRG 871 to 194, and substantiates the ICD-10-CM codes that support the appropriate DRG assignment.</p>

<p>Beneficiary Name: Susan A. Smith<br>
Date of Birth: 01/15/1965<br>
Member ID Number: ABC123456789<br>
Claim Number: 1234567890<br>
Patient Account Number: 1010026790<br>
Claim Dates of Service: 06/01/2024 to 06/05/2024<br>
Diagnosis in Question: ICD-10-CM codes A41.9, R65.20, J96.21</p>

<p>Reason(s) for Denial: Insufficient clinical documentation to support diagnosis.<br>
DRG Change: Reassignment from DRG 871 to DRG 194.</p>

<p>Sunny Valley Hospital respectfully disagrees with the reviewer's conclusion disputing the appropriateness of the principal and secondary diagnoses of A41.9, R65.20, and J96.21, prompting a reassignment of the DRG.</p>

<p><span style="background-color:#E3F2FD; border-radius:2px; padding:0 2px">Ms. Smith, a 64-year-old female, was admitted to Sunny Valley Hospital with suspected sepsis necessitating broad-spectrum IV antibiotics, including vancomycin, cefepime, and metronidazole</span>. During her hospitalization, Ms. Smith displayed clear clinical signs and symptoms consistent with sepsis, severe sepsis, and acute respiratory failure.</p>

<p>Argument 1: The Principal Diagnosis of Sepsis (A41.9) is Clinically Validated</p>

<p><span style="background-color:#E3F2FD; border-radius:2px; padding:0 2px">Ms. Smith's urine culture confirmed the presence of infection; she exhibited multiple SIRS criteria: temperature dysregulation (Temp: 38.1°C and 35.6°C) and persistent tachypnea (Resp: 24–25), alongside elevated leukocytosis (WBC consistently >12,000/mm³)</span>.</p>

<p>Conclusion for Sepsis: The documented confirmed infection and systemic response clinically validate the sepsis diagnosis as the primary reason for admission.</p>

<p>Argument 2: The Secondary Diagnosis of Severe Sepsis (R65.20) is Supported by Clear Evidence of Acute Organ Dysfunction</p>

<p><span style="background-color:#E3F2FD; border-radius:2px; padding:0 2px">Ms. Smith's serum creatinine increased from baseline, indicating AKI. Ms. Smith required significant oxygen support (5 L/min via simple face mask) to maintain SpO2 at 90%, confirming acute hypoxemic respiratory failure and further contributing to a SOFA score of +1 to +2 points</span>.</p>

<p>Conclusion for Severe Sepsis: The coexistence of AKI and acute respiratory failure demonstrates a SOFA score increase of at least 2 points, confirming severe sepsis.</p>

<p>[Argument 3 — in progress]</p>

<p>Based on the patient's documented clinical course and supporting evidence, the diagnoses of A41.9, R65.20, and J96.21 were appropriately assigned. We respectfully request the reconsideration of this claim under the originally submitted DRG 871.</p>

<p>Respectfully,</p>

<p>Dr. Jane Smith<br>
Medical Director<br>
Sunny Valley Hospital<br>
Phone: (123) 456-7890<br>
Email: jane.smith@sunnyvalleyhospital.com</p>

<p>Please return all correspondence to<br>
Sunny Valley Hospital<br>
1234 Sunshine Boulevard<br>
Pleasantville, ST 12345</p>
`;

const MOCK_LETTER_V3 = MOCK_APPEAL_LETTER;

// Inline diff version — sentence-level tracked changes in Argument 1 paragraph
const INLINE_DIFF_CONTENT = `<p>Sunny Valley Hospital<br>
1234 Sunshine Boulevard<br>
Pleasantville, ST 12345</p>

<p>03/17/2026</p>

<p>Wellcare<br>
Wellcare Medicare Advantage<br>
Grievance and Appeals Department<br>
P.O. Box 4000<br>
Farmington, MO 63640</p>

<p>Dear Reviewer,</p>

<p>This is a request for reconsideration of Ms. Susan A. Smith's denied claim for services provided at Sunny Valley Hospital. The following response addresses the denial issued by Wellcare, specifically the reassignment of DRG 871 to 194, and substantiates the ICD-10-CM codes that support the appropriate DRG assignment.</p>

<p>Beneficiary Name: Susan A. Smith<br>
Date of Birth: 01/15/1965<br>
Member ID Number: ABC123456789<br>
Claim Number: 1234567890<br>
Patient Account Number: 1010026790<br>
Claim Dates of Service: 06/01/2024 to 06/05/2024<br>
Diagnosis in Question: ICD-10-CM codes A41.9, R65.20, J96.21</p>

<p>Reason(s) for Denial: Insufficient clinical documentation to support diagnosis.<br>
DRG Change: Reassignment from DRG 871 to DRG 194.</p>

<p>Sunny Valley Hospital respectfully disagrees with the reviewer's conclusion disputing the appropriateness of the principal and secondary diagnoses of A41.9, R65.20, and J96.21, prompting a reassignment of the DRG.</p>

<p><span style="background-color:#E3F2FD; border-radius:2px; padding:0 2px">Ms. Smith, a 64-year-old female, was admitted to Sunny Valley Hospital with suspected sepsis necessitating broad-spectrum IV antibiotics, including vancomycin, cefepime, and metronidazole</span>. During her hospitalization, Ms. Smith displayed clear clinical signs and symptoms consistent with sepsis, severe sepsis, and acute respiratory failure.</p>

<p>Argument 1: The Principal Diagnosis of Sepsis (A41.9) is Clinically Validated</p>

<p><del style="color:#B91C1C;background-color:#FEF2F2;text-decoration:line-through;border-radius:2px;padding:0 1px">Ms. Smith's urine culture confirmed the presence of infection; she exhibited multiple SIRS criteria: temperature dysregulation (Temp: 38.1°C and 35.6°C) and persistent tachypnea (Resp: 24–25), alongside elevated leukocytosis (WBC consistently >12,000/mm³).</del> <ins style="color:#166534;background-color:#F0FDF4;text-decoration:none;border-radius:2px;padding:0 1px">Ms. Smith's urine culture returned positive for E. coli, confirming a documented infectious source. She met three of four SIRS criteria on admission: temperature dysregulation (Temp: 38.1°C), persistent tachypnea (Resp: 24–25 breaths/min), and leukocytosis (WBC 14,200/mm³, rising to 18,600/mm³ by Day 2).</ins></p>

<p><del style="color:#B91C1C;background-color:#FEF2F2;text-decoration:line-through;border-radius:2px;padding:0 1px">Conclusion for Sepsis: The documented confirmed infection and systemic response clinically validate the sepsis diagnosis as the primary reason for admission.</del> <ins style="color:#166534;background-color:#F0FDF4;text-decoration:none;border-radius:2px;padding:0 1px">Conclusion for Sepsis: Wellcare's denial cites insufficient documentation; however, the confirmed E. coli infection, three SIRS criteria, and the attending physician's explicit sepsis diagnosis satisfy the ICD-10-CM clinical validation standard for A41.9.</ins></p>

<p>Argument 2: The Secondary Diagnosis of Severe Sepsis (R65.20) is Supported by Clear Evidence of Acute Organ Dysfunction</p>

<p><span style="background-color:#E3F2FD; border-radius:2px; padding:0 2px">Ms. Smith's serum creatinine increased from baseline, indicating AKI. Ms. Smith required significant oxygen support (5 L/min via simple face mask) to maintain SpO2 at 90%, confirming acute hypoxemic respiratory failure and further contributing to a SOFA score of +1 to +2 points</span>.</p>

<p>Conclusion for Severe Sepsis: The coexistence of AKI and acute respiratory failure demonstrates a SOFA score increase of at least 2 points, confirming severe sepsis.</p>

<p>[Argument 3 — in progress]</p>

<p>Based on the patient's documented clinical course and supporting evidence, the diagnoses of A41.9, R65.20, and J96.21 were appropriately assigned. We respectfully request the reconsideration of this claim under the originally submitted DRG 871.</p>

<p>Respectfully,</p>

<p>Dr. Jane Smith<br>
Medical Director<br>
Sunny Valley Hospital<br>
Phone: (123) 456-7890<br>
Email: jane.smith@sunnyvalleyhospital.com</p>

<p>Please return all correspondence to<br>
Sunny Valley Hospital<br>
1234 Sunshine Boulevard<br>
Pleasantville, ST 12345</p>
`;

const MOCK_VERSIONS = [
  { id: 'v1', label: 'Version 1', time: '9:45 AM on Mar 17, 2026',  author: 'SmarterDx', isCurrentDraft: false, content: MOCK_LETTER_V1 },
  { id: 'v2', label: 'Version 2', time: '10:01 AM on Mar 17, 2026', author: 'SmarterDx', isCurrentDraft: true,  content: MOCK_LETTER_V2 },
];

// ─── Worklist data mapping ────────────────────────────────────────────────────

function isoToMDY(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y}`;
}

function todayFormatted() {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function stateToDisplayStatus(state) {
  switch (state) {
    case 'Queue':
    case 'InProgress': return 'Ready for Review'
    case 'Submitted':  return 'Submitted'
    case 'Overturned': return 'Overturned'
    case 'Closed':     return 'Will Not Submit'
    case 'Archive':    return 'Archived'
    default:           return 'Ready for Review'
  }
}

function buildCaseOverrides(record) {
  if (!record) return {};
  const levelMap = { L1: 'Level 1', L2: 'Level 2', L3: 'Level 3' };
  return {
    patientName: record.patient.name,
    har: record.claim.har,
    mrn: record.patient.mrn,
    claimNumber: record.claim.claimId,
    payer: record.payer,
    type: record.denialType,
    denialDate: isoToMDY(record.createdAt),
    appealDeadline: isoToMDY(record.deadline),
    totalBilledAmount: record.deniedAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
    level: levelMap[record.appealLevel] ?? 'Level 1',
    denialDescription: record.denialType + (record.denialSubtype ? ': ' + record.denialSubtype : ''),
    status: stateToDisplayStatus(record.state),
    submittedDate: (record.state === 'Submitted' || record.state === 'Overturned') ? todayFormatted() : null,
    overturnedDate: record.state === 'Overturned' ? todayFormatted() : null,
  };
}

// ─── State & Reducer ─────────────────────────────────────────────────────────

const initialState = {
  caseData: MOCK_CASE,
  letter: {
    content: MOCK_VERSIONS.find(v => v.isCurrentDraft)?.content ?? MOCK_VERSIONS[MOCK_VERSIONS.length - 1].content,
    isDirty: false,
    versions: MOCK_VERSIONS,
  },
  activity: {
    byLevel: MOCK_ACTIVITY_BY_LEVEL,
    activeLevel: 'Level 2',
  },
  comments: MOCK_COMMENTS,
  aiEdit: {
    status: 'idle', // 'idle' | 'loading' | 'pending-review'
    prompt: '',
    uploadedDocs: [],
    pendingContent: null,
    preEditContent: null,
  },
  ui: {
    historyOpen: true,
    commentsOpen: true,
    caseMenuAnchor: null,
    letterMenuAnchor: null,
    levelMenuAnchor: null,
    statusMenuAnchor: null,
    deleteDialogOpen: false,
    remarksExpanded: false,
    snackbar: { open: false, message: '' },
    view: 'case',
    hasAttachments: false,
    inlineEditPanelOpen: false,
  },
};

function getNow() {
  return new Date().toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true, timeZoneName: 'short',
  });
}

function statusFromAction(action, current) {
  switch (action) {
    case 'Submit':                   return 'Submitted';
    case 'Will Not Submit':          return 'Will Not Submit';
    case 'Archive':                  return 'Archived';
    case 'Complete Review':          return 'Ready to Submit';
    case 'Overturned':               return 'Overturned';
    case 'Upheld - Will Appeal':     return 'Ready for Review';
    case 'Upheld - Will Not Appeal': return 'Will Not Submit';
    case 'Remove Outcome':           return 'Submitted';
    case 'Return to Review':         return 'Ready for Review';
    default:                         return current;
  }
}

function bumpVersionTime(timeStr) {
  const match = timeStr.match(/^(\d+):(\d+) (AM|PM) on (.+)$/);
  if (!match) return timeStr;
  const [, hStr, mStr, ampm, rest] = match;
  let totalMins = parseInt(hStr) * 60 + parseInt(mStr);
  if (ampm === 'PM' && parseInt(hStr) !== 12) totalMins += 12 * 60;
  if (ampm === 'AM' && parseInt(hStr) === 12) totalMins -= 12 * 60;
  totalMins += 4;
  const h = Math.floor(totalMins / 60) % 24;
  const m = totalMins % 60;
  const newAmpm = h < 12 ? 'AM' : 'PM';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${String(m).padStart(2, '0')} ${newAmpm} on ${rest}`;
}

const AI_EDIT_RESET = { status: 'idle', prompt: '', uploadedDocs: [], pendingContent: null, preEditContent: null };

function reducer(state, action) {
  const now = getNow();
  switch (action.type) {
    case 'SET_STATUS': {
      const newStatus = statusFromAction(action.payload, state.caseData.status);
      const today = todayFormatted();
      const submittedDate = newStatus === 'Submitted' ? today : state.caseData.submittedDate;
      const overturnedDate = newStatus === 'Overturned' ? today : (newStatus === 'Submitted' ? null : state.caseData.overturnedDate);
      return {
        ...state,
        caseData: { ...state.caseData, status: newStatus, submittedDate, overturnedDate },
        ui: { ...state.ui, statusMenuAnchor: null },
      };
    }
    case 'SET_LEVEL':
      return { ...state, caseData: { ...state.caseData, level: action.payload }, ui: { ...state.ui, levelMenuAnchor: null } };
    case 'SET_RATING':
      return { ...state, caseData: { ...state.caseData, rating: action.payload } };
    case 'SET_APPEAL_DEADLINE':
      return { ...state, caseData: { ...state.caseData, appealDeadline: action.payload } };
    case 'SET_LETTER_DIRTY':
      return { ...state, letter: { ...state.letter, isDirty: true } };
    case 'SAVE_LETTER': {
      const currentDraft = state.letter.versions.find(v => v.isCurrentDraft);
      const baseVersionId = currentDraft?.isCheckpoint ? currentDraft.baseVersionId : currentDraft?.id;
      const newCheckpoint = {
        id: `${baseVersionId}_s${Date.now()}`,
        label: currentDraft.label,
        time: bumpVersionTime(currentDraft.time),
        author: 'Krista Soriano',
        isCurrentDraft: true,
        isCheckpoint: true,
        baseVersionId,
        content: action.payload,
      };
      const updatedVersions = state.letter.versions.map(v => ({ ...v, isCurrentDraft: false }));
      return {
        ...state,
        letter: {
          ...state.letter,
          isDirty: false,
          content: action.payload,
          versions: [...updatedVersions, newCheckpoint],
        },
      };
    }
    case 'START_CREATE_VERSION':
      return { ...state, ui: { ...state.ui, view: 'generating-version', hasAttachments: action.payload?.hasAttachments ?? false, letterMenuAnchor: null } };
    case 'VERSION_GENERATED': {
      const n = state.letter.versions.filter(v => !v.isCheckpoint).length + 1;
      const totalMins = 569 + n * 16;
      const h = Math.floor(totalMins / 60);
      const m = totalMins % 60;
      const ampm = h < 12 ? 'AM' : 'PM';
      const displayH = h > 12 ? h - 12 : h;
      const time = `${displayH}:${String(m).padStart(2, '0')} ${ampm} on Mar 17, 2026`;
      const newVersion = {
        id: `v${n}`,
        label: `Version ${n}`,
        time,
        author: 'SmarterDx',
        isCurrentDraft: true,
        content: state.letter.content,
      };
      const updatedVersions = state.letter.versions.map(v => ({ ...v, isCurrentDraft: false }));
      const newEntry = { id: Date.now(), action: 'Appeal is Ready for Review', date: '2026-03-17', user: 'SmarterDx', hasAppealLink: true };
      return {
        ...state,
        letter: { ...state.letter, versions: [...updatedVersions, newVersion], isDirty: false },
        activity: {
          ...state.activity,
          byLevel: {
            ...state.activity.byLevel,
            'Level 2': [...state.activity.byLevel['Level 2'], newEntry],
          },
        },
        ui: { ...state.ui, view: 'case' },
      };
    }
    case 'ADD_COMMENT': {
      const c = { id: Date.now(), ts: now, user: 'Krista Soriano', text: action.payload };
      return { ...state, comments: [c, ...state.comments] };
    }
    case 'SET_ACTIVITY_LEVEL':
      return { ...state, activity: { ...state.activity, activeLevel: action.payload } };
    case 'TOGGLE_HISTORY':
      return { ...state, ui: { ...state.ui, historyOpen: !state.ui.historyOpen } };
    case 'TOGGLE_COMMENTS':
      return { ...state, ui: { ...state.ui, commentsOpen: !state.ui.commentsOpen } };
    case 'TOGGLE_REMARKS':
      return { ...state, ui: { ...state.ui, remarksExpanded: !state.ui.remarksExpanded } };
    case 'OPEN_CASE_MENU':
      return { ...state, ui: { ...state.ui, caseMenuAnchor: action.payload } };
    case 'CLOSE_CASE_MENU':
      return { ...state, ui: { ...state.ui, caseMenuAnchor: null } };
    case 'OPEN_LETTER_MENU':
      return { ...state, ui: { ...state.ui, letterMenuAnchor: action.payload } };
    case 'CLOSE_LETTER_MENU':
      return { ...state, ui: { ...state.ui, letterMenuAnchor: null } };
    case 'OPEN_LEVEL_MENU':
      return { ...state, ui: { ...state.ui, levelMenuAnchor: action.payload } };
    case 'CLOSE_LEVEL_MENU':
      return { ...state, ui: { ...state.ui, levelMenuAnchor: null } };
    case 'OPEN_STATUS_MENU':
      return { ...state, ui: { ...state.ui, statusMenuAnchor: action.payload } };
    case 'CLOSE_STATUS_MENU':
      return { ...state, ui: { ...state.ui, statusMenuAnchor: null } };
    case 'NAV_TO_EDIT':
      return { ...state, ui: { ...state.ui, view: 'edit', caseMenuAnchor: null } };
    case 'OPEN_INLINE_EDIT_PANEL':
      return { ...state, ui: { ...state.ui, inlineEditPanelOpen: true, caseMenuAnchor: null } };
    case 'CLOSE_INLINE_EDIT_PANEL':
      return { ...state, ui: { ...state.ui, inlineEditPanelOpen: false } };
    case 'NAV_TO_CASE':
      return { ...state, ui: { ...state.ui, view: 'case' } };
    case 'NAV_TO_VERSION_HISTORY':
      return { ...state, ui: { ...state.ui, view: 'version-history', letterMenuAnchor: null } };
    case 'RESTORE_VERSION':
      return {
        ...state,
        letter: {
          ...state.letter,
          content: action.payload.content,
          isDirty: false,
          versions: state.letter.versions.map(v => ({ ...v, isCurrentDraft: v.id === action.payload.versionId })),
        },
        ui: { ...state.ui, view: 'restoring' },
      };
    case 'RESTORE_COMPLETE':
      return { ...state, ui: { ...state.ui, view: 'case' } };
    case 'DELETE_VERSION':
      return {
        ...state,
        letter: {
          ...state.letter,
          versions: state.letter.versions.filter(v => v.id !== action.payload),
        },
      };
    case 'SAVE_DENIAL_DETAILS':
      return { ...state, ui: { ...state.ui, view: 'regenerating', caseMenuAnchor: null } };
    case 'REGEN_COMPLETE':
      return { ...state, ui: { ...state.ui, view: 'case' } };
    case 'OPEN_DELETE_DIALOG':
      return { ...state, ui: { ...state.ui, deleteDialogOpen: true, caseMenuAnchor: null } };
    case 'CLOSE_DELETE_DIALOG':
      return { ...state, ui: { ...state.ui, deleteDialogOpen: false } };
    case 'CONFIRM_DELETE':
      return { ...state, caseData: { ...state.caseData, status: 'Archived' }, ui: { ...state.ui, deleteDialogOpen: false } };
    case 'SHOW_SNACKBAR':
      return { ...state, ui: { ...state.ui, snackbar: { open: true, message: action.payload } } };
    case 'HIDE_SNACKBAR':
      return { ...state, ui: { ...state.ui, snackbar: { open: false, message: '' } } };

    // ── AI Edit cases ──────────────────────────────────────────────────────────
    case 'SET_AI_PROMPT':
      return { ...state, aiEdit: { ...state.aiEdit, prompt: action.payload } };
    case 'ADD_UPLOADED_DOC':
      return { ...state, aiEdit: { ...state.aiEdit, uploadedDocs: [...state.aiEdit.uploadedDocs, action.payload] } };
    case 'REMOVE_UPLOADED_DOC':
      return { ...state, aiEdit: { ...state.aiEdit, uploadedDocs: state.aiEdit.uploadedDocs.filter((_, i) => i !== action.payload) } };
    case 'START_AI_EDIT':
      return {
        ...state,
        aiEdit: {
          ...state.aiEdit,
          status: 'loading',
          preEditContent: state.letter.content,
          pendingContent: null,
        },
      };
    case 'AI_EDIT_COMPLETE':
      return {
        ...state,
        aiEdit: {
          ...state.aiEdit,
          status: 'pending-review',
          pendingContent: action.payload,
        },
      };
    case 'ACCEPT_AI_EDIT': {
      // Strip diff markup: remove <del> blocks, unwrap <ins>, strip <mark>
      const stripped = (state.aiEdit.pendingContent || '')
        .replace(/<del[^>]*>[\s\S]*?<\/del>/g, '')
        .replace(/<\/?ins[^>]*>/g, '')
        .replace(/<\/?mark[^>]*>/g, '');
      // SAVE_LETTER logic — create a checkpoint
      const currentDraft = state.letter.versions.find(v => v.isCurrentDraft);
      const baseVersionId = currentDraft?.isCheckpoint ? currentDraft.baseVersionId : currentDraft?.id;
      const newCheckpoint = {
        id: `${baseVersionId}_s${Date.now()}`,
        label: currentDraft.label,
        time: bumpVersionTime(currentDraft.time),
        author: 'Krista Soriano',
        isCurrentDraft: true,
        isCheckpoint: true,
        baseVersionId,
        content: stripped,
      };
      const updatedVersions = state.letter.versions.map(v => ({ ...v, isCurrentDraft: false }));
      return {
        ...state,
        letter: {
          ...state.letter,
          isDirty: false,
          content: stripped,
          versions: [...updatedVersions, newCheckpoint],
        },
        aiEdit: AI_EDIT_RESET,
        ui: { ...state.ui, snackbar: { open: true, message: 'AI changes accepted and saved.' } },
      };
    }
    case 'REJECT_AI_EDIT':
      return {
        ...state,
        letter: {
          ...state.letter,
          content: state.aiEdit.preEditContent ?? state.letter.content,
          isDirty: false,
        },
        aiEdit: AI_EDIT_RESET,
        ui: { ...state.ui, snackbar: { open: true, message: 'Changes rejected — letter restored.' } },
      };

    default:
      return state;
  }
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function viewDenialInNewTab() {
  const tab = window.open('', '_blank');
  if (tab) { tab.document.write(MOCK_DENIAL_LETTER_HTML); tab.document.close(); }
}

// ─── generateScopedDelta ──────────────────────────────────────────────────────
// When the user has a text selection, find that paragraph and apply a targeted
// del/ins transform instead of replacing the whole letter.

function detectIntent(lower) {
  if (/\b(shorter|shorten|concise|condense|trim|brief|simplify|tighten)\b/.test(lower)) return 'shorter';
  if (/\b(stronger|strengthen|bolder|forceful|emphatic|aggressive)\b/.test(lower)) return 'stronger';
  if (/\b(emphasize|highlight|stress|reinforce|key point|important)\b/.test(lower)) return 'emphasize';
  if (/\b(rewrite|rephrase|reword|differently|alternative)\b/.test(lower)) return 'rewrite';
  return 'shorter'; // sensible default
}

function generateScopedDelta(prompt, selectedText, currentContent) {
  const intent = detectIntent(prompt.toLowerCase());
  const search = selectedText.trim().slice(0, 55);
  if (!search) return null;

  const temp = document.createElement('div');
  temp.innerHTML = currentContent;

  // Find the paragraph whose plain text contains the selection
  let targetP = null;
  for (const p of temp.querySelectorAll('p')) {
    const text = p.textContent.trim();
    if (text.length < 30) continue; // skip headings / short labels
    if (text.includes(search) || search.includes(text.slice(0, 40))) {
      targetP = p;
      break;
    }
  }
  if (!targetP) return null;

  // Find a pre-written transform for this paragraph
  const paraText = targetP.textContent.trim();
  const transform = SCOPE_TRANSFORMS.find(t => paraText.includes(t.match));
  if (!transform) return null;

  const modifiedText = transform.intents[intent] ?? transform.intents.shorter;
  const originalHtml = targetP.innerHTML;
  targetP.innerHTML =
    `<del style="${DEL_STYLE}">${originalHtml}</del> ` +
    `<ins style="${INS_STYLE}">${modifiedText}</ins>`;

  return temp.innerHTML;
}

// ─── runFakeAiEdit ────────────────────────────────────────────────────────────

function runFakeAiEdit(prompt, uploadedDocs, selectedText, currentContent, dispatch) {
  dispatch({ type: 'START_AI_EDIT' });

  const useScoped = selectedText && selectedText.trim().length > 0;
  const delayMs = useScoped ? 2000 : null;

  const lower = prompt.toLowerCase();
  const scenario = AI_EDIT_SCENARIOS.find(s =>
    s.promptMatch.length > 0 && s.promptMatch.some(kw => lower.includes(kw))
  ) || AI_EDIT_SCENARIOS[AI_EDIT_SCENARIOS.length - 1];

  setTimeout(() => {
    if (useScoped) {
      const scopedDelta = generateScopedDelta(prompt, selectedText, currentContent);
      if (scopedDelta) {
        dispatch({ type: 'AI_EDIT_COMPLETE', payload: scopedDelta });
        return;
      }
    }
    dispatch({ type: 'AI_EDIT_COMPLETE', payload: scenario.delta });
  }, useScoped ? delayMs : scenario.delayMs);
}

// ─── AppNav ───────────────────────────────────────────────────────────────────

function AppNav() {
  return (
    <Box sx={{ height: 48, bgcolor: '#fff', borderBottom: '1px solid #EEEEEE', display: 'flex', alignItems: 'stretch', px: 3, flexShrink: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', pr: 4 }}>
        <Box component="img" src="/smarterdx_logo.webp" alt="SmarterDx" sx={{ height: 14, display: 'block' }} />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
        <Box
          sx={{
            display: 'flex', alignItems: 'center',
            px: 2, pt: '12px', pb: '16px',
            borderBottom: '2px solid #1976D2',
            cursor: 'pointer',
          }}
        >
          <Typography sx={{ color: '#1976D2', fontWeight: 500, fontSize: '0.875rem' }}>
            Cases
          </Typography>
        </Box>
      </Box>
      <Box sx={{ flex: 1 }} />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        <Box sx={{
          width: 30, height: 30, borderRadius: '50%', bgcolor: '#43A047',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <PersonIcon sx={{ color: '#fff', fontSize: 18 }} />
        </Box>
        <KeyboardArrowDownIcon sx={{ color: '#9E9E9E', fontSize: 18 }} />
      </Box>
    </Box>
  );
}

// ─── StarRating ───────────────────────────────────────────────────────────────

function StarRating({ rating, onChange }) {
  const [hovered, setHovered] = useState(null);
  const display = hovered !== null ? hovered : rating;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map((star) =>
        star <= display ? (
          <StarIcon
            key={star}
            onClick={() => onChange(star === rating ? 0 : star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(null)}
            sx={{ fontSize: 18, color: '#FFB400', cursor: 'pointer' }}
          />
        ) : (
          <StarBorderIcon
            key={star}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(null)}
            sx={{ fontSize: 18, color: '#BDBDBD', cursor: 'pointer', '&:hover': { color: '#FFB400' } }}
          />
        )
      )}
    </Box>
  );
}

// ─── CaseHeader ──────────────────────────────────────────────────────────────

function CaseHeader({ state, dispatch, onBack = () => {}, onStatusMenuClick = null, useInlineEditPanel = false, onEditDenialDetails = null }) {
  const { caseData, ui } = state;
  const statusCfg = STATUS_CONFIG[caseData.status] || STATUS_CONFIG.Archived;
  const ratingLabel = RATING_LABELS[caseData.rating] || 'Needs Rating';

  return (
    <Box sx={{ bgcolor: '#fff', px: 3, pt: 1.5, pb: 2, flexShrink: 0, borderBottom: '1px solid #E0E0E0' }}>

      {/* Breadcrumb */}
      <Button
        onClick={onBack}
        startIcon={<ChevronLeftIcon sx={{ fontSize: '16px !important', mr: '-4px' }} />}
        sx={{
          fontSize: '0.875rem',
          p: 0, minWidth: 0, mb: 0.75,
        }}
      >
        Back to Worklist
      </Button>

      {/* Row: patient name (left) + pills + btn (right) */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 0.5 }}>
        <Typography sx={{ fontWeight: 500, fontSize: '1.4375rem', color: '#272727', lineHeight: 1.35, letterSpacing: '-0.01em' }}>
          {caseData.patientName}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, pt: '3px' }}>
          {/* Deadline chip */}
          <Chip
            label={`Deadline: ${caseData.appealDeadline}`}
            variant="outlined"
            size="medium"
            sx={{
              borderColor: '#0288D1',
              color: '#0288D1',
              borderRadius: '100px',
              height: 32,
              fontWeight: 500,
              fontSize: '0.8125rem',
            }}
          />

          {/* Level pill — no down caret */}
          <Button
            size="small"
            onClick={(e) => dispatch({ type: 'OPEN_LEVEL_MENU', payload: e.currentTarget })}
            sx={{
              bgcolor: 'rgba(0,0,0,0.08)', borderRadius: '16px',
              color: '#455A64', fontWeight: 500, fontSize: '0.8125rem',
              border: 'none', px: 1.5, height: 32, minWidth: 0,
              '&:hover': { bgcolor: 'rgba(0,0,0,0.12)', border: 'none' },
            }}
          >
            {caseData.level}
          </Button>

          {/* Status pill */}
          <Button
            size="small"
            endIcon={<ArrowDropDownIcon sx={{ fontSize: '18px !important', ml: '-4px' }} />}
            onClick={(e) => dispatch({ type: 'OPEN_STATUS_MENU', payload: e.currentTarget })}
            sx={{
              bgcolor: statusCfg.bg, color: statusCfg.color, borderRadius: '16px',
              fontWeight: 600, fontSize: '0.8125rem', px: 1.5, height: 32, minWidth: 0,
              border: 'none', '&:hover': { bgcolor: statusCfg.bg, filter: 'brightness(0.96)', border: 'none' },
            }}
          >
            {caseData.status}
          </Button>

          {/* More options */}
          <Tooltip title="More options">
            <IconButton
              size="small"
              onClick={(e) => dispatch({ type: 'OPEN_CASE_MENU', payload: e.currentTarget })}
              sx={{
                width: 32, height: 32,
                border: '1px solid rgba(25, 118, 210, 0.5)', borderRadius: '4px',
                color: '#1976D2', '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.04)' },
              }}
            >
              <MoreHorizIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Row: stars + rating label + timestamp */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StarRating
            rating={caseData.rating}
            onChange={(val) => dispatch({ type: 'SET_RATING', payload: val })}
          />
          <Typography sx={{ color: '#616161', fontFamily: 'Archivo, sans-serif', fontSize: '0.706rem', fontWeight: 500 }}>
            {ratingLabel}
          </Typography>
          <Typography
            sx={{ color: 'var(--colors-interactive-ghost-text)', fontFamily: 'Archivo, sans-serif', fontSize: '0.706rem', fontWeight: 500, cursor: 'pointer', '&:hover': { color: 'var(--colors-interactive-hover-ghost-text)' } }}
          >
            Add comment
          </Typography>
        </Box>

        <Typography sx={{ color: '#616161', fontSize: '0.7875rem', fontWeight: 400, pt: '3px' }}>
          Started {caseData.startedAt}, by {caseData.startedBy}
        </Typography>
      </Box>

      {/* ── Level Menu ── */}
      <Menu anchorEl={ui.levelMenuAnchor} open={Boolean(ui.levelMenuAnchor)} onClose={() => dispatch({ type: 'CLOSE_LEVEL_MENU' })} PaperProps={{ sx: { minWidth: 140 } }}>
        {LEVEL_OPTIONS.map((l) => (
          <MenuItem key={l} selected={l === caseData.level} onClick={() => dispatch({ type: 'SET_LEVEL', payload: l })} sx={{ fontSize: '0.875rem' }}>
            {l}
          </MenuItem>
        ))}
      </Menu>

      {/* ── Status Menu ── */}
      <Menu anchorEl={ui.statusMenuAnchor} open={Boolean(ui.statusMenuAnchor)} onClose={() => dispatch({ type: 'CLOSE_STATUS_MENU' })} PaperProps={{ sx: { minWidth: 220 } }}>
        {(caseData.status === 'Submitted'
          ? ['Overturned', 'Upheld - Will Appeal', 'Upheld - Will Not Appeal', 'Will Not Submit', 'Return to Review']
          : caseData.status === 'Overturned'
          ? ['Upheld - Will Not Appeal', 'Upheld - Will Appeal', 'Remove Outcome', 'Return to Review']
          : STATUS_WORKFLOW_ACTIONS.filter(a => !(a === 'Retry Letter' && caseData.status === 'Ready for Review'))
        ).map((a) => (
            <MenuItem
              key={a}
              onClick={() => {
                dispatch({ type: 'CLOSE_STATUS_MENU' })
                if (onStatusMenuClick) {
                  onStatusMenuClick(a)
                } else {
                  dispatch({ type: 'SET_STATUS', payload: a })
                }
              }}
              sx={{
                fontSize: '0.875rem',
                color: (a === 'Upheld - Will Not Appeal' || a === 'Will Not Submit') ? '#616161' : undefined,
              }}
            >
              {a}
            </MenuItem>
          ))}
      </Menu>

      {/* ── Case Overflow Menu ── */}
      <Menu anchorEl={ui.caseMenuAnchor} open={Boolean(ui.caseMenuAnchor)} onClose={() => dispatch({ type: 'CLOSE_CASE_MENU' })} PaperProps={{ sx: { minWidth: 210 } }}>
        <MenuItem onClick={() => { dispatch({ type: 'CLOSE_CASE_MENU' }); window.open(window.location.href, '_blank'); }} sx={{ fontSize: '0.875rem' }}>
          <ListItemIcon><OpenInNewIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Open denial in new tab</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          dispatch({ type: 'CLOSE_CASE_MENU' });
          if (onEditDenialDetails) onEditDenialDetails();
          else dispatch({ type: useInlineEditPanel ? 'OPEN_INLINE_EDIT_PANEL' : 'NAV_TO_EDIT' });
        }} sx={{ fontSize: '0.875rem' }}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Edit denial details</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => dispatch({ type: 'OPEN_DELETE_DIALOG' })} sx={{ fontSize: '0.875rem', color: 'error.main' }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete denial</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}

// ─── CaseInfoPanel ────────────────────────────────────────────────────────────

function CaseInfoPanel({ caseData, drgCodes, ui, dispatch }) {
  const IDENTIFIERS = [
    { label: 'HAR',             value: caseData.har },
    { label: 'MRN',             value: caseData.mrn },
    { label: 'Visit ID',        value: caseData.visitId },
    { label: 'Patient Account', value: caseData.patientAccount },
    { label: 'Discharged',      value: caseData.dischargeDate },
    { label: 'Location',        value: caseData.location },
    { label: 'Total Charge',    value: caseData.totalBilledAmount },
    ...(caseData.submittedDate ? [{ label: 'Submitted', value: caseData.submittedDate }] : []),
    ...(caseData.overturnedDate ? [{ label: 'Overturned', value: caseData.overturnedDate }] : []),
  ];

  const TRUNCATE_LEN = 160;
  const full = 'Denial Description: ' + caseData.denialDescription + ' Additional Remarks: ' + caseData.additionalRemarks;
  const isTruncatable = full.length > TRUNCATE_LEN;
  const truncated = full.slice(0, TRUNCATE_LEN) + '...';

  return (
    <Box sx={{ display: 'flex', bgcolor: '#fff', px: 1.5, py: 1.5, gap: 1.5, mt: 0, mb: 4 }}>
      {/* Left column: grey card with identifiers */}
      <Box
        sx={{
          width: 240, flexShrink: 0, height: 'fit-content',
          bgcolor: '#F5F5F5', borderRadius: '4px',
          px: 2, py: 1.5,
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          columnGap: '12px',
          rowGap: '2px',
        }}
      >
        {IDENTIFIERS.map(({ label, value }, i) => ([
          <Typography key={`label-${i}`} sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#616161', lineHeight: '17px', whiteSpace: 'nowrap' }}>
            {label}
          </Typography>,
          <Typography key={`value-${i}`} sx={{ fontSize: '0.75rem', color: '#616161', fontWeight: 400, lineHeight: '17px' }}>
            {value || '-'}
          </Typography>,
        ]))}
      </Box>

      {/* Right column: payer + denial reason + DRG codes */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5, pt: 0.5 }}>
        {/* Payer */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline' }}>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#757575', flexShrink: 0 }}>
            Payer
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: 'rgba(0,0,0,0.87)' }}>
            {caseData.payer}
          </Typography>
        </Box>

        {/* Reason for Denial */}
        <Box>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#757575', mb: 0.5 }}>
            Reason for Denial
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: 'rgba(0,0,0,0.87)', lineHeight: 1.5 }}>
            {ui.remarksExpanded ? full : truncated}
            {isTruncatable && (
              <Box
                component="span"
                onClick={() => dispatch({ type: 'TOGGLE_REMARKS' })}
                sx={{ color: 'var(--colors-interactive-ghost-text)', cursor: 'pointer', ml: 0.5, fontSize: '0.8125rem' }}
              >
                {ui.remarksExpanded ? ' View Less' : ' View More'}
              </Box>
            )}
          </Typography>
        </Box>

        {/* DRG Codes — only shown for DRG Downgrade denials */}
        {caseData.type === 'DRG Downgrade' && (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'auto auto 1fr', alignItems: 'start', gap: '12px 16px' }}>
            {drgCodes.map((drg, i) => {
              const isAdded = drg.type === 'added';
              return [
                <Box
                  key={`type-${i}`}
                  sx={{
                    px: 1, py: '6px', borderRadius: '12px',
                    bgcolor: isAdded ? '#D0F0C0' : '#F8D7DA',
                    flexShrink: 0, justifySelf: 'start',
                  }}
                >
                  <Typography sx={{ fontSize: '0.6875rem', fontWeight: 400, color: isAdded ? '#1B5E20' : '#7F1D1D', lineHeight: 1 }}>
                    {isAdded ? 'Added' : 'Removed'}
                  </Typography>
                </Box>,
                <Box
                  key={`code-${i}`}
                  sx={{
                    px: 1, py: '6px', borderRadius: '12px',
                    bgcolor: '#fff', border: '1px solid #BDBDBD', flexShrink: 0, justifySelf: 'start',
                  }}
                >
                  <Typography sx={{ fontSize: '0.6875rem', fontWeight: 500, color: '#333', lineHeight: 1 }}>
                    {drg.code}
                  </Typography>
                </Box>,
                <Typography key={`desc-${i}`} sx={{ fontSize: '0.75rem', color: '#616161', lineHeight: 1.4 }}>
                  {drg.description}
                </Typography>,
              ];
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelativeTime(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes === 1 ? '1 min ago' : `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? '1 hr ago' : `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

// ─── LetterToolbar ────────────────────────────────────────────────────────────

function LetterToolbar({ editorRef, saveStatus, savedAt, versionCount, letterMenuAnchor, onCopy, onCreateVersion, onViewVersionHistory, autosaveEnabled, viewOnly, onToggleAutosave, onToggleViewOnly, onManualSave, dispatch }) {
  const exec = (cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
  };

  const FmtBtn = ({ onClick, children, title }) => (
    <Tooltip title={title} placement="top">
      <IconButton
        size="small"
        onMouseDown={(e) => { e.preventDefault(); onClick(); }}
        sx={{ width: 34, height: 34, borderRadius: '4px', border: '1px solid #D3D3D3', color: '#424242', '&:hover': { bgcolor: '#F5F5F5' } }}
      >
        {children}
      </IconButton>
    </Tooltip>
  );

  return (
    <Box
      sx={{
        display: 'flex', alignItems: 'center', gap: 0.5,
        px: 2, py: 0.75,
        bgcolor: '#fff', borderBottom: '1px solid #EEEEEE',
        flexShrink: 0, flexWrap: 'wrap',
      }}
    >
      <FmtBtn title="Bold" onClick={() => exec('bold')}><FormatBoldIcon sx={{ fontSize: 21 }} /></FmtBtn>
      <FmtBtn title="Italic" onClick={() => exec('italic')}><FormatItalicIcon sx={{ fontSize: 21 }} /></FmtBtn>
      <FmtBtn title="Underline" onClick={() => exec('underline')}><FormatUnderlinedIcon sx={{ fontSize: 21 }} /></FmtBtn>
      <FmtBtn title="Align left" onClick={() => exec('justifyLeft')}><FormatAlignLeftIcon sx={{ fontSize: 21 }} /></FmtBtn>
      <FmtBtn title="Align center" onClick={() => exec('justifyCenter')}><FormatAlignCenterIcon sx={{ fontSize: 21 }} /></FmtBtn>
      <FmtBtn title="Align right" onClick={() => exec('justifyRight')}><FormatAlignRightIcon sx={{ fontSize: 21 }} /></FmtBtn>
      <FmtBtn title="Justify" onClick={() => exec('justifyFull')}><FormatAlignJustifyIcon sx={{ fontSize: 21 }} /></FmtBtn>
      <FmtBtn title="Undo" onClick={() => exec('undo')}><UndoIcon sx={{ fontSize: 21 }} /></FmtBtn>

      <Box sx={{ flex: 1, minWidth: 8 }} />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Save status indicators */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, minWidth: 130 }}>
          {viewOnly ? (
            <Typography sx={{ fontSize: '0.75rem', color: '#9E9E9E', userSelect: 'none' }}>
              Viewing only
            </Typography>
          ) : (
            <>
              {saveStatus === 'saving' && (
                <>
                  <CircularProgress size={12} sx={{ color: '#9E9E9E' }} />
                  <Typography sx={{ fontSize: '0.75rem', color: '#9E9E9E', userSelect: 'none' }}>
                    Saving…
                  </Typography>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <CheckIcon sx={{ fontSize: 14, color: '#9E9E9E' }} />
                  <Typography sx={{ fontSize: '0.75rem', color: '#9E9E9E', userSelect: 'none' }}>
                    Saved {formatRelativeTime(savedAt)}
                  </Typography>
                </>
              )}
              {saveStatus === 'unsaved' && (
                <Typography sx={{ fontSize: '0.75rem', color: '#9E9E9E', userSelect: 'none' }}>
                  Unsaved changes
                </Typography>
              )}
            </>
          )}
        </Box>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />
        {!autosaveEnabled && !viewOnly && (
          <Button
            size="small"
            startIcon={<SaveIcon sx={{ fontSize: '21px !important' }} />}
            onClick={onManualSave}
            variant={saveStatus === 'unsaved' ? 'contained' : 'outlined'}
            sx={{
              fontSize: '0.7rem', px: 1.25, py: '6.5px', height: 34,
            }}
          >
            Save
          </Button>
        )}
        <Button
          size="small"
          startIcon={<ContentCopyIcon sx={{ fontSize: '21px !important' }} />}
          onClick={onCopy}
          variant="outlined"
          sx={{ fontSize: '0.7rem', px: 1.25, py: '6.5px', height: 34 }}
        >
          Copy
        </Button>
        <Button
          size="small"
          startIcon={<AutorenewIcon sx={{ fontSize: '21px !important' }} />}
          onClick={onCreateVersion}
          variant="outlined"
          sx={{ fontSize: '0.7rem', px: 1.25, py: '6.5px', height: 34 }}
        >
          Create New Version
        </Button>
        <IconButton
          size="small"
          onClick={(e) => dispatch({ type: 'OPEN_LETTER_MENU', payload: e.currentTarget })}
          sx={{ border: '1px solid var(--colors-interactive-default-border)', color: 'var(--colors-interactive-ghost-text)', width: 34, height: 34, borderRadius: '4px' }}
        >
          <MoreHorizIcon sx={{ fontSize: 17.5 }} />
        </IconButton>
      </Box>

      <Menu
        anchorEl={letterMenuAnchor}
        open={Boolean(letterMenuAnchor)}
        onClose={() => dispatch({ type: 'CLOSE_LETTER_MENU' })}
        PaperProps={{ sx: { minWidth: 210 } }}
      >
        <MenuItem onClick={() => { dispatch({ type: 'CLOSE_LETTER_MENU' }); window.open(window.location.href, '_blank'); }} sx={{ fontSize: '0.875rem' }}>
          <ListItemIcon><OpenInNewIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Open letter in new tab</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => dispatch({ type: 'CLOSE_LETTER_MENU' })} sx={{ fontSize: '0.875rem' }}>
          <ListItemIcon><PrintIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Print</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => dispatch({ type: 'CLOSE_LETTER_MENU' })} sx={{ fontSize: '0.875rem' }}>
          <ListItemIcon><InsertDriveFileIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Export</ListItemText>
          <ChevronRightIcon sx={{ fontSize: 16, color: '#BDBDBD' }} />
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { dispatch({ type: 'CLOSE_LETTER_MENU' }); onViewVersionHistory(); }} sx={{ fontSize: '0.875rem' }}>
          <ListItemIcon><HistoryIcon fontSize="small" /></ListItemIcon>
          <ListItemText>See version history</ListItemText>
        </MenuItem>
        <Divider />
        <Box sx={{ px: 2, pt: 1, pb: 0.25 }}>
          <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: '#9E9E9E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Editor settings
          </Typography>
        </Box>
        <MenuItem onClick={onToggleAutosave} sx={{ fontSize: '0.875rem', justifyContent: 'space-between', pr: 1 }}>
          <ListItemText>Autosave</ListItemText>
          <Switch size="small" checked={autosaveEnabled} onClick={e => e.stopPropagation()} onChange={onToggleAutosave} />
        </MenuItem>
        <MenuItem onClick={onToggleViewOnly} sx={{ fontSize: '0.875rem', justifyContent: 'space-between', pr: 1 }}>
          <ListItemText>View only</ListItemText>
          <Switch size="small" checked={viewOnly} onClick={e => e.stopPropagation()} onChange={onToggleViewOnly} />
        </MenuItem>
      </Menu>
    </Box>
  );
}

// ─── LetterEditor ─────────────────────────────────────────────────────────────

function LetterEditor({ editorRef, initialContent, onDirty, viewOnly, loading, disabled, onSelectionChange, onFocus, onBlur }) {
  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = initialContent;
  }, []);

  useEffect(() => {
    const handleSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || !editorRef.current) return;
      const anchorNode = sel.anchorNode;
      if (!anchorNode || !editorRef.current.contains(anchorNode)) return;
      const text = sel.toString().trim();
      if (onSelectionChange) onSelectionChange(text);
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  return (
    <Box sx={{ bgcolor: '#F6F8FA', px: 3, py: 2.5 }}>
      <style>{`
        [data-letter-editor] mark {
          background-color: #EDE9FE;
          color: inherit;
          border-radius: 2px;
          padding: 0 1px;
        }
        [data-letter-editor] del {
          color: #B91C1C;
          background-color: #FEF2F2;
          text-decoration: line-through;
          border-radius: 2px;
          padding: 0 1px;
        }
        [data-letter-editor] ins {
          color: #166534;
          background-color: #F0FDF4;
          text-decoration: none;
          border-radius: 2px;
          padding: 0 1px;
        }
      `}</style>
      <Box
        sx={{
          bgcolor: '#fff',
          border: '1px solid #D3D3D3',
          borderRadius: '2px',
          px: '20px', py: '14px',
          maxWidth: 820,
          mx: 'auto',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        <div
          ref={editorRef}
          data-letter-editor
          contentEditable={!viewOnly && !disabled && !loading}
          suppressContentEditableWarning
          onInput={(viewOnly || disabled || loading) ? undefined : onDirty}
          onFocus={onFocus}
          onBlur={onBlur}
          style={{
            fontFamily: 'Roboto, sans-serif',
            fontSize: '14px',
            lineHeight: '1.5',
            color: '#616161',
            outline: 'none',
            minHeight: 560,
          }}
        />
      </Box>

      <Typography sx={{ color: '#6E6E6E', fontSize: '0.75rem', fontStyle: 'italic', mt: 2, textAlign: 'center' }}>
        AI-generated rationale; please review for accuracy and completeness
      </Typography>
    </Box>
  );
}

// ─── AiChangesActionBar ───────────────────────────────────────────────────────

function AiChangesActionBar({ onAccept, onReject }) {
  return (
    <Box
      sx={{
        display: 'flex', alignItems: 'center', gap: 1,
        px: 2, py: 0.875,
        bgcolor: '#FFFFFF',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        flexShrink: 0,
      }}
    >
      <Typography sx={{ flex: 1, fontSize: '0.8125rem', color: 'rgba(0,0,0,0.87)', fontWeight: 500 }}>
        Review AI-suggested changes. Highlighted sections have been modified
      </Typography>
      <Button
        size="small"
        variant="outlined"
        onClick={onReject}
        startIcon={<DeleteIcon sx={{ fontSize: '14px !important' }} />}
        sx={{ fontSize: '0.75rem', px: 1.5, height: 30, flexShrink: 0 }}
      >
        Reject
      </Button>
      <Button
        size="small"
        variant="contained"
        onClick={onAccept}
        sx={{ fontSize: '0.75rem', px: 1.5, height: 30, flexShrink: 0 }}
      >
        Accept &amp; Save
      </Button>
    </Box>
  );
}

// ─── UploadedDocChips ─────────────────────────────────────────────────────────

function UploadedDocChips({ docs, onRemove }) {
  if (!docs.length) return null;
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, px: 2, pt: 0.75, pb: 0.25 }}>
      {docs.map((doc, i) => (
        <Chip
          key={i}
          label={doc.name}
          size="small"
          icon={<InsertDriveFileIcon sx={{ fontSize: '14px !important' }} />}
          onDelete={() => onRemove(i)}
          sx={{
            fontSize: '0.75rem', height: 26,
            bgcolor: '#E3F2FD', color: '#1565C0',
            '& .MuiChip-icon': { color: '#1565C0' },
            '& .MuiChip-deleteIcon': { fontSize: 14, color: '#1565C0', '&:hover': { color: '#0D47A1' } },
          }}
        />
      ))}
    </Box>
  );
}


// ─── AiPromptBar ─────────────────────────────────────────────────────────────

function AiPromptBar({ prompt, onPromptChange, uploadedDocs, onAddDoc, onRemoveDoc, onSubmit, loading, pendingReview, onAccept, onReject, selectedText, onClearSelection }) {
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (pendingReview) setFocused(false);
  }, [pendingReview]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading && prompt.trim()) onSubmit();
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(f => onAddDoc(f));
    e.target.value = '';
  };

  const scopeLabel = selectedText
    ? `${selectedText.slice(0, 200)}${selectedText.length > 200 ? '…' : ''}`
    : null;

  return (
    <Box
      ref={containerRef}
      onFocus={() => { if (!pendingReview) setFocused(true); }}
      onBlur={(e) => {
        if (!containerRef.current?.contains(e.relatedTarget)) setFocused(false);
      }}
      sx={{
        position: 'absolute',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90%',
        maxWidth: 620,
        zIndex: 10,
        bgcolor: '#FFFFFF',
        border: focused ? '1.5px solid #1976D2' : '1.5px solid #E0E0E0',
        borderRadius: '14px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.13)',
        transition: 'border-color 0.15s',
        px: 1.5, pt: 1.25, pb: 1.25,
      }}
    >
      {pendingReview ? (
        /* ── Accept / reject surface ── */
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 0.5, py: 0.375 }}>
          <Typography sx={{ flex: 1, fontSize: '0.8125rem', color: 'rgba(0,0,0,0.75)', fontWeight: 400, lineHeight: 1.4 }}>
            Review AI-suggested changes. Highlighted sections have been modified
          </Typography>
          <Button
            size="small"
            variant="outlined"
            onClick={onReject}
            startIcon={<DeleteIcon sx={{ fontSize: '14px !important' }} />}
            sx={{ fontSize: '0.75rem', px: 1.5, height: 30, flexShrink: 0 }}
          >
            Reject
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={onAccept}
            sx={{ fontSize: '0.75rem', px: 1.5, height: 30, flexShrink: 0 }}
          >
            Accept &amp; Save
          </Button>
        </Box>
      ) : (
        /* ── Prompt input surface ── */
        <>
          {/* Selection scope indicator */}
          {scopeLabel && (
            <Box sx={{ mb: 1.5, mx: 0.25 }}>
              <Box sx={{
                display: 'inline-flex', alignItems: 'center', gap: 0.75,
                bgcolor: '#EDE9FE', border: '1px solid #DDD6FE',
                borderRadius: '20px', pl: 1.25, pr: 0.75, py: 0.5,
                maxWidth: '100%',
              }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#7C3AED', flexShrink: 0 }} />
                <Typography sx={{ fontSize: '0.6875rem', fontWeight: 500, lineHeight: 1.2, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#5B21B6' }}>
                  Editing selection:{' '}
                  <Box component="span" sx={{ fontWeight: 400 }}>"{scopeLabel}"</Box>
                </Typography>
                <IconButton size="small" onClick={onClearSelection}
                  sx={{ p: 0.25, ml: 0.25, color: '#7C3AED', flexShrink: 0, '&:hover': { color: '#5B21B6', bgcolor: 'rgba(124,58,237,0.1)' } }}>
                  <CloseIcon sx={{ fontSize: 13 }} />
                </IconButton>
              </Box>
            </Box>
          )}

          {/* Uploaded doc chips */}
          {uploadedDocs.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5, px: 0.25 }}>
              {uploadedDocs.map((doc, i) => (
                <Chip
                  key={i}
                  label={doc.name}
                  size="small"
                  icon={<InsertDriveFileIcon sx={{ fontSize: '13px !important' }} />}
                  onDelete={() => onRemoveDoc(i)}
                  deleteIcon={<CloseIcon sx={{ fontSize: '13px !important' }} />}
                  sx={{
                    fontSize: '0.7rem',
                    bgcolor: '#FFFFFF', color: 'rgba(0,0,0,0.75)',
                    border: '1px solid rgba(0,0,0,0.15)',
                    '& .MuiChip-icon': { color: 'rgba(0,0,0,0.4)' },
                    '& .MuiChip-deleteIcon': { color: 'rgba(0,0,0,0.35)', '&:hover': { color: 'rgba(0,0,0,0.6)' } },
                  }}
                />
              ))}
            </Box>
          )}

          {/* Input row — or thinking state */}
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: '6px', py: '6px' }}>
              <Typography sx={{ flex: 1, fontSize: '0.875rem', color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {prompt}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.625, flexShrink: 0 }}>
                <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: '#5C6BC0' }}>Thinking</Typography>
                {[0, 1, 2].map(i => (
                  <Box
                    key={i}
                    sx={{
                      width: 4, height: 4, borderRadius: '50%', bgcolor: '#5C6BC0',
                      animation: 'ai-dot-bounce 1.4s infinite ease-in-out',
                      animationDelay: `${i * 0.16}s`,
                      '@keyframes ai-dot-bounce': {
                        '0%, 80%, 100%': { transform: 'scale(0.4)', opacity: 0.3 },
                        '40%': { transform: 'scale(1)', opacity: 1 },
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                multiline
                maxRows={4}
                fullWidth
                size="small"
                placeholder={scopeLabel ? 'Ask AI to edit the selected text…' : 'Ask AI to make an edit…'}
                value={prompt}
                onChange={(e) => onPromptChange(e.target.value)}
                onKeyDown={handleKeyDown}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    color: '#1F2937',
                    '& fieldset': { border: 'none' },
                  },
                  '& .MuiInputBase-input::placeholder': { color: '#9CA3AF', opacity: 1 },
                  '& .MuiInputBase-root': { p: '4px 6px' },
                }}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0 }}>
                <Tooltip title="Attach criteria or guidelines">
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => fileInputRef.current?.click()}
                      sx={{ color: 'text.disabled', '&:hover': { color: 'var(--colors-interactive-ghost-text)' }, width: 28, height: 28 }}
                    >
                      <AttachFileIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </span>
                </Tooltip>
                <input ref={fileInputRef} type="file" multiple hidden onChange={handleFileChange} accept=".pdf,.doc,.docx,.txt" />

                <Tooltip title="Send  ↵">
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => { if (prompt.trim()) onSubmit(); }}
                      disabled={!prompt.trim()}
                      sx={{
                        bgcolor: prompt.trim() ? '#1976D2' : 'transparent',
                        color: prompt.trim() ? '#fff' : '#D1D5DB',
                        width: 30, height: 30, borderRadius: '8px',
                        border: prompt.trim() ? 'none' : '1.5px solid #E5E7EB',
                        '&:hover': { bgcolor: prompt.trim() ? '#1565C0' : 'transparent' },
                        '&.Mui-disabled': { bgcolor: 'transparent', color: '#E5E7EB', border: '1.5px solid #F3F4F6' },
                        transition: 'all 0.15s',
                      }}
                    >
                      <ArrowForwardIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            </Box>
          )}

          {/* Footer disclaimer */}
          {!loading && (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mt: 1, pt: 0.875, borderTop: '1px solid rgba(0,0,0,0.06)', mx: 0.25 }}>
              <InfoOutlinedIcon sx={{ fontSize: 11, color: 'rgba(0,0,0,0.35)', mt: '1px', flexShrink: 0 }} />
              <Typography sx={{ fontSize: '0.6875rem', color: 'rgba(0,0,0,0.4)', lineHeight: 1.4 }}>
                Works with existing letter content only.
              </Typography>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
// ─── CreateNewVersionModal ────────────────────────────────────────────────────

const CNV_DENIAL_SUMMARY = 'Sepsis denied — payer argues infection without sufficient systemic response or organ dysfunction to support the diagnosis.';
const CNV_APPEAL_STRATEGY = 'Appeal will argue sepsis is supported by both clinical criteria frameworks and provider documentation.';

const CNV_INITIAL_ARGS = [
  { id: 1, label: 'Sepsis supported by Sepsis-2 (SIRS) criteria', enabled: true, evidence: [
    { text: 'Temp 39.1°C at presentation — meets SIRS criterion (>38°C)', strength: 'Strong' },
    { text: 'HR 118 bpm on admission — meets SIRS criterion (>90 bpm)', strength: 'Strong' },
    { text: 'WBC 16.8 × 10³/µL — meets SIRS criterion (>12k or <4k)', strength: 'Strong' },
    { text: 'RR 22 breaths/min on admission — meets SIRS criterion (>20)', strength: 'Supporting' },
    { text: 'Documented infection source: UTI confirmed on urinalysis', strength: 'Supporting' },
  ]},
  { id: 2, label: 'Sepsis supported by Sepsis-3 (SOFA) criteria', enabled: true, evidence: [
    { text: 'Creatinine 0.9 → 1.6 mg/dL (AKI Stage 1) — Renal SOFA +1', strength: 'Strong' },
    { text: 'Lactate 3.2 mmol/L on admission — elevated (>2), indicates hypoperfusion', strength: 'Strong' },
    { text: 'Vasopressors required to maintain MAP ≥65 — Cardiovascular SOFA +2', strength: 'Strong' },
    { text: 'H&P and discharge summary preserve sepsis due to UTI diagnosis', strength: 'Supporting' },
    { text: 'UA and blood cultures obtained in ED — source identified', strength: 'Supporting' },
  ]},
  { id: 3, label: 'Inpatient level of care medically necessary', enabled: true, evidence: [
    { text: 'Vasopressors initiated Day 1 for hemodynamic support', strength: 'Strong' },
    { text: 'IV ceftriaxone 1g q24h + 30 cc/kg fluid resuscitation bolus', strength: 'Strong' },
    { text: 'Continuous telemetry — hemodynamic instability risk', strength: 'Supporting' },
    { text: 'AKI Stage 1 — required IV hydration and serial creatinine monitoring', strength: 'Supporting' },
  ]},
];

const CNV_STANDARD_OPTIONS = ['Sepsis-2 (SIRS)', 'Sepsis-3 (SOFA)', 'InterQual criteria', 'Milliman MCG'];

const CNV_SUGGESTIONS = [
  'Rebuild the argument around the SOFA score from the record',
  'Directly address the payer\'s denial reason and counter each point',
  'Use a stronger tone throughout',
];
const CNV_GAP_OPTIONS = ['Criteria not met', 'Documentation absent', 'Timing disputed', 'Severity insufficient'];
const CNV_STRENGTH_OPTIONS = ['Strong', 'Supporting', 'Weak', 'Do not use'];
const CNV_STRENGTH_COLOR = {
  'Strong': 'success.main',
  'Supporting': 'warning.main',
  'Weak': 'error.main',
  'Do not use': 'action.disabled',
};

function CnvChipMenu({ label, value, options, chipColor, onSelect }) {
  const [anchorEl, setAnchorEl] = useState(null);
  return (
    <>
      <Chip
        label={`${label}: ${value}`}
        size="small" variant="outlined" color={chipColor}
        onClick={e => setAnchorEl(e.currentTarget)}
        sx={{ fontSize: '0.75rem', height: 26, cursor: 'pointer', borderRadius: '999px', fontWeight: 500, '& .MuiChip-label': { px: 1.5 } }}
      />
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: { borderRadius: 2 } }}>
        {options.map(opt => (
          <MenuItem key={opt} selected={value === opt} dense
            onClick={() => { onSelect(opt); setAnchorEl(null); }}
            sx={{ fontSize: '0.8125rem', minWidth: 180 }}>
            {opt}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

function CnvArgumentCard({ arg, onUpdate }) {
  const [expanded, setExpanded] = useState(false);

  const updateStrength = (idx, strength) => {
    const updated = arg.evidence.map((e, i) => i === idx ? { ...e, strength } : e);
    onUpdate({ evidence: updated });
  };

  return (
    <Box sx={{ bgcolor: '#fff', border: '1px solid', borderColor: 'divider', borderRadius: '8px' }}>
      <Box
        onClick={() => setExpanded(v => !v)}
        sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: 2, py: 1.5,
          borderBottom: expanded ? '1px solid' : 'none',
          borderBottomColor: expanded ? 'divider' : 'transparent',
          cursor: 'pointer', userSelect: 'none',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
          <Checkbox
            size="small" checked={arg.enabled}
            onChange={() => onUpdate({ enabled: !arg.enabled })}
            onClick={e => e.stopPropagation()}
            sx={{ p: 0, mr: 0.5 }}
          />
          <Typography sx={{ fontSize: '0.875rem', color: '#000', lineHeight: 1.5, opacity: arg.enabled ? 1 : 0.5, flex: 1 }}>
            {arg.label}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          <Typography sx={{ fontSize: '0.75rem', color: '#616161', opacity: arg.enabled ? 1 : 0.5, whiteSpace: 'nowrap' }}>
            {arg.evidence.length} supporting evidence
          </Typography>
          <KeyboardArrowDownIcon sx={{ fontSize: 21, color: '#212121', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </Box>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ bgcolor: '#fff', p: 2, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {arg.evidence.map((item, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: CNV_STRENGTH_COLOR[item.strength], flexShrink: 0, transition: 'background-color 0.15s' }} />
              <Typography variant="body2" sx={{ flex: 1, textDecoration: item.strength === 'Do not use' ? 'line-through' : 'none', opacity: item.strength === 'Do not use' ? 0.4 : 1 }}>
                {item.text}
              </Typography>
              <Select
                size="small" value={item.strength}
                onChange={e => updateStrength(i, e.target.value)}
                MenuProps={{ PaperProps: { sx: { borderRadius: 2 } } }}
                sx={(theme) => {
                  const c = {
                    'Strong':     { color: theme.palette.success.main,  border: theme.palette.success.main },
                    'Supporting': { color: theme.palette.text.secondary, border: theme.palette.divider },
                    'Weak':       { color: theme.palette.warning.main,   border: theme.palette.warning.main },
                    'Do not use': { color: theme.palette.text.disabled,  border: theme.palette.divider },
                  }[item.strength] || { color: theme.palette.text.primary, border: theme.palette.divider };
                  return {
                    color: c.color, fontSize: '0.8125rem', fontWeight: 400, height: 32, borderRadius: '100px',
                    '.MuiOutlinedInput-notchedOutline': { border: `1px solid ${c.border}` },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: `1px solid ${c.border}` },
                    '.MuiSelect-icon': { color: c.color, fontSize: '1.25rem' },
                    '.MuiSelect-select': { py: '4px', pl: '10px', pr: '28px !important' },
                  };
                }}
              >
                {CNV_STRENGTH_OPTIONS.map(o => (
                  <MenuItem key={o} value={o} dense sx={{ fontSize: '0.8125rem' }}>{o}</MenuItem>
                ))}
              </Select>
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}

function CreateNewVersionModal({ open, onClose, onConfirm }) {
  const [denialSummary, setDenialSummary] = useState(CNV_DENIAL_SUMMARY);
  const [standard, setStandard] = useState('Sepsis-2 (SIRS)');
  const [gap, setGap] = useState('Criteria not met');
  const [args, setArgs] = useState(CNV_INITIAL_ARGS.map(a => ({ ...a, evidence: [...a.evidence] })));
  const [instructions, setInstructions] = useState('');
  const [cnvDocs, setCnvDocs] = useState([]);
  const [appealPlanOpen, setAppealPlanOpen] = useState(false);
  const cnvFileInputRef = useRef(null);

  const updateArg = (id, patch) =>
    setArgs(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));

  const handleConfirm = () => {
    onConfirm(cnvDocs.length > 0);
    setDenialSummary(CNV_DENIAL_SUMMARY);
    setStandard('Sepsis-2 (SIRS)');
    setGap('Criteria not met');
    setArgs(CNV_INITIAL_ARGS.map(a => ({ ...a, evidence: [...a.evidence] })));
    setInstructions('');
    setCnvDocs([]);
    setAppealPlanOpen(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: '12px', overflow: 'hidden' } }}>

      <DialogTitle sx={{ pr: 6 }}>
        Create new version
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ position: 'absolute', top: 12, right: 12, color: 'text.secondary' }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers={false}>

        {/* Subtitle */}
        <DialogContentText sx={{ mb: 2 }}>
          Any additional instructions or criteria for this version?
        </DialogContentText>

        {/* Suggestions */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Here are some things you can try:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.75 }}>
            {CNV_SUGGESTIONS.map((s, i) => (
              <ButtonBase
                key={i}
                onClick={() => setInstructions(s)}
                sx={{
                  display: 'inline-flex', alignItems: 'center', gap: 0.75,
                  textAlign: 'left',
                  px: 1.25, py: 0.625,
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  bgcolor: '#F9FAFB',
                  '&:hover': { bgcolor: '#F3F4F6', borderColor: '#D1D5DB' },
                  transition: 'background-color 0.12s, border-color 0.12s',
                }}
              >
                <SubdirectoryArrowRightIcon sx={{ fontSize: 13, color: '#9CA3AF', flexShrink: 0 }} />
                <Typography sx={{ fontSize: '0.8125rem', color: '#374151', lineHeight: 1.5 }}>{s}</Typography>
              </ButtonBase>
            ))}
          </Box>
        </Box>

        {/* Instruction input card */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{
            border: '1px solid #E0E0E0',
            borderRadius: '10px',
            bgcolor: '#FAFAFA',
            overflow: 'hidden',
            '&:focus-within': { borderColor: 'rgba(25,118,210,0.4)', bgcolor: '#fff' },
            transition: 'all 0.15s',
          }}>
            <TextField
              multiline
              minRows={4}
              maxRows={7}
              fullWidth
              placeholder="e.g. Switch to Sepsis-3 criteria, address the two-midnight rule, reference the payer's specific denial reason…"
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '0.875rem',
                  lineHeight: 1.65,
                  color: '#1F2937',
                  '& fieldset': { border: 'none' },
                  '& textarea': { px: 1.5, pt: 1.5, pb: 0.75 },
                },
                '& .MuiInputBase-input::placeholder': { color: '#9CA3AF', opacity: 1, lineHeight: 1.65 },
              }}
            />

            {/* Attachment row */}
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 0.5,
              px: 1.25, py: 0.875,
              borderTop: '1px solid rgba(0,0,0,0.06)',
            }}>
              <Tooltip title="Attach criteria or guidelines (PDF, Word, TXT)">
                <span>
                  <IconButton
                    size="small"
                    onClick={() => cnvFileInputRef.current?.click()}
                    sx={{
                      color: '#9CA3AF', borderRadius: '6px',
                      '&:hover': { color: '#1976D2', bgcolor: 'rgba(25,118,210,0.06)' },
                      width: 28, height: 28,
                    }}
                  >
                    <AttachFileIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </span>
              </Tooltip>
              <Typography sx={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                Attach criteria or guidelines
              </Typography>
              <input
                ref={cnvFileInputRef} type="file" multiple hidden
                accept=".pdf,.doc,.docx,.txt"
                onChange={(e) => {
                  Array.from(e.target.files || []).forEach(f => setCnvDocs(prev => [...prev, f]));
                  e.target.value = '';
                }}
              />
            </Box>
          </Box>

          {/* Attached doc chips */}
          {cnvDocs.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
              {cnvDocs.map((doc, i) => (
                <Chip
                  key={i}
                  label={doc.name}
                  size="small"
                  icon={<InsertDriveFileIcon sx={{ fontSize: '13px !important' }} />}
                  onDelete={() => setCnvDocs(prev => prev.filter((_, j) => j !== i))}
                  sx={{
                    fontSize: '0.7rem', height: 24,
                    bgcolor: '#E3F2FD', color: '#1565C0',
                    border: '1px solid #BBDEFB',
                    '& .MuiChip-icon': { color: '#1976D2' },
                    '& .MuiChip-deleteIcon': { fontSize: 13, color: '#1976D2', '&:hover': { color: '#1565C0' } },
                  }}
                />
              ))}
            </Box>
          )}
        </Box>

        {/* Disclaimer */}
        <DialogContentText variant="body2">
          AI-generated content may contain errors. Review before submitting to payers.
        </DialogContentText>

      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleConfirm}>Generate letter</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── MainContent (left panel) ─────────────────────────────────────────────────

function MainContent({ state, dispatch, view, selectedVersionId, onViewVersionHistory, onBack, onRestore, saveStatus, setSaveStatus, savedAt, setSavedAt, getEditorContentRef, autosaveEnabled, viewOnly, onToggleAutosave, onToggleViewOnly, onManualSave, onCreateVersion, scrollToDiff = false }) {
  const editorRef = useRef(null);
  const [selectedText, setSelectedText] = useState('');
  const isVersionHistory = view === 'version-history';
  const selectedVersion = state.letter.versions.find(v => v.id === selectedVersionId) || state.letter.versions[state.letter.versions.length - 1];
  const { aiEdit } = state;

  // Track previous aiEdit.status to detect transitions
  const prevAiStatusRef = useRef(aiEdit.status);

  const autosaveTimer = useRef(null);
  // Force re-render every 30s to keep relative time fresh
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => forceUpdate(n => n + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  // Register editor content getter with root
  useEffect(() => {
    getEditorContentRef.current = () => editorRef.current?.innerHTML ?? '';
    return () => { getEditorContentRef.current = null; };
  }, []);

  // Scroll to first diff on initial load when showing tracked changes
  useEffect(() => {
    if (!scrollToDiff) return;
    const timer = setTimeout(() => {
      const firstDel = editorRef.current?.querySelector('del');
      if (firstDel) firstDel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Cleanup autosave timer on unmount
  useEffect(() => {
    return () => clearTimeout(autosaveTimer.current);
  }, []);

  // beforeunload: save immediately if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (saveStatus === 'unsaved' || saveStatus === 'saving') {
        e.preventDefault();
        const content = editorRef.current?.innerHTML;
        if (content) {
          dispatch({ type: 'SAVE_LETTER', payload: content });
          setSaveStatus('saved');
          setSavedAt(new Date());
        }
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveStatus]);

  // Detect aiEdit status transitions and update editor innerHTML
  useEffect(() => {
    const prev = prevAiStatusRef.current;
    prevAiStatusRef.current = aiEdit.status;

    if (prev === 'loading' && aiEdit.status === 'pending-review') {
      if (editorRef.current && aiEdit.pendingContent) {
        editorRef.current.innerHTML = aiEdit.pendingContent;
        setTimeout(() => {
          const first = editorRef.current?.querySelector('del, ins');
          if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
    if (prev !== 'idle' && aiEdit.status === 'idle') {
      if (editorRef.current) {
        editorRef.current.innerHTML = state.letter.content;
      }
    }
  }, [aiEdit.status]);

  const triggerAutosave = () => {
    setSaveStatus('unsaved');
    if (!autosaveEnabled) return;
    clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      setSaveStatus('saving');
      setTimeout(() => {
        const content = editorRef.current?.innerHTML ?? '';
        dispatch({ type: 'SAVE_LETTER', payload: content });
        setSaveStatus('saved');
        setSavedAt(new Date());
      }, 400);
    }, 4500);
  };

  // Reset save status when version changes
  useEffect(() => {
    setSaveStatus('saved');
    setSavedAt(new Date());
    clearTimeout(autosaveTimer.current);
  }, [state.letter.versions.find(v => v.isCurrentDraft)?.id]);

  const handleCopy = async () => {
    const text = editorRef.current?.innerText || '';
    try { await navigator.clipboard.writeText(text); } catch { /* noop */ }
    dispatch({ type: 'SHOW_SNACKBAR', payload: 'Letter copied to clipboard' });
  };
  const isAiLoading = aiEdit.status === 'loading';
  const isAiPendingReview = aiEdit.status === 'pending-review';
  const isAiActive = isAiLoading || isAiPendingReview;

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: '#fff', position: 'relative' }}>
      {isVersionHistory ? (
        <>
          <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #E0E0E0', px: 3, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <Button
              variant="outlined"
              startIcon={<ChevronLeftIcon sx={{ fontSize: '18px !important', mr: '-4px' }} />}
              onClick={onBack}
              size="small"
              sx={{ fontSize: '0.8125rem', px: 1.5 }}
            >
              Back to Current Draft
            </Button>
            <Button
              variant="contained"
              startIcon={<RestoreIcon sx={{ fontSize: '18px !important' }} />}
              onClick={() => onRestore(selectedVersion.id, selectedVersion.content)}
              disabled={selectedVersion.isCurrentDraft}
              size="small"
              sx={{ fontSize: '0.8125rem', px: 1.5 }}
            >
              Restore This Draft
            </Button>
          </Box>
          <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2.5, bgcolor: '#F6F8FA' }}>
            <Box
              sx={{
                bgcolor: '#fff',
                border: '1px solid #D3D3D3',
                borderRadius: '2px',
                px: '20px', py: '14px',
                maxWidth: 820,
                mx: 'auto',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}
            >
              <div
                dangerouslySetInnerHTML={{ __html: selectedVersion.content }}
                style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', lineHeight: '1.5', color: '#616161', minHeight: 560 }}
              />
            </Box>
            <Typography sx={{ color: '#6E6E6E', fontSize: '0.75rem', fontStyle: 'italic', mt: 2, textAlign: 'center' }}>
              AI-generated rationale; please review for accuracy and completeness
            </Typography>
          </Box>
        </>
      ) : (
        // Case view: scrollable body with sticky toolbar above letter + floating AiPromptBar
        <>
          {/* Scrollable body: CaseInfoPanel → sticky toolbar → LetterEditor */}
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            <CaseInfoPanel
              caseData={state.caseData}
              drgCodes={MOCK_DRG_CODES}
              ui={state.ui}
              dispatch={dispatch}
            />

            {/* Toolbar slot — sticky, directly above the letter */}
            <Box sx={{ position: 'sticky', top: 0, zIndex: 5 }}>
              <LetterToolbar
                editorRef={editorRef}
                saveStatus={saveStatus}
                savedAt={savedAt}
                versionCount={state.letter.versions.length}
                letterMenuAnchor={state.ui.letterMenuAnchor}
                onCopy={handleCopy}
                onCreateVersion={onCreateVersion}
                onViewVersionHistory={onViewVersionHistory}
                autosaveEnabled={autosaveEnabled}
                viewOnly={viewOnly}
                onToggleAutosave={onToggleAutosave}
                onToggleViewOnly={onToggleViewOnly}
                onManualSave={onManualSave}
                dispatch={dispatch}
              />
            </Box>

            <LetterEditor
              editorRef={editorRef}
              initialContent={state.letter.content}
              onDirty={triggerAutosave}
              viewOnly={viewOnly}
              loading={isAiLoading}
              disabled={isAiActive}
              onSelectionChange={setSelectedText}
            />
            {/* Spacer so content isn't hidden under the floating prompt bar */}
            <Box sx={{ height: 140 }} />
          </Box>

          {/* AI prompt bar — floating, centered over the letter canvas */}
          <AiPromptBar
            prompt={aiEdit.prompt}
            onPromptChange={(val) => dispatch({ type: 'SET_AI_PROMPT', payload: val })}
            uploadedDocs={aiEdit.uploadedDocs}
            onAddDoc={(file) => dispatch({ type: 'ADD_UPLOADED_DOC', payload: file })}
            onRemoveDoc={(idx) => dispatch({ type: 'REMOVE_UPLOADED_DOC', payload: idx })}
            onSubmit={() => runFakeAiEdit(
              aiEdit.prompt,
              aiEdit.uploadedDocs,
              selectedText,
              editorRef.current?.innerHTML || state.letter.content,
              dispatch,
            )}
            loading={isAiLoading}
            pendingReview={isAiPendingReview}
            onAccept={() => dispatch({ type: 'ACCEPT_AI_EDIT' })}
            onReject={() => dispatch({ type: 'REJECT_AI_EDIT' })}
            selectedText={selectedText}
            onClearSelection={() => setSelectedText('')}
          />
        </>
      )}
    </Box>
  );
}

// ─── RightRail ────────────────────────────────────────────────────────────────

function SectionHeader({ label, icon, open, onToggle }) {
  return (
    <Box
      onClick={onToggle}
      sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        py: 1.25, cursor: 'pointer', userSelect: 'none',
        '&:hover': { bgcolor: 'rgba(0,0,0,0.02)', mx: -2, px: 2 },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {icon}
        <Typography sx={{ fontSize: '0.875rem', fontWeight: 400, color: '#212121' }}>
          {label}
        </Typography>
      </Box>
      <ExpandMoreIcon
        sx={{ fontSize: 18, color: '#757575', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
      />
    </Box>
  );
}

function HistorySection({ activity, versions, dispatch }) {
  const { byLevel, activeLevel } = activity;
  const entries = byLevel[activeLevel] || [];
  const levels = Object.keys(byLevel);

  let appealCount = 0;
  const entryOrdinals = entries.map(entry => {
    if (entry.hasAppealLink) { appealCount++; return appealCount; }
    return 0;
  });
  const totalAppealEntries = appealCount;

  const baseVersions = versions ? versions.filter(v => !v.isCheckpoint) : [];
  const currentDraft = versions ? versions.find(v => v.isCurrentDraft) : null;
  const activeDraftBase = currentDraft?.isCheckpoint
    ? baseVersions.find(v => v.id === currentDraft.baseVersionId)
    : currentDraft;
  const activeDraftAppealOrdinal = baseVersions.findIndex(v => v.id === activeDraftBase?.id) + 1;

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, borderBottom: '1px solid #EEEEEE', mb: 1.5 }}>
        {levels.map((lvl) => {
          const active = lvl === activeLevel;
          return (
            <Box
              key={lvl}
              onClick={() => dispatch({ type: 'SET_ACTIVITY_LEVEL', payload: lvl })}
              sx={{
                pb: 1, cursor: 'pointer',
                borderBottom: active ? '2px solid #1976D2' : '2px solid transparent',
                mb: '-1px',
              }}
            >
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: active ? 600 : 400, color: active ? '#1976D2' : '#9E9E9E' }}>
                {lvl}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {entries.length === 0 ? (
        <Typography sx={{ color: '#BDBDBD', fontSize: '0.8rem', textAlign: 'center', py: 2 }}>
          No activity for {activeLevel}
        </Typography>
      ) : (
        <Box sx={{ position: 'relative', pl: 3.5, pt: 0.5 }}>
          <Box
            sx={{
              position: 'absolute', left: 11.5, top: 12, bottom: 12,
              width: '1px', bgcolor: '#BDBDBD', borderRadius: '1px',
            }}
          />
          {entries.map((entry, idx) => {
            const appealOrdinal = entryOrdinals[idx];
            const isComplete = entry.hasAppealLink && appealOrdinal === activeDraftAppealOrdinal;
            const actionLabel = (entry.hasAppealLink && totalAppealEntries > 1)
              ? `${entry.action} - Version ${appealOrdinal}`
              : entry.action;
            return (
              <Box key={entry.id} sx={{ position: 'relative', mb: idx < entries.length - 1 ? 2.5 : 1 }}>
                <Box sx={{ position: 'absolute', left: -26, top: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20 }}>
                  {isComplete ? (
                    <CheckCircleIcon sx={{ fontSize: 20, color: '#1976D2' }} />
                  ) : (
                    <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: '#757575', flexShrink: 0 }} />
                  )}
                </Box>
                <Typography sx={{ fontSize: '0.77rem', fontWeight: 500, color: '#212121', mb: 0.25 }}>
                  {actionLabel}
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: '#616161', mb: 0.5 }}>
                  {entry.date} by {entry.user}
                </Typography>
                {entry.hasDenialLink && (
                  <Typography
                    component="span"
                    onClick={viewDenialInNewTab}
                    sx={{ fontSize: '0.75rem', color: 'var(--colors-interactive-ghost-text)', cursor: 'pointer', '&:hover': { color: 'var(--colors-interactive-hover-ghost-text)' }, display: 'inline-flex', alignItems: 'center', gap: 0.25 }}
                  >
                    View Denial <OpenInNewIcon sx={{ fontSize: 12 }} />
                  </Typography>
                )}
                {entry.hasAppealLink && (
                  <Typography
                    component="span"
                    sx={{ fontSize: '0.75rem', color: 'var(--colors-interactive-ghost-text)', cursor: 'pointer', '&:hover': { color: 'var(--colors-interactive-hover-ghost-text)' }, display: 'inline-flex', alignItems: 'center', gap: 0.25 }}
                  >
                    Open Appeal <OpenInNewIcon sx={{ fontSize: 12 }} />
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

function CommentsSection({ comments, dispatch }) {
  const [draft, setDraft] = useState('');

  const handleSubmit = () => {
    const t = draft.trim();
    if (!t) return;
    dispatch({ type: 'ADD_COMMENT', payload: t });
    dispatch({ type: 'SHOW_SNACKBAR', payload: 'Comment added' });
    setDraft('');
  };

  return (
    <Box>
      {comments.length === 0 ? (
        <Box sx={{ py: 0.5 }}>
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#616161', mb: 0.5 }}>
            No comments on this case yet.
          </Typography>
          <Typography sx={{ fontSize: '0.77rem', color: '#616161', mb: 1.5, lineHeight: 1.5 }}>
            Use comments to document decisions or share context with your team.
          </Typography>
          {draft === '' ? (
            <Box
              onClick={() => setDraft(' ')}
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', px: 1, py: '6px', borderRadius: '4px', '&:hover': { bgcolor: 'var(--colors-interactive-hover-ghost-background)' } }}
            >
              <AddIcon sx={{ fontSize: 20, color: 'var(--colors-interactive-ghost-text)' }} />
              <Typography sx={{ fontSize: '0.875rem', color: 'var(--colors-interactive-ghost-text)' }}>
                Add Comment
              </Typography>
            </Box>
          ) : null}
        </Box>
      ) : (
        comments.map((c) => (
          <Box key={c.id} sx={{ bgcolor: '#F6F8FA', border: '1px solid #EEEEEE', borderRadius: 1, p: 1.5, mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#424242' }}>{c.user}</Typography>
              <Typography sx={{ fontSize: '0.7rem', color: '#9E9E9E' }}>{c.ts}</Typography>
            </Box>
            <Typography sx={{ fontSize: '0.8rem', color: '#212121', lineHeight: 1.6 }}>{c.text}</Typography>
          </Box>
        ))
      )}

      {(draft.trim() !== '' || comments.length > 0) && (
        <Box sx={{ mt: 1 }}>
          <TextField
            placeholder="Add a comment..."
            multiline minRows={2} maxRows={4} fullWidth size="small"
            value={draft.trim() === '' && draft !== '' ? '' : draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(); }}
            sx={{ mb: 1, '& .MuiOutlinedInput-root': { fontSize: '0.8125rem' } }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {comments.length > 0 && (
              <Box
                onClick={() => setDraft(' ')}
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', '&:hover': { bgcolor: 'var(--colors-interactive-hover-ghost-background)' } }}
              >
                <AddIcon sx={{ fontSize: 20, color: 'var(--colors-interactive-ghost-text)' }} />
                <Typography sx={{ fontSize: '0.875rem', color: 'var(--colors-interactive-ghost-text)' }}>
                  Add Comment
                </Typography>
              </Box>
            )}
            <Button size="small" variant="contained" disabled={!draft.trim()} onClick={handleSubmit} sx={{ fontSize: '0.8rem', ml: 'auto' }}>
              Add
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}

function EvidenceCard({ item }) {
  const STRENGTH_BARS = { Strong: 3, Moderate: 2, Low: 1 };
  const bars = STRENGTH_BARS[item.strength] || 1;

  return (
    <Box
      sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        pt: 2, pb: 2, px: 1.5,
        bgcolor: '#FFFFFF', borderRadius: '4px',
        border: '1px solid #E5E7EB',
        mb: 1, cursor: 'pointer',
        transition: 'background-color 0.15s',
        '&:hover': { bgcolor: '#F3F4F6' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.875rem', color: '#000', lineHeight: 1.5 }}>
          {item.condition}
        </Typography>
        <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: 'rgba(0,0,0,0.87)' }}>
            {item.count}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ display: 'flex', gap: '2px', alignItems: 'flex-end' }}>
            {[1, 2, 3].map((b) => (
              <Box key={b} sx={{ width: 3, height: b * 4, bgcolor: b <= bars ? item.strengthColor : '#E0E0E0', borderRadius: '1px' }} />
            ))}
          </Box>
          <Typography sx={{ fontSize: '0.875rem', color: '#616161', lineHeight: 1.5 }}>
            {item.strength}
          </Typography>
        </Box>
        <ChevronRightIcon sx={{ fontSize: 21, color: '#BDBDBD', flexShrink: 0 }} />
      </Box>
    </Box>
  );
}

function CardSection({ icon, label, open, onToggle, children }) {
  return (
    <Box sx={{ px: 2, pb: 2 }}>
      <Box sx={{ bgcolor: '#fff', border: '1px solid #EEEEEE', borderRadius: '8px' }}>
        <Box
          onClick={onToggle}
          sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            px: 2, py: 2,
            borderBottom: open ? '1px solid #EEEEEE' : 'none',
            cursor: 'pointer', userSelect: 'none',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {icon}
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 400, color: '#000', lineHeight: '24.5px' }}>
              {label}
            </Typography>
          </Box>
          <KeyboardArrowDownIcon
            sx={{ fontSize: 21, color: '#212121', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
          />
        </Box>
        <Collapse in={open}>
          <Box sx={{ bgcolor: '#F6F8FA', borderRadius: '0 0 8px 8px', p: 2 }}>
            {children}
          </Box>
        </Collapse>
      </Box>
    </Box>
  );
}

function RightRail({ state, dispatch, isCollapsed, view, selectedVersionId, onSelectVersion }) {
  const { ui, activity, comments } = state;
  const isVersionHistory = view === 'version-history';

  const [openGroups, setOpenGroups] = useState({});
  const [versionMenu, setVersionMenu] = useState({ anchor: null, versionId: null });
  const currentDraftForGroups = state.letter.versions.find(v => v.isCurrentDraft);
  const currentBaseId = currentDraftForGroups
    ? (currentDraftForGroups.isCheckpoint ? currentDraftForGroups.baseVersionId : currentDraftForGroups.id)
    : null;
  const isGroupOpen = (baseId) => openGroups[baseId] ?? (baseId === currentBaseId);
  const toggleGroup = (baseId) => {
    setOpenGroups(prev => ({ ...prev, [baseId]: !(prev[baseId] ?? (baseId === currentBaseId)) }));
  };

  const groups = [];
  const groupMap = {};
  state.letter.versions.slice().reverse().forEach(v => {
    const baseId = v.isCheckpoint ? v.baseVersionId : v.id;
    if (!groupMap[baseId]) {
      groupMap[baseId] = { baseId, label: v.label, versions: [] };
      groups.push(groupMap[baseId]);
    }
    groupMap[baseId].versions.push(v);
  });

  return (
    <Box
      sx={{
        width: isCollapsed ? 0 : 420,
        flexShrink: 0,
        borderLeft: '1px solid #E0E0E0',
        bgcolor: '#ECEFF1',
        overflowX: 'hidden',
        overflowY: isCollapsed ? 'hidden' : 'auto',
        opacity: isCollapsed ? 0 : 1,
        display: 'flex', flexDirection: 'column',
        transition: 'width 280ms ease-in-out, opacity 200ms ease',
      }}
    >
      {isVersionHistory ? (
        <Box>
          <Box sx={{ px: 2, pt: 2, pb: 1 }}>
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: '#333' }}>
              Version History
            </Typography>
          </Box>
          <Box sx={{ px: 2, pb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {groups.map(group => {
              const open = isGroupOpen(group.baseId);
              return (
                <Box key={group.baseId} sx={{ bgcolor: '#fff', border: '1px solid #EEEEEE', borderRadius: '8px' }}>
                  <Box
                    onClick={() => toggleGroup(group.baseId)}
                    sx={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      px: 2, py: 2,
                      borderBottom: open ? '1px solid #EEEEEE' : 'none',
                      cursor: 'pointer', userSelect: 'none',
                    }}
                  >
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 400, color: '#000' }}>
                      {group.label}
                    </Typography>
                    <KeyboardArrowDownIcon
                      sx={{ fontSize: 21, color: '#212121', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                    />
                  </Box>
                  <Collapse in={open}>
                    <Box>
                      {group.versions.map((v, vIdx) => {
                        const isSelected = v.id === selectedVersionId;
                        const isLast = vIdx === group.versions.length - 1;
                        return (
                          <Tooltip key={v.id} title={`Last saved at ${v.time} by ${v.author}`} placement="left" arrow>
                            <Box
                              onClick={() => onSelectVersion(v.id)}
                              sx={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                px: 2, py: 2,
                                cursor: 'pointer',
                                borderRadius: isLast ? '0 0 8px 8px' : 0,
                                '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
                                transition: 'background-color 0.15s',
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Radio
                                  size="small"
                                  checked={isSelected}
                                  onChange={() => onSelectVersion(v.id)}
                                  sx={{ p: 0, flexShrink: 0 }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <Box>
                                  <Typography sx={{ fontSize: '0.8125rem', color: '#212121', lineHeight: 1.4 }}>
                                    {v.time}
                                  </Typography>
                                  <Typography sx={{ fontSize: '0.8125rem', color: '#616161' }}>
                                    {v.author}
                                  </Typography>
                                </Box>
                              </Box>
                              {v.isCurrentDraft ? (
                                <Chip label="Current Draft" color="primary" variant="outlined" size="small" />
                              ) : v.author !== 'SmarterDx' ? (
                                <IconButton
                                  size="small"
                                  onClick={(e) => { e.stopPropagation(); setVersionMenu({ anchor: e.currentTarget, versionId: v.id }); }}
                                  sx={{ p: 0.5, color: '#9E9E9E' }}
                                >
                                  <MoreHorizIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              ) : null}
                            </Box>
                          </Tooltip>
                        );
                      })}
                    </Box>
                  </Collapse>
                </Box>
              );
            })}
          </Box>
        </Box>
      ) : (
        <>
          <Box>
            <Box sx={{ px: 2, pt: 2, pb: 1 }}>
              <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: '#333' }}>
                Case Activity
              </Typography>
            </Box>

            <CardSection
              icon={<AccessTimeIcon sx={{ fontSize: 17.5, color: '#212121' }} />}
              label="History"
              open={ui.historyOpen}
              onToggle={() => dispatch({ type: 'TOGGLE_HISTORY' })}
            >
              <HistorySection activity={activity} versions={state.letter.versions} dispatch={dispatch} />
            </CardSection>

            <CardSection
              icon={<ChatBubbleOutlineIcon sx={{ fontSize: 17.5, color: '#212121' }} />}
              label="Comments"
              open={ui.commentsOpen}
              onToggle={() => dispatch({ type: 'TOGGLE_COMMENTS' })}
            >
              <CommentsSection comments={comments} dispatch={dispatch} />
            </CardSection>
          </Box>

          <Box sx={{ px: 2, pt: 2, pb: 2, flex: 1 }}>
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: '#333', mb: 1.25 }}>
              Case Details
            </Typography>

            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#43526A', mb: 0.75 }}>
              Supporting Evidence
            </Typography>

            <Box>
              {MOCK_EVIDENCE.map((item) => (
                <EvidenceCard key={item.id} item={item} />
              ))}
            </Box>
          </Box>
        </>
      )}
      {/* Version row kebab menu */}
      <Menu
        anchorEl={versionMenu.anchor}
        open={Boolean(versionMenu.anchor)}
        onClose={() => setVersionMenu({ anchor: null, versionId: null })}
        PaperProps={{ sx: { minWidth: 160 } }}
      >
        <MenuItem
          onClick={() => {
            dispatch({ type: 'DELETE_VERSION', payload: versionMenu.versionId });
            setVersionMenu({ anchor: null, versionId: null });
          }}
          sx={{ fontSize: '0.875rem', color: 'error.main' }}
        >
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete draft</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}

// ─── Dialogs ─────────────────────────────────────────────────────────────────

function DeleteDenialDialog({ patientName, open, dispatch }) {
  return (
    <Dialog open={open} onClose={() => dispatch({ type: 'CLOSE_DELETE_DIALOG' })} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem' }}>Delete Denial?</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ fontSize: '0.875rem' }}>
          Are you sure you want to delete the denial for <strong>{patientName}</strong>? This action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={() => dispatch({ type: 'CLOSE_DELETE_DIALOG' })} color="inherit" size="small">Cancel</Button>
        <Button variant="contained" color="error" size="small" onClick={() => dispatch({ type: 'CONFIRM_DELETE' })}>Delete</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Edit Diagnoses Data ─────────────────────────────────────────────────────

const EDIT_DIAGNOSES = [
  { id: 0, code: 'A41.9',  name: 'Sepsis, unspecified organism',                          billedLabel: 'Billed Principal', defaultAdj: 'Removed'              },
  { id: 1, code: 'R65.20', name: 'Severe sepsis without septic shock',                    billedLabel: null,               defaultAdj: 'Removed'              },
  { id: 2, code: 'J96.21', name: 'Acute and chronic respiratory failure with hypoxia',    billedLabel: 'Billed MCC',       defaultAdj: 'Removed'              },
  { id: 3, code: 'J18.9',  name: 'Pneumonia, unspecified organism',                       billedLabel: null,               defaultAdj: 'Changed to Principal' },
  { id: 4, code: 'N17.9',  name: 'Acute kidney failure, unspecified',                     billedLabel: null,               defaultAdj: 'Unchanged'            },
  { id: 5, code: 'I10',    name: 'Essential (primary) hypertension',                      billedLabel: null,               defaultAdj: 'Unchanged'            },
];

const PAYER_ADJ_OPTIONS = ['Unchanged', 'Changed to Secondary', 'Changed to Principal', 'Removed', 'Added'];
const DRG_REVIEW_TYPE_OPTIONS = ['Clinical Validation Review', 'Coding Audit'];

const MOCK_FIND_ENCOUNTER = {
  id: 'SE1',
  patientName: 'Susan Smith',
  dob: '08/14/1955',
  har: '5291037',
  mrn: '3921847',
  visitId: '8847201',
  admit: '05/28/2024',
  discharge: '06/05/2024',
  dxCode: 'A41.9',
  dxName: 'Sepsis, unspecified organism',
  billedDrg: '871',
};

const FIND_ENCOUNTER_LOOKUP = [MOCK_FIND_ENCOUNTER];

const MOCK_ENCOUNTERS = [
  { id: 'E1', patientName: 'Marcus Johnson',    dob: '04/22/1968', har: '4821039', mrn: '8847291', visitId: '2937410', admit: '01/12/2025', discharge: '01/19/2025', dxCode: 'A41.9', dxName: 'Sepsis, unspecified organism',    billedDrg: '871' },
  { id: 'E2', patientName: 'Marcus Johnson',    dob: '04/22/1968', har: '4812201', mrn: '8847291', visitId: '2930041', admit: '09/03/2024', discharge: '09/08/2024', dxCode: 'J18.9', dxName: 'Pneumonia, unspecified organism', billedDrg: '194' },
  { id: 'E3', patientName: 'Marcus B. Johnson', dob: '04/22/1968', har: '4798830', mrn: '8847291', visitId: '2901837', admit: '05/22/2024', discharge: '05/25/2024', dxCode: 'I10',   dxName: 'Essential (primary) hypertension', billedDrg: '812' },
];

// ─── Convert date formats ─────────────────────────────────────────────────────

function toISO(mmddyyyy) {
  if (!mmddyyyy) return '';
  const [m, d, y] = mmddyyyy.split('/');
  return `${y}-${m}-${d}`;
}

function toDisplay(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y}`;
}

// ─── EncounterSearchPanel ─────────────────────────────────────────────────────

function EncounterSearchPanel({ activeEncId, encounters, onSelect, onCancel }) {
  const [searchField, setSearchField]     = useState('HAR');
  const [searchQuery, setSearchQuery]     = useState('');
  const [searching, setSearching]         = useState(false);
  const [hasSearched, setHasSearched]     = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const runSearch = () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setTimeout(() => {
      const q = searchQuery.trim().toLowerCase();
      setSearchResults(encounters.filter(enc => {
        if (searchField === 'HAR')          return enc.har.toLowerCase().includes(q);
        if (searchField === 'MRN')          return enc.mrn.toLowerCase().includes(q);
        return enc.patientName.toLowerCase().includes(q);
      }));
      setHasSearched(true);
      setSearching(false);
    }, 1500);
  };

  return (
    <Box sx={{ px: 3, pt: 2.5, pb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3.5 }}>
        <Typography sx={{ fontSize: '0.9375rem', fontWeight: 600, color: 'rgba(0,0,0,0.87)' }}>
          Find the Encounter for the Denial
        </Typography>
        <Button size="small" onClick={onCancel} sx={{ fontSize: '0.8125rem', p: 0, minWidth: 0 }}>
          Cancel
        </Button>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
        <FormControl size="small" sx={{ width: 200 }}>
          <InputLabel>Identifier</InputLabel>
          <Select value={searchField} label="Identifier" onChange={(e) => setSearchField(e.target.value)}>
            <MenuItem value="HAR">HAR</MenuItem>
            <MenuItem value="Patient Name">Patient Name</MenuItem>
            <MenuItem value="MRN">MRN</MenuItem>
          </Select>
        </FormControl>
        <TextField
          size="small" label={searchField} value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') runSearch(); }}
          sx={{ width: 300 }}
        />
        <Button variant="contained" size="medium" onClick={runSearch} sx={{ flexShrink: 0 }}>Search</Button>
      </Box>

      <Button startIcon={<AddIcon sx={{ fontSize: '16px !important' }} />} size="small"
        sx={{ fontSize: '0.8125rem', p: 0, minWidth: 0, mb: 2 }}>
        Add identifier
      </Button>

      {searching && (
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4, pb: 2 }}>
          <CircularProgress size={28} />
        </Box>
      )}

      {!searching && hasSearched && (
        <>
          <Typography sx={{ fontSize: '0.8125rem', color: 'var(--colors-text-secondary)', mb: 1 }}>
            Displaying {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
          </Typography>
          <Box sx={{ bgcolor: 'var(--colors-table-row-background)', border: '1px solid var(--colors-table-layout-border)', borderRadius: '8px', overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 860 }}>
              <TableHead>
                <TableRow>
                  {['Patient Name','HAR','MRN','Visit ID','Admit — Discharge','Principle Dx','Billed DRG'].map(h => (
                    <TableCell key={h} sx={{ py: '12px', px: 2, whiteSpace: 'nowrap' }}>{h}</TableCell>
                  ))}
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {searchResults.map((enc) => (
                  <TableRow key={enc.id} sx={{ cursor: 'default', verticalAlign: 'top' }}>
                    <TableCell sx={{ py: '12px', pl: 2, pr: 2 }}>
                      <Typography sx={{ fontSize: 'var(--font-sizes-table-cell-font-size)', color: 'var(--colors-text-primary)', whiteSpace: 'nowrap' }}>{enc.patientName}</Typography>
                      <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'var(--colors-text-secondary)', whiteSpace: 'nowrap' }}>{enc.dob}</Typography>
                    </TableCell>
                    <TableCell sx={{ py: '12px', px: 2, whiteSpace: 'nowrap' }}><CodeValue value={enc.har} label="HAR" /></TableCell>
                    <TableCell sx={{ py: '12px', px: 2, whiteSpace: 'nowrap' }}><CodeValue value={enc.mrn} label="MRN" /></TableCell>
                    <TableCell sx={{ py: '12px', px: 2, whiteSpace: 'nowrap' }}><CodeValue value={enc.visitId} label="Visit ID" /></TableCell>
                    <TableCell sx={{ py: '12px', px: 2, whiteSpace: 'nowrap' }}>{enc.admit} — {enc.discharge}</TableCell>
                    <TableCell sx={{ py: '12px', px: 2, maxWidth: 160 }}>
                      <Tooltip title={`${enc.dxCode} — ${enc.dxName}`} placement="top" arrow>
                        <Box>
                          <Typography sx={{ fontSize: 'var(--font-sizes-table-cell-font-size)', color: 'var(--colors-text-primary)', whiteSpace: 'nowrap' }}>{enc.dxCode}</Typography>
                          <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'var(--colors-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>{enc.dxName}</Typography>
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ py: '12px', px: 2, whiteSpace: 'nowrap' }}>{enc.billedDrg}</TableCell>
                    <TableCell sx={{ py: '12px', textAlign: 'right', pr: 2 }}>
                      <Button size="small" onClick={() => onSelect(enc)}
                        sx={{ fontSize: '0.8125rem', p: 0, minWidth: 0, whiteSpace: 'nowrap' }}>
                        Select
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {searchResults.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ py: 4, textAlign: 'center', color: 'var(--colors-text-secondary)', fontSize: '0.875rem' }}>
                      No encounters found. Try a different search term.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </>
      )}
    </Box>
  );
}

// ─── EditFormContent ──────────────────────────────────────────────────────────

function EditFormContent({ caseData, dispatch }) {
  const [denialType, setDenialType]           = useState(caseData.type === 'Medical Necessity' ? 'level_of_service' : 'denied_diagnosis');
  const [level, setLevel]                     = useState(caseData.level || 'Level 2');
  const [payer, setPayer]                     = useState(caseData.payer || '');
  const [payerRationale, setPayerRationale]   = useState(caseData.additionalRemarks || '');
  const [drgType, setDrgType]                 = useState('msdrg');
  const [drgReviewType, setDrgReviewType]     = useState('Clinical Validation Review');
  const [diagAdjustments, setDiagAdjustments] = useState({ 0: 'Removed', 1: 'Removed', 2: 'Removed', 3: 'Changed to Principal', 4: 'Unchanged', 5: 'Unchanged' });
  const [deadlineISO, setDeadlineISO]         = useState(toISO(caseData.appealDeadline));
  const [hasChanges, setHasChanges]           = useState(false);
  const [caseInfoEditing, setCaseInfoEditing] = useState(false);
  const [selectedEncId, setSelectedEncId]     = useState('SE1');

  const markChanged = () => setHasChanges(true);
  const activeEnc = FIND_ENCOUNTER_LOOKUP.find(e => e.id === selectedEncId) || FIND_ENCOUNTER_LOOKUP[0];

  const caseIdentifiers = [
    { label: 'Name',          value: activeEnc.patientName },
    { label: 'Date of Birth', value: activeEnc.dob         },
    { label: 'HAR',           value: activeEnc.har         },
    { label: 'MRN',           value: activeEnc.mrn         },
    { label: 'Visit ID',      value: activeEnc.visitId     },
    { label: 'Discharged',    value: activeEnc.discharge   },
  ];

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {hasChanges && (
        <Box sx={{ bgcolor: '#E3F2FD', borderBottom: '1px solid rgba(25,118,210,0.3)', px: 3, py: '8px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AutorenewIcon sx={{ fontSize: 18, color: '#1976D2' }} />
          <Typography sx={{ fontSize: '0.875rem', color: 'rgba(0,0,0,0.87)', flex: 1 }}>Changes will regenerate the letter</Typography>
          <Chip label="Unsaved" size="small" sx={{ bgcolor: '#1976D2', color: '#fff', fontWeight: 500, fontSize: '0.75rem', height: 24 }} />
        </Box>
      )}

      <Box sx={{ flex: 1, overflowY: 'auto', bgcolor: '#F6F8FA' }}>
        <Box sx={{ width: '100%', px: 3, py: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Box>
            <Typography sx={{ fontSize: '1.375rem', fontWeight: 600, color: '#272727', letterSpacing: '-0.01em' }}>
              Edit Denial Details
            </Typography>
          </Box>

          {/* Encounter section */}
          <Box sx={{ bgcolor: '#fff', border: '1px solid #E5E5E5', borderRadius: '8px', boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <Box sx={{ px: 3, py: 1.75, bgcolor: '#FAFAFA', borderBottom: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'rgba(0,0,0,0.54)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Encounter</Typography>
              {!caseInfoEditing && (
                <Button startIcon={<EditIcon sx={{ fontSize: '17px !important' }} />} size="small" onClick={() => setCaseInfoEditing(true)}
                  sx={{ fontSize: '0.8125rem', p: 0, minWidth: 0 }}>
                  Edit
                </Button>
              )}
            </Box>
            <Box sx={{ px: 3, py: 2.5 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px 24px' }}>
                {caseIdentifiers.map(({ label, value }) => (
                  <Box key={label}>
                    <Typography sx={{ fontSize: '0.6875rem', color: 'rgba(0,0,0,0.54)', letterSpacing: '0.4px', lineHeight: 1.66, mb: 0.25 }}>{label}</Typography>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: 'rgba(0,0,0,0.87)', lineHeight: 1.43 }}>{value || '—'}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
            {caseInfoEditing && (
              <Box sx={{ borderTop: '1px solid #E5E5E5' }}>
                <EncounterSearchPanel
                  activeEncId={selectedEncId}
                  encounters={FIND_ENCOUNTER_LOOKUP}
                  onSelect={(enc) => { setSelectedEncId(enc.id); setCaseInfoEditing(false); markChanged(); }}
                  onCancel={() => setCaseInfoEditing(false)}
                />
              </Box>
            )}
          </Box>

          {/* Denial Details section */}
          <Box sx={{ bgcolor: '#fff', border: '1px solid #E5E5E5', borderRadius: '8px', boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <Box sx={{ px: 3, py: 1.75, bgcolor: '#FAFAFA', borderBottom: '1px solid #F0F0F0' }}>
              <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'rgba(0,0,0,0.54)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Denial Details</Typography>
            </Box>
            <Box sx={{ px: 3, py: 3 }}>
              <Box sx={{ display: 'flex', gap: 0, flexWrap: 'wrap', alignItems: 'stretch' }}>
                <Box sx={{ flex: '1 0 220px', display: 'flex', flexDirection: 'column', gap: 3, pr: 4 }}>
                  <Box sx={{ display: 'flex', gap: 3 }}>
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                      <Typography sx={{ fontSize: '0.875rem', color: '#616161' }}>Level</Typography>
                      <FormControl size="small" fullWidth>
                        <Select value={level} onChange={(e) => { setLevel(e.target.value); markChanged(); }}>
                          {LEVEL_OPTIONS.map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Box>
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                      <Typography sx={{ fontSize: '0.875rem', color: '#616161' }}>Appeal Deadline</Typography>
                      <TextField size="small" type="date" fullWidth value={deadlineISO}
                        onChange={(e) => { setDeadlineISO(e.target.value); dispatch({ type: 'SET_APPEAL_DEADLINE', payload: toDisplay(e.target.value) }); markChanged(); }} />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    <Typography sx={{ fontSize: '0.875rem', color: '#616161' }}>Payer</Typography>
                    <FormControl size="small" fullWidth>
                      <Select value={payer} onChange={(e) => { setPayer(e.target.value); markChanged(); }}>
                        <MenuItem value={caseData.payer}>{caseData.payer}</MenuItem>
                        <MenuItem value="Blue Cross Blue Shield of Michigan">Blue Cross Blue Shield of Michigan</MenuItem>
                        <MenuItem value="Aetna">Aetna</MenuItem>
                        <MenuItem value="United Healthcare">United Healthcare</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    <Typography sx={{ fontSize: '0.875rem', color: '#616161' }}>Denial Type</Typography>
                    <RadioGroup value={denialType} onChange={(e) => { setDenialType(e.target.value); markChanged(); }}>
                      <FormControlLabel value="denied_diagnosis" control={<Radio size="small" />} label={<Typography sx={{ fontSize: '0.9375rem' }}>Denied Diagnosis</Typography>} />
                      <FormControlLabel value="level_of_service" control={<Radio size="small" />} label={<Typography sx={{ fontSize: '0.9375rem' }}>Level of Service Medical Necessity</Typography>} />
                    </RadioGroup>
                  </Box>
                  {caseData.type !== 'Medical Necessity' && denialType !== 'level_of_service' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                      <Typography sx={{ fontSize: '0.875rem', color: '#616161' }}>DRG Review Type</Typography>
                      <FormControl size="small" fullWidth>
                        <Select value={drgReviewType} onChange={(e) => { setDrgReviewType(e.target.value); markChanged(); }}>
                          {DRG_REVIEW_TYPE_OPTIONS.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Box>
                  )}
                </Box>
                <Box sx={{ width: '1px', bgcolor: '#E5E5E5', alignSelf: 'stretch', flexShrink: 0 }} />
                <Box sx={{ flex: '1 0 220px', display: 'flex', flexDirection: 'column', pl: 4 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, flex: 1 }}>
                    <Typography sx={{ fontSize: '0.875rem', color: '#616161' }}>Payer Rationale</Typography>
                    <TextField multiline fullWidth size="small" value={payerRationale}
                      onChange={(e) => { setPayerRationale(e.target.value); markChanged(); }}
                      placeholder="Enter the payer's rationale for denial…"
                      sx={{ flex: 1, '& .MuiOutlinedInput-root': { height: '100%', alignItems: 'flex-start' }, '& .MuiInputBase-inputMultiline': { height: '100% !important', boxSizing: 'border-box', overflow: 'auto !important' } }} />
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* DRG section — hidden for Medical Necessity denial types */}
          {caseData.type !== 'Medical Necessity' && denialType !== 'level_of_service' && (
            <Box sx={{ bgcolor: '#fff', border: '1px solid #E5E5E5', borderRadius: '8px', boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <Box sx={{ px: 3, py: 1.75, bgcolor: '#FAFAFA', borderBottom: '1px solid #F0F0F0' }}>
                <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'rgba(0,0,0,0.54)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>DRG</Typography>
              </Box>
              <Box sx={{ px: 3, py: 3, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Box sx={{ flex: 1, bgcolor: '#FAFAFA', border: '1px solid #E5E5E5', borderRadius: '8px', px: 3, py: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontWeight: 500, fontSize: '1rem', color: '#171717' }}>Billed DRG</Typography>
                      <RadioGroup row value={drgType} onChange={(e) => { setDrgType(e.target.value); markChanged(); }}>
                        <FormControlLabel value="msdrg"  control={<Radio size="small" />} label={<Typography sx={{ fontSize: '0.875rem' }}>MSDRG</Typography>} />
                        <FormControlLabel value="aprdrg" control={<Radio size="small" />} label={<Typography sx={{ fontSize: '0.875rem' }}>APRDRG</Typography>} />
                      </RadioGroup>
                    </Box>
                    <TextField size="small" fullWidth defaultValue="871 – Septicemia or Severe Sepsis without MV >96 Hours with MCC" onChange={markChanged}
                      sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fff' } }}
                      InputProps={{ endAdornment: <InputAdornment position="end"><Chip label="MCC" size="small" sx={{ bgcolor: 'rgba(0,0,0,0.08)', height: 22, fontSize: '0.8125rem', borderRadius: '100px' }} /></InputAdornment> }} />
                  </Box>
                  <ArrowForwardIcon sx={{ color: 'rgba(0,0,0,0.87)', fontSize: 28, flexShrink: 0 }} />
                  <Box sx={{ flex: 1, bgcolor: '#FFF4E5', border: '1px solid #E5E5E5', borderRadius: '8px', px: 3, py: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography sx={{ fontWeight: 500, fontSize: '1rem', color: '#171717' }}>Payer Adjusted DRG</Typography>
                    <TextField size="small" fullWidth defaultValue="194 – Simple Pneumonia and Pleurisy with CC" onChange={markChanged}
                      sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fff' } }}
                      InputProps={{ endAdornment: <InputAdornment position="end"><Chip label="Base" size="small" sx={{ bgcolor: '#EF6C00', color: '#fff', height: 22, fontSize: '0.8125rem', borderRadius: '100px' }} /></InputAdornment> }} />
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography sx={{ fontSize: '1rem', fontWeight: 500, color: 'rgba(0,0,0,0.87)', mb: 0.25 }}>Adjusted Diagnoses</Typography>
                    <Typography sx={{ fontSize: '0.875rem', color: 'rgba(0,0,0,0.6)', lineHeight: 1.5 }}>
                      Review the payer's adjustment for each diagnosis. Use the dropdown to update any row.
                    </Typography>
                  </Box>
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '4px' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#FAFAFA' }}>
                          <TableCell sx={{ fontWeight: 500, fontSize: '0.875rem', color: 'rgba(0,0,0,0.87)', py: '10px' }}>Diagnosis Code</TableCell>
                          <TableCell sx={{ fontWeight: 500, fontSize: '0.875rem', color: 'rgba(0,0,0,0.87)', width: 150, py: '10px' }}>Billed</TableCell>
                          <TableCell sx={{ fontWeight: 500, fontSize: '0.875rem', color: 'rgba(0,0,0,0.87)', width: 204, py: '10px' }}>Payer Adjustment</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {EDIT_DIAGNOSES.map((d) => {
                          const val = diagAdjustments[d.id] ?? d.defaultAdj;
                          const isChanged = val !== 'Unchanged';
                          return (
                            <TableRow key={d.id}>
                              <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.06)', py: 2 }}>
                                <Typography sx={{ fontSize: '0.875rem', lineHeight: 1.5, pl: '4px' }}>
                                  <Box component="span" sx={{ fontWeight: 500, color: 'rgba(0,0,0,0.87)' }}>{d.code}</Box>
                                  {' '}
                                  <Box component="span" sx={{ color: 'rgba(0,0,0,0.54)' }}>{d.name}</Box>
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.06)', width: 150, py: 2 }}>
                                {d.billedLabel && (
                                  <Chip label={d.billedLabel} size="small"
                                    sx={{ bgcolor: 'rgba(0,0,0,0.08)', color: 'rgba(0,0,0,0.87)', fontSize: '0.8125rem', fontWeight: 400, height: 28, borderRadius: '100px' }} />
                                )}
                              </TableCell>
                              <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.06)', width: 204, py: 2 }}>
                                <Select size="small" value={val}
                                  onChange={(e) => { setDiagAdjustments((prev) => ({ ...prev, [d.id]: e.target.value })); markChanged(); }}
                                  sx={{
                                    bgcolor: '#fff',
                                    color: isChanged ? '#EF6C00' : 'rgba(0,0,0,0.87)',
                                    fontSize: '0.8125rem', fontWeight: 400, height: 32, borderRadius: '100px',
                                    '.MuiOutlinedInput-notchedOutline': { border: isChanged ? '1px solid #EF6C00' : '1px solid rgba(0,0,0,0.23)' },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: isChanged ? '1px solid #EF6C00' : '1px solid rgba(0,0,0,0.23)' },
                                    '.MuiSelect-icon': { color: isChanged ? '#EF6C00' : 'rgba(0,0,0,0.54)', fontSize: '1.25rem' },
                                    '.MuiSelect-select': { py: '4px', pl: '10px', pr: '28px !important' },
                                  }}>
                                  {PAYER_ADJ_OPTIONS.map((opt) => (
                                    <MenuItem key={opt} value={opt} sx={{ fontSize: '0.875rem' }}>{opt}</MenuItem>
                                  ))}
                                </Select>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Button startIcon={<AddIcon sx={{ fontSize: '18px !important' }} />}
                    sx={{ fontSize: '0.875rem', p: 0, alignSelf: 'flex-start' }}>
                    Add Diagnosis Code
                  </Button>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography sx={{ fontSize: '1rem', fontWeight: 500, color: 'rgba(0,0,0,0.87)' }}>Adjusted Procedures</Typography>
                  <Button startIcon={<AddIcon sx={{ fontSize: '18px !important' }} />}
                    sx={{ fontSize: '0.875rem', p: 0, alignSelf: 'flex-start' }}>
                    Add Procedure
                  </Button>
                </Box>
              </Box>
            </Box>
          )}

          <Box sx={{ height: 24 }} />
        </Box>
      </Box>

      <Box sx={{ bgcolor: '#fff', borderTop: '1px solid #E0E0E0', px: 4, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1.5, flexShrink: 0, boxShadow: '0 -2px 8px rgba(0,0,0,0.06)' }}>
        <Button variant="outlined" onClick={() => dispatch({ type: 'NAV_TO_CASE' })}
          sx={{ fontSize: '0.9375rem', px: 2.5 }}>
          Back to Letter
        </Button>
        <Button variant="contained"
          onClick={() => { dispatch({ type: 'SAVE_DENIAL_DETAILS' }); dispatch({ type: 'SHOW_SNACKBAR', payload: 'Saving denial details and regenerating letter…' }); }}
          sx={{ fontSize: '0.9375rem', px: 2.5 }}>
          Save and Generate Letter
        </Button>
      </Box>
    </Box>
  );
}

// ─── FindEncounterPage ────────────────────────────────────────────────────────

export function FindEncounterPage({ onSelect, onCancel }) {
  const [searchField, setSearchField]     = useState('HAR');
  const [searchQuery, setSearchQuery]     = useState('');
  const [searching, setSearching]         = useState(false);
  const [hasSearched, setHasSearched]     = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const runSearch = () => {
    const q = searchQuery.trim().toLowerCase();
    setSearching(true);
    setHasSearched(true);
    setTimeout(() => {
      const results = q
        ? FIND_ENCOUNTER_LOOKUP.filter(enc => {
            if (searchField === 'HAR')  return enc.har.toLowerCase().includes(q);
            if (searchField === 'MRN')  return enc.mrn.toLowerCase().includes(q);
            return enc.patientName.toLowerCase().includes(q);
          })
        : FIND_ENCOUNTER_LOOKUP;
      setSearchResults(results);
      setSearching(false);
    }, 1500);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#F6F8FA', overflow: 'hidden' }}>
      <AppNav />
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <Box sx={{ maxWidth: 960, mx: 'auto', width: '100%', px: 3, pt: 4, pb: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3.5 }}>
            <Button startIcon={<ArrowBackIcon sx={{ fontSize: '18px !important' }} />} onClick={onCancel}
              sx={{ fontSize: '0.875rem', p: 0, minWidth: 0 }}>
              Back to Worklist
            </Button>
            <Button onClick={onCancel} sx={{ fontSize: '0.875rem' }}>Cancel</Button>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: 'rgba(0,0,0,0.87)', lineHeight: 1.4 }}>New Denial</Typography>
            <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(0,0,0,0.54)', mt: 0.5 }}>Step 1 of 2 · Find the Encounter for the Denial</Typography>
          </Box>

          <Box sx={{ bgcolor: '#fff', border: '1px solid #E5E5E5', borderRadius: '8px', p: 3, mb: hasSearched ? 3 : 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <FormControl size="small" sx={{ width: 200 }}>
                <InputLabel>Identifier</InputLabel>
                <Select value={searchField} label="Identifier" onChange={(e) => setSearchField(e.target.value)}>
                  <MenuItem value="HAR">HAR</MenuItem>
                  <MenuItem value="Patient Name">Patient Name</MenuItem>
                  <MenuItem value="MRN">MRN</MenuItem>
                </Select>
              </FormControl>
              <TextField size="small" label={searchField} value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') runSearch(); }}
                sx={{ width: 300 }} />
              <Button variant="contained" onClick={runSearch} sx={{ flexShrink: 0, px: 3, height: 40 }}>Search</Button>
            </Box>
            <Button startIcon={<AddIcon sx={{ fontSize: '16px !important' }} />} size="small"
              sx={{ color: 'var(--colors-ocean-4)', fontSize: '0.8125rem', fontWeight: 500, p: 0, minWidth: 0, mb: 2.5, '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}>
              Add identifier
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, bgcolor: 'var(--colors-blue-1)', borderRadius: '6px', p: 1.5 }}>
              <InfoOutlinedIcon sx={{ color: 'var(--colors-blue-4)', fontSize: 16, mt: '1px', flexShrink: 0 }} />
              <Typography sx={{ fontSize: '0.8125rem', color: 'var(--colors-text-primary)', lineHeight: 1.55 }}>
                <strong>Tip:</strong> Try searching by HAR/FIN from the denial letter. If unavailable, use full patient name or MRN.
              </Typography>
            </Box>
          </Box>

          {hasSearched && (
            searching ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}><CircularProgress size={32} /></Box>
            ) : (
              <>
                <Typography sx={{ fontSize: '0.8125rem', color: 'var(--colors-text-secondary)', mb: 1.5 }}>
                  Displaying {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                </Typography>
                {searchResults.length > 0 ? (
                  <Box sx={{ bgcolor: 'var(--colors-table-row-background)', border: '1px solid var(--colors-table-layout-border)', borderRadius: '8px', overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: 860 }}>
                      <TableHead>
                        <TableRow>
                          {['Patient Name','HAR','MRN','Visit ID','Admit — Discharge','Principle Dx','Billed DRG'].map(h => (
                            <TableCell key={h} sx={{ py: '12px', px: 2, whiteSpace: 'nowrap' }}>{h}</TableCell>
                          ))}
                          <TableCell />
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {searchResults.map((enc) => (
                          <TableRow key={enc.id} sx={{ cursor: 'default', verticalAlign: 'top' }}>
                            <TableCell sx={{ py: '12px', pl: 2, pr: 2 }}>
                              <Typography sx={{ fontSize: 'var(--font-sizes-table-cell-font-size)', color: 'var(--colors-text-primary)', whiteSpace: 'nowrap' }}>{enc.patientName}</Typography>
                              <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'var(--colors-text-secondary)', whiteSpace: 'nowrap' }}>{enc.dob}</Typography>
                            </TableCell>
                            <TableCell sx={{ py: '12px', px: 2, whiteSpace: 'nowrap' }}><CodeValue value={enc.har} label="HAR" /></TableCell>
                            <TableCell sx={{ py: '12px', px: 2, whiteSpace: 'nowrap' }}><CodeValue value={enc.mrn} label="MRN" /></TableCell>
                            <TableCell sx={{ py: '12px', px: 2, whiteSpace: 'nowrap' }}><CodeValue value={enc.visitId} label="Visit ID" /></TableCell>
                            <TableCell sx={{ py: '12px', px: 2, whiteSpace: 'nowrap' }}>{enc.admit} — {enc.discharge}</TableCell>
                            <TableCell sx={{ py: '12px', px: 2, maxWidth: 160 }}>
                              <Tooltip title={`${enc.dxCode} — ${enc.dxName}`} placement="top" arrow>
                                <Box>
                                  <Typography sx={{ fontSize: 'var(--font-sizes-table-cell-font-size)', color: 'var(--colors-text-primary)', whiteSpace: 'nowrap' }}>{enc.dxCode}</Typography>
                                  <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'var(--colors-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>{enc.dxName}</Typography>
                                </Box>
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={{ py: '12px', px: 2, whiteSpace: 'nowrap' }}>{enc.billedDrg}</TableCell>
                            <TableCell sx={{ py: '12px', textAlign: 'right', pr: 2 }}>
                              <Button size="small" onClick={() => onSelect(enc)}
                                sx={{ color: 'var(--colors-ocean-4)', fontSize: '0.8125rem', fontWeight: 500, p: 0, minWidth: 0, whiteSpace: 'nowrap', '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}>
                                Select
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 6, bgcolor: 'var(--colors-table-row-background)', border: '1px solid var(--colors-table-layout-border)', borderRadius: '8px' }}>
                    <Typography sx={{ fontSize: '0.9375rem', color: 'var(--colors-text-secondary)' }}>
                      No encounters found. Try a different search term or identifier.
                    </Typography>
                  </Box>
                )}
              </>
            )
          )}
        </Box>
      </Box>
    </Box>
  );
}

// ─── NewDenialDetailsPage ─────────────────────────────────────────────────────

export function NewDenialDetailsPage({ selectedEncounter, onBack, onCancel }) {
  const [denialType, setDenialType]         = useState('denied_diagnosis');
  const [level, setLevel]                   = useState('Level 2');
  const [payer, setPayer]                   = useState('');
  const [payerRationale, setPayerRationale] = useState('');
  const [drgReviewType, setDrgReviewType]   = useState('Clinical Validation Review');
  const [deadlineISO, setDeadlineISO]       = useState('');

  const caseIdentifiers = [
    { label: 'Name',          value: selectedEncounter?.patientName ?? '—' },
    { label: 'Date of Birth', value: selectedEncounter?.dob         ?? '—' },
    { label: 'HAR',           value: selectedEncounter?.har         ?? '—' },
    { label: 'MRN',           value: selectedEncounter?.mrn         ?? '—' },
    { label: 'Visit ID',      value: selectedEncounter?.visitId     ?? '—' },
    { label: 'Discharged',    value: selectedEncounter?.discharge   ?? '—' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#F6F8FA', overflow: 'hidden' }}>
      <AppNav />
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <Box sx={{ maxWidth: 960, mx: 'auto', width: '100%', px: 3, pt: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3.5 }}>
            <Button startIcon={<ArrowBackIcon sx={{ fontSize: '18px !important' }} />} onClick={onBack}
              sx={{ color: 'var(--colors-ocean-4)', fontSize: '0.875rem', fontWeight: 500, p: 0, minWidth: 0, '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}>
              Find Encounter
            </Button>
            <Button onClick={onCancel} sx={{ color: 'var(--colors-ocean-4)', fontSize: '0.875rem', fontWeight: 500 }}>Cancel</Button>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: 'rgba(0,0,0,0.87)', lineHeight: 1.4 }}>New Denial</Typography>
            <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(0,0,0,0.54)', mt: 0.5 }}>Step 2 of 2 · Enter Denial Details</Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Box sx={{ bgcolor: '#fff', border: '1px solid #E5E5E5', borderRadius: '8px', boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <Box sx={{ px: 3, py: 1.75, bgcolor: '#FAFAFA', borderBottom: '1px solid #F0F0F0' }}>
                <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'rgba(0,0,0,0.54)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Encounter</Typography>
              </Box>
              <Box sx={{ px: 3, py: 2.5 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px 24px' }}>
                  {caseIdentifiers.map(({ label, value }) => (
                    <Box key={label}>
                      <Typography sx={{ fontSize: '0.6875rem', color: 'rgba(0,0,0,0.54)', letterSpacing: '0.4px', lineHeight: 1.66, mb: 0.25 }}>{label}</Typography>
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: 'rgba(0,0,0,0.87)', lineHeight: 1.43 }}>{value}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>

            <Box sx={{ bgcolor: '#fff', border: '1px solid #E5E5E5', borderRadius: '8px', boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <Box sx={{ px: 3, py: 1.75, bgcolor: '#FAFAFA', borderBottom: '1px solid #F0F0F0' }}>
                <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'rgba(0,0,0,0.54)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Denial Details</Typography>
              </Box>
              <Box sx={{ px: 3, py: 3 }}>
                <Box sx={{ display: 'flex', gap: 0, flexWrap: 'wrap', alignItems: 'stretch' }}>
                  <Box sx={{ flex: '1 0 220px', display: 'flex', flexDirection: 'column', gap: 3, pr: 4 }}>
                    <Box sx={{ display: 'flex', gap: 3 }}>
                      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                        <Typography sx={{ fontSize: '0.875rem', color: '#616161' }}>Level</Typography>
                        <FormControl size="small" fullWidth>
                          <Select value={level} onChange={(e) => setLevel(e.target.value)}>
                            {LEVEL_OPTIONS.map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                          </Select>
                        </FormControl>
                      </Box>
                      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                        <Typography sx={{ fontSize: '0.875rem', color: '#616161' }}>Appeal Deadline</Typography>
                        <TextField size="small" type="date" fullWidth value={deadlineISO} onChange={(e) => setDeadlineISO(e.target.value)} />
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                      <Typography sx={{ fontSize: '0.875rem', color: '#616161' }}>Payer</Typography>
                      <FormControl size="small" fullWidth>
                        <Select value={payer} onChange={(e) => setPayer(e.target.value)} displayEmpty
                          renderValue={payer ? undefined : () => <span style={{ color: 'rgba(0,0,0,0.38)' }}>Select payer</span>}>
                          <MenuItem value="Blue Cross Blue Shield of Michigan">Blue Cross Blue Shield of Michigan</MenuItem>
                          <MenuItem value="Aetna">Aetna</MenuItem>
                          <MenuItem value="United Healthcare">United Healthcare</MenuItem>
                          <MenuItem value="Cigna">Cigna</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                      <Typography sx={{ fontSize: '0.875rem', color: '#616161' }}>Denial Type</Typography>
                      <RadioGroup value={denialType} onChange={(e) => setDenialType(e.target.value)}>
                        <FormControlLabel value="denied_diagnosis" control={<Radio size="small" />} label={<Typography sx={{ fontSize: '0.9375rem' }}>Denied Diagnosis</Typography>} />
                        <FormControlLabel value="level_of_service" control={<Radio size="small" />} label={<Typography sx={{ fontSize: '0.9375rem' }}>Level of Service Medical Necessity</Typography>} />
                      </RadioGroup>
                    </Box>
                  </Box>
                  <Box sx={{ width: '1px', bgcolor: '#E5E5E5', alignSelf: 'stretch', flexShrink: 0 }} />
                  <Box sx={{ flex: '1 0 220px', display: 'flex', flexDirection: 'column', pl: 4 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, flex: 1 }}>
                      <Typography sx={{ fontSize: '0.875rem', color: '#616161' }}>Payer Rationale</Typography>
                      <TextField multiline fullWidth size="small" value={payerRationale}
                        onChange={(e) => setPayerRationale(e.target.value)}
                        placeholder="Enter the payer's rationale for denial…"
                        sx={{ flex: 1, '& .MuiOutlinedInput-root': { height: '100%', alignItems: 'flex-start' }, '& .MuiInputBase-inputMultiline': { height: '100% !important', boxSizing: 'border-box', overflow: 'auto !important' } }} />
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>

            <Box sx={{ height: 48 }} />
          </Box>
        </Box>
      </Box>

      <Box sx={{ bgcolor: '#fff', borderTop: '1px solid #E0E0E0', px: 4, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1.5, flexShrink: 0, boxShadow: '0 -2px 8px rgba(0,0,0,0.06)' }}>
        <Button variant="outlined" onClick={onBack}
          sx={{ fontSize: '0.9375rem', px: 2.5 }}>
          Back
        </Button>
        <Button variant="contained" onClick={onCancel}
          sx={{ fontSize: '0.9375rem', px: 2.5 }}>
          Create Denial
        </Button>
      </Box>
    </Box>
  );
}

// ─── RegeneratingContent ──────────────────────────────────────────────────────

function RegeneratingContent({ dispatch }) {
  useEffect(() => {
    const timer = setTimeout(() => dispatch({ type: 'REGEN_COMPLETE' }), 2000);
    return () => clearTimeout(timer);
  }, [dispatch]);

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#F6F8FA' }}>
      <CircularProgress size={48} color="primary" />
      <Typography sx={{ mt: 3, fontSize: '1rem', color: '#424242', fontWeight: 500 }}>Regenerating appeal letter…</Typography>
      <Typography sx={{ mt: 1, fontSize: '0.875rem', color: '#757575' }}>Based on your updated denial details</Typography>
    </Box>
  );
}

// ─── RestoringContent ─────────────────────────────────────────────────────────

function RestoringContent({ dispatch }) {
  useEffect(() => {
    const timer = setTimeout(() => dispatch({ type: 'RESTORE_COMPLETE' }), 1500);
    return () => clearTimeout(timer);
  }, [dispatch]);

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#F6F8FA' }}>
      <CircularProgress size={48} color="primary" />
      <Typography sx={{ mt: 3, fontSize: '1rem', color: '#424242', fontWeight: 500 }}>Restoring version…</Typography>
      <Typography sx={{ mt: 1, fontSize: '0.875rem', color: '#757575' }}>Loading the selected draft</Typography>
    </Box>
  );
}

// ─── StepIndicator ────────────────────────────────────────────────────────────

function VersionStepIndicator({ num, stepState, isPaused }) {
  if (stepState === 'complete') {
    return (
      <Box sx={{ width: 16, height: 16, borderRadius: '50%', border: '1.5px solid #1976D2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <CheckIcon sx={{ fontSize: 10, color: '#1976D2' }} />
      </Box>
    );
  }
  if (stepState === 'active') {
    return (
      <Box sx={{ position: 'relative', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {!isPaused && <CircularProgress size={18} thickness={2.5} sx={{ color: '#1976D2', position: 'absolute', top: 0, left: 0 }} />}
        {isPaused && <Box sx={{ width: 18, height: 18, borderRadius: '50%', border: '1.5px solid #1976D2', position: 'absolute', top: 0, left: 0 }} />}
        <Typography sx={{ fontSize: '9.6px', fontWeight: 600, color: '#1976D2', lineHeight: 1, position: 'relative' }}>
          {num}
        </Typography>
      </Box>
    );
  }
  return <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: '#E0E0E0', flexShrink: 0 }} />;
}

// ─── VersionProgressCard ──────────────────────────────────────────────────────

function VersionProgressCard({ hasAttachments, isPaused }) {
  const steps = hasAttachments
    ? [
        { num: 1, label: 'Processing attachments', state: 'complete' },
        { num: 2, label: 'Writing new version',    state: 'active'   },
      ]
    : [
        { num: 1, label: 'Applying your instructions', state: 'complete' },
        { num: 2, label: 'Writing new version',        state: 'active'   },
      ];

  return (
    <Box sx={{ bgcolor: '#fff', border: '1px solid #E5E5E5', borderRadius: '8px', boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)', px: '25px', py: 2 }}>
      <Typography sx={{ fontSize: '1rem', color: 'rgba(0,0,0,0.87)', mb: 2 }}>
        Progress
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {steps.map(({ num, label, state }) => (
          <Box key={num} sx={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <VersionStepIndicator num={num} stepState={state} isPaused={isPaused} />
            <Typography sx={{ fontSize: '0.875rem', fontWeight: state === 'active' ? 500 : 400, color: 'rgba(0,0,0,0.87)', lineHeight: 1.43 }}>
              {label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// ─── GeneratingVersionContent ─────────────────────────────────────────────────

function GeneratingVersionContent({ dispatch, hasAttachments = false, isPaused = false }) {
  useEffect(() => {
    if (isPaused) return;
    const timer = setTimeout(() => dispatch({ type: 'VERSION_GENERATED' }), 4000);
    return () => clearTimeout(timer);
  }, [dispatch, isPaused]);

  return (
    <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2.5, bgcolor: '#F6F8FA' }}>
      <VersionProgressCard hasAttachments={hasAttachments} isPaused={isPaused} />
    </Box>
  );
}

// ─── VersionHistoryLayout ─────────────────────────────────────────────────────

function VersionHistoryLayout({ selectedVersionId, onSelectVersion, onBack, onRestore }) {
  const selectedVersion = MOCK_VERSIONS.find(v => v.id === selectedVersionId) || MOCK_VERSIONS[0];

  return (
    <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: '#F6F8FA' }}>
        <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #E0E0E0', px: 3, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <Button variant="outlined" startIcon={<ChevronLeftIcon sx={{ fontSize: '18px !important', mr: '-4px' }} />} onClick={onBack} size="small"
            sx={{ fontSize: '0.8125rem', px: 1.5 }}>
            Back to Current Draft
          </Button>
          <Button variant="contained" startIcon={<RestoreIcon sx={{ fontSize: '18px !important' }} />}
            onClick={() => onRestore(selectedVersion.content)} size="small"
            sx={{ fontSize: '0.8125rem', px: 1.5 }}>
            Restore This Draft
          </Button>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2.5 }}>
          <Box sx={{ bgcolor: '#fff', border: '1px solid #D3D3D3', borderRadius: '2px', px: '20px', py: '14px', maxWidth: 820, mx: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div
              dangerouslySetInnerHTML={{ __html: selectedVersion.content }}
              style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', lineHeight: '1.5', color: '#616161', minHeight: 560 }}
            />
          </Box>
          <Typography sx={{ color: '#6E6E6E', fontSize: '0.75rem', fontStyle: 'italic', mt: 2, textAlign: 'center' }}>
            AI-generated rationale; please review for accuracy and completeness
          </Typography>
        </Box>
      </Box>

      <Box sx={{ width: 360, flexShrink: 0, bgcolor: '#fff', borderLeft: '1px solid #E0E0E0', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid #E0E0E0', flexShrink: 0 }}>
          <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#212121' }}>Version History</Typography>
        </Box>
        <Box sx={{ px: 1.5, py: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {MOCK_VERSIONS.map((v) => {
            const isSelected = v.id === selectedVersionId;
            return (
              <Tooltip key={v.id} title={`Last saved at ${v.time} by ${v.author}`} placement="left" arrow>
                <Box
                  onClick={() => onSelectVersion(v.id)}
                  sx={{
                    display: 'flex', alignItems: 'flex-start', gap: 0.5,
                    border: isSelected ? '1px solid #1976D2' : '1px solid #E0E0E0',
                    borderRadius: 1, px: 1.5, py: 1.25,
                    cursor: 'pointer',
                    bgcolor: isSelected ? 'rgba(25,118,210,0.04)' : '#fff',
                    '&:hover': { bgcolor: isSelected ? 'rgba(25,118,210,0.06)' : '#F6F8FA' },
                    transition: 'background-color 0.15s',
                  }}
                >
                  <Radio size="small" checked={isSelected} onChange={() => onSelectVersion(v.id)}
                    sx={{ p: 0, mt: '2px', mr: 0.5, flexShrink: 0 }}
                    onClick={(e) => e.stopPropagation()} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.5, mb: 0.25 }}>
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#212121' }}>{v.label}</Typography>
                      {v.isCurrentDraft && (
                        <Chip label="Current Draft" variant="outlined" size="small"
                          sx={{ fontSize: '0.6875rem', height: 20, borderColor: '#1976D2', color: '#1976D2', flexShrink: 0 }} />
                      )}
                    </Box>
                    <Typography sx={{ fontSize: '0.8125rem', color: '#616161', lineHeight: 1.4 }}>{v.time}</Typography>
                    <Typography sx={{ fontSize: '0.8125rem', color: '#616161' }}>{v.author}</Typography>
                  </Box>
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}

// ─── CasePageAiEditing (root) ─────────────────────────────────────────────────

export default function CasePageAiEditing({ onBack = () => {}, initialView = 'case', initialHasAttachments = false, isPaused = false, hideNav = false, caseRecord = null, onStatusAction = null, useInlineEditPanel = false, onEditDenialDetails = null }) {
  const [state, dispatch] = useReducer(reducer, null, () => {
    const overrides = buildCaseOverrides(caseRecord);
    const base = {
      ...initialState,
      caseData: { ...initialState.caseData, ...overrides },
      ui: { ...initialState.ui, view: initialView === 'inline-diff' ? 'case' : initialView, hasAttachments: initialHasAttachments },
    };
    if (initialView === 'inline-diff') {
      return {
        ...base,
        letter: { ...base.letter, content: INLINE_DIFF_CONTENT },
        aiEdit: { ...base.aiEdit, status: 'pending-review', pendingContent: INLINE_DIFF_CONTENT, preEditContent: MOCK_LETTER_V2 },
      };
    }
    return base;
  });
  const { caseData, ui } = state;
  const currentDraft = state.letter.versions.find(v => v.isCurrentDraft) || state.letter.versions[state.letter.versions.length - 1];
  const [selectedVersionId, setSelectedVersionId] = useState('v2');
  const [cnvOpen, setCnvOpen] = useState(false);

  const [saveStatus, setSaveStatus] = useState('saved');
  const [savedAt, setSavedAt] = useState(new Date());
  const [autosaveEnabled, setAutosaveEnabled] = useState(true);
  const [viewOnly, setViewOnly] = useState(false);
  const getEditorContentRef = useRef(null);

  const [wnsOpen, setWnsOpen] = useState(false);
  const [wnsReason, setWnsReason] = useState('');
  const [wnsComment, setWnsComment] = useState('');

  // Keep selectedVersionId pointing to current draft when a new version is generated
  useEffect(() => {
    if (currentDraft) setSelectedVersionId(currentDraft.id);
  }, [currentDraft?.id]);

  const handleManualSave = () => {
    const content = getEditorContentRef.current?.() ?? '';
    dispatch({ type: 'SAVE_LETTER', payload: content });
    setSaveStatus('saved');
    setSavedAt(new Date());
  };

  function handleStatusMenuClick(actionLabel) {
    if (actionLabel === 'Will Not Submit') {
      setWnsOpen(true);
      return;
    }
    dispatch({ type: 'SET_STATUS', payload: actionLabel });
    if (actionLabel === 'Submit')                   onStatusAction?.('submit');
    else if (actionLabel === 'Archive')             onStatusAction?.('archive');
    else if (actionLabel === 'Complete Review')     onStatusAction?.('complete-review');
    else if (actionLabel === 'Overturned')          onStatusAction?.('overturned');
    else if (actionLabel === 'Upheld - Will Appeal')     onStatusAction?.('upheld-will-appeal');
    else if (actionLabel === 'Upheld - Will Not Appeal') onStatusAction?.('upheld-will-not-appeal');
    else if (actionLabel === 'Remove Outcome')      onStatusAction?.('remove-outcome');
    else if (actionLabel === 'Return to Review')    onStatusAction?.('return-to-review');
  }

  function handleWnsConfirm() {
    dispatch({ type: 'SET_STATUS', payload: 'Will Not Submit' });
    onStatusAction?.('will-not-submit', { reason: wnsReason, comment: wnsComment });
    setWnsOpen(false);
    setWnsReason('');
    setWnsComment('');
  }

  const handleBack = () => {
    if (saveStatus === 'unsaved' || saveStatus === 'saving') {
      const content = getEditorContentRef.current?.();
      if (content) dispatch({ type: 'SAVE_LETTER', payload: content });
      setSaveStatus('saved');
      setSavedAt(new Date());
    }
    onBack();
  };

  // START_CREATE_VERSION opens the modal instead of navigating directly
  const handleCreateVersion = () => setCnvOpen(true);

  const snackbar = (
    <Snackbar
      open={ui.snackbar.open}
      autoHideDuration={2500}
      onClose={() => dispatch({ type: 'HIDE_SNACKBAR' })}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={() => dispatch({ type: 'HIDE_SNACKBAR' })} severity="success" variant="filled" sx={{ fontSize: '0.8125rem' }}>
        {ui.snackbar.message}
      </Alert>
    </Snackbar>
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {!hideNav && <AppNav />}
      <CaseHeader state={state} dispatch={dispatch} onBack={handleBack} onStatusMenuClick={handleStatusMenuClick} useInlineEditPanel={useInlineEditPanel} onEditDenialDetails={onEditDenialDetails} />
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {(ui.view === 'case' || ui.view === 'version-history') && (
            <MainContent
              state={state}
              dispatch={dispatch}
              view={ui.view}
              selectedVersionId={selectedVersionId}
              onViewVersionHistory={() => dispatch({ type: 'NAV_TO_VERSION_HISTORY' })}
              onBack={() => dispatch({ type: 'NAV_TO_CASE' })}
              onRestore={(versionId, content) => dispatch({ type: 'RESTORE_VERSION', payload: { versionId, content } })}
              saveStatus={saveStatus}
              setSaveStatus={setSaveStatus}
              savedAt={savedAt}
              setSavedAt={setSavedAt}
              getEditorContentRef={getEditorContentRef}
              autosaveEnabled={autosaveEnabled}
              viewOnly={viewOnly}
              onToggleAutosave={() => setAutosaveEnabled(v => !v)}
              onToggleViewOnly={() => setViewOnly(v => !v)}
              onManualSave={handleManualSave}
              onCreateVersion={handleCreateVersion}
              scrollToDiff={initialView === 'inline-diff'}
            />
          )}
          {ui.view === 'edit'               && <EditFormContent caseData={caseData} dispatch={dispatch} />}
          {ui.view === 'regenerating'       && <RegeneratingContent dispatch={dispatch} />}
          {ui.view === 'restoring'          && <RestoringContent dispatch={dispatch} />}
          {ui.view === 'generating-version' && <GeneratingVersionContent dispatch={dispatch} hasAttachments={ui.hasAttachments} isPaused={isPaused} />}
        </Box>
        <RightRail
          state={state}
          dispatch={dispatch}
          isCollapsed={ui.view === 'edit'}
          view={ui.view}
          selectedVersionId={selectedVersionId}
          onSelectVersion={setSelectedVersionId}
        />
        {useInlineEditPanel && ui.inlineEditPanelOpen && (
          <>
            <Box
              onClick={() => dispatch({ type: 'CLOSE_INLINE_EDIT_PANEL' })}
              sx={{
                position: 'absolute', inset: 0,
                bgcolor: 'rgba(0,0,0,0.32)',
                zIndex: 10,
                animation: 'sdxFadeIn 160ms ease-out',
                '@keyframes sdxFadeIn': { from: { opacity: 0 }, to: { opacity: 1 } },
              }}
            />
            <Box
              sx={{
                position: 'absolute', top: 0, right: 0, bottom: 0,
                width: 480, maxWidth: '100%',
                bgcolor: 'background.paper',
                boxShadow: '-8px 0 24px rgba(0,0,0,0.12)',
                zIndex: 11,
                display: 'flex', flexDirection: 'column',
                animation: 'sdxSlideInRight 220ms cubic-bezier(0.2, 0, 0, 1)',
                '@keyframes sdxSlideInRight': {
                  from: { transform: 'translateX(100%)' },
                  to:   { transform: 'translateX(0)' },
                },
              }}
            >
              <CaseEditDenialDetailsPanel
                caseData={caseData}
                onClose={() => dispatch({ type: 'CLOSE_INLINE_EDIT_PANEL' })}
              />
            </Box>
          </>
        )}
      </Box>
      <DeleteDenialDialog patientName={caseData.patientName} open={ui.deleteDialogOpen} dispatch={dispatch} />
      <CreateNewVersionModal
        open={cnvOpen}
        onClose={() => setCnvOpen(false)}
        onConfirm={(hasAtts) => { setCnvOpen(false); dispatch({ type: 'START_CREATE_VERSION', payload: { hasAttachments: hasAtts } }); }}
      />

      {/* ── Will Not Submit Dialog ── */}
      <Dialog open={wnsOpen} onClose={() => setWnsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          Reason for Not Submitting
          <IconButton size="small" onClick={() => setWnsOpen(false)} sx={{ color: 'text.secondary' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          <DialogContentText sx={{ mb: 2.5, fontSize: '0.875rem' }}>
            What's the reason for not submitting the appeal?
          </DialogContentText>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Reason *</InputLabel>
            <Select value={wnsReason} onChange={e => setWnsReason(e.target.value)} label="Reason *">
              {WNS_REASONS.map(r => (
                <MenuItem key={r} value={r} sx={{ fontSize: '0.875rem' }}>{r}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Comment (optional)"
            multiline
            rows={4}
            fullWidth
            size="small"
            value={wnsComment}
            onChange={e => setWnsComment(e.target.value)}
            placeholder="Add any additional context…"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setWnsOpen(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button
            onClick={handleWnsConfirm}
            disabled={!wnsReason}
            variant="contained"
            sx={{ bgcolor: '#157d9d', '&:hover': { bgcolor: '#11647e' }, '&:disabled': { bgcolor: 'action.disabledBackground' } }}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {snackbar}
    </Box>
  );
}
