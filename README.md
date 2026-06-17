# Maison de Scent

A small perfume catalogue and recommendation site I built to combine two things I like: fragrance, and working with real data instead of placeholder content. It covers 300 real fragrances pulled from a public dataset, lets you filter and search them, and has a "For You" mode where you pick notes you like and it suggests fragrances based on that.

The whole interface works in English and Turkish, including the note names themselves, not just the buttons and labels.

## What it does

- Browse and filter 300 fragrances by gender, olfactory family, and season, with live text search across name, brand, and notes
- Click any fragrance to see its full note pyramid (top / heart / base), main accords, year, and rating
- "Find similar" inside that detail view, which surfaces the closest fragrances by scent profile
- A separate "For You" tab where you build a small profile from notes you like and get a ranked list of matches, each one showing exactly which notes it shares with your picks
- Full English/Turkish interface, with the language choice remembered between visits
- No frameworks, no build step — plain HTML, CSS, and JavaScript

## How the recommendation actually works

Each fragrance gets turned into a weighted set of features: its notes and its main accords. Base notes carry the most weight, since they're what's left once the top notes burn off — they define how a fragrance actually smells after the first twenty minutes. Heart notes come next, top notes least, and accords sit a bit above heart notes because they represent the overall character the perfumer was going for rather than a single raw ingredient.

"Find similar" compares two fragrances with weighted cosine similarity: roughly, how much their feature sets point in the same direction, regardless of how many notes either one happens to list. A small bonus gets added if they share the same olfactory family, but it's deliberately tiny so it can't outweigh a genuinely strong note overlap from a different family.

"For You" works the same way in reverse. Your selected notes become a profile, every fragrance gets scored against it, and the score is normalised so a fragrance with twenty notes doesn't automatically beat one with six just because it has more surface area to match against. Gender and season aren't hard filters — they nudge the ranking up or down a little, because a "men's" fragrance can still genuinely suit someone who picked "women," and I'd rather rank that lower than hide it completely.

## Language

Almost everything is translated, including the individual notes in the dataset, not just the interface labels. A handful of more obscure or purely synthetic notes (things like ambroxan or iso e super) stay in English on both sides, since there isn't really a Turkish equivalent and forcing one would just be confusing. The recommendation logic always runs on the original English keys underneath, so switching languages mid-session never changes how anything is scored — only how it's displayed.

## Tech

- Plain HTML, CSS, and JavaScript — no frameworks, no dependencies
- Google Fonts (Cormorant Garamond for headings, Inter for everything else)
- All fragrance and translation data is bundled into a single JS file, so the site runs straight from the filesystem with no server needed


## About the data

The fragrance data comes from the "Fragrantica.com Fragrance Dataset" on Kaggle (uploaded by olgagmiufana1), originally compiled from Fragrantica.com. It's licensed under CC BY-NC-SA 4.0. I cleaned it and narrowed it down to 300 fragrances — 100 men's, 100 women's, 100 unisex — for this project, and the resulting dataset is shared under that same license. This is a non-commercial, educational project.

The code itself is MIT licensed.
