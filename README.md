# Maison de Scent

A bilingual (English / Turkish) perfume catalogue and recommendation site. Browse 300 fragrances, filter by gender, olfactory family, and season, read full note pyramids in a detail modal, and get personalised recommendations by picking the notes you love.



---

## Features

- **Catalogue** — live search across name, brand, and notes; four combinable filters; responsive 3-4 column card grid
- **Detail modal** — full top / heart / base note pyramid, accords, rating, and a "find similar" button that surfaces the five closest fragrances using cosine similarity
- **For You** — pick notes from a searchable pool, set optional gender and season preferences, and get a ranked list of 12 matches with the shared notes highlighted
- **Bilingual** — full EN / TR interface including note and accord translations; language persists across visits
- **Zero dependencies** — vanilla HTML, CSS, and JavaScript; runs by opening `index.html`

---

## How the recommendation works

Every fragrance is represented as a weighted feature vector. Base notes get a weight of 3, heart notes 2, top notes 1, and accords 2.5. I weighted base notes highest because they define a fragrance's lasting character — the dry-down is what you live with. Top notes evaporate quickly, so they matter less for matching.

**Find similar** computes the weighted cosine similarity between two fragrance vectors. Cosine similarity looks at the *angle* between vectors, not their length, so a fragrance with many notes isn't automatically ranked above one with fewer. A small bonus (0.04) is added when two fragrances share the same olfactory family.

**For You** builds a profile from your selected notes (each weighted 1.0), then scores every fragrance by how much of its weighted note mass overlaps with your selection, normalised by the fragrance's total possible weight. Gender and season preferences apply multiplicative boosts (×1.15 and ×1.10 for a match, ×0.75 for a gender mismatch), so they nudge the ranking without hard-filtering anything out.

---

## Tech stack

- HTML5 / CSS3 (custom properties, CSS Grid, no frameworks)
- Vanilla JavaScript (ES6+, IIFE module pattern)
- Google Fonts: Cormorant Garamond + Inter
- No build step, no bundler, no dependencies

---

## Running locally

Just open `index.html` in any modern browser. Everything is self-contained — the fragrance data and translations are embedded in `data.js` as globals.

```
open maison-de-scent/index.html        # macOS
start maison-de-scent/index.html       # Windows
xdg-open maison-de-scent/index.html    # Linux
```

---

## Deploying to GitHub Pages

1. Create a repository called `maison-de-scent` on GitHub.
2. Push the project folder contents (not the folder itself) to the `main` branch:
   ```bash
   cd maison-de-scent
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/maison-de-scent.git
   git push -u origin main
   ```
3. Go to **Settings → Pages** in your repository.
4. Under **Source**, choose **Deploy from a branch**, select `main`, and set the folder to `/ (root)`.
5. Save — GitHub will provide a URL in the form `https://YOUR_USERNAME.github.io/maison-de-scent/` within a minute or two.

---

## Data attribution

Fragrance data: "Fragrantica.com Fragrance Dataset" (Kaggle, uploader: olgagmiufana1), originally from Fragrantica.com. Licensed under CC BY-NC-SA 4.0. Cleaned and reduced to 300 perfumes for this non-commercial educational project; derived data shared under the same license.

The site code is MIT licensed. The fragrance data is CC BY-NC-SA 4.0.
