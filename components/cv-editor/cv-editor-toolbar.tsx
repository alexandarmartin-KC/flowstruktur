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
} from 'lucide-react';

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
    updateSettings,
    createCheckpoint,
    restoreCheckpoint,
    deleteCheckpoint,
  } = useCVEditor();
  const { canExport } = useUserProfile();
  
  const [checkpointName, setCheckpointName] = useState('');
  const [showCheckpointDialog, setShowCheckpointDialog] = useState(false);
  const [showExportWarning, setShowExportWarning] = useState(false);
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
    window.print();
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
    </div>
  );
}
