// Types for the enhanced saved jobs feature

export type StepStatus = 'not_started' | 'in_progress' | 'done';

export interface StepProgress {
  status: StepStatus;
  updatedAt?: string;
}

export interface SavedJobEnhanced {
  id: string;
  jobTitle: string;
  companyName: string;
  location?: string;
  savedAt: string; // ISO
  source?: 'uploaded' | 'recommended_close' | 'recommended_far';
  analysisSummary: {
    bullets: string[]; // max 3
  };
  stepProgress: {
    cv: StepProgress;
    coverLetter: StepProgress;
    interview: StepProgress;
  };
  links: {
    analysisUrl: string;
    cvUrl: string;
    coverLetterUrl: string;
    interviewUrl: string;
  };
}

export type SortOption = 'newest' | 'oldest' | 'company_asc';

export interface SavedJobsFilters {
  search: string;
  sort: SortOption;
}

// Helper to get next action based on step progress
export function getNextAction(stepProgress: SavedJobEnhanced['stepProgress']): {
  step: 'cv' | 'coverLetter' | 'interview' | 'complete';
  label: string;
  url: string;
  jobId: string;
} | null {
  if (stepProgress.cv.status !== 'done') {
    return {
      step: 'cv',
      label: stepProgress.cv.status === 'not_started' ? 'Start CV' : 'Fortsæt CV',
      url: 'cv',
      jobId: '',
    };
  }
  if (stepProgress.coverLetter.status !== 'done') {
    return {
      step: 'coverLetter',
      label: stepProgress.coverLetter.status === 'not_started' 
        ? 'Start ansøgning' 
        : 'Fortsæt ansøgning',
      url: 'ansoegning',
      jobId: '',
    };
  }
  if (stepProgress.interview.status !== 'done') {
    return {
      step: 'interview',
      label: stepProgress.interview.status === 'not_started' 
        ? 'Start samtaleforberedelse' 
        : 'Fortsæt samtaleforberedelse',
      url: 'interview',
      jobId: '',
    };
  }
  return {
    step: 'complete',
    label: 'Åbn job workspace',
    url: 'cv',
    jobId: '',
  };
}

// Filter and sort helpers
export function filterSavedJobs(
  jobs: SavedJobEnhanced[],
  search: string
): SavedJobEnhanced[] {
  if (!search.trim()) return jobs;
  
  const searchLower = search.toLowerCase().trim();
  return jobs.filter(
    (job) =>
      job.jobTitle.toLowerCase().includes(searchLower) ||
      job.companyName.toLowerCase().includes(searchLower) ||
      (job.location?.toLowerCase().includes(searchLower) ?? false)
  );
}

export function sortSavedJobs(
  jobs: SavedJobEnhanced[],
  sortOption: SortOption
): SavedJobEnhanced[] {
  const sorted = [...jobs];
  
  switch (sortOption) {
    case 'newest':
      return sorted.sort(
        (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
      );
    case 'oldest':
      return sorted.sort(
        (a, b) => new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime()
      );
    case 'company_asc':
      return sorted.sort((a, b) =>
        a.companyName.localeCompare(b.companyName, 'da-DK')
      );
    default:
      return sorted;
  }
}
