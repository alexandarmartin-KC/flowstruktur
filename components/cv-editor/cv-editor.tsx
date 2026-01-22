'use client';

import { useEffect, useState } from 'react';
import { useCVEditor, CVEditorProvider } from '@/contexts/cv-editor-context';
import { useUserProfile } from '@/contexts/user-profile-context';
import { useSavedJobs } from '@/contexts/saved-jobs-context';
import { FONT_FAMILY_OPTIONS, TEXT_SIZE_OPTIONS } from '@/lib/cv-types';
import { CVEditorToolbar } from './cv-editor-toolbar';
import { CVEditorLeftColumn } from './cv-editor-left-column';
import { CVEditorRightColumn } from './cv-editor-right-column';
import { Loader2 } from 'lucide-react';

interface CVEditorProps {
  jobId: string;
}

function CVEditorInner({ jobId }: CVEditorProps) {
  const { state, loadDocument } = useCVEditor();
  const { profile, isLoaded: profileLoaded } = useUserProfile();
  const { savedJobs, isLoaded: jobsLoaded } = useSavedJobs();
  
  const job = savedJobs.find(j => j.id === jobId);
  
  // Load document on mount
  useEffect(() => {
    if (jobsLoaded) {
      loadDocument(jobId);
    }
  }, [jobId, jobsLoaded, loadDocument]);
  
  // Loading state
  if (!state.isLoaded || !profileLoaded || !jobsLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Indlæser CV editor...</p>
        </div>
      </div>
    );
  }
  
  if (!state.document) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Kunne ikke indlæse CV dokumentet.</p>
      </div>
    );
  }
  
  const { settings } = state.document;
  const fontOption = FONT_FAMILY_OPTIONS.find(f => f.value === settings.fontFamily) || FONT_FAMILY_OPTIONS[0];
  const sizeOption = TEXT_SIZE_OPTIONS[settings.textSize];
  
  return (
    <div className="cv-editor-container">
      {/* Toolbar */}
      <CVEditorToolbar jobTitle={job?.title} />
      
      {/* Editor canvas - fixed two-column layout */}
      <div className="cv-editor-canvas bg-gray-100 dark:bg-gray-900 py-8 px-4 min-h-screen">
        <div 
          className="cv-document bg-white shadow-lg mx-auto max-w-[850px] min-h-[1100px] print:shadow-none print:max-w-none"
          style={{ 
            fontFamily: fontOption.fontFamily,
            fontSize: sizeOption.body,
          }}
        >
          {/* Two-column grid - locked widths */}
          <div className="grid grid-cols-[280px_1fr] min-h-[1100px]">
            {/* LEFT COLUMN - Narrow factual sidebar */}
            <CVEditorLeftColumn 
              profile={profile}
              fontSize={sizeOption}
            />
            
            {/* RIGHT COLUMN - Main content */}
            <CVEditorRightColumn 
              fontSize={sizeOption}
              jobDescription={job?.description || job?.fullData?.description}
            />
          </div>
        </div>
      </div>
      
      {/* Print footer - contact info from user profile */}
      <div className="cv-print-footer">
        {profile?.name}
        {profile?.email && <> &nbsp;&#47;&#47;&nbsp; {profile.email}</>}
        {profile?.phone && <> &nbsp;&#47;&#47;&nbsp; {profile.phone}</>}
      </div>
      
      {/* Print styles */}
      <style jsx global>{`
        /* Hide footer in screen mode */
        .cv-print-footer {
          display: none;
        }
        
        @media print {
          body * {
            visibility: hidden;
          }
          .cv-document, .cv-document * {
            visibility: visible;
          }
          .cv-document {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: none !important;
            box-shadow: none !important;
          }
          .cv-editor-toolbar,
          .print\\:hidden {
            display: none !important;
          }
          .no-print {
            display: none !important;
          }
          
          /* Page setup */
          @page {
            size: A4;
            margin: 10mm 10mm 18mm 10mm;
          }
          
          /* Print footer - fixed at bottom of every page */
          .cv-print-footer {
            display: block !important;
            visibility: visible !important;
            position: fixed;
            bottom: 5mm;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 8pt;
            color: #9ca3af;
            letter-spacing: 0.02em;
          }
        }
      `}</style>
    </div>
  );
}

// Wrapper that provides the CVEditorProvider
export function CVEditor({ jobId }: CVEditorProps) {
  return (
    <CVEditorProvider>
      <CVEditorInner jobId={jobId} />
    </CVEditorProvider>
  );
}
