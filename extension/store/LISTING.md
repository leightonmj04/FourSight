# Chrome Web Store submission: FourSight 1.0.0

Everything to paste into the developer dashboard, field by field. The upload file is
`dist/foursight-1.0.0.zip`, built with `sh tools/build-extension.sh`.

## Package tab

Upload `dist/foursight-1.0.0.zip`.

## Store listing tab

**Name** (from the manifest): FourSight: Degree Flowchart Planner

**Summary** (from the manifest, 132 characters max):
Plan your whole degree on a prerequisite flowchart: UT Austin engineering and business templates, or any school's curriculum.

**Description:**

```
FourSight lays out every semester of a UT Austin engineering or business degree as one interactive flowchart, so you can see your whole degree at once and catch prerequisite problems before registration.

Pick your program from the menu, grouped by college. Engineering: Aerospace, Architectural, Biomedical, Chemical, Civil, Computational, Electrical and Computer (all eight concentrations), Environmental, Geosystems, Mechanical or Petroleum Engineering. Business: Accounting (including the BBA/MPA), Business Analytics, Canfield Business Honors, Finance, International Business, Management, Management Information Systems, Marketing or Supply Chain Management, plus the Computer Science and ECE dual degrees with Business Honors. Each starts from a suggested plan built from the 2026-28 catalog. Add any of 144 UT minors and 43 UT certificates and plan their courses alongside your degree.

Not at UT? Upload your school's degree plan (PDF, text or CSV) and FourSight lays out your courses by semester, checks the credit hours against the file, and can read a prerequisite flowchart to draw your prerequisite chains. You can add a minor from its catalog page too, or start from a blank plan.

• Drag courses between semesters. Broken prerequisites turn red right away, with a list of what to fix.
• Hover or pin a course to trace its prerequisite chain: the courses it needs and the courses it unlocks.
• Warnings for courses past their on-time limit or placed in a term they aren't offered.
• A live degree audit shows hours and courses completed in each requirement area.
• Check off a whole semester at once, recolor course types, and add your own courses with any course number.
• Add, edit or delete courses, add summer or extra terms, and reset to the suggested plan at any time.

Private by design: FourSight runs entirely in your browser. Your plan is saved only on your computer, and your curriculum, flowchart and minor files are read on your device and never uploaded. FourSight needs no special permissions and collects no data; the only thing it ever sends is feedback a student writes and chooses to send with the Feedback button.

FourSight is an independent student planning tool. It is not affiliated with or endorsed by The University of Texas at Austin, and it is not an official degree audit. Always confirm your plan with the Interactive Degree Audit and your department's advising office.
```

**Category:** Education (or Productivity)

**Language:** English

**Graphic assets** (all in `extension/store/`):

| Field | File |
| --- | --- |
| Store icon (128x128) | `extension/icons/icon-128.png` |
| Screenshots (1280x800) | `screenshot-1-flowchart.png`, `screenshot-2-mechanical.png`, `screenshot-3-conflicts.png` (leave out `screenshot-4-transcript.png` while transcript upload is hidden) |
| Small promo tile (440x280) | `promo-small-440x280.png` |

The marquee promo tile (1400x560) is optional and not included.

## Privacy tab

**Single purpose:**
FourSight is a degree planner: it shows a student's degree plan as an interactive prerequisite flowchart that they can rearrange and check.

**Permission justification:** FourSight requests no permissions and no host permissions. (The toolbar button only opens the extension's own page.)

**Are you using remote code?** No, I am not using remote code. (pdf.js and the Sora font are bundled in the package.)

**Data usage:** check **Personally identifiable information** (the email address a student types into the feedback form) and **Personal communications** (the feedback message they write). Leave every other data type unchecked. Feedback is sent only when the student presses Send, through Web3Forms (web3forms.com) to the developer's inbox, and is used only to reply and fix problems. Everything else stays on the student's computer: plans are stored in the browser's local storage, and curriculum, flowchart and minor files are read in the browser and never sent anywhere.

Then tick all three certifications:
- I do not sell or transfer user data to third parties, outside of the approved use cases
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- I do not use or transfer user data to determine creditworthiness or for lending purposes

**Privacy policy URL:** required now that feedback is collected. Use https://github.com/leightonmj04/FourSight/blob/main/PRIVACY.md (it covers the feedback form).

## Distribution tab

Visibility: Public (or Unlisted to share by link only while testing). Regions: all regions, or United States only.

## Before each new upload

1. Raise `"version"` in `extension/manifest.json` (the store rejects a repeated version number).
2. Run `sh tools/build-extension.sh`.
3. Test `dist/foursight-extension/` with chrome://extensions, Developer mode on, Load unpacked.
4. Upload the new zip from `dist/`.
