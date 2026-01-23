'use client';

import { useCVEditor } from '@/contexts/cv-editor-context';
import { useUserProfile } from '@/contexts/user-profile-context';
import { FONT_FAMILY_OPTIONS, TEXT_SIZE_OPTIONS, LANGUAGE_LEVEL_LABELS } from '@/lib/cv-types';

/**
 * CV Print Preview - Matches editor layout exactly for PDF export
 * This component renders the CV in a print-optimized format
 */
export function CVPrintPreview() {
  const { state } = useCVEditor();
  const { profile } = useUserProfile();
  
  const document = state.document;
  if (!document) return null;
  
  const { leftColumn, rightColumn, settings } = document;
  const fontOption = FONT_FAMILY_OPTIONS.find(f => f.value === settings.fontFamily) || FONT_FAMILY_OPTIONS[0];
  const sizeOption = TEXT_SIZE_OPTIONS[settings.textSize];
  const showPhoto = leftColumn.showProfilePhoto && profile?.profilePhoto?.dataUrl;
  
  return (
    <div 
      className="cv-print-preview"
      style={{ 
        fontFamily: fontOption.fontFamily,
        fontSize: sizeOption.body,
        lineHeight: 1.5,
      }}
    >
      <div className="grid grid-cols-[280px_1fr]">
        {/* LEFT COLUMN */}
        <div 
          className="bg-slate-50 p-6 border-r border-slate-200"
          style={{ 
            pageBreakInside: 'avoid',
            breakInside: 'avoid',
          }}
        >
          {/* Photo */}
          {showPhoto && (
            <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-2 border-slate-300">
              <img
                src={profile.profilePhoto!.dataUrl}
                alt={profile?.name || 'Profilbillede'}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Name & Title */}
          <div className="text-center mb-6">
            <h1 
              className="font-bold text-slate-900 mb-1"
              style={{ fontSize: sizeOption.name }}
            >
              {profile?.name || 'Dit navn'}
            </h1>
            {profile?.title && (
              <p className="text-slate-600" style={{ fontSize: sizeOption.heading }}>
                {profile.title}
              </p>
            )}
          </div>
          
          {/* Contact */}
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-300 pb-1">
              Kontakt
            </h2>
            <div className="space-y-1 text-sm text-slate-700">
              {profile?.email && <div>{profile.email}</div>}
              {profile?.phone && <div>{profile.phone}</div>}
              {profile?.location && <div>{profile.location}</div>}
              {profile?.linkedin && <div>{profile.linkedin}</div>}
              {profile?.portfolio && <div>{profile.portfolio}</div>}
            </div>
          </div>
          
          {/* Education */}
          {leftColumn.education.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-300 pb-1">
                Uddannelse
              </h2>
              <div className="space-y-2">
                {leftColumn.education.map((item) => (
                  <div key={item.id}>
                    <div className="font-medium text-xs">{item.title}</div>
                    <div className="text-[11px] text-slate-600">{item.institution}</div>
                    <div className="text-[11px] text-slate-500">{item.year}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Skills */}
          {leftColumn.skills.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-300 pb-1">
                Kompetencer
              </h2>
              <div className="space-y-1">
                {leftColumn.skills.map((item) => (
                  <div key={item.id} className="flex items-start gap-2 text-sm">
                    <span className="text-slate-400 mt-[2px] flex-shrink-0">•</span>
                    <span className="leading-relaxed">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Languages */}
          {leftColumn.languages.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-300 pb-1">
                Sprog
              </h2>
              <div className="space-y-1 text-sm">
                {leftColumn.languages.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.language}</span>
                    <span className="text-slate-500">{LANGUAGE_LEVEL_LABELS[item.level] || item.level}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* RIGHT COLUMN */}
        <div className="p-8">
          {/* Professional Intro */}
          <div className="mb-8">
            <h2 
              className="font-bold text-slate-900 uppercase tracking-wider mb-3 pb-1 border-b border-slate-300"
              style={{ fontSize: sizeOption.heading }}
            >
              Profil
            </h2>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {rightColumn.professionalIntro.content}
            </div>
          </div>
          
          {/* Experience */}
          {rightColumn.experience.length > 0 && (
            <div>
              <h2 
                className="font-bold text-slate-900 uppercase tracking-wider mb-4 pb-1 border-b border-slate-300"
                style={{ fontSize: sizeOption.heading }}
              >
                Erfaring
              </h2>
              
              <div className="space-y-6">
                {rightColumn.experience.map((exp, index) => (
                  <div 
                    key={exp.id}
                    style={{ 
                      pageBreakInside: 'avoid',
                      breakInside: 'avoid',
                    }}
                  >
                    {/* Separator */}
                    {index > 0 && (
                      <div className="border-t border-slate-200 mb-4 pt-4" />
                    )}
                    
                    {/* Header */}
                    <div className="mb-2">
                      {/* Title on its own line */}
                      <div className="font-semibold leading-tight" style={{ fontSize: sizeOption.heading }}>
                        {exp.title}
                      </div>
                      
                      {/* Company and Location on same line */}
                      <div className="text-sm leading-tight mt-1">
                        <span>{exp.company}</span>
                        {exp.location && (
                          <>
                            <span className="text-slate-400 mx-1">·</span>
                            <span className="text-slate-600">{exp.location}</span>
                          </>
                        )}
                      </div>
                      
                      {/* Date range on its own line */}
                      <div className="text-sm text-slate-500 leading-tight mt-1">
                        {exp.startDate} – {exp.endDate || 'Nu'}
                      </div>
                    </div>
                    
                    {/* Key Milestones */}
                    {exp.keyMilestones && (
                      <div className="mb-3 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {exp.keyMilestones}
                      </div>
                    )}
                    
                    {/* Bullets */}
                    {exp.bullets.length > 0 && (
                      <ul className="space-y-1.5">
                        {exp.bullets.map((bullet) => (
                          <li key={bullet.id} className="flex items-start gap-2 text-sm">
                            <span className="text-slate-400 mt-[3px] flex-shrink-0">•</span>
                            <span className="text-slate-700 leading-relaxed">{bullet.content}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
