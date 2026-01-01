# Interview Preparation Feature - Implementation Guide

## Overview

The "Forberedelse til interview" (Interview Preparation) feature is a comprehensive, AI-powered interview preparation system that helps users prepare for job interviews based on their CV, the job posting, and their application.

## Architecture & Data Flow

### 1. **Process Navigation (Updated Topbar)**

**File:** [app/app/job/[jobId]/layout.tsx](app/app/job/[jobId]/layout.tsx)

The topbar now displays a 3-step process:
1. **CV-tilpasning** (CV Customization)
2. **Ansøgning** (Application)
3. **Forberedelse til interview** (Interview Preparation)

**Key Features:**
- Sticky/fixed positioning for visibility
- Clear visual indication of current step
- Numbered labels (1, 2, 3) for clarity
- Color-coded active state (primary border + background)

### 2. **Interview Preparation Page**

**File:** [app/app/job/[jobId]/interview/page.tsx](app/app/job/[jobId]/interview/page.tsx)

This is the main entry point for interview preparation. It:

#### Load Process:
1. Fetches resolved CV data using `useResolvedCv(jobId)`
2. Calls `/api/interview-analysis` with:
   - Job posting description
   - Resolved CV (merged base CV + job-specific overrides)
   - Tailored CV (if available from CV step)
   - Application text (if available)
   - User dimension scores (personality profile)

#### Display Structure:
```
1. Header: "Forberedelse til jobsamtale – [Jobtitel]"
2. CV Risk Section: 3-5 identified weak points with severity badges
3. Strengths Section: 3-4 areas where user matches job well
4. Expected Questions: 6-12 likely interview questions
5. Training CTA: "Start interview-træning med AI" button
```

### 3. **Interview Analysis API**

**File:** [app/api/interview-analysis/route.ts](app/api/interview-analysis/route.ts)

This API endpoint performs deep CV-to-job-posting analysis.

#### Input:
```typescript
{
  jobPosting: string;           // Job description
  resolvedCv: string;           // Merged CV content
  tailoredCv?: string;          // Optional tailored CV
  application?: string;         // Optional application text
  userProfile?: object;         // Optional user profile data
  dimensionScores?: object;     // Personality scores (1-5)
}
```

#### Processing:
1. Uses `INTERVIEW_ANALYSIS` system prompt
2. Asks Claude to analyze CV vs. job requirements
3. Identifies 3-5 risks, 3-4 strengths, and 8-12 expected questions
4. Returns structured JSON response

#### Output:
```typescript
{
  risks: [
    {
      title: string;
      description: string;
      example: string;          // Sample interviewer question
      severity: 'high' | 'medium' | 'low';
    }
  ],
  strengths: string[];          // 3-4 matching areas
  expectedQuestions: [
    {
      question: string;         // Full question
      context: string;          // Why it's likely
      suggestedApproach: string; // How to answer
    }
  ]
}
```

### 4. **Interview Simulation Component**

**File:** [components/interview-simulation.tsx](components/interview-simulation.tsx)

Interactive interview training where AI acts as the interviewer.

#### Flow:
1. User sees one question at a time (up to 8 questions)
2. User types their answer in textarea
3. Click "Indsend svar" (Submit answer)
4. AI provides feedback on the answer
5. User can navigate to previous/next question
6. After all questions: completion screen with summary

#### Features:
- Progress bar showing completion percentage
- Real-time feedback with strengths and improvement areas
- CV reference suggestions
- Navigation (Previous/Next)
- Completion summary with statistics

### 5. **Interview Simulation API**

**File:** [app/api/interview-simulation/route.ts](app/api/interview-simulation/route.ts)

Handles individual answer feedback during the simulation.

#### Input:
```typescript
{
  question: string;           // Current question
  userAnswer: string;         // User's response
  jobPosting: string;         // Job context
  resolvedCv: string;         // CV context
  previousFeedback?: object;  // Optional feedback from prior questions
  questionIndex: number;      // Current question number
  totalQuestions: number;     // Total questions in simulation
}
```

#### Processing:
1. Uses `INTERVIEW_SIMULATION` system prompt
2. Claude acts as professional interviewer
3. Evaluates answer quality
4. Provides constructive feedback

#### Output:
```typescript
{
  feedback: string;           // Overall feedback
  strengths: string;          // What was good
  improvement: string;        // What could improve
  cvReference: string;        // Relevant CV point
  nextQuestion: string | null; // Next question or null if done
}
```

## System Prompts

### INTERVIEW_ANALYSIS Prompt

Analyzes the full profile to identify:
- **Risks:** Potential problem areas from CV vs. job match
  - Career gaps
  - Missing key experience
  - Unclear achievements
  - Over/under qualification
  - Skill mismatches

- **Strengths:** Strong alignment points
  - Relevant experience
  - Key skills match
  - Cultural alignment indicators
  - Achievement alignment

- **Expected Questions:** 8-12 realistic, contextual questions based on CV + job

**Location:** [lib/system-prompts.ts](lib/system-prompts.ts)

### INTERVIEW_SIMULATION Prompt

Represents a professional HR/hiring manager conducting the interview.

**Rules:**
- One question at a time
- Realistic interviewer behavior
- Constructive feedback after each answer
- Focus on actual experience and motivation
- Not aggressive or tricky

**Location:** [lib/system-prompts.ts](lib/system-prompts.ts)

## Data Management

### Resolved CV Hook

**File:** [hooks/use-resolved-cv.ts](hooks/use-resolved-cv.ts)

The `useResolvedCv(jobId)` hook provides:
- Waits for context rehydration (`isLoaded`)
- Loads CV sections from `localStorage`
- Loads user profile from `localStorage`
- Provides fallback mock data for development
- Returns `ResolvedCV` object with:
  - `sections[]`: Array of CVSection (name, suggestedText, status)
  - `profile`: User profile data (name, email, etc.)
  - `jobTitle`: The job title for context

### Data Flow

```
useResolvedCv(jobId)
  ↓
[CV sections from localStorage]
[User profile from localStorage]
  ↓
/api/interview-analysis
  ↓
InterviewAnalysis object
  ↓
Interview page UI + InterviewSimulation component
```

## User Experience Flow

1. **User navigates to interview page**
   - URL: `/app/job/{jobId}/interview`
   - Page loads resolved CV data
   - API call to `/api/interview-analysis`

2. **User sees analysis**
   - Risks with severity badges (red/orange/gray)
   - Strengths highlighted in green box
   - Expected questions with context
   - CTA button: "Start interview-træning"

3. **User clicks training button**
   - InterviewSimulation component opens
   - First question displayed
   - Textarea for answer input
   - Submit button

4. **User answers each question**
   - Types answer
   - Submits
   - Gets feedback immediately
   - Can review and move to next question

5. **User completes training**
   - Completion screen
   - Summary statistics
   - Key takeaways
   - Options to restart or exit

## Key Design Decisions

### 1. **Resolved CV Over Component State**
- All interview features use `useResolvedCv()` not local component state
- Ensures data consistency and deep-link functionality
- Allows page refresh without losing context

### 2. **One Question at a Time**
- Simulates real interview pace
- Reduces cognitive overload
- Allows detailed feedback per answer
- Better for learning and retention

### 3. **Severity-Based Risk Display**
- High severity: Red badges (critical gaps)
- Medium severity: Orange badges (notable gaps)
- Low severity: Gray badges (minor considerations)
- Helps users prioritize preparation

### 4. **Progressive Feedback**
- First: Risk analysis (what to prepare for)
- Then: Question preparation (here's what they'll ask)
- Finally: Simulation (practice answering)

### 5. **No Free Chat**
- Unlike typical AI assistants, this is structured
- Focused on real interview preparation
- Question-answer pairs only
- Professional training mode

## Testing Checklist

- [ ] Navigation bar shows 3 steps correctly
- [ ] Active step is visually highlighted
- [ ] Interview page loads without errors
- [ ] CV data is fetched and resolved
- [ ] Interview analysis API returns valid data
- [ ] Risk section displays 3-5 items with correct severity
- [ ] Strengths section shows 3-4 items
- [ ] Expected questions displays 6+ questions
- [ ] Training CTA button is visible and clickable
- [ ] Simulation loads first question
- [ ] User can type answer in textarea
- [ ] Submit button submits and shows feedback
- [ ] Feedback is constructive and relevant
- [ ] Can navigate previous/next between questions
- [ ] Completion screen appears after all questions
- [ ] Completion screen shows correct statistics
- [ ] Page works with deep link (direct URL)
- [ ] Page works after refresh (data persists)

## Future Enhancements

1. **Multiple interview formats** (behavioral, technical, case study)
2. **Recording & playback** of practice answers
3. **Industry-specific question banks**
4. **Comparison against similar job descriptions**
5. **Interview confidence score** that improves with practice
6. **Export interview prep as PDF**
7. **Share interview prep with mentor/coach**
8. **Integration with calendar for scheduled practice**

## Dependencies

- `next`: 16.1.1
- `react`: 19.2.3
- `openai`: 6.15.0
- `@radix-ui/react-*`: Various UI components
- `lucide-react`: Icons
- No external interview-specific libraries (all built custom)

## File Summary

| File | Purpose |
|------|---------|
| [app/app/job/[jobId]/layout.tsx](app/app/job/[jobId]/layout.tsx) | Updated with sticky process navigation |
| [app/app/job/[jobId]/interview/page.tsx](app/app/job/[jobId]/interview/page.tsx) | Main interview prep page |
| [components/interview-simulation.tsx](components/interview-simulation.tsx) | Interview training component |
| [app/api/interview-analysis/route.ts](app/api/interview-analysis/route.ts) | CV analysis API |
| [app/api/interview-simulation/route.ts](app/api/interview-simulation/route.ts) | Answer feedback API |
| [lib/system-prompts.ts](lib/system-prompts.ts) | Added INTERVIEW_ANALYSIS & INTERVIEW_SIMULATION prompts |

---

**Status:** ✅ Ready for testing and deployment
