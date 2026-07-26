export function getAssessmentTab(location = {}) {
  const pathname = location.pathname || '';
  const search = location.search || '';
  const explicitAssessment = location.assessment || location.tab || null;
  const searchParams = location.searchParams || new URLSearchParams(search);

  if (pathname === '/assessment/readiness') return 'readiness';
  if (pathname === '/assessment/execution') return 'execution';
  if (pathname === '/assessment/clarity') return 'clarity';
  if (pathname === '/assessment/testimonial') return 'testimonial';

  const assessmentType = explicitAssessment || searchParams.get?.('assessment') || searchParams.get('assessment');
  if (assessmentType === 'execution') return 'execution';
  if (assessmentType === 'readiness') return 'readiness';

  const mode = location.mode || searchParams.get?.('mode') || searchParams.get('mode');
  if (mode === 'coach') return 'readiness';

  const share = location.share || searchParams.get?.('share') || searchParams.get('share');
  if (share === 'story') return 'testimonial';

  return 'clarity';
}

export function getAssessmentPath(tab) {
  switch (tab) {
    case 'readiness':
      return '/assessment/readiness';
    case 'execution':
      return '/assessment/execution';
    case 'testimonial':
      return '/assessment/testimonial';
    case 'clarity':
    default:
      return '/assessment';
  }
}
