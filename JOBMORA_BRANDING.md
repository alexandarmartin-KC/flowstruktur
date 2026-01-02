# Jobmora Logo Setup

## Current Status
The application has been rebranded from "FlowStruktur" to "Jobmora". All text references have been updated.

## Logo Files

### Placeholder Logo
A temporary SVG logo has been created at `/public/jobmora-logo.svg` that shows a door icon with gradient colors.

### To Add Your Actual Logo

1. **Save the logo image** from your design to the `/public` directory:
   - Recommended format: SVG (best for scalability)
   - Alternative formats: PNG (with transparent background)
   - Recommended filename: `jobmora-logo.svg` or `jobmora-logo.png`

2. **If using a different filename**, update the logo component at `/components/jobmora-logo.tsx`:
   ```tsx
   src="/your-logo-filename.svg"
   ```

3. **Logo is used in these components:**
   - `/components/app-sidebar.tsx` - Main app sidebar
   - `/components/app-header.tsx` - Mobile header
   - `/app/page.tsx` - Landing page
   - `/app/om/page.tsx` - About page  
   - `/app/pris/page.tsx` - Pricing page

## Branding Updates Completed

✅ Package name: `jobmora`
✅ Site title: "Jobmora - Din karrierecoach"
✅ All page headers and footers
✅ Navigation components
✅ User agent strings in API routes
✅ Logo component created with proper sizing

## Next Steps

1. Replace `/public/jobmora-logo.svg` with the actual logo from your design
2. Test the logo appearance across all pages
3. Adjust logo sizing if needed by modifying the `size` prop in component usage
4. Consider adding a favicon version at `/public/favicon.ico`
