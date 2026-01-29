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
  const [isReloading, setIsReloading] = useState(false);
  const [cvPreloaded, setCvPreloaded] = useState(false);
  
  // Check if CV was preloaded
  useEffect(() => {
    setCvPreloaded(hasCVData());
  }, []);
  
  const document = state.document;
  const exportReqs = canExport();
  
  const handleExportPDF = () => {
    if (!exportReqs.canExport) {
      setShowExportWarning(true);
      return;
    }
    
    if (!document) {
      alert('Intet CV dokument at eksportere');
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
      
      // Layout constants
      const leftColumnWidth = 65;
      const rightColumnStart = leftColumnWidth + 5;
      const rightColumnWidth = pageWidth - rightColumnStart - 10;
      const marginTop = 15;
      const marginLeft = 10;
      const lineHeight = 5;
      
      let leftY = marginTop;
      let rightY = marginTop;
      
      // Draw left column background
      pdf.setFillColor(248, 250, 252); // slate-50
      pdf.rect(0, 0, leftColumnWidth, pageHeight, 'F');
      
      // === LEFT COLUMN ===
      
      // Name
      if (profile?.name) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.setTextColor(30, 41, 59); // slate-800
        const nameLines = pdf.splitTextToSize(profile.name, leftColumnWidth - 15);
        pdf.text(nameLines, marginLeft, leftY);
        leftY += nameLines.length * 6 + 2;
      }
      
      // Title
      if (profile?.title) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(71, 85, 105); // slate-500
        const titleLines = pdf.splitTextToSize(profile.title, leftColumnWidth - 15);
        pdf.text(titleLines, marginLeft, leftY);
        leftY += titleLines.length * 4 + 6;
      }
      
      // Contact section
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139); // slate-500
      pdf.text('KONTAKT', marginLeft, leftY);
      leftY += 5;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(51, 65, 85); // slate-700
      
      if (profile?.email) {
        pdf.text(profile.email, marginLeft, leftY);
        leftY += lineHeight;
      }
      if (profile?.phone) {
        pdf.text(profile.phone, marginLeft, leftY);
        leftY += lineHeight;
      }
      if (profile?.city) {
        pdf.text(profile.city, marginLeft, leftY);
        leftY += lineHeight;
      }
      
      leftY += 5;
      
      // Skills
      if (document.leftColumn.skills.length > 0) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        pdf.text('KOMPETENCER', marginLeft, leftY);
        leftY += 5;
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(51, 65, 85);
        
        for (const skill of document.leftColumn.skills) {
          if (skill.skill) {
            pdf.text('• ' + skill.skill, marginLeft, leftY);
            leftY += lineHeight;
          }
        }
        leftY += 3;
      }
      
      // Languages
      if (document.leftColumn.languages.length > 0) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        pdf.text('SPROG', marginLeft, leftY);
        leftY += 5;
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(51, 65, 85);
        
        for (const lang of document.leftColumn.languages) {
          if (lang.language) {
            const levelLabel = LANGUAGE_LEVEL_LABELS[lang.level] || lang.level;
            pdf.text(lang.language, marginLeft, leftY);
            pdf.setTextColor(100, 116, 139);
            pdf.text(levelLabel, marginLeft, leftY + 4);
            pdf.setTextColor(51, 65, 85);
            leftY += 10;
          }
        }
        leftY += 3;
      }
      
      // Education
      if (document.leftColumn.education.length > 0) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        pdf.text('UDDANNELSE', marginLeft, leftY);
        leftY += 5;
        
        for (const edu of document.leftColumn.education) {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(9);
          pdf.setTextColor(51, 65, 85);
          if (edu.degree) {
            const degreeLines = pdf.splitTextToSize(edu.degree, leftColumnWidth - 15);
            pdf.text(degreeLines, marginLeft, leftY);
            leftY += degreeLines.length * 4;
          }
          
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8);
          pdf.setTextColor(100, 116, 139);
          if (edu.institution) {
            pdf.text(edu.institution, marginLeft, leftY);
            leftY += 4;
          }
          if (edu.year) {
            pdf.text(edu.year, marginLeft, leftY);
            leftY += 4;
          }
          leftY += 3;
        }
      }
      
      // === RIGHT COLUMN ===
      
      // Profile/Summary
      if (document.rightColumn.profileSummary) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(30, 41, 59);
        pdf.text('PROFIL', rightColumnStart, rightY);
        rightY += 6;
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(51, 65, 85);
        const summaryLines = pdf.splitTextToSize(document.rightColumn.profileSummary, rightColumnWidth);
        pdf.text(summaryLines, rightColumnStart, rightY);
        rightY += summaryLines.length * 4 + 8;
      }
      
      // Experience
      if (document.rightColumn.experiences.length > 0) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(30, 41, 59);
        pdf.text('ERFARING', rightColumnStart, rightY);
        rightY += 6;
        
        for (const exp of document.rightColumn.experiences) {
          // Check if we need a new page
          if (rightY > pageHeight - 40) {
            pdf.addPage();
            rightY = marginTop;
            // Redraw left column background on new page
            pdf.setFillColor(248, 250, 252);
            pdf.rect(0, 0, leftColumnWidth, pageHeight, 'F');
          }
          
          // Title
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(10);
          pdf.setTextColor(30, 41, 59);
          if (exp.title) {
            pdf.text(exp.title, rightColumnStart, rightY);
            rightY += 5;
          }
          
          // Company and location
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          pdf.setTextColor(71, 85, 105);
          let companyLine = exp.company || '';
          if (exp.location) companyLine += ' - ' + exp.location;
          if (companyLine) {
            pdf.text(companyLine, rightColumnStart, rightY);
            rightY += 4;
          }
          
          // Dates
          pdf.setFontSize(8);
          pdf.setTextColor(100, 116, 139);
          let dateLine = exp.startDate || '';
          if (exp.endDate) dateLine += ' - ' + exp.endDate;
          else if (dateLine) dateLine += ' - Nu';
          if (dateLine) {
            pdf.text(dateLine, rightColumnStart, rightY);
            rightY += 5;
          }
          
          // Key milestones
          if (exp.keyMilestones) {
            pdf.setFont('helvetica', 'italic');
            pdf.setFontSize(9);
            pdf.setTextColor(51, 65, 85);
            const milestoneLines = pdf.splitTextToSize(exp.keyMilestones, rightColumnWidth);
            pdf.text(milestoneLines, rightColumnStart, rightY);
            rightY += milestoneLines.length * 4 + 2;
          }
          
          // Bullets
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          pdf.setTextColor(51, 65, 85);
          for (const bullet of exp.bullets) {
            if (bullet.content) {
              const bulletLines = pdf.splitTextToSize('• ' + bullet.content, rightColumnWidth);
              
              // Check if we need a new page
              if (rightY + bulletLines.length * 4 > pageHeight - 15) {
                pdf.addPage();
                rightY = marginTop;
                pdf.setFillColor(248, 250, 252);
                pdf.rect(0, 0, leftColumnWidth, pageHeight, 'F');
              }
              
              pdf.text(bulletLines, rightColumnStart, rightY);
              rightY += bulletLines.length * 4 + 1;
            }
          }
          
          rightY += 5;
        }
      }
      
      // Save
      const userName = profile?.name?.replace(/[^a-zA-Z0-9æøåÆØÅ\s]/g, '').replace(/\s+/g, '_') || 'CV';
      pdf.save(`CV_${userName}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Der opstod en fejl ved PDF-generering. Prøv igen.');
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
                Fra dit CV
              </Badge>
            )}
            {jobTitle && (
              <Badge variant="outline" className="hidden sm:inline-flex truncate max-w-[200px]">
                {jobTitle}
              </Badge>
            )}
            {state.isSaving && (
              <Badge variant="secondary" className="text-xs">
                Gemmer...
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
              title="Fortryd (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={redo}
              disabled={!canRedo}
              title="Gentag (Ctrl+Y)"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
            
            <div className="w-px h-6 bg-border mx-2" />
            
            {/* Font family */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Type className="h-4 w-4" />
                  <span className="hidden sm:inline">Skrifttype</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Skrifttype</DropdownMenuLabel>
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
                  <span className="hidden sm:inline">Størrelse</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Tekststørrelse</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(['small', 'normal', 'large'] as const).map(size => (
                  <DropdownMenuItem 
                    key={size}
                    onClick={() => handleSizeChange(size)}
                    className="flex items-center justify-between"
                  >
                    <span>
                      {size === 'small' && 'Lille'}
                      {size === 'normal' && 'Normal'}
                      {size === 'large' && 'Stor'}
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
                <Button variant="ghost" size="icon" title="Versioner">
                  <History className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Gemte versioner</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {document?.checkpoints.length === 0 ? (
                  <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                    Ingen gemte versioner endnu
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
                          {new Date(cp.createdAt).toLocaleDateString('da-DK', {
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
                          title="Gendan"
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
                          title="Slet"
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
                      Gem version
                    </DropdownMenuItem>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Gem version</DialogTitle>
                      <DialogDescription>
                        Giv denne version et navn, så du kan finde den igen senere.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Label htmlFor="checkpoint-name">Navn</Label>
                      <Input
                        id="checkpoint-name"
                        value={checkpointName}
                        onChange={(e) => setCheckpointName(e.target.value)}
                        placeholder="f.eks. 'Før AI ændringer'"
                        className="mt-2"
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateCheckpoint()}
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCheckpointDialog(false)}>
                        Annuller
                      </Button>
                      <Button onClick={handleCreateCheckpoint} disabled={!checkpointName.trim()}>
                        Gem
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
              title="Genindlæs fra original CV"
              disabled={isReloading}
            >
              <RefreshCw className={`h-4 w-4 ${isReloading ? 'animate-spin' : ''}`} />
            </Button>
            
            {/* Save */}
            <Button variant="ghost" size="icon" onClick={saveDocument} title="Gem">
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
            <DialogTitle>Manglende profiloplysninger</DialogTitle>
            <DialogDescription>
              Før du kan eksportere dit CV, skal du udfylde følgende oplysninger i din profil:
            </DialogDescription>
          </DialogHeader>
          <ul className="list-disc list-inside space-y-1 py-4">
            {exportReqs.missingRequiredFields.map((field, i) => (
              <li key={i} className="text-sm text-muted-foreground">{field}</li>
            ))}
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportWarning(false)}>
              Luk
            </Button>
            <Button onClick={() => window.location.href = '/app/profil'}>
              Gå til profil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reload confirmation dialog */}
      <Dialog open={showReloadDialog} onOpenChange={setShowReloadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Genindlæs fra original CV</DialogTitle>
            <DialogDescription>
              Dette vil genparsere dit originale CV og erstatte alle dine nuværende ændringer. 
              Dine tidligere redigeringer vil gå tabt.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 px-1 text-sm text-muted-foreground">
            <p className="mb-2">Brug denne funktion hvis:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Tekst er afkortet eller mangler</li>
              <li>Datoer eller titler er forkerte</li>
              <li>Du vil starte forfra med friske data</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReloadDialog(false)} disabled={isReloading}>
              Annuller
            </Button>
            <Button onClick={handleReload} disabled={isReloading}>
              {isReloading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Genindlæser...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Genindlæs
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
