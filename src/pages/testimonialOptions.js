// Share Your Story form — approved wording and options from the developer
// build request v1.2 (approved by Veta P. Hurst, 2026-11-13). The values must
// match the insert rule in supabase/migrations/20261117120000_testimonial_form_v1_2.sql.

export const TESTIMONIAL_CONSENT_VERSION = 'Consent v3, 2026-11';
export const CONSENT_CONTACT_EMAIL = 'veta.hurst@phoenixclearinsight.com';

// M5 — internal only. "Assessment only" is feedback, not a coaching testimonial.
export const ENGAGEMENT_TYPES = [
  { value: 'clarity_intensive', label: 'Clarity Intensive' },
  { value: 'coaching_package', label: 'Coaching package' },
  { value: 'pq_program', label: 'PQ program' },
  { value: 'assessment_only', label: 'Assessment only' },
  { value: 'other', label: 'Other' },
];

// M10 — Anonymous is the default (Decision 1).
export const NAME_DISPLAY_OPTIONS = [
  { value: 'anonymous', label: 'Anonymous' },
  { value: 'first_last_initial', label: 'First name and last initial' },
  { value: 'full_name', label: 'Full name' },
];

// M11 — where a story may be used (Decision 3).
export const PLACEMENTS = [
  { value: 'client_stories', label: 'Client Stories page' },
  { value: 'social_media', label: 'Social media' },
  { value: 'sales_materials', label: 'Sales materials' },
  { value: 'case_study', label: 'Case study' },
  { value: 'speaking', label: 'Speaking' },
];

// M12 — editing choice (Decision 4).
export const EDIT_CHOICES = [
  { value: 'exact', label: 'Use my words exactly' },
  { value: 'shorten_with_approval', label: 'You may shorten them; send me the edit to approve' },
];

export const CLARITY_BANDS = ['Transitioner', 'Strategist', 'Executor', 'Phoenix'];
export const SELF_BAND_OPTIONS = [...CLARITY_BANDS, 'Not sure'];

// Moderation statuses (V3). Each change is timestamped by the database.
export const TESTIMONIAL_STATUSES = ['Pending Review', 'Approved', 'Rejected', 'Removal Requested', 'Removed'];

// M8 / Section 4 — approved story questions.
export const STORY_FIELDS = [
  {
    key: 'before',
    heading: 'Before',
    label: 'Where were you when you started?',
    helper: 'What were you trying to do, and what was getting in the way? How did it feel?',
    placeholder: "I'd been weighing a career move for a year and couldn't choose.",
    maxLength: 4000,
  },
  {
    key: 'shift',
    heading: 'The Shift',
    label: 'What changed during our work together?',
    helper: 'What made you act? What did you do first? What did working with Veta help you see or do differently?',
    placeholder: 'Naming my real priority made the choice obvious. That week I told my manager.',
    maxLength: 4000,
  },
  {
    key: 'after',
    heading: 'After',
    label: "What's different now?",
    helper: 'Name one specific result: a decision made, a step taken, time saved each week, or a number that moved.',
    placeholder: 'I started the new role six weeks later.',
    maxLength: 4000,
  },
  {
    key: 'quote',
    heading: 'One sentence',
    label: 'What would you tell someone in your shoes?',
    helper: 'We may use this as a short quote.',
    placeholder: 'Stop waiting to feel ready.',
    maxLength: 300,
  },
];

// M13
export const PRIVACY_NOTE = "Please leave out details you'd want kept private, such as your employer's name, health information, or other people's names.";

// Section 5 — Consent to Publish, final wording.
export const CONSENT_NOTICE = {
  title: 'Phoenix Client Stories: Consent to Share and Publish',
  intro: 'Thank you for sharing your story. Before you submit, please review the following.',
  sections: [
    ['What gets published', 'If your story is approved, it may appear in the places you checked above, with the name option you chose (anonymous, first name and last initial, or full name). Your role or profession appears if you provided one. Your email address is never displayed publicly.'],
    ["If you've taken the Clarity Assessment", 'Submitting this form with the same email address you used for Clarity may match your story to your own Clarity results. Your Band (for example, "Phoenix") is shown with your story only if you ticked "Show my Clarity Band."'],
    ['Editing', 'We publish your words as written, or a shortened version you have approved, depending on the choice you made above.'],
    ['Review before publishing', "Every story is reviewed by a coach before it's published. Nothing is published automatically or immediately."],
    ['Changing your mind', `You may ask for your published story to be removed, or for your name to be changed to anonymous, at any time by emailing ${CONSENT_CONTACT_EMAIL}. We will act on removal requests promptly.`],
  ],
  checkbox: 'I have read this notice and give Phoenix Clear Insight Consulting LLC permission to publish my story as described above.',
};

const labelFor = (options, value) => options.find((option) => option.value === value)?.label || '';
export const engagementLabel = (value) => labelFor(ENGAGEMENT_TYPES, value);
export const nameDisplayLabel = (value) => labelFor(NAME_DISPLAY_OPTIONS, value);
export const editChoiceLabel = (value) => labelFor(EDIT_CHOICES, value);
export const placementLabels = (values) => (Array.isArray(values) ? values.map((value) => labelFor(PLACEMENTS, value)).filter(Boolean) : []);

export const isFeedbackOnly = (engagementType) => engagementType === 'assessment_only';
export const hasPublishConsent = (story) => Boolean(story?.consentTimestamp);

// The name exactly as it would appear publicly (mirrors get_published_stories).
export function publicDisplayName(story) {
  const first = String(story?.firstName || '').trim();
  const last = String(story?.lastName || '').trim();
  if (story?.nameDisplay === 'full_name') return `${first} ${last}`.trim();
  if (story?.nameDisplay === 'first_last_initial') return `${first} ${last ? `${last[0]}.` : ''}`.trim();
  return 'Anonymous client';
}

export const emptyTestimonialForm = () => ({
  firstName: '',
  lastName: '',
  email: '',
  role: '',
  engagementType: '',
  segment: '',
  selfBandStart: '',
  selfBandNow: '',
  before: '',
  shift: '',
  after: '',
  quote: '',
  nameDisplay: 'anonymous',
  permittedUses: [],
  editChoice: '',
  storyCallRequest: false,
  showBand: false,
  consent: false,
  website: '', // honeypot: real visitors never see or fill this
});

// Returns a map of field → message; empty when the form can be submitted.
export function validateTestimonial(form) {
  const errors = {};
  const required = (key, message) => { if (!String(form[key] || '').trim()) errors[key] = message; };
  required('firstName', 'Please enter your first name.');
  required('lastName', 'Please enter your last name.');
  required('email', 'Please enter your email address.');
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(form.email).trim())) errors.email = 'Please enter a valid email address.';
  if (!ENGAGEMENT_TYPES.some((option) => option.value === form.engagementType)) errors.engagementType = 'Please choose what you worked on with Veta.';
  STORY_FIELDS.forEach((field) => required(field.key, `Please answer "${field.label}"`));
  if (String(form.quote || '').trim().length > 300) errors.quote = 'Please keep your one sentence under 300 characters.';
  if (!NAME_DISPLAY_OPTIONS.some((option) => option.value === form.nameDisplay)) errors.nameDisplay = 'Please choose how your name appears.';
  if (!EDIT_CHOICES.some((option) => option.value === form.editChoice)) errors.editChoice = 'Please choose how we may edit your words.';
  if (!form.consent) errors.consent = 'Please tick the consent box to submit your story.';
  return errors;
}

// Which moderation buttons apply to a story in its current status.
export function testimonialActions(story) {
  switch (story.status) {
    case 'Pending Review':
      return hasPublishConsent(story)
        ? [{ status: 'Approved', label: 'Approve', tone: 'approve' }, { status: 'Rejected', label: 'Reject', tone: 'reject' }]
        : [{ status: 'Rejected', label: 'Reject', tone: 'reject' }];
    case 'Approved':
      return [{ status: 'Removal Requested', label: 'Log removal request', tone: 'reject' }, { status: 'Removed', label: 'Remove from publication', tone: 'reject' }];
    case 'Removal Requested':
      return [{ status: 'Removed', label: 'Mark removed', tone: 'reject' }];
    default:
      return [];
  }
}
