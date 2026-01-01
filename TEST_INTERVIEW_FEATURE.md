# Quick Test Guide - Interview Preparation Feature

## Setup

```bash
# Set your OpenAI API key
export OPENAI_API_KEY="sk-..."

# Install dependencies (if not already done)
npm install

# Run development server
npm run dev
```

Visit: http://localhost:3000

## Test Flow

### 1. **Access a Job**
1. Go to `/app/gemte-jobs` (Saved jobs page)
2. Click on any saved job card
3. You should land on the job details page

### 2. **See Updated Navigation**
Look at the sticky process bar:
- Shows 3 steps: "1. CV-tilpasning", "2. Ansøgning", "3. Interview-forberedelse"
- Current step is highlighted with primary color and border
- All 3 should be clickable links

### 3. **Access Interview Page**
Click "3. Interview-forberedelse" in the navigation bar
- URL should be: `/app/job/{jobId}/interview`
- Page loads CV data (you should see a loading spinner briefly)

### 4. **View Analysis Results**
Once loaded, you should see:

**Section 1: "Det skal du være særligt forberedt på"**
- 3-5 risk cards with severity badges
- Each card is expandable (click to see details)
- Details show example interview questions

**Section 2: "✓ Dine styrker"** (green box)
- 3-4 bullet points of your strengths
- Tailored to the job and your CV

**Section 3: "Sandsynlige interviewspørgsmål"**
- 6-12 interview questions with context
- Each shows why the question is likely and suggested approach

**Section 4: Interview Training CTA**
- Blue card with "Start interview-træning med AI" button
- Sparkles icon for visual appeal

### 5. **Start Interview Training**
Click "Start træning" button
- Interview simulation component loads
- Progress bar shows 0% (1/8 questions)
- Single question displayed with context
- Textarea for typing answer
- "Indsend svar" button

### 6. **Answer a Question**
1. Type an answer in the textarea (any text)
2. Click "Indsend svar"
3. Wait for AI feedback (loading spinner shows)
4. You should see feedback card with:
   - "Hvad var godt:" (Strengths section)
   - "Forbedring:" (Improvement section)
   - Optionally "Fra dit CV:" (CV reference)
   - Overall feedback in italics

### 7. **Navigate Questions**
After feedback:
- "Forrige" button (disabled on first question)
- "Næste spørgsmål" button (changes to "Afslut træning" on last question)
- Click next to move to question 2

### 8. **Complete Training**
After answering all 8 questions and clicking final "Afslut træning":
- Completion screen appears
- Shows "Tillykke! 🎉"
- Stats: Questions answered, % strengths identified
- Key takeaways from your feedback
- Buttons: "Start forfra" or "Tilbage til forberedelse"

### 9. **Navigation Persistence**
While on interview page:
- Click "1. CV-tilpasning" → goes to CV page
- Click back to "3. Interview-forberedelse" → returns to analysis (not training)
- Interview data should be cached

## Deep Link Testing

### Test Direct URL
Paste directly in browser:
```
http://localhost:3000/app/job/{jobId}/interview
```

Replace `{jobId}` with actual job ID from localStorage or URL

Should:
- Load CV data
- Fetch interview analysis
- Display without errors

### Test Page Refresh
1. On interview page, press F5 or Cmd+R
2. Page should reload and maintain state
3. Analysis should still be visible (might refetch)

## Expected Data Sources

### CV Data
Loaded from `useResolvedCv(jobId)`:
- localStorage: `cv_sections_{jobId}`
- localStorage: `flowstruktur_user_profile`
- Falls back to mock data if not found

### Job Data
From `savedJobs` context:
- Requires job to exist in context
- Job should have `id`, `title`, `company`, `description`

### Interview Analysis
Generated via `/api/interview-analysis`:
- Requires valid OpenAI API key
- First call takes ~5-10 seconds
- Response is not cached (refreshes each time)

## Debugging Tips

### Check Browser Console
Look for:
- Any fetch errors (red)
- Component warnings (yellow)
- Successful API responses (debug logs)

### Network Tab
Monitor requests:
- `/api/interview-analysis` - Should return JSON with analysis
- `/api/interview-simulation` - Should return feedback for each answer

### Redux DevTools / Storage
- Check localStorage for `cv_sections_{jobId}`
- Check localStorage for `flowstruktur_user_profile`
- Check for personality data if available

### Common Issues

**"Job ikke fundet"**
- Ensure you're accessing from an actual saved job
- Check `savedJobs` context has data

**"Kunne ikke indlæse CV data"**
- CV sections not in localStorage
- Falls back to mock data (should still work)

**"Kunne ikke analysere interviewforberedelse"**
- OpenAI API key not set
- API rate limit exceeded
- Invalid CV/job data passed

**Styling Issues**
- Check that Tailwind CSS is loading
- Dark mode should work (check system preference)
- Responsive design works on mobile (sticky nav scrolls)

## Edge Cases to Test

1. **No CV data available** → Should show mock data
2. **Job with no description** → Should still analyze based on title
3. **Very long CV** → Should still process correctly
4. **Rapid API calls** → Should queue/debounce properly
5. **Long answers in simulation** → Textarea should handle scroll
6. **Navigation between pages** → Data should persist

## Success Indicators

✅ All 3 process steps visible in sticky nav
✅ Interview page loads without errors
✅ Analysis shows risks, strengths, questions
✅ Can click through full interview simulation
✅ Get feedback on answers
✅ Can navigate previous/next questions
✅ Completion screen appears
✅ Deep links work
✅ Page refresh maintains state
✅ Styling looks professional and polished

---

**Questions?** Check [INTERVIEW_FEATURE.md](INTERVIEW_FEATURE.md) for detailed documentation.
