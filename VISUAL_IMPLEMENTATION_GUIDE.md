# 🎯 Interview Preparation Feature - Visual Implementation Guide

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     JOB DETAIL PAGE                              │
│  /app/job/[jobId]                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  STICKY PROCESS BAR (Updated)                             │  │
│  │  ┌──────────────┬──────────────┬────────────────────────┐  │
│  │  │ 1. CV        │ 2. Ansøgning │ 3. Interview-forbred. │  │
│  │  │ tilpasning   │              │                        │  │
│  │  └──────────────┴──────────────┴────────────────────────┘  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│              [Page Content - One of Three Routes]               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## 🔀 Interview Route Details

### Interview Preparation Page Structure

```
/app/job/[jobId]/interview
│
├── Load Data
│   ├── useResolvedCv(jobId)
│   │   ├── Load cv_sections_{jobId} from localStorage
│   │   ├── Load flowstruktur_user_profile from localStorage
│   │   └── Fallback to mock data if missing
│   │
│   └── Call /api/interview-analysis
│       ├── Send: jobPosting, resolvedCv, tailoredCv, application
│       └── Receive: risks[], strengths[], expectedQuestions[]
│
├── Display Analysis Section
│   ├── "Det skal du være særligt forberedt på"
│   │   └── Risk Cards (3-5)
│   │       ├── Title + Description
│   │       ├── Severity Badge (High/Med/Low)
│   │       └── Expandable: Example question
│   │
│   ├── "✓ Dine styrker" (Green box)
│   │   └── 3-4 matching areas
│   │
│   ├── "Sandsynlige interviewspørgsmål"
│   │   └── Question Cards (6+)
│   │       ├── Full question
│   │       ├── Context (why it's likely)
│   │       └── Suggested approach
│   │
│   └── Interview Training CTA
│       └── "Start interview-træning med AI" Button
│
└── Interactive Training Mode
    ├── InterviewSimulation Component
    │
    ├── Question Loop (8 questions max)
    │   ├── Display: One question at a time
    │   │   ├── Question text
    │   │   ├── Context explanation
    │   │   └── Textarea for answer
    │   │
    │   ├── Submit Answer
    │   │   └── POST to /api/interview-simulation
    │   │
    │   ├── Get Feedback
    │   │   ├── Strengths in answer
    │   │   ├── Improvement suggestion
    │   │   ├── CV reference point
    │   │   └── Overall assessment
    │   │
    │   └── Navigation
    │       ├── Previous (disabled on first)
    │       └── Next (becomes "Finish" on last)
    │
    └── Completion Screen
        ├── Congratulations message
        ├── Statistics (X questions answered)
        ├── Key takeaways
        └── Options: Start Over / Back to Analysis
```

## 📊 Data Flow Diagram

```
User Action Flow:
────────────────

1. User visits /app/job/{jobId}/interview
   │
   ├─→ Load CV using useResolvedCv(jobId)
   │   │
   │   ├─→ Check if context loaded (isLoaded)
   │   ├─→ Query localStorage for cv_sections_{jobId}
   │   ├─→ Query localStorage for flowstruktur_user_profile
   │   └─→ Return resolved CV or mock data
   │
   └─→ Show loading spinner
   
2. Call /api/interview-analysis
   │
   ├─→ Request payload:
   │   ├─ jobPosting: string
   │   ├─ resolvedCv: string
   │   ├─ tailoredCv: string (optional)
   │   ├─ application: string (optional)
   │   └─ dimensionScores: object (optional)
   │
   ├─→ Claude via INTERVIEW_ANALYSIS prompt
   │   │
   │   ├─→ Analyze risks (3-5)
   │   │   └─ title, description, example, severity
   │   │
   │   ├─→ Identify strengths (3-4)
   │   │   └─ Text describing match areas
   │   │
   │   └─→ Generate questions (8-12)
   │       └─ question, context, suggestedApproach
   │
   └─→ Return JSON analysis

3. Display analysis on page
   │
   ├─ Render risk cards with expandable details
   ├─ Show strengths in styled box
   ├─ List expected questions
   └─ Display training CTA button

4. User clicks "Start interview-træning"
   │
   ├─→ Mount InterviewSimulation component
   ├─→ Show first of 8 questions
   └─→ Enable answer textarea

5. User types answer & clicks "Indsend svar"
   │
   ├─→ Call /api/interview-simulation
   │   │
   │   ├─→ Request payload:
   │   │   ├─ question: string
   │   │   ├─ userAnswer: string
   │   │   ├─ jobPosting: string
   │   │   ├─ resolvedCv: string
   │   │   ├─ questionIndex: number
   │   │   └─ totalQuestions: number
   │   │
   │   ├─→ Claude via INTERVIEW_SIMULATION prompt
   │   │   │
   │   │   └─→ Evaluate answer
   │   │       ├─ feedback (overall)
   │   │       ├─ strengths (what was good)
   │   │       ├─ improvement (what to work on)
   │   │       ├─ cvReference (supporting CV point)
   │   │       └─ nextQuestion (null if done)
   │   │
   │   └─→ Return feedback JSON
   │
   ├─→ Display feedback card with all details
   ├─→ Enable "Previous" button
   └─→ Enable "Next Question" button

6. User navigates through remaining questions
   │
   ├─→ Click Previous: Show previous Q with cached feedback
   ├─→ Click Next: Show next question or completion screen
   └─→ Repeat 5-6 until all 8 questions done

7. Completion screen
   │
   ├─ Show congratulations
   ├─ Display statistics (8 questions answered)
   ├─ Show key takeaways from feedback
   ├─ Offer to restart or return to analysis
   └─ User can navigate back to job or other sections
```

## 🎨 UI Component Hierarchy

```
InterviewPage
├── Header & Title
├── Error Alert (if any)
├── Content (one of):
│   │
│   ├── Loading State
│   │
│   └── Loaded Analysis
│       ├── Card: CV Risks Section
│       │   ├── Badge: Severity (High/Med/Low)
│       │   ├── Risk Item (expandable)
│       │   │   ├── Title + Description
│       │   │   └── [Expanded] Example Question
│       │   └── ... (3-5 risks)
│       │
│       ├── Card: Strengths Section (green)
│       │   └── Bullet List (3-4 strengths)
│       │
│       ├── Card: Expected Questions
│       │   ├── Question Item
│       │   │   ├── Question text (bold)
│       │   │   ├── Context explanation
│       │   │   └── Suggested approach hint
│       │   └── ... (6+ questions)
│       │
│       └── Card: Training CTA (blue)
│           ├── Icon: Sparkles
│           ├── Title & Description
│           └── Button: "Start interview-træning"
│
└── [If Training Active]
    └── InterviewSimulation
        ├── Header with Progress Badge
        ├── Progress Bar (percentage)
        ├── Current Question Card
        │   ├── Question Title
        │   ├── Context (description)
        │   └── Textarea for Answer
        │
        ├── [If No Feedback]
        │   └── Button: "Indsend svar"
        │
        └── [If Feedback Shown]
            ├── Feedback Card (blue)
            │   ├── "Hvad var godt:" section
            │   ├── "Forbedring:" section
            │   ├── "Fra dit CV:" section (optional)
            │   └── Overall feedback (italic)
            │
            └── Navigation Buttons
                ├── Button: "Forrige" (disabled if first)
                └── Button: "Næste spørgsmål" or "Afslut træning"
```

## 🔧 System Prompt Flow

### INTERVIEW_ANALYSIS Prompt
```
Input: Job description + Full CV + User profile + Scores
         ↓
    Claude Analysis
         ↓
Output: {
  risks: [{ title, description, example, severity }],
  strengths: [string],
  expectedQuestions: [{ question, context, suggestedApproach }]
}
```

### INTERVIEW_SIMULATION Prompt
```
Input: Current question + User answer + Job context + CV
         ↓
    Claude as Interviewer
         ↓
Output: {
  feedback: string,
  strengths: string,
  improvement: string,
  cvReference: string,
  nextQuestion: string | null
}
```

## 🗄️ Data Storage

### localStorage Keys Used
```
cv_sections_{jobId}                    → CVSection[]
flowstruktur_user_profile              → UserProfile
flowstruktur_tailored_cv               → string (optional)
job_posting_{jobId}                    → string (optional)
job_application_{jobId}                → string (optional)
flowstruktur_personality_data          → object (optional)
```

### Context Values
```
useSavedJobs() → {
  savedJobs: Job[],
  isLoaded: boolean
}
```

## ✨ Key Features Summary

| Feature | Status | Details |
|---------|--------|---------|
| **Process Navigation** | ✅ Complete | Sticky 3-step stepper with active highlighting |
| **CV Risk Analysis** | ✅ Complete | 3-5 items with severity badges, expandable |
| **Strength Identification** | ✅ Complete | 3-4 match areas in dedicated section |
| **Question Generation** | ✅ Complete | 6+ contextual questions with explanations |
| **Interview Simulation** | ✅ Complete | 8-question practice with feedback |
| **Real-Time Feedback** | ✅ Complete | Strengths, improvements, CV references |
| **Progress Tracking** | ✅ Complete | Visual progress bar during simulation |
| **Navigation** | ✅ Complete | Previous/next between questions, exit anytime |
| **Completion Summary** | ✅ Complete | Stats and key takeaways after finishing |
| **Deep Link Support** | ✅ Complete | Direct URL access works |
| **Refresh Persistence** | ✅ Complete | Page refresh maintains analysis |
| **Error Handling** | ✅ Complete | User-friendly error messages |
| **Loading States** | ✅ Complete | Clear spinners and disabled states |
| **Dark Mode Support** | ✅ Complete | Follows system theme preferences |
| **Mobile Responsive** | ✅ Complete | Works on all screen sizes |

---

**Visual Implementation Status**: ✅ COMPLETE
**Ready for Integration Testing**: YES
**Documentation Completeness**: 100%
