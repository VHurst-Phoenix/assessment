// Testimonial CSV export (build request v1.2, "CSV" item): one row per story
// with engagement type, name display, permitted uses, edit choice and the
// story-call request alongside the story itself.

import {
  editChoiceLabel,
  engagementLabel,
  isFeedbackOnly,
  nameDisplayLabel,
  placementLabels,
} from '../pages/testimonialOptions.js';

export function toTestimonialExportRow(story) {
  return {
    Submitted: story.date ?? '',
    'Story ID': story.id ?? '',
    'First Name': story.firstName ?? '',
    'Last Name': story.lastName ?? '',
    Email: story.email ?? '',
    'Role / Profession': story.role ?? '',
    Segment: story.segment ?? '',
    'Engagement Type': engagementLabel(story.engagementType),
    'Story Type': isFeedbackOnly(story.engagementType) ? 'Feedback' : 'Coaching testimonial',
    'Name Display': nameDisplayLabel(story.nameDisplay),
    'Permitted Uses': placementLabels(story.permittedUses).join('; '),
    'Edit Choice': editChoiceLabel(story.editChoice),
    'Story-Call Request': story.storyCallRequest ? 'Yes' : 'No',
    Band: story.band ?? '',
    'Band Source': story.band ? story.bandSource ?? '' : '',
    'Show Band': story.showBand ? 'Yes' : 'No',
    'Band Start (self-reported)': story.selfBandStart ?? '',
    'Band Now (self-reported)': story.selfBandNow ?? '',
    Before: story.before ?? '',
    'The Shift': story.shift ?? '',
    After: story.after ?? '',
    'One Sentence': story.quote ?? '',
    Status: story.status ?? '',
    'Status Changed': story.statusChangedAt ?? '',
    'Consent Timestamp': story.consentTimestamp ?? '',
    'Consent Version': story.consentVersion ?? '',
  };
}
