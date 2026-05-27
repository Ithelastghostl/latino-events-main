# Image Generation Prompts — La Tribu

Generate these images using your preferred AI tool (Midjourney, DALL-E, Flux, etc.). Export as WebP, max 400KB per image. Place generated files in `images/`.

---

## 1. Hero Background (`images/hero-bg.webp`)

**Dimensions:** 1920×1080  
**Prompt:** Atmospheric nightclub scene, Latin dance party, warm golden and magenta lighting, crowd dancing energetically, motion blur on dancers, DJ booth in background with colorful lights, smoke machine haze, shot from slightly above the crowd. Cinematic, high energy, warm tones. No text.

---

## 2. Community Photo (`images/community.webp`)

**Dimensions:** 800×600  
**Prompt:** Diverse group of young people laughing and dancing together at an intimate Latin music event, warm ambient lighting, candid authentic moment, some people with drinks, colorful outfits, close-up group shot showing genuine joy and connection. Warm color grading with golden tones.

---

## 3. Event Card Images (4 needed)

### 3a. Salsa Night (`images/event-salsa.webp`)

**Dimensions:** 600×400  
**Prompt:** Elegant salsa dance couple mid-spin on a dimly lit dance floor, warm spotlights, red and gold tones, other couples dancing in soft focus background, intimate venue atmosphere. Cinematic.

### 3b. Reggaeton Party (`images/event-reggaeton.webp`)

**Dimensions:** 600×400  
**Prompt:** High-energy reggaeton party scene, neon magenta and blue lights, young crowd with hands up, DJ on stage, urban nightclub setting, confetti in the air, electric atmosphere. Vibrant colors.

### 3c. Bachata Evening (`images/event-bachata.webp`)

**Dimensions:** 600×400  
**Prompt:** Romantic bachata dance scene, couple dancing close in soft warm lighting, fairy lights in background, intimate bar setting, amber and rose gold tones, other couples swaying in background. Moody and warm.

### 3d. Latin Brunch (`images/event-brunch.webp`)

**Dimensions:** 600×400  
**Prompt:** Vibrant daytime Latin brunch party, rooftop or outdoor terrace, people dancing and eating, colorful cocktails, tropical decorations, bright natural light with warm golden hour feel, festive and relaxed atmosphere.

---

## 4. DJ Photos (4–6 needed)

**Dimensions:** 400×400 each  
**Naming:** `images/dj-1.webp`, `images/dj-2.webp`, etc.  
**Prompt template:** Portrait of a Latin music DJ at their decks, [VARIATION], dramatic lighting from below, professional headshot style with nightclub atmosphere, confident expression. Dark background with colored accent lights.

**Variations:**
- Male DJ, close crop, magenta side lighting
- Female DJ, wider shot showing mixer, golden backlight
- Male DJ with headphones around neck, coral and blue lights
- Female DJ mid-mix, energetic pose, purple and gold lighting

---

## 5. Gallery / Moments Grid (6–8 needed)

**Dimensions:** Mixed (some 600×400, some 400×600 for variety)  
**Naming:** `images/gallery-1.webp` through `images/gallery-8.webp`  
**Prompt template:** Candid photo from a Latin dance event in London, [VARIATION], authentic nightlife photography style, warm color grading.

**Variations:**
- Group of friends toasting drinks at a table
- Couple doing a dramatic salsa dip
- Crowd shot from the DJ booth perspective
- Close-up of dancing feet on the floor
- People laughing at the bar
- DJ performing with crowd visible
- Sparklers or celebration moment
- Wide venue shot showing full dance floor

---

## 6. Venue Page Hero (`images/venue-hero.webp`)

**Dimensions:** 1200×600  
**Prompt:** Beautiful London venue interior set up for a Latin dance event, elegant lighting, empty dance floor ready for the night, bar area visible in background, warm amber and magenta accent lights, professional venue photography style. Aspirational and inviting.

---

## 7. WhatsApp QR Placeholder (`images/whatsapp-qr.webp`)

**No generation needed** — create a QR code linking to your WhatsApp group invite URL. Use any free QR generator. Export as WebP, 300×300px.

---

## 8. La Tribu Logo (`images/logo.webp` + `images/logo-white.webp`)

**Dimensions:** 400×100 (landscape) or 200×200 (square)  
**Note:** Best created manually in Figma/Canva rather than AI-generated. Use Bebas Neue for "LA TRIBU" with Pacifico for a script accent. Two versions: dark (for light backgrounds) and white (for dark backgrounds).

---

## After Generation

1. Place all images in the `images/` directory
2. Optimize with: `for f in images/*.webp; do cwebp -q 80 "$f" -o "$f"; done` (if cwebp installed)
3. Verify no single image exceeds 400KB
4. The frontend pages will reference these exact filenames
