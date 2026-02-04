'use client';

import { useState, useEffect } from 'react';
import { useCVEditor } from '@/contexts/cv-editor-context';
import { useUserProfile } from '@/contexts/user-profile-context';
import { FONT_FAMILY_OPTIONS, TEXT_SIZE_OPTIONS, CVSettings } from '@/lib/cv-types';
import { hasCVData } from '@/lib/cv-normalizer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Undo2,
  Redo2,
  Download,
  Save,
  Settings,
  Bookmark,
  History,
  Check,
  Trash2,
  RotateCcw,
  Type,
  Palette,
  FileCheck,
  RefreshCw,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { LANGUAGE_LEVEL_LABELS } from '@/lib/cv-types';

interface CVEditorToolbarProps {
  jobTitle?: string;
}

export function CVEditorToolbar({ jobTitle }: CVEditorToolbarProps) {
  const { 
    state, 
    undo, 
    redo, 
    canUndo, 
    canRedo, 
    saveDocument,
    reloadFromOriginal,
    updateSettings,
    createCheckpoint,
    restoreCheckpoint,
    deleteCheckpoint,
  } = useCVEditor();
  const { canExport, profile } = useUserProfile();
  
  const [checkpointName, setCheckpointName] = useState('');
  const [showCheckpointDialog, setShowCheckpointDialog] = useState(false);
  const [showExportWarning, setShowExportWarning] = useState(false);
  const [showReloadDialog, setShowReloadDialog] = useState(false);
  const [showLanguageLevelWarning, setShowLanguageLevelWarning] = useState(false);
  const [missingLanguageLevels, setMissingLanguageLevels] = useState<string[]>([]);
  const [isReloading, setIsReloading] = useState(false);
  const [cvPreloaded, setCvPreloaded] = useState(false);
  
  // Check if CV was preloaded
  useEffect(() => {
    setCvPreloaded(hasCVData());
  }, []);
  
  const document = state.document;
  const exportReqs = canExport();
  
  // Validate language levels before export
  const validateLanguageLevels = (): { valid: boolean; missing: string[] } => {
    if (!document) return { valid: true, missing: [] };
    
    const languagesWithoutLevel = document.leftColumn.languages.filter(
      (lang) => lang.language && lang.language.trim() !== '' && (!lang.level || lang.level.trim() === '')
    );
    
    return {
      valid: languagesWithoutLevel.length === 0,
      missing: languagesWithoutLevel.map((l) => l.language),
    };
  };
  
  const handleExportPDF = async () => {
    if (!exportReqs.canExport) {
      setShowExportWarning(true);
      return;
    }
    
    if (!document) {
      alert('No CV document to export');
      return;
    }
    
    // Validate language levels
    const languageValidation = validateLanguageLevels();
    if (!languageValidation.valid) {
      setMissingLanguageLevels(languageValidation.missing);
      setShowLanguageLevelWarning(true);
      return;
    }
    
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Professional layout constants - refined spacing
      const leftColumnWidth = 62;
      const rightColumnStart = leftColumnWidth + 8;
      const rightColumnWidth = pageWidth - rightColumnStart - 12;
      const marginTop = 18;
      const marginLeft = 12;
      const sectionSpacing = 8;
      const itemSpacing = 4;
      
      let leftY = marginTop;
      let rightY = marginTop;
      let currentPage = 1;
      
      // Helper function to draw left column background
      const drawLeftColumnBg = () => {
        pdf.setFillColor(250, 250, 250); // Very subtle gray - more professional
        pdf.rect(0, 0, leftColumnWidth, pageHeight, 'F');
      };
      
      // Helper function to add footer (page 2+ only)
      // Footer: Name and email centered in left column, page number on right
      const addFooter = (pageNum: number) => {
        if (pageNum > 1 && profile?.name) {
          const footerBottomY = pageHeight - 10;
          const leftColumnCenter = leftColumnWidth / 2; // Center of left column
          
          // Name - centered in left column
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(7);
          pdf.setTextColor(150, 150, 150); // Light gray
          pdf.text(profile.name, leftColumnCenter, footerBottomY, { align: 'center' });
          
          // Email - centered below name in left column
          if (profile.email) {
            pdf.setFontSize(6.5);
            pdf.setTextColor(170, 170, 170); // Slightly lighter
            pdf.text(profile.email, leftColumnCenter, footerBottomY + 3.5, { align: 'center' });
          }
          
          // Page number - right side of page
          pdf.setFontSize(6.5);
          pdf.setTextColor(180, 180, 180);
          pdf.text(`${pageNum}`, pageWidth - 12, footerBottomY + 1.5, { align: 'right' });
        }
      };
      
      // Draw left column background
      drawLeftColumnBg();
      
      // === LEFT COLUMN (Page 1) ===
      
      // Profile Photo (rounded/circular) - medium size, not dominant
      if (document.leftColumn.showProfilePhoto && profile?.profilePhoto?.dataUrl) {
        const photoSize = 28; // mm - medium size
        const photoX = marginLeft;
        const photoY = leftY;
        
        try {
          // Create a circular version of the image using canvas
          const img = new Image();
          img.src = profile.profilePhoto.dataUrl;
          
          // Wait for image to load
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Failed to load image'));
            // If already loaded
            if (img.complete) resolve();
          });
          
          // Create canvas for circular crop
          const canvas = window.document.createElement('canvas');
          const size = 200; // px - high res for quality
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            // Draw circular clip
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            
            // Draw image centered and covering the circle
            const aspectRatio = img.width / img.height;
            let drawWidth = size;
            let drawHeight = size;
            let offsetX = 0;
            let offsetY = 0;
            
            if (aspectRatio > 1) {
              drawWidth = size * aspectRatio;
              offsetX = -(drawWidth - size) / 2;
            } else {
              drawHeight = size / aspectRatio;
              offsetY = -(drawHeight - size) / 2;
            }
            
            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
            
            // Get circular image as PNG (supports transparency)
            const circularDataUrl = canvas.toDataURL('image/png');
            
            // Add circular image to PDF
            pdf.addImage(
              circularDataUrl,
              'PNG',
              photoX,
              photoY,
              photoSize,
              photoSize
            );
          }
          
          // CRITICAL: Add clear vertical spacing between photo and name (6mm = ~17px)
          leftY += photoSize + 6;
        } catch (e) {
          console.error('Error adding profile photo to PDF:', e);
          // Continue without photo if it fails
        }
      }
      
      // === HEADER SECTION (Name is largest text on page) ===
      
      // Full Name - largest text on the page, visually stands on its own
      if (profile?.name) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(16); // Largest on page
        pdf.setTextColor(25, 25, 25); // Near black
        const nameLines = pdf.splitTextToSize(profile.name, leftColumnWidth - 14);
        pdf.text(nameLines, marginLeft, leftY);
        leftY += nameLines.length * 6 + 3;
      }
      
      // Professional Title - smaller, muted
      if (profile?.title) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100); // Muted gray
        const titleLines = pdf.splitTextToSize(profile.title, leftColumnWidth - 14);
        pdf.text(titleLines, marginLeft, leftY);
        leftY += titleLines.length * 4 + sectionSpacing;
      }
      
      // === CONTACT SECTION ===
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(80, 80, 80); // Dark gray for section headers
      pdf.text('CONTACT', marginLeft, leftY);
      leftY += 5;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(50, 50, 50); // Dark gray for content
      
      if (profile?.email) {
        pdf.text(profile.email, marginLeft, leftY);
        leftY += 4.5;
      }
      if (profile?.phone) {
        pdf.text(profile.phone, marginLeft, leftY);
        leftY += 4.5;
      }
      if (profile?.city) {
        pdf.text(profile.city, marginLeft, leftY);
        leftY += 4.5;
      }
      
      leftY += sectionSpacing;
      
      // === SKILLS SECTION ===
      if (document.leftColumn.skills.length > 0) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(80, 80, 80);
        pdf.text('SKILLS', marginLeft, leftY);
        leftY += 5;
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(50, 50, 50);
        
        for (const skill of document.leftColumn.skills) {
          if (skill.name) {
            pdf.text('• ' + skill.name, marginLeft, leftY);
            leftY += 4.5;
          }
        }
        leftY += sectionSpacing;
      }
      
      // === LANGUAGES SECTION ===
      if (document.leftColumn.languages.length > 0) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(80, 80, 80);
        pdf.text('LANGUAGES', marginLeft, leftY);
        leftY += 5;
        
        for (const lang of document.leftColumn.languages) {
          if (lang.language) {
            const levelLabel = LANGUAGE_LEVEL_LABELS[lang.level] || lang.level;
            // Language name - normal weight
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(9);
            pdf.setTextColor(50, 50, 50);
            pdf.text(lang.language, marginLeft, leftY);
            // Level - muted
            pdf.setFontSize(8);
            pdf.setTextColor(120, 120, 120);
            pdf.text(levelLabel, marginLeft, leftY + 3.5);
            leftY += 9;
          }
        }
        leftY += sectionSpacing;
      }
      
      // === EDUCATION SECTION ===
      if (document.leftColumn.education.length > 0) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(80, 80, 80);
        pdf.text('EDUCATION', marginLeft, leftY);
        leftY += 5;
        
        for (const edu of document.leftColumn.education) {
          // Education title - bold (this is a section title within education)
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(9);
          pdf.setTextColor(50, 50, 50);
          if (edu.title) {
            const titleLines = pdf.splitTextToSize(edu.title, leftColumnWidth - 14);
            pdf.text(titleLines, marginLeft, leftY);
            leftY += titleLines.length * 4;
          }
          
          // Institution - normal weight, muted
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8);
          pdf.setTextColor(100, 100, 100);
          if (edu.institution) {
            pdf.text(edu.institution, marginLeft, leftY);
            leftY += 3.5;
          }
          // Year - muted gray (dates never bold)
          if (edu.year) {
            pdf.setTextColor(130, 130, 130);
            pdf.text(edu.year, marginLeft, leftY);
            leftY += 3.5;
          }
          leftY += itemSpacing;
        }
      }
      
      // === RIGHT COLUMN ===
      
      // Profile/Summary - short (3-4 lines max), calm, factual, professional
      if (document.rightColumn.professionalIntro.content) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(80, 80, 80);
        pdf.text('PROFILE', rightColumnStart, rightY);
        rightY += 5;
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(50, 50, 50);
        const summaryLines = pdf.splitTextToSize(document.rightColumn.professionalIntro.content, rightColumnWidth);
        pdf.text(summaryLines, rightColumnStart, rightY);
        rightY += summaryLines.length * 4 + sectionSpacing + 2;
      }
      
      // === EXPERIENCE SECTION ===
      if (document.rightColumn.experience.length > 0) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(80, 80, 80);
        pdf.text('EXPERIENCE', rightColumnStart, rightY);
        rightY += 6;
        
        for (let expIndex = 0; expIndex < document.rightColumn.experience.length; expIndex++) {
          const exp = document.rightColumn.experience[expIndex];
          
          // Check if we need a new page
          if (rightY > pageHeight - 40) {
            // Add footer to current page before creating new one
            addFooter(currentPage);
            pdf.addPage();
            currentPage++;
            rightY = marginTop;
            // Redraw left column background on new page
            drawLeftColumnBg();
          }
          
          // Job Title - bold (only job titles get bold)
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(10);
          pdf.setTextColor(30, 30, 30);
          if (exp.title) {
            pdf.text(exp.title, rightColumnStart, rightY);
            rightY += 4.5;
          }
          
          // Company, location, period - normal weight (never bold)
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          pdf.setTextColor(70, 70, 70);
          let companyLine = exp.company || '';
          if (exp.location) companyLine += ', ' + exp.location;
          if (companyLine) {
            pdf.text(companyLine, rightColumnStart, rightY);
            rightY += 4;
          }
          
          // Dates - normal weight, muted color (dates never bold)
          pdf.setFontSize(8);
          pdf.setTextColor(130, 130, 130); // Light gray for dates
          let dateLine = exp.startDate || '';
          if (exp.endDate) dateLine += ' – ' + exp.endDate;
          else if (dateLine) dateLine += ' – Present';
          if (dateLine) {
            pdf.text(dateLine, rightColumnStart, rightY);
            rightY += 5;
          }
          
          // Key milestones / narrative paragraph - italic for context
          if (exp.keyMilestones) {
            pdf.setFont('helvetica', 'italic');
            pdf.setFontSize(9);
            pdf.setTextColor(60, 60, 60);
            const milestoneLines = pdf.splitTextToSize(exp.keyMilestones, rightColumnWidth);
            pdf.text(milestoneLines, rightColumnStart, rightY);
            rightY += milestoneLines.length * 4 + 3;
          }
          
          // Bullets - normal weight (never bold), action-oriented
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          pdf.setTextColor(50, 50, 50);
          for (const bullet of exp.bullets) {
            if (bullet.content) {
              const bulletLines = pdf.splitTextToSize('• ' + bullet.content, rightColumnWidth);
              
              // Check if we need a new page
              if (rightY + bulletLines.length * 4 > pageHeight - 20) {
                // Add footer to current page
                addFooter(currentPage);
                pdf.addPage();
                currentPage++;
                rightY = marginTop;
                drawLeftColumnBg();
              }
              
              pdf.text(bulletLines, rightColumnStart, rightY);
              rightY += bulletLines.length * 4 + 1;
            }
          }
          
          // Add visual separation between roles using whitespace only (no lines)
          rightY += 8;
        }
      }
      
      // Add footer to last page if it's page 2 or later
      addFooter(currentPage);
      
      // Save
      const userName = profile?.name?.replace(/[^a-zA-Z0-9æøåÆØÅ\s]/g, '').replace(/\s+/g, '_') || 'CV';
      pdf.save(`CV_${userName}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('An error occurred while generating PDF. Please try again.');
    }
  };
  
  const handleCreateCheckpoint = () => {
    if (checkpointName.trim()) {
      createCheckpoint(checkpointName.trim());
      setCheckpointName('');
      setShowCheckpointDialog(false);
    }
  };
  
  const handleFontChange = (fontFamily: CVSettings['fontFamily']) => {
    updateSettings({ fontFamily });
  };
  
  const handleSizeChange = (textSize: CVSettings['textSize']) => {
    updateSettings({ textSize });
  };
  
  const handleReload = async () => {
    setIsReloading(true);
    try {
      await reloadFromOriginal();
    } finally {
      setIsReloading(false);
      setShowReloadDialog(false);
    }
  };
  
  return (
    <div className="cv-editor-toolbar sticky top-0 z-50 bg-white dark:bg-gray-950 border-b shadow-sm print:hidden">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left side - Title and status */}
          <div className="flex items-center gap-3">
            <h1 className="font-semibold text-lg truncate max-w-[200px] sm:max-w-[300px]">
              CV Editor
            </h1>
            {cvPreloaded && (
              <Badge variant="secondary" className="hidden sm:inline-flex gap-1 text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                <FileCheck className="h-3 w-3" />
                From your CV
              </Badge>
            )}
            {jobTitle && (
              <Badge variant="outline" className="hidden sm:inline-flex truncate max-w-[200px]">
                {jobTitle}
              </Badge>
            )}
            {state.isSaving && (
              <Badge variant="secondary" className="text-xs">
                Saving...
              </Badge>
            )}
          </div>
          
          {/* Center - Undo/Redo and formatting */}
          <div className="flex items-center gap-1">
            {/* Undo/Redo */}
            <Button
              variant="ghost"
              size="icon"
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
            
            <div className="w-px h-6 bg-border mx-2" />
            
            {/* Font family */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Type className="h-4 w-4" />
                  <span className="hidden sm:inline">Font</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Font</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {FONT_FAMILY_OPTIONS.map(font => (
                  <DropdownMenuItem 
                    key={font.value}
                    onClick={() => handleFontChange(font.value as CVSettings['fontFamily'])}
                    className="flex items-center justify-between"
                  >
                    <span style={{ fontFamily: font.fontFamily }}>{font.label}</span>
                    {document?.settings.fontFamily === font.value && (
                      <Check className="h-4 w-4 ml-2" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Text size */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Palette className="h-4 w-4" />
                  <span className="hidden sm:inline">Size</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Text size</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(['small', 'normal', 'large'] as const).map(size => (
                  <DropdownMenuItem 
                    key={size}
                    onClick={() => handleSizeChange(size)}
                    className="flex items-center justify-between"
                  >
                    <span>
                      {size === 'small' && 'Small'}
                      {size === 'normal' && 'Normal'}
                      {size === 'large' && 'Large'}
                    </span>
                    {document?.settings.textSize === size && (
                      <Check className="h-4 w-4 ml-2" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Right side - Actions */}
          <div className="flex items-center gap-2">
            {/* Checkpoints */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" title="Versions">
                  <History className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Saved versions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {document?.checkpoints.length === 0 ? (
                  <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                    No saved versions yet
                  </div>
                ) : (
                  document?.checkpoints.map(cp => (
                    <DropdownMenuItem 
                      key={cp.id} 
                      className="flex items-center justify-between group"
                    >
                      <div className="flex-1 truncate">
                        <div className="font-medium text-sm">{cp.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(cp.createdAt).toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            restoreCheckpoint(cp.id);
                          }}
                          title="Restore"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCheckpoint(cp.id);
                          }}
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
                
                <DropdownMenuSeparator />
                <Dialog open={showCheckpointDialog} onOpenChange={setShowCheckpointDialog}>
                  <DialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Bookmark className="h-4 w-4 mr-2" />
                      Save version
                    </DropdownMenuItem>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Save version</DialogTitle>
                      <DialogDescription>
                        Give this version a name so you can find it later.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Label htmlFor="checkpoint-name">Name</Label>
                      <Input
                        id="checkpoint-name"
                        value={checkpointName}
                        onChange={(e) => setCheckpointName(e.target.value)}
                        placeholder="e.g. 'Before AI changes'"
                        className="mt-2"
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateCheckpoint()}
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCheckpointDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateCheckpoint} disabled={!checkpointName.trim()}>
                        Save
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Reload from original */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowReloadDialog(true)} 
              title="Reload from original CV"
              disabled={isReloading}
            >
              <RefreshCw className={`h-4 w-4 ${isReloading ? 'animate-spin' : ''}`} />
            </Button>
            
            {/* Save */}
            <Button variant="ghost" size="icon" onClick={saveDocument} title="Save">
              <Save className="h-4 w-4" />
            </Button>
            
            {/* Export PDF */}
            <Button onClick={handleExportPDF} className="gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download PDF</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Export warning dialog */}
      <Dialog open={showExportWarning} onOpenChange={setShowExportWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Missing profile information</DialogTitle>
            <DialogDescription>
              Before you can export your CV, please fill in the following information in your profile:
            </DialogDescription>
          </DialogHeader>
          <ul className="list-disc list-inside space-y-1 py-4">
            {exportReqs.missingRequiredFields.map((field, i) => (
              <li key={i} className="text-sm text-muted-foreground">{field}</li>
            ))}
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportWarning(false)}>
              Close
            </Button>
            <Button onClick={() => window.location.href = '/app/profil'}>
              Go to profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Language level warning dialog */}
      <Dialog open={showLanguageLevelWarning} onOpenChange={setShowLanguageLevelWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Missing language levels</DialogTitle>
            <DialogDescription>
              Please select a proficiency level for each language before downloading your CV.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-2">The following languages need a level:</p>
            <ul className="list-disc list-inside space-y-1">
              {missingLanguageLevels.map((lang, i) => (
                <li key={i} className="text-sm font-medium">{lang}</li>
              ))}
            </ul>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowLanguageLevelWarning(false)}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reload confirmation dialog */}
      <Dialog open={showReloadDialog} onOpenChange={setShowReloadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reload from original CV</DialogTitle>
            <DialogDescription>
              This will re-parse your original CV and replace all your current changes. 
              Your previous edits will be lost.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 px-1 text-sm text-muted-foreground">
            <p className="mb-2">Use this feature if:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Text is truncated or missing</li>
              <li>Dates or titles are incorrect</li>
              <li>You want to start over with fresh data</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReloadDialog(false)} disabled={isReloading}>
              Cancel
            </Button>
            <Button onClick={handleReload} disabled={isReloading}>
              {isReloading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Reloading...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
