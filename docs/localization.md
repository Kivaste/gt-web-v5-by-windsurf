# Localization Strategy

This document outlines how to make the gadgetTamer site content easy to edit and translate across multiple languages.

## Goals
- Centralize every user-facing string outside of markup and scripts.
- Support multiple locales without duplicating `index.html`, `script.js`, or styles.
- Allow quick language switching (e.g., English, Estonian) with minimal rebuild effort.

## Directory Structure
```
project-root/
  content/
    en.json
    et.json
  docs/
    localization.md
  index.html
  script.js
  styles.css
```

## Content Files (`content/*.json`)
- Use one JSON file per locale. Example:
  ```json
  {
    "slides": {
      "specialOffer": {
        "title": "Just for YOU! <s>Act fast</s> Take your time, ends in:",
        "cta": "🚨 Special Offer Banner — create urgency, make you act fast! 🚨"
      },
      "faq": {
        "q1": "Is this really different from any other landing page?",
        "a1": "Yes—because you now understand the persuasion levers being pulled on every other site you visit."
      }
    },
    "buttons": {
      "ctaPrimary": "👉 Take Action Now"
    }
  }
  ```
- Keep keys stable and human-readable. Use nested objects to mirror sections (`slides`, `popup`, `buttons`, etc.).
- Store rich text (including `<em>`, `<strong>`, `<s>`) as HTML snippets where necessary.

## Step 1 – String Inventory & Key Map

### Slides (`index.html` in current order)
- banner.red.message — `Just for YOU! <s>Act fast</s> Take your time, ends in:` (`index.html` red banner)
- banner.red.loading — `loading…` (countdown placeholder)
- banner.yellow.message — `🚨 Special Offer Banner — create urgency, make you act fast! 🚨`
- hero.title — `WHY DOES THIS PAGE LOOK LIKE THIS?!`
- hero.subtitle — `Because it's your first lesson in becoming a gadgetTamer`
- slides.whySimilar.title — `Why Do All Websites Look the Same?`
- slides.whySimilar.intro — `Homepages, landing pages, sales pages—often impersonal...`
- slides.whySimilar.note — `every website is designed to grab your attention...`
- slides.specialOffer.title — `Special Offer`
- slides.specialOffer.copy — `🚨 Special Offer Banner — create urgency, make you act fast! 🚨`
- slides.dataTrail.* (unchanged)
- slides.cookies.* (unchanged)
- slides.abTesting.* (unchanged)
- slides.freeMaterials.* (unchanged)
- slides.whyPopup.* (unchanged)
- slides.whyTrustUs.* (unchanged)
- slides.faq.* (unchanged)
- slides.pricing.* (unchanged)
- slides.personalNote.* (unchanged)
- slides.aboutMe.* (unchanged)
- slides.aboutGadgetTaming.* (unchanged)
- slides.callToAction.* (unchanged)
- buttons.ctaPrimary — `👉 Take Action Now`
- footer.copy — `© 2024 gadgetTamer. Honest websites. Better sleep. Stronger trust.`

### Pop-ups & Modals (`script.js`)
- popups.whyPopup.title — `Here's your pop-up!`
- popups.whyPopup.desc — `This is exactly what we were talking about—timed to grab your attention right when you're learning about pop-ups. Meta, right?`
- popups.whyPopup.primary — `I see what you did there`
- popups.whyPopup.secondary — `Close`
- popups.fastToTop.title — `Back to the top already?`
- popups.fastToTop.desc — `Here's a 2‑minute summary of what matters most — and your next step.`
- popups.fastToTop.primary — `Get the summary`
- popups.fastToTop.secondary — `No thanks`
- popups.exitIntent.title — `Wait — before you go`
- popups.exitIntent.desc — `Grab the free field guide to spotting persuasion patterns so your attention stays yours.`
- popups.exitIntent.primary — `Get the field guide`
- popups.exitIntent.secondary — `No thanks`
- popups.dialog.closeAria — `Close dialog`

### Stats & Status Messages
- stats.referrer.direct — `Direct`
- stats.location.loading — `Loading…`
- stats.location.unknown — `Unknown`
- stats.location.unavailable — `Unavailable`
- stats.buttons.noneYet — `None yet`
- cookies.status.checking — `Checking…`
- cookies.status.allowed — `Allowed`
- cookies.status.blocked — `Blocked`
- cookies.status.likelyBlocked — `Likely Blocked`
- cookies.status.cleared — `✓ Cleared`
- cookies.status.failed — `✗ Failed`
- comment.form.error — `Please write something first!`
- comment.form.success — `Comment posted! (Not really, but visually it works 😉)`

> Reuse keys for identical strings (e.g., `None yet`) to avoid duplication. Document additional strings here as new features are added.

## Marking Translatable Elements
- Add `data-i18n` attributes to every element containing copy. Example in `index.html`:
  ```html
  <h2 data-i18n="slides.specialOffer.title"></h2>
  ```
- For dynamic sections rendered in `script.js` (pop-up copy, red banner countdown label), replace hard-coded strings with lookups using the same keys.

## Runtime Loading (`script.js`)
1. Detect the preferred locale (URL param, `localStorage`, or browser language).
2. Fetch the matching JSON file from `content/` at startup.
3. Walk the DOM for `[data-i18n]` nodes and set their `textContent` or `innerHTML` with the localized string.
4. Provide a fallback to `en.json` if a key or locale is missing, logging a warning for QA.
5. When the language picker changes, re-run the binding without reloading the page.

## Language Picker UI
- Add a compact selector (e.g., `<select id="langSwitcher">`).
- Store the chosen language in `localStorage` or the query string.
- On change, reload the localized copy and re-render countdown labels, pop-up text, and button copy.

## Updating `script.js`
- Replace hard-coded strings in functions such as `showPopup()` or `updateCountdownText()` with localized values.
- Use helper functions (e.g., `getCopy(key)`) to access the loaded dictionary.
- Ensure countdown and statistics updates remain functional by only replacing the human-readable labels.

## QA Checklist
- Verify every element with `data-i18n` populates correctly in each locale.
- Confirm the fallback language displays if a localized key is missing.
- Test the language picker: switch languages mid-session and ensure countdowns, pop-ups, and slide text update immediately.
- Check accessibility: localized strings should include translated aria labels and button titles.

## Adding a New Language
1. Duplicate `content/en.json` to `content/<locale>.json` and translate values.
2. Add the new locale option to the language picker.
3. Run the QA checklist for the new language.
4. If needed, add locale-specific assets (images, PDFs) and reference them via the content file.

## Maintenance Tips
- Keep this document updated as the localization system evolves.
- Enforce linting or CI checks to ensure no string keys are missing across locales.
- Encourage copywriters/translators to work directly in the JSON files; consider using a shared tool (e.g., Google Sheets export) if the team prefers spreadsheets.
