import { NextRequest, NextResponse } from 'next/server';
import { SavedJobEnhanced } from '@/lib/saved-jobs-types';

// Mock data for development - in production this would come from a database
const MOCK_SAVED_JOBS: SavedJobEnhanced[] = [
  {
    id: 'job-1',
    jobTitle: 'Senior Frontend Developer',
    companyName: 'Novo Nordisk',
    location: 'Bagsværd',
    savedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'uploaded',
    analysisSummary: {
      bullets: [
        'Stærk match på React og TypeScript erfaring',
        'Din projektledererfaring er en bonus',
        'Fokus på pharma-domain knowledge kan styrkes',
      ],
    },
    stepProgress: {
      cv: { status: 'in_progress', updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
      coverLetter: { status: 'not_started' },
      interview: { status: 'not_started' },
    },
    links: {
      analysisUrl: '/app/job/job-1/analysis',
      cvUrl: '/app/job/job-1/cv',
      coverLetterUrl: '/app/job/job-1/ansoegning',
      interviewUrl: '/app/job/job-1/interview',
    },
  },
  {
    id: 'job-2',
    jobTitle: 'Product Manager',
    companyName: 'Danske Bank',
    location: 'København',
    savedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'uploaded',
    analysisSummary: {
      bullets: [
        'God erfaring med stakeholder management',
        'Finansiel sektor erfaring er et plus',
        'Fokus på agile metodikker matcher',
      ],
    },
    stepProgress: {
      cv: { status: 'done', updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
      coverLetter: { status: 'in_progress', updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
      interview: { status: 'not_started' },
    },
    links: {
      analysisUrl: '/app/job/job-2/analysis',
      cvUrl: '/app/job/job-2/cv',
      coverLetterUrl: '/app/job/job-2/ansoegning',
      interviewUrl: '/app/job/job-2/interview',
    },
  },
  {
    id: 'job-3',
    jobTitle: 'UX Designer',
    companyName: 'Maersk',
    location: 'København',
    savedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'recommended_close',
    analysisSummary: {
      bullets: [
        'Stærk portfolio match',
        'Erfaring med shipping-domain kan udvikles',
        'Teamarbejde og kommunikation fremhæves',
      ],
    },
    stepProgress: {
      cv: { status: 'done', updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
      coverLetter: { status: 'done', updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
      interview: { status: 'in_progress', updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
    },
    links: {
      analysisUrl: '/app/job/job-3/analysis',
      cvUrl: '/app/job/job-3/cv',
      coverLetterUrl: '/app/job/job-3/ansoegning',
      interviewUrl: '/app/job/job-3/interview',
    },
  },
  {
    id: 'job-4',
    jobTitle: 'Data Scientist',
    companyName: 'Vestas',
    location: 'Aarhus',
    savedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'uploaded',
    analysisSummary: {
      bullets: [
        'Python og ML erfaring matcher perfekt',
        'Energisektoren er ny men spændende',
        'Fokus på storskala dataanalyse',
      ],
    },
    stepProgress: {
      cv: { status: 'not_started' },
      coverLetter: { status: 'not_started' },
      interview: { status: 'not_started' },
    },
    links: {
      analysisUrl: '/app/job/job-4/analysis',
      cvUrl: '/app/job/job-4/cv',
      coverLetterUrl: '/app/job/job-4/ansoegning',
      interviewUrl: '/app/job/job-4/interview',
    },
  },
];

export async function GET(_req: NextRequest) {
  // In production, this would fetch from a database
  // For now, return mock data
  
  return NextResponse.json({
    jobs: MOCK_SAVED_JOBS,
    total: MOCK_SAVED_JOBS.length,
  });
}
