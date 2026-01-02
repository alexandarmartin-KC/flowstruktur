import { NextRequest, NextResponse } from 'next/server';
import { load } from 'cheerio';

interface ImportResponse {
  ok: boolean;
  parseFailed?: boolean;
  sourceUrl: string;
  sourceDomain: string;
  fetchedAt: string;
  title?: string;
  company?: string;
  location?: string;
  descriptionRaw?: string;
  descriptionClean?: string;
}

// SSRF protection: block private IPs and localhost
function isPrivateOrLocalhost(hostname: string): boolean {
  // Check for localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    return true;
  }
  
  // Check for private IP ranges
  const privateRanges = [
    /^10\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^192\.168\./,
    /^169\.254\./,
    /^fc00:/,
    /^fe80:/,
  ];
  
  return privateRanges.some(range => range.test(hostname));
}

// Clean and normalize text
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
}

// Extract text from element, removing scripts, styles, nav, footer
function extractCleanText($: any, element: any): string {
  const clone = $(element).clone();
  
  // Remove unwanted elements
  clone.find('script, style, nav, footer, header, aside, .navigation, .menu, .sidebar, .ads, .advertisement').remove();
  
  const text = clone.text();
  return cleanText(text);
}

// Parse job data from HTML
function parseJobData(html: string, url: string): Omit<ImportResponse, 'ok' | 'parseFailed' | 'sourceUrl' | 'sourceDomain' | 'fetchedAt'> {
  const $ = load(html);
  
  // Extract title
  let title = $('meta[property="og:title"]').attr('content') || 
              $('meta[name="twitter:title"]').attr('content') ||
              $('title').text() ||
              $('h1').first().text();
  title = cleanText(title);
  
  // Extract company
  let company = $('meta[property="og:site_name"]').attr('content') ||
                $('meta[name="application-name"]').attr('content');
  
  // Try to find company from structured data
  if (!company) {
    $('script[type="application/ld+json"]').each((_, elem) => {
      try {
        const data = JSON.parse($(elem).html() || '{}');
        if (data['@type'] === 'JobPosting' && data.hiringOrganization?.name) {
          company = data.hiringOrganization.name;
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    });
  }
  
  company = company ? cleanText(company) : undefined;
  
  // Extract location from structured data
  let location: string | undefined;
  $('script[type="application/ld+json"]').each((_, elem) => {
    try {
      const data = JSON.parse($(elem).html() || '{}');
      if (data['@type'] === 'JobPosting' && data.jobLocation) {
        const loc = data.jobLocation;
        if (loc.address?.addressLocality) {
          location = loc.address.addressLocality;
          if (loc.address?.addressCountry) {
            location += `, ${loc.address.addressCountry}`;
          }
        }
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
  });
  
  // Extract job description
  let descriptionRaw = '';
  let descriptionClean = '';
  
  // Try to find main content area
  const mainContent = $('main').first();
  const article = $('article').first();
  const roleMain = $('[role="main"]').first();
  
  if (mainContent.length > 0) {
    descriptionRaw = mainContent.html() || '';
    descriptionClean = extractCleanText($, mainContent);
  } else if (article.length > 0) {
    descriptionRaw = article.html() || '';
    descriptionClean = extractCleanText($, article);
  } else if (roleMain.length > 0) {
    descriptionRaw = roleMain.html() || '';
    descriptionClean = extractCleanText($, roleMain);
  } else {
    // Fallback to body
    descriptionRaw = $('body').html() || '';
    descriptionClean = extractCleanText($, $('body'));
  }
  
  return {
    title: title || undefined,
    company,
    location,
    descriptionRaw: descriptionRaw || undefined,
    descriptionClean: descriptionClean || undefined,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;
    
    // Validate URL
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required and must be a string' },
        { status: 400 }
      );
    }
    
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }
    
    // Only allow http and https
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return NextResponse.json(
        { error: 'Only HTTP and HTTPS URLs are allowed' },
        { status: 400 }
      );
    }
    
    // SSRF protection
    if (isPrivateOrLocalhost(parsedUrl.hostname)) {
      return NextResponse.json(
        { error: 'Cannot fetch from private or localhost addresses' },
        { status: 400 }
      );
    }
    
    // Fetch the URL
    const fetchedAt = new Date().toISOString();
    const sourceDomain = parsedUrl.hostname;
    
    let html: string;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; JobmoraBot/1.0)',
        },
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      html = await response.text();
    } catch (error: any) {
      // If fetch fails, return parseFailed response with minimal data
      return NextResponse.json<ImportResponse>({
        ok: true,
        parseFailed: true,
        sourceUrl: url,
        sourceDomain,
        fetchedAt,
      });
    }
    
    // Parse the HTML
    const parsed = parseJobData(html, url);
    
    // Check if we got meaningful content
    const parseFailed = !parsed.descriptionClean || parsed.descriptionClean.length < 500;
    
    const response: ImportResponse = {
      ok: true,
      parseFailed,
      sourceUrl: url,
      sourceDomain,
      fetchedAt,
      ...parsed,
    };
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('Error importing job:', error);
    return NextResponse.json(
      { error: 'Failed to import job', details: error.message },
      { status: 500 }
    );
  }
}
