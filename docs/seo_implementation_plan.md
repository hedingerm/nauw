# SEO Implementation Plan for nauw

## Current Status ✅

### Technical Foundation (Completed)
- [x] Created `/public` directory with robots.txt
- [x] Updated root layout with nauw branding and comprehensive meta tags
- [x] Implemented dynamic sitemap generation (`/src/app/sitemap.ts`)
- [x] Added Organization and SoftwareApplication structured data
- [x] Created SEO utilities for metadata generation
- [x] Added manifest.json for PWA support
- [x] Optimized homepage with FAQ schema

### Files Created
- `/public/robots.txt` - Search engine crawler directives
- `/public/manifest.json` - PWA manifest
- `/src/app/sitemap.ts` - Dynamic sitemap generation
- `/src/lib/seo/structured-data.ts` - Schema.org definitions
- `/src/lib/seo/metadata.ts` - Metadata utilities
- `/src/components/seo/structured-data-script.tsx` - JSON-LD component

## Missing Tasks 📋

### High Priority (Week 1-2)

#### 1. Static Assets
- [ ] Create `/public/og-image.png` (1200x630px) - Open Graph image
- [ ] Create `/public/logo.png` - Company logo
- [ ] Create `/public/icon-192.png` - PWA icon
- [ ] Create `/public/icon-512.png` - PWA icon
- [ ] Create `/public/favicon.ico` - Browser favicon

#### 2. Landing Pages
- [ ] Create `/src/app/(marketing)/friseure/page.tsx` - Hairdresser industry page
- [ ] Create `/src/app/(marketing)/therapeuten/page.tsx` - Therapist industry page
- [ ] Create `/src/app/(marketing)/beauty/page.tsx` - Beauty industry page
- [ ] Create `/src/app/(marketing)/nachhilfe/page.tsx` - Tutoring industry page
- [ ] Create `/src/app/(marketing)/preise/page.tsx` - Pricing page
- [ ] Create `/src/app/(marketing)/funktionen/page.tsx` - Features page

#### 3. Analytics & Monitoring
- [ ] Add Google Analytics 4 script
- [ ] Set up Google Search Console
- [ ] Add schema validation testing
- [ ] Implement conversion tracking

### Medium Priority (Week 3-4)

#### 4. Location Pages
- [ ] Create `/src/app/(marketing)/[location]/page.tsx` - Dynamic location pages
- [ ] Implement location-specific content for major Swiss cities
- [ ] Add local business schema per location

#### 5. Content Marketing
- [ ] Create `/src/app/(marketing)/ressourcen/page.tsx` - Resource center
- [ ] Create `/src/app/(marketing)/blog/page.tsx` - Blog listing
- [ ] Create `/src/app/(marketing)/blog/[slug]/page.tsx` - Blog post template
- [ ] Add blog post schema markup

#### 6. Trust & Social Proof
- [ ] Create `/src/app/(marketing)/erfolgsgeschichten/page.tsx` - Case studies
- [ ] Add customer testimonial schema
- [ ] Implement review/rating display

### Low Priority (Month 2-3)

#### 7. Advanced SEO Features
- [ ] Implement breadcrumb navigation with schema
- [ ] Add XML sitemap for images
- [ ] Create `/src/app/(marketing)/vergleich/page.tsx` - Comparison page
- [ ] Add hreflang tags for multi-language support
- [ ] Implement canonical URL handling for duplicates

#### 8. Performance Optimization
- [ ] Convert all `<img>` to Next.js `<Image />`
- [ ] Implement lazy loading for below-fold content
- [ ] Add resource hints (preconnect, prefetch)
- [ ] Optimize Core Web Vitals scores

#### 9. Additional Features
- [ ] Create 404 error page with SEO optimization
- [ ] Add search functionality with search schema
- [ ] Implement RSS feed for blog
- [ ] Add social media meta tags per page

## Implementation Notes

### Image Requirements
- OG Image: Professional design showcasing nauw brand
- Logo: SVG preferred, PNG fallback
- Icons: Follow PWA best practices

### Content Guidelines
- All content in German (primary)
- Focus on Swiss market terminology
- Include local phone numbers and pricing in CHF
- Emphasize data privacy and Swiss hosting

### Technical Considerations
- Use `generateMetadata` function for all new pages
- Add structured data relevant to each page type
- Ensure all pages are mobile-responsive
- Test with Google's Rich Results Test

### SEO Checklist per Page
1. Unique title and meta description
2. Proper heading hierarchy (H1, H2, etc.)
3. Internal linking to related pages
4. Relevant structured data
5. Optimized images with alt text
6. Fast loading time (<3s)
7. Mobile-friendly design

## Success Metrics
- Organic traffic growth
- Keyword rankings for target terms
- Click-through rate improvement
- Conversion rate from organic traffic
- Rich snippet appearance in SERPs