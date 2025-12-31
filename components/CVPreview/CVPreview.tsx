'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Mail, Phone, Linkedin, ExternalLink } from 'lucide-react';

interface CVSection {
  id: string;
  name: string;
  suggestedText: string;
  status: 'approved' | 'pending' | 'editing' | 'rejected';
}

interface UserProfile {
  name?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  portfolio?: string;
  location?: string;
  profileImage?: string;
  title?: string;
}

interface CVPreviewProps {
  sections: CVSection[];
  profile?: UserProfile;
  jobTitle?: string;
  onEditSection?: (sectionId: string) => void;
}

export function CVPreview({ sections, profile, jobTitle, onEditSection }: CVPreviewProps) {
  const approvedSections = sections.filter(s => s.status === 'approved');

  // Helper to parse experience sections
  const parseExperienceText = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const items: { title: string; company?: string; period?: string; bullets: string[] }[] = [];
    
    let current: any = null;
    
    lines.forEach(line => {
      if (line.startsWith('•')) {
        if (current) {
          current.bullets.push(line.substring(1).trim());
        }
      } else if (line.includes('|')) {
        if (current) items.push(current);
        const parts = line.split('|').map(p => p.trim());
        current = {
          title: parts[0] || '',
          company: parts[1] || '',
          period: parts[2] || '',
          bullets: []
        };
      }
    });
    
    if (current) items.push(current);
    return items;
  };

  // Helper to parse competences into columns
  const parseCompetences = (text: string) => {
    return text.split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^[•-]\s*/, '').trim())
      .filter(Boolean);
  };

  return (
    <div className="cv-preview bg-white text-gray-900 max-w-[21cm] mx-auto p-12 shadow-lg" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
      {/* Header */}
      <header className="mb-8 border-b-2 border-gray-900 pb-6 relative">
        <div className={profile?.profileImage ? 'pr-24' : ''}>
          <h1 className="text-3xl font-bold mb-1">{profile?.name || 'Dit Navn'}</h1>
          {profile?.title && (
            <p className="text-lg text-gray-600 mb-3">{profile.title}</p>
          )}
          
          {/* Contact line */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
            {profile?.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {profile.email}
              </span>
            )}
            {profile?.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {profile.phone}
              </span>
            )}
            {profile?.linkedin && (
              <span className="flex items-center gap-1">
                <Linkedin className="h-3 w-3" />
                {profile.linkedin}
              </span>
            )}
            {profile?.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {profile.location}
              </span>
            )}
          </div>
        </div>

        {/* Optional profile image */}
        {profile?.profileImage && (
          <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden rounded-sm border border-gray-300">
            <img 
              src={profile.profileImage} 
              alt={profile.name || 'Profilbillede'}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </header>

      {/* Sections */}
      <div className="space-y-6">
        {approvedSections.map((section) => {
          const isExperience = section.id.includes('erfaring') || section.name.toLowerCase().includes('erfaring');
          const isCompetences = section.id.includes('kompetencer') || section.name.toLowerCase().includes('kompetencer');
          const isProfile = section.id === 'profil' || section.name.toLowerCase().includes('profil');

          return (
            <section key={section.id} className="cv-section">
              {/* Section header with edit link */}
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold uppercase tracking-wide border-b-2 border-gray-900 pb-1 flex-1">
                  {section.name}
                </h2>
                {onEditSection && (
                  <button
                    onClick={() => onEditSection(section.id)}
                    className="text-xs text-blue-600 hover:text-blue-800 ml-4 print:hidden"
                  >
                    Redigér
                  </button>
                )}
              </div>

              {/* Content rendering based on section type */}
              {isProfile && (
                <div className="text-sm leading-relaxed text-gray-700">
                  {section.suggestedText.split('\n').map((para, i) => (
                    <p key={i} className="mb-2">{para}</p>
                  ))}
                </div>
              )}

              {isExperience && (
                <div className="space-y-4">
                  {parseExperienceText(section.suggestedText).map((exp, i) => (
                    <div key={i}>
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="font-semibold text-base">
                          {exp.title}
                          {exp.company && <span className="font-normal"> – {exp.company}</span>}
                        </h3>
                        {exp.period && (
                          <span className="text-sm text-gray-600">{exp.period}</span>
                        )}
                      </div>
                      {exp.bullets.length > 0 && (
                        <ul className="space-y-1 text-sm text-gray-700">
                          {exp.bullets.map((bullet, j) => (
                            <li key={j} className="flex items-start gap-2">
                              <span className="text-gray-400 mt-1">•</span>
                              <span className="flex-1">{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {isCompetences && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-700">
                  {parseCompetences(section.suggestedText).map((comp, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-gray-400">•</span>
                      <span>{comp}</span>
                    </div>
                  ))}
                </div>
              )}

              {!isProfile && !isExperience && !isCompetences && (
                <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">
                  {section.suggestedText}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Length warning if too long */}
      {approvedSections.length > 8 && (
        <div className="mt-8 text-xs text-amber-600 print:hidden">
          ⚠️ Dit CV er relativt langt. Overvej om alle sektioner er nødvendige for at holde det indenfor 2 sider.
        </div>
      )}
    </div>
  );
}
