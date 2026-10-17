# Alec Rostamian portfolio

A static, Ocean's Eleven-inspired business-card portfolio. No backend, package install, build step, secrets, or API keys are required.

## Contents

- `dist/index.html`: front/back card, Projects, CV, Contact, and compact player.
- `dist/style.css`: linen texture, inset embossed frame, flip animation, and responsive layout.
- `dist/script.js`: section routes, internal scrolling, card flip, and audio controls.
- `dist/audio-config.js`: soundtrack path and display credit.
- `dist/assets/debussy-arabesque.mp3`: owner-supplied, approved recording.
- `.github/workflows/pages.yml`: deploys only `dist/` to GitHub Pages after pushes to `main` or manual runs.
- `tests/behavior.test.cjs`: dependency-free simulated-DOM behavior checks.

## GitHub Pages setup

This user site belongs in `alecrostamian/alecrostamian.github.io`.

1. In the repository, open **Settings → Pages**.
2. Under **Build and deployment**, select **GitHub Actions** as the source.
3. Open **Actions → Publish portfolio to GitHub Pages** and run it against `main` if the first push has not already deployed.
4. Check that the workflow succeeded for the intended commit, then verify the live URL shown by GitHub: `https://alecrostamian.github.io/`.

The workflow has repository-content read permission, Pages write permission, and an ID token for the Pages deployment. It uploads only `dist/`, not the repository's other files. HTML/CSS/JS use relative asset paths and the site has a `.nojekyll` marker.

GitHub Pages is public. A public repository also exposes its source files and commit history. The displayed contact address is `alecjrostamian@gmail.com`. The CV includes UCLA Mathematics of Computation (3.8 GPA) and all seven work, research, and extracurricular entries consolidated from the owner’s resumes. Projects are Courtsift, NBA News Intelligence & Market Analysis, and NBA Shot Make Predictor.

Official setup: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site

## Editing

Change the three templates in `dist/index.html` for Projects, CV, and Contact. The scrollable region is `.back-content`; the border, header, and audio footer stay fixed within the card. Change the soundtrack through `dist/audio-config.js` and include any attribution required by the recording's license. `creditUrl` and `creditLabel` enable an optional source link.

For a local preview, serve `dist/` using a static web server, such as `python -m http.server 8080 --directory dist`, and visit its local URL.

## Audio

The owner supplied and approved the replacement recording for this website on 2026-10-16. It is an unmodified stereo MP3 at 44.1 kHz with a duration of 251.350204 seconds. The uploaded filename contained `arabesque-1-renzi`; embedded metadata did not establish the exact work number or performer, so the display label is simply **Arabesque · Claude Debussy**. No recording license beyond the owner's supplied approval is inferred.

The player starts from the first flip gesture, loops, and keeps playing after flipping back. Contact hides the player footer to keep that section minimal, while the same audio element continues playing; returning to the card restores the controls. Manual pause survives later flips. Deep-link navigation does not automatically start audio. The previous recording is not included.

## Brand asset

The Courtsift link uses the original wordmark from https://courtsift.com/brand/wordmark.png, supplied for this portfolio update. Its transparent PNG preserves the logo lettering and red color; the `.com` suffix uses a matching red serif treatment.

## Checks

Run:

```
node --check dist/script.js
node --check dist/audio-config.js
node tests/behavior.test.cjs
python tests/check_static.py
```

The simulated-DOM tests cover initial loading, first and repeated flips, persistent playback, pause preservation, play/pause, time display, seeking, section navigation, return, Escape, unknown routes, error status, and SVG frame generation. The static checks also verify the three-project order, exact goal statement, all seven CV entries, GPA, exact email, and Contact’s minimal content. These checks do not replace rendered-browser and actual-audio testing. For this update, headless Chromium could not start because the environment denied its required socket operation; rendered desktop/mobile QA was unavailable.
