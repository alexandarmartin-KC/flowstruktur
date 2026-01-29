'use client';

import { MapPin, Mail, Phone, Linkedin } from 'lucide-react';

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
  profilePhoto?: {
    dataUrl?: string;
    fileName?: string;
    updatedAt?: string;
  };
  cvPreferences?: {
    showProfilePhoto?: boolean;
  };
}

interface CVPreviewProps {
  sections: CVSection[];
  profile?: UserProfile;
  jobTitle?: string;
}

interface ParsedExperience {
  title: string;
  company?: string;
  location?: string;
  period?: string;
  bullets: string[];
}

export function CVPreview({ sections, profile, jobTitle }: CVPreviewProps) {
  const approvedSections = sections.filter(s => s.status === 'approved');

  // Determine if we should show profile photo
  const shouldShowPhoto = profile?.cvPreferences?.showProfilePhoto && profile?.profilePhoto?.dataUrl;

  // Improved experience parser - handles multiple formats
  const parseExperienceText = (text: string): ParsedExperience[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const items: ParsedExperience[] = [];
    
    let current: ParsedExperience | null = null;
    
    lines.forEach(line => {
      const trimmed = line.trim();
      
      // Check if it's a bullet point
      if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
        if (current) {
          const bullet = trimmed.substring(1).trim();
          if (bullet) {
            current.bullets.push(bullet);
          }
        }
      } 
      // Check if it's a role line (contains | separator)
      else if (trimmed.includes('|')) {
        // Save previous entry if exists
        if (current) items.push(current);
        
        const parts = trimmed.split('|').map(p => p.trim());
        
        // Flexible parsing based on number of parts
        let title = parts[0] || '';
        let company = '';
        let location = undefined;
        let period = '';
        
        if (parts.length === 2) {
          // Format: "Title | Company" or "Title | Period"
          // Check if second part is a date
          if (parts[1].match(/\d{4}/)) {
            period = parts[1];
          } else {
            company = parts[1];
          }
        } else if (parts.length === 3) {
          // Format: "Title | Company | Period" or "Title | Company | Location"
          company = parts[1];
          // Check if third part is a date
          if (parts[2].match(/\d{4}/) || parts[2].toLowerCase().match(/present|nu|current/)) {
            period = parts[2];
          } else {
            location = parts[2];
          }
        } else if (parts.length >= 4) {
          // Format: "Title | Company | Location | Period"
          company = parts[1];
          location = parts[2];
          period = parts[3];
        }
        
        current = {
          title: title,
          company: company,
          location: location,
          period: period,
          bullets: []
        };
      }
      // If we have a current item and this is not empty, treat as description/bullet
      else if (current && trimmed && !trimmed.match(/^[A-ZÆØÅ\s]+$/)) {
        current.bullets.push(trimmed);
      }
    });
    
    // Add last item
    if (current) items.push(current);
    
    return items;
  };

  // Parse competences/skills
  const parseCompetences = (text: string): string[] => {
    return text.split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^[•-]\s*/, '').trim())
      .filter(Boolean);
  };

  // Parse simple list items (education, certifications)
  const parseListItems = (text: string): string[] => {
    return text.split('\n')
      .filter(line => line.trim())
      .map(line => line.trim())
      .filter(Boolean);
  };

  return (
    <div 
      className="cv-preview bg-white text-gray-900 max-w-[800px] mx-auto px-16 py-12 shadow-sm border border-gray-200 rounded-sm" 
      style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif', lineHeight: 1.6 }}
    >
      {/* Header */}
      <header className="mb-10 pb-6 border-b border-gray-300 relative">
        <div className={shouldShowPhoto ? 'pr-24' : ''}>
          <h1 className="text-4xl font-bold mb-2 text-gray-900">{profile?.name || 'Dit Navn'}</h1>
          {profile?.title && (
            <p className="text-lg text-gray-600 mb-3">{profile.title}</p>
          )}
          
          {/* Contact line */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
            {profile?.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {profile.email}
              </span>
            )}
            {profile?.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                {profile.phone}
              </span>
            )}
            {profile?.linkedin && (
              <span className="flex items-center gap-1.5">
                <Linkedin className="h-3.5 w-3.5" />
                {profile.linkedin}
              </span>
            )}
            {profile?.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {profile.location}
              </span>
            )}
          </div>
        </div>

        {/* Profile photo - only show if user has enabled it */}
        {shouldShowPhoto && (
          <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden rounded border border-gray-300">
            <img 
              src={profile.profilePhoto!.dataUrl} 
              alt={profile.name || 'Profilbillede'}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </header>

      {/* Sections */}
      <div className="space-y-8">
        {approvedSections.map((section) => {
          const isExperience = section.id.includes('erfaring') || section.name.toLowerCase().includes('erfaring');
          const isCompetences = section.id.includes('kompetencer') || section.name.toLowerCase().includes('kompetencer');
          const isProfile = section.id === 'profil' || section.name.toLowerCase().includes('profil') || section.name.toLowerCase().includes('resumé');
          const isEducation = section.id.includes('uddannelse') || section.name.toLowerCase().includes('uddannelse');

          return (
            <section key={section.id} className="cv-section">
              {/* Section header */}
              <div className="mb-4">
                <h2 className="text-base font-bold uppercase tracking-wider text-gray-900 pb-1 border-b border-gray-300">
                  {section.name}
                </h2>
              </div>

              {/* Content rendering - READ ONLY, NO INPUTS */}
              <div className="cv-section-content">
                {/* Profile/Resume */}
                {isProfile && (
                  <div className="text-sm leading-relaxed text-gray-800">
                    {section.suggestedText.split('\n').filter(p => p.trim()).map((para, i) => (
                      <p key={i} className="mb-2">{para}</p>
                    ))}
                  </div>
                )}

                {/* Experience */}
                {isExperience && (
                  <div className="space-y-5">
                    {(() => {
                      // Check if there's any text first
                      if (!section.suggestedText || section.suggestedText.trim() === '') {
                        return (
                          <p className="text-sm text-gray-500 italic">
                            Ingen erfaringer tilføjet endnu
                          </p>
                        );
                      }
                      
                      const experiences = parseExperienceText(section.suggestedText);
                      
                      if (experiences.length === 0) {
                        // If text exists but parser found nothing, show the raw text
                        return (
                          <div className="text-sm text-gray-800 whitespace-pre-wrap">
                            {section.suggestedText}
                          </div>
                        );
                      }
                      
                      return experiences.map((exp, i) => (
                        <div key={i} className="experience-item mb-6">
                          {/* Title on its own line */}
                          <div className="font-semibold text-base text-gray-900 mb-1">
                            {exp.title}
                          </div>
                          
                          {/* Company and Location on same line */}
                          <div className="flex items-baseline gap-x-2 text-sm mb-1">
                            {exp.company && (
                              <>
                                <span className="text-gray-700">{exp.company}</span>
                                {exp.location && (
                                  <>
                                    <span className="text-gray-400 mx-1">-</span>
                                    <span className="text-gray-600">{exp.location}</span>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                          
                          {/* Period on its own line */}
                          {exp.period && (
                            <div className="text-sm text-gray-500 mb-3">
                              {exp.period
                                .replace(/,\s*/g, ' ') // Remove commas
                                .replace(/–|—/g, '-') // Normalize dashes to hyphen
                                .replace(/\s+/g, ' ') // Normalize whitespace
                                .trim()
                              }
                            </div>
                          )}
                          
                          {exp.bullets.length > 0 ? (
                            <ul className="space-y-1.5 text-sm text-gray-800">
                              {exp.bullets.map((bullet, j) => (
                                <li key={j} className="flex items-start gap-2">
                                  <span className="text-gray-400 mt-0.5 select-none">•</span>
                                  <span className="flex-1">{bullet}</span>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      ));
                    })()}
                  </div>
                )}

                {/* Competences */}
                {isCompetences && (
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-800">
                    {parseCompetences(section.suggestedText).map((comp, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-gray-400 select-none">•</span>
                        <span>{comp}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Education */}
                {isEducation && (
                  <div className="space-y-2 text-sm text-gray-800">
                    {parseListItems(section.suggestedText).map((item, i) => (
                      <div key={i} className="leading-relaxed">
                        {item}
                      </div>
                    ))}
                  </div>
                )}

                {/* Generic sections (certifications, other) */}
                {!isProfile && !isExperience && !isCompetences && !isEducation && (
                  <div className="space-y-2 text-sm text-gray-800">
                    {parseListItems(section.suggestedText).map((item, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-gray-400 select-none">•</span>
                        <span className="flex-1">{item}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* Length warning */}
      {approvedSections.length > 8 && (
        <div className="mt-10 pt-4 border-t border-gray-200 text-xs text-amber-600 print:hidden">
          <strong>⚠️ Note:</strong> Dit CV er relativt langt. Overvej om alle sektioner er nødvendige for at holde det indenfor 2 sider.
        </div>
      )}
    </div>
  );
}
