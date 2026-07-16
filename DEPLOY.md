# Deployment Guide

This repository is a static site. No build step is required.

## Option 1: GitHub Pages

1. Push this repository to GitHub.
2. In repository settings, open Pages.
3. Set Source to `Deploy from a branch`.
4. Select your main branch and `/ (root)`.
5. Save.

After deploy:
- Home: `/`
- Janatics: `/src/janatics_part_number_generator_all_products.html`
- Dealer: `/src-dealer-tracker/index.html`

`.nojekyll` is included so all static paths are served as-is.

## Option 2: Netlify

1. Import this repo in Netlify.
2. Build command: leave empty.
3. Publish directory: `.`

`netlify.toml` already configures:
- `/janatics` -> Janatics page
- `/dealer` -> Dealer page

## Option 3: Vercel

1. Import this repo in Vercel.
2. Framework Preset: `Other`.
3. Build command: leave empty.
4. Output directory: leave empty.

`vercel.json` already configures:
- `/janatics` -> Janatics page
- `/dealer` -> Dealer page
