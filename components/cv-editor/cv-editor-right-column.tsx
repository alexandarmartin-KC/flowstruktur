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
  ChevronUp,
  ChevronDown,
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
    reorderExperience,
    addBullet,
    updateBullet,
    removeBullet,
    reorderBullets,
    setAiLoading,
  } = useCVEditor();
  
  const document = state.document;
  if (!document) return null;
  
  const { rightColumn } = document;
  
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
      />
      
      {/* Experience Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
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
        
        {rightColumn.experience.length === 0 ? (
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-8 text-center">
            <p className="text-slate-500 text-sm mb-4">
              Ingen stillinger tilføjet endnu
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
                onMoveUp={() => {
                  if (index > 0) {
                    const newOrder = [...rightColumn.experience];
                    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
                    reorderExperience(newOrder);
                  }
                }}
                onMoveDown={() => {
                  if (index < rightColumn.experience.length - 1) {
                    const newOrder = [...rightColumn.experience];
                    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
                    reorderExperience(newOrder);
                  }
                }}
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
}

function ProfessionalIntroSection({
  intro,
  onUpdate,
  onAiSuggestion,
  aiLoading,
  setAiLoading,
  jobDescription,
  fontSize,
}: ProfessionalIntroSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const isOverLimit = exceedsLimit(intro.content, CONTENT_LIMITS.professionalIntroLines);
  const lineCount = countLines(intro.content);
  const isLoading = aiLoading?.sectionId === 'intro';
  
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
        
        {!intro.aiSuggestion && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAiRewrite}
            disabled={!intro.content.trim() || !jobDescription || isLoading}
            className="text-xs no-print"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3 mr-1" />
            )}
            Optimer med AI
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
              <span className="text-slate-400 italic">
                Klik her for at skrive din professionelle beskrivelse...
              </span>
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
  onMoveUp: () => void;
  onMoveDown: () => void;
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
  onMoveUp,
  onMoveDown,
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
      
      {/* Remove and reorder buttons */}
      <div className="absolute -left-10 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 no-print">
        {!isFirst && (
          <button onClick={onMoveUp} className="p-1 hover:bg-slate-100 rounded" title="Flyt op">
            <ChevronUp className="h-4 w-4 text-slate-400" />
          </button>
        )}
        {!isLast && (
          <button onClick={onMoveDown} className="p-1 hover:bg-slate-100 rounded" title="Flyt ned">
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
        )}
        <button onClick={onRemove} className="p-1 hover:bg-red-50 rounded" title="Fjern">
          <X className="h-4 w-4 text-red-500" />
        </button>
      </div>
      
      {/* Role Header */}
      <div className="mb-3">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <Input
            value={experience.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Titel"
            className="font-semibold text-base h-auto py-0 px-1 border-0 bg-transparent focus-visible:ring-1 w-auto inline-flex min-w-[100px]"
            style={{ fontSize: fontSize.heading }}
          />
          <span className="text-slate-400">—</span>
          <Input
            value={experience.company}
            onChange={(e) => onUpdate({ company: e.target.value })}
            placeholder="Virksomhed"
            className="h-auto py-0 px-1 border-0 bg-transparent focus-visible:ring-1 w-auto inline-flex min-w-[100px]"
          />
          {experience.location && (
            <>
              <span className="text-slate-400">|</span>
              <Input
                value={experience.location}
                onChange={(e) => onUpdate({ location: e.target.value })}
                placeholder="Lokation"
                className="text-slate-600 h-auto py-0 px-1 border-0 bg-transparent focus-visible:ring-1 w-auto inline-flex min-w-[80px]"
              />
            </>
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
              <span className="text-slate-400 italic">
                Klik for at tilføje nøgleopgaver...
              </span>
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
