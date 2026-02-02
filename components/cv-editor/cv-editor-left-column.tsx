'use client';

import { useState } from 'react';
import { useCVEditor } from '@/contexts/cv-editor-context';
import { UserProfile } from '@/contexts/user-profile-context';
import { LANGUAGE_LEVEL_OPTIONS, LANGUAGE_LEVEL_LABELS, CVLanguageItem, TextSizeOption } from '@/lib/cv-types';
import { getTranslations, type CVLanguage } from '@/lib/cv-translations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Globe,
  Plus,
  X,
  GripVertical,
  Image as ImageIcon,
} from 'lucide-react';

interface CVEditorLeftColumnProps {
  profile: UserProfile;
  fontSize: TextSizeOption;
}

export function CVEditorLeftColumn({ profile, fontSize }: CVEditorLeftColumnProps) {
  const { 
    state, 
    toggleProfilePhoto,
    addEducation,
    updateEducation,
    removeEducation,
    addSkill,
    updateSkill,
    removeSkill,
    addLanguage,
    updateLanguage,
    removeLanguage,
  } = useCVEditor();
  
  const document = state.document;
  if (!document) return null;
  
  const { leftColumn } = document;
  const lang = (document.language || 'da') as CVLanguage;
  const tr = getTranslations(lang);
  const showPhoto = leftColumn.showProfilePhoto && profile?.profilePhoto?.dataUrl;
  
  return (
    <div 
      className="cv-left-column bg-slate-50 dark:bg-slate-900 p-6 border-r border-slate-200 dark:border-slate-800"
      style={{ fontSize: fontSize.body }}
    >
      {/* Profile Photo Toggle & Display */}
      {showPhoto ? (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3 no-print">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Profile photo
            </span>
            <Switch
              checked={leftColumn.showProfilePhoto}
              onCheckedChange={toggleProfilePhoto}
              disabled={!profile?.profilePhoto?.dataUrl}
            />
          </div>
          <div className="cv-profile-photo w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-slate-300 dark:border-slate-600">
            <img
              src={profile.profilePhoto!.dataUrl}
              alt={profile.name || 'Profile photo'}
              className="w-full h-full object-cover"
              style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
            />
          </div>
        </div>
      ) : (
        <div className="mb-6 no-print">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Profile photo
            </span>
            <Switch
              checked={leftColumn.showProfilePhoto}
              onCheckedChange={toggleProfilePhoto}
              disabled={!profile?.profilePhoto?.dataUrl}
            />
          </div>
          <div className="w-24 h-24 mx-auto rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400">
            <ImageIcon className="h-8 w-8" />
          </div>
          {!profile?.profilePhoto?.dataUrl && (
            <p className="text-xs text-slate-400 text-center mt-2">
              Upload photo in your profile
            </p>
          )}
        </div>
      )}
      
      {/* Name & Title (from profile - read only) */}
      <div className="mb-6 text-center">
        <h1 
          className="font-bold text-slate-900 dark:text-slate-100 mb-1"
          style={{ fontSize: fontSize.name }}
        >
          {profile?.name || 'Your name'}
        </h1>
        {profile?.title && (
          <p className="text-slate-600 dark:text-slate-400" style={{ fontSize: fontSize.heading }}>
            {profile.title}
          </p>
        )}
      </div>
      
      {/* Contact Details (from profile - read only) */}
      <div className="mb-6 space-y-2">
        <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
          Contact
        </h2>
        
        {profile?.email && (
          <div className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
            <Mail className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
            <span className="break-all">{profile.email}</span>
          </div>
        )}
        
        {profile?.phone && (
          <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <Phone className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <span>{profile.phone}</span>
          </div>
        )}
        
        {profile?.location && (
          <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <span>{profile.location}</span>
          </div>
        )}
        
        {profile?.linkedin && (
          <div className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
            <Linkedin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
            <span className="break-all">{profile.linkedin}</span>
          </div>
        )}
        
        {profile?.portfolio && (
          <div className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
            <Globe className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
            <span className="break-all">{profile.portfolio}</span>
          </div>
        )}
      </div>
      
      {/* Education */}
      <div className="mb-6">
        <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
          {tr.education}
        </h2>
        
        <div className="space-y-3">
          {leftColumn.education.map((item) => (
            <div 
              key={item.id} 
              className="group relative bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm border border-slate-200 dark:border-slate-700 overflow-visible"
            >
              <button
                onClick={() => removeEducation(item.id)}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity no-print"
              >
                <X className="h-3 w-3" />
              </button>
              
              <textarea
                value={item.title}
                onChange={(e) => updateEducation(item.id, { title: e.target.value })}
                placeholder="Education / Title"
                rows={1}
                className="w-full font-medium text-xs py-0.5 px-1 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-blue-500 resize-none overflow-hidden"
                style={{ minHeight: '1.5em' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = target.scrollHeight + 'px';
                }}
              />
              <textarea
                value={item.institution}
                onChange={(e) => updateEducation(item.id, { institution: e.target.value })}
                placeholder="Institution"
                rows={1}
                className="w-full text-[11px] text-slate-600 py-0.5 px-1 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-blue-500 resize-none overflow-hidden mt-0.5"
                style={{ minHeight: '1.5em' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = target.scrollHeight + 'px';
                }}
              />
              <textarea
                value={item.year}
                onChange={(e) => updateEducation(item.id, { year: e.target.value })}
                placeholder="Year (e.g. 2016 - 2019)"
                rows={1}
                className="w-full text-[11px] text-slate-500 py-0.5 px-1 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-blue-500 resize-none overflow-hidden mt-0.5"
                style={{ minHeight: '1.5em' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = target.scrollHeight + 'px';
                }}
              />
            </div>
          ))}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addEducation()}
            className="w-full text-xs text-slate-500 hover:text-slate-700 no-print"
          >
            <Plus className="h-3 w-3 mr-1" />
            {tr.addEducation}
          </Button>
        </div>
      </div>
      
      {/* Skills */}
      <div className="mb-6">
        <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
          {tr.skills}
        </h2>
        
        <div className="space-y-2">
          {leftColumn.skills.map((item) => (
            <div 
              key={item.id}
              className="group flex items-start gap-2"
            >
              <span className="text-slate-400 text-xs mt-1.5">•</span>
              <textarea
                value={item.name}
                onChange={(e) => {
                  updateSkill(item.id, { name: e.target.value });
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                placeholder={lang === 'en' ? 'Skill' : 'Kompetence'}
                className="text-sm py-1 px-2 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-ring rounded flex-1 resize-none overflow-hidden min-h-[24px] leading-snug"
                rows={1}
                onFocus={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
              />
              <button
                onClick={() => removeSkill(item.id)}
                className="p-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity no-print mt-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addSkill()}
            className="w-full text-xs text-slate-500 hover:text-slate-700 no-print"
          >
            <Plus className="h-3 w-3 mr-1" />
            {tr.addSkill}
          </Button>
        </div>
      </div>
      
      {/* Languages */}
      <div className="mb-6">
        <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
          {tr.languages}
        </h2>
        
        <div className="space-y-2">
          {leftColumn.languages.map((item) => (
            <div 
              key={item.id}
              className="group"
            >
              <div className="flex items-center gap-1">
                <Input
                  value={item.language}
                  onChange={(e) => updateLanguage(item.id, { language: e.target.value })}
                  placeholder={lang === 'en' ? 'Language' : 'Sprog'}
                  className="text-sm h-auto py-1 px-2 border-0 bg-transparent focus-visible:ring-1 flex-1 min-w-0"
                />
                <button
                  onClick={() => removeLanguage(item.id)}
                  className="p-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity no-print flex-shrink-0"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <Select
                value={item.level}
                onValueChange={(value) => updateLanguage(item.id, { level: value })}
              >
                <SelectTrigger className="w-full h-auto py-0.5 px-2 text-xs border-0 bg-transparent text-slate-500">
                  <SelectValue placeholder={item.level || (lang === 'en' ? 'Select level' : 'Vælg niveau')} />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_LEVEL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-xs">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addLanguage()}
            className="w-full text-xs text-slate-500 hover:text-slate-700 no-print"
          >
            <Plus className="h-3 w-3 mr-1" />
            {tr.addLanguage}
          </Button>
        </div>
      </div>
    </div>
  );
}
