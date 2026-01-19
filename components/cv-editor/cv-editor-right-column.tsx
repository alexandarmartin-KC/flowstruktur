'use client';

import { useState, useRef, useEffect } from 'react';
import { useCVEditor } from '@/contexts/cv-editor-context';
import { 
  TextSizeOption, 
  CONTENT_LIMITS, 
  countLines, 
  exceedsLimit,
  CVExperienceBlock,
  CVAISuggestion,
  generateId,
} from '@/lib/cv-types';
import { getRawCVData } from '@/lib/cv-normalizer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  X,
  GripVertical,
  Sparkles,
  Check,
  Pencil,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

interface CVEditorRightColumnProps {
  fontSize: TextSizeOption;
  jobDescription?: string;
}

export function CVEditorRightColumn({ fontSize, jobDescription }: CVEditorRightColumnProps) {
  const { 
    state,
    updateProfessionalIntro,
    setIntroAiSuggestion,
    addExperience,
    updateExperience,
    removeExperience,
    addBullet,
    updateBullet,
    removeBullet,
    reorderBullets,
    setAiLoading,
  } = useCVEditor();
  
  const document = state.document;
  if (!document) return null;
  
  const { rightColumn } = document;
  
  // Check if we have experience data to generate intro from
  const hasExperienceData = rightColumn.experience.length > 0 && 
    rightColumn.experience.some(exp => 
      exp.bullets.length > 0 || exp.keyMilestones.trim().length > 0
    );
  
  return (
    <div 
      className="cv-right-column p-8"
      style={{ fontSize: fontSize.body }}
    >
      {/* Professional Intro Section */}
      <ProfessionalIntroSection 
        intro={rightColumn.professionalIntro}
        onUpdate={updateProfessionalIntro}
        onAiSuggestion={setIntroAiSuggestion}
        aiLoading={state.aiLoading}
        setAiLoading={setAiLoading}
        jobDescription={jobDescription}
        fontSize={fontSize}
        hasExperienceData={hasExperienceData}
      />
      
      {/* Experience Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-2">
          <h2 
            className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider"
            style={{ fontSize: fontSize.heading }}
          >
            Erfaring
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addExperience()}
            className="text-xs no-print"
          >
            <Plus className="h-3 w-3 mr-1" />
            Tilføj stilling
          </Button>
        </div>
        
        {/* Auto-sort notice */}
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 no-print">
          Erfaring sorteres automatisk efter dato (nyeste først)
        </p>
        
        {rightColumn.experience.length === 0 ? (
          <div className="border-2 border-dashed border-amber-200 dark:border-amber-700 rounded-lg p-8 text-center bg-amber-50 dark:bg-amber-950/20">
            <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-amber-500" />
            <p className="text-amber-800 dark:text-amber-200 text-sm font-medium mb-2">
              Ingen stillinger kunne udtrækkes fra dit CV
            </p>
            <p className="text-amber-700 dark:text-amber-300 text-xs mb-4">
              Vi kunne ikke automatisk parse erfaringsdata fra dit CV-format. 
              Du kan tilføje dine stillinger manuelt — de vil blive gemt og brugt til fremtidige ansøgninger.
            </p>
            <p className="text-amber-600 dark:text-amber-400 text-xs mb-4 italic">
              Tip: Kontrollér at dit uploadede CV indeholder en tydelig &quot;Erfaring&quot; eller &quot;Experience&quot; sektion.
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => addExperience()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Tilføj din første stilling
            </Button>
          </div>
        ) : (
          <div className="space-y-0">
            {rightColumn.experience.map((exp, index) => (
              <ExperienceBlock
                key={exp.id}
                experience={exp}
                isFirst={index === 0}
                isLast={index === rightColumn.experience.length - 1}
                onUpdate={(updates) => updateExperience(exp.id, updates)}
                onRemove={() => removeExperience(exp.id)}
                onAddBullet={() => addBullet(exp.id)}
                onUpdateBullet={(bulletId, content) => updateBullet(exp.id, bulletId, content)}
                onRemoveBullet={(bulletId) => removeBullet(exp.id, bulletId)}
                onReorderBullets={(bullets) => reorderBullets(exp.id, bullets)}
                aiLoading={state.aiLoading}
                setAiLoading={setAiLoading}
                jobDescription={jobDescription}
                fontSize={fontSize}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Professional Intro Section Component
interface ProfessionalIntroSectionProps {
  intro: { content: string; aiSuggestion?: CVAISuggestion };
  onUpdate: (content: string) => void;
  onAiSuggestion: (suggestion: CVAISuggestion | undefined) => void;
  aiLoading: { sectionId: string; type: string } | null;
  setAiLoading: (loading: { sectionId: string; type: string } | null) => void;
  jobDescription?: string;
  fontSize: TextSizeOption;
  hasExperienceData: boolean;
}

function ProfessionalIntroSection({
  intro,
  onUpdate,
  onAiSuggestion,
  aiLoading,
  setAiLoading,
  jobDescription,
  fontSize,
  hasExperienceData,
}: ProfessionalIntroSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const isOverLimit = exceedsLimit(intro.content, CONTENT_LIMITS.professionalIntroLines);
  const lineCount = countLines(intro.content);
  const isLoading = aiLoading?.sectionId === 'intro';
  const hasContent = intro.content.trim().length > 0;
  
  // AI can only suggest intro from experience if there IS experience data
  // This follows spec Case 3: if no bullets and no narrative exist, AI must refuse
  
  // Optimize existing intro for job (only when content exists)
  const handleAiRewrite = async () => {
    if (!intro.content.trim() || !jobDescription) return;
    
    setAiLoading({ sectionId: 'intro', type: 'rewrite' });
    
    try {
      const response = await fetch('/api/cv/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'rewrite-intro',
          content: intro.content,
          jobDescription,
        }),
      });
      
      if (!response.ok) throw new Error('AI request failed');
      
      const data = await response.json();
      
      onAiSuggestion({
        id: generateId(),
        originalContent: intro.content,
        suggestedContent: data.suggestion,
        rationale: data.rationale,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('AI rewrite error:', error);
    } finally {
      setAiLoading(null);
    }
  };
  
  // Generate intro from experience (only when no content exists)
  const handleGenerateFromExperience = async () => {
    if (!jobDescription) return;
    
    setAiLoading({ sectionId: 'intro', type: 'generate' });
    
    try {
      // Get raw CV data to provide context
      const rawCV = getRawCVData();
      const cvSummary = rawCV?.summary || rawCV?.cvText?.slice(0, 2000) || '';
      
      const response = await fetch('/api/cv/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'generate-intro-from-experience',
          jobDescription,
          cvData: cvSummary,
        }),
      });
      
      if (!response.ok) throw new Error('AI request failed');
      
      const data = await response.json();
      
      onAiSuggestion({
        id: generateId(),
        originalContent: '',
        suggestedContent: data.suggestion,
        rationale: 'Genereret baseret på din erfaring fra dit CV',
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('AI generate error:', error);
    } finally {
      setAiLoading(null);
    }
  };
  
  const handleAcceptSuggestion = () => {
    if (intro.aiSuggestion) {
      onUpdate(intro.aiSuggestion.suggestedContent);
      onAiSuggestion(undefined);
    }
  };
  
  const handleRejectSuggestion = () => {
    onAiSuggestion(undefined);
  };
  
  return (
    <div className="professional-intro-section">
      <div className="flex items-center justify-between mb-3">
        <h2 
          className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider"
          style={{ fontSize: fontSize.heading }}
        >
          Profil
        </h2>
        
        {!intro.aiSuggestion && hasContent && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAiRewrite}
            disabled={!jobDescription || isLoading}
            className="text-xs no-print"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3 mr-1" />
            )}
            Optimer til jobbet
          </Button>
        )}
      </div>
      
      {/* Line count warning */}
      {isOverLimit && (
        <Alert className="mb-3 py-2 no-print" variant="default">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Profilbeskrivelsen er {lineCount} linjer. Vi anbefaler maks {CONTENT_LIMITS.professionalIntroLines} linjer.
          </AlertDescription>
        </Alert>
      )}
      
      {/* AI Suggestion */}
      {intro.aiSuggestion && intro.aiSuggestion.status === 'pending' && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800 no-print">
          <div className="flex items-start gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">AI forslag</p>
              {intro.aiSuggestion.rationale && (
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  {intro.aiSuggestion.rationale}
                </p>
              )}
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded p-3 text-sm mb-3 whitespace-pre-wrap">
            {intro.aiSuggestion.suggestedContent}
          </div>
          
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAcceptSuggestion}>
              <Check className="h-3 w-3 mr-1" />
              Accepter
            </Button>
            <Button size="sm" variant="outline" onClick={() => {
              onUpdate(intro.aiSuggestion!.suggestedContent);
              onAiSuggestion(undefined);
              setIsEditing(true);
            }}>
              <Pencil className="h-3 w-3 mr-1" />
              Rediger
            </Button>
            <Button size="sm" variant="ghost" onClick={handleRejectSuggestion}>
              <X className="h-3 w-3 mr-1" />
              Afvis
            </Button>
          </div>
        </div>
      )}
      
      {/* Content area */}
      <div 
        className="prose prose-sm max-w-none cursor-text group relative"
        onClick={() => setIsEditing(true)}
      >
        {isEditing ? (
          <Textarea
            ref={textareaRef}
            value={intro.content}
            onChange={(e) => onUpdate(e.target.value)}
            onBlur={() => setIsEditing(false)}
            placeholder="Skriv en kort professionel beskrivelse på 4-5 linjer. Fokuser på din kernekompetence og hvad du kan tilbyde."
            className="min-h-[120px] text-sm leading-relaxed resize-none border-slate-300 focus:border-blue-500"
            autoFocus
          />
        ) : (
          <div className="min-h-[80px] text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {intro.content || (
              <div className="space-y-3">
                <p className="text-slate-400 italic">
                  Ingen profilbeskrivelse fundet i dit CV.
                </p>
                {hasExperienceData ? (
                  // Case 2: No intro, but experience data exists - offer AI suggestion
                  <>
                    <p className="text-slate-500 text-xs">
                      Du kan skrive en kort professionel beskrivelse manuelt, eller lade AI foreslå en baseret på din erfaring.
                    </p>
                    {jobDescription && !intro.aiSuggestion && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateFromExperience();
                        }}
                        disabled={isLoading}
                        className="text-xs"
                      >
                        {isLoading ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Sparkles className="h-3 w-3 mr-1" />
                        )}
                        Foreslå intro fra erfaring
                      </Button>
                    )}
                  </>
                ) : (
                  // Case 3: No intro AND no experience data - AI cannot help, user must write
                  <p className="text-slate-500 text-xs">
                    Klik her for at skrive din professionelle beskrivelse. Tilføj gerne dine erfaringer først i sektionen nedenfor.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Experience Block Component
interface ExperienceBlockProps {
  experience: CVExperienceBlock;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (updates: Partial<CVExperienceBlock>) => void;
  onRemove: () => void;
  onAddBullet: () => void;
  onUpdateBullet: (bulletId: string, content: string) => void;
  onRemoveBullet: (bulletId: string) => void;
  onReorderBullets: (bullets: CVExperienceBlock['bullets']) => void;
  aiLoading: { sectionId: string; type: string } | null;
  setAiLoading: (loading: { sectionId: string; type: string } | null) => void;
  jobDescription?: string;
  fontSize: TextSizeOption;
}

function ExperienceBlock({
  experience,
  isFirst,
  isLast,
  onUpdate,
  onRemove,
  onAddBullet,
  onUpdateBullet,
  onRemoveBullet,
  onReorderBullets,
  aiLoading,
  setAiLoading,
  jobDescription,
  fontSize,
}: ExperienceBlockProps) {
  const [editingMilestones, setEditingMilestones] = useState(false);
  const [showAiMilestones, setShowAiMilestones] = useState(false);
  const [aiMilestonesSuggestion, setAiMilestonesSuggestion] = useState<string>('');
  
  const isOverBulletLimit = experience.bullets.length > CONTENT_LIMITS.bulletsPerJob;
  const isOverMilestonesLimit = exceedsLimit(experience.keyMilestones, CONTENT_LIMITS.keyMilestonesLines);
  const isLoadingMilestones = aiLoading?.sectionId === experience.id && aiLoading?.type === 'milestones';
  
  // Generate milestones from bullets using AI
  const handleGenerateMilestones = async () => {
    if (experience.bullets.length === 0) return;
    
    setAiLoading({ sectionId: experience.id, type: 'milestones' });
    
    try {
      const response = await fetch('/api/cv/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'generate-milestones',
          bullets: experience.bullets.map(b => b.content),
          title: experience.title,
          company: experience.company,
          jobDescription,
        }),
      });
      
      if (!response.ok) throw new Error('AI request failed');
      
      const data = await response.json();
      setAiMilestonesSuggestion(data.suggestion);
      setShowAiMilestones(true);
    } catch (error) {
      console.error('AI milestones error:', error);
    } finally {
      setAiLoading(null);
    }
  };
  
  const handleAcceptMilestones = () => {
    onUpdate({ keyMilestones: aiMilestonesSuggestion });
    setShowAiMilestones(false);
    setAiMilestonesSuggestion('');
  };
  
  return (
    <div className="experience-block group relative">
      {/* Separator line between jobs */}
      {!isFirst && (
        <div className="border-t border-slate-200 dark:border-slate-700 my-6" />
      )}
      
      {/* Remove button - no reorder buttons, experience is auto-sorted by date */}
      <div className="absolute -left-10 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 no-print">
        <button onClick={onRemove} className="p-1 hover:bg-red-50 rounded" title="Fjern">
          <X className="h-4 w-4 text-red-500" />
        </button>
      </div>
      
      {/* Role Header */}
      <div className="mb-3">
        {/* Title on full width line */}
        <div className="mb-1">
          <Input
            value={experience.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Titel (f.eks. Security Specialist, Physical Security)"
            className="font-semibold text-base h-auto py-0 px-1 border-0 bg-transparent focus-visible:ring-1 w-full"
            style={{ fontSize: fontSize.heading }}
          />
        </div>
        
        {/* Company and Location on same line */}
        <div className="flex items-baseline gap-x-2 gap-y-1 flex-wrap">
          <Input
            value={experience.company}
            onChange={(e) => onUpdate({ company: e.target.value })}
            placeholder="Virksomhed"
            className="h-auto py-0 px-1 border-0 bg-transparent focus-visible:ring-1 flex-1 min-w-[150px]"
          />
          {experience.location && (
            <>
              <span className="text-slate-400">—</span>
              <Input
                value={experience.location}
                onChange={(e) => onUpdate({ location: e.target.value })}
                placeholder="Lokation"
                className="text-slate-600 h-auto py-0 px-1 border-0 bg-transparent focus-visible:ring-1 flex-1 min-w-[100px]"
              />
            </>
          )}
          {!experience.location && (
            <button
              type="button"
              onClick={() => onUpdate({ location: '' })}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              + Tilføj lokation
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2 mt-1">
          <Input
            value={experience.startDate}
            onChange={(e) => onUpdate({ startDate: e.target.value })}
            placeholder="Start (f.eks. Jan 2020)"
            className="text-sm text-slate-500 h-auto py-0 px-1 border-0 bg-transparent focus-visible:ring-1 w-auto inline-flex min-w-[100px]"
          />
          <span className="text-slate-400">–</span>
          <Input
            value={experience.endDate || ''}
            onChange={(e) => onUpdate({ endDate: e.target.value || undefined })}
            placeholder="Nu"
            className="text-sm text-slate-500 h-auto py-0 px-1 border-0 bg-transparent focus-visible:ring-1 w-auto inline-flex min-w-[60px]"
          />
        </div>
      </div>
      
      {/* Key Milestones */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Nøgleopgaver
          </span>
          
          {!experience.keyMilestones && experience.bullets.length > 0 && !showAiMilestones && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerateMilestones}
              disabled={isLoadingMilestones}
              className="text-xs no-print"
            >
              {isLoadingMilestones ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3 mr-1" />
              )}
              Generer fra punkter
            </Button>
          )}
        </div>
        
        {isOverMilestonesLimit && (
          <Alert className="mb-2 py-1 no-print" variant="default">
            <AlertTriangle className="h-3 w-3" />
            <AlertDescription className="text-xs">
              Vi anbefaler maks {CONTENT_LIMITS.keyMilestonesLines} linjer.
            </AlertDescription>
          </Alert>
        )}
        
        {/* AI Milestones Suggestion */}
        {showAiMilestones && aiMilestonesSuggestion && (
          <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800 no-print">
            <div className="flex items-start gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-blue-600 mt-0.5" />
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Genereret fra dine punkter
              </p>
            </div>
            
            <div className="bg-white dark:bg-slate-900 rounded p-2 text-sm mb-3 whitespace-pre-wrap">
              {aiMilestonesSuggestion}
            </div>
            
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAcceptMilestones}>
                <Check className="h-3 w-3 mr-1" />
                Accepter
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  onUpdate({ keyMilestones: aiMilestonesSuggestion });
                  setShowAiMilestones(false);
                  setAiMilestonesSuggestion('');
                  setEditingMilestones(true);
                }}
              >
                <Pencil className="h-3 w-3 mr-1" />
                Rediger
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => {
                  setShowAiMilestones(false);
                  setAiMilestonesSuggestion('');
                }}
              >
                <X className="h-3 w-3 mr-1" />
                Afvis
              </Button>
            </div>
          </div>
        )}
        
        {editingMilestones ? (
          <Textarea
            value={experience.keyMilestones}
            onChange={(e) => onUpdate({ keyMilestones: e.target.value })}
            onBlur={() => setEditingMilestones(false)}
            placeholder="Beskriv dine nøgleopgaver og ansvar i 2-4 linjer..."
            className="text-sm leading-relaxed resize-none min-h-[80px]"
            autoFocus
          />
        ) : (
          <div 
            className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap cursor-text min-h-[40px]"
            onClick={() => setEditingMilestones(true)}
          >
            {experience.keyMilestones || (
              <div className="space-y-2">
                {experience.bullets.length > 0 ? (
                  <>
                    <p className="text-slate-400 italic text-xs">
                      Dit CV indeholdt punkter men ingen sammenfatning.
                    </p>
                    <p className="text-slate-500 text-xs">
                      Klik for at skrive manuelt, eller brug &quot;Generer fra punkter&quot; ovenfor.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-slate-400 italic text-xs">
                      Ingen nøgleopgaver fundet.
                    </p>
                    <p className="text-slate-500 text-xs">
                      Klik her for at beskrive dine primære ansvarsområder og resultater.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Bullets */}
      <div>
        {isOverBulletLimit && (
          <Alert className="mb-2 py-1 no-print" variant="default">
            <AlertTriangle className="h-3 w-3" />
            <AlertDescription className="text-xs">
              Vi anbefaler maks {CONTENT_LIMITS.bulletsPerJob} punkter.
            </AlertDescription>
          </Alert>
        )}
        
        <ul className="space-y-2">
          {experience.bullets.map((bullet, idx) => (
            <li key={bullet.id} className="flex items-start gap-2 group/bullet">
              <span className="text-slate-400 mt-1.5 select-none">•</span>
              <Input
                value={bullet.content}
                onChange={(e) => onUpdateBullet(bullet.id, e.target.value)}
                placeholder="Beskriv en konkret præstation eller ansvar..."
                className="flex-1 text-sm h-auto py-1 px-2 border-0 bg-transparent focus-visible:ring-1"
              />
              <button
                onClick={() => onRemoveBullet(bullet.id)}
                className="p-1 text-red-500 opacity-0 group-hover/bullet:opacity-100 transition-opacity no-print"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
        
        {experience.bullets.length < CONTENT_LIMITS.bulletsPerJob + 2 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddBullet}
            className="mt-2 text-xs text-slate-500 hover:text-slate-700 no-print"
          >
            <Plus className="h-3 w-3 mr-1" />
            Tilføj punkt
          </Button>
        )}
      </div>
    </div>
  );
}
