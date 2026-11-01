# FlipScout

A small, understandable prototype for evaluating potential car flips.

## Run on your computer

1. Extract the ZIP completely.
2. Open `index.html` in Chrome, Edge, or Firefox.

No installation, API key, build step, or internet connection is required. Keep `src/` next to `index.html`.

For a normal development workflow, open this folder in VS Code and serve it with your preferred static server. For example, with Python installed:

```sh
python -m http.server 8000
```

Then open http://localhost:8000. Browser storage behavior can differ when opening files directly; a local server gives a consistent origin.

## Try it

- Apply make, mileage, asking price, sample radius, keyword, title, and profit filters.
- Keywords separated by commas match ANY term. Exclusions reject ANY matching term.
- Save a car with the star, then open Watchlist. Search filters also apply to Watchlist.
- Open Inspect deal and edit resale, purchase, repairs, labor, transport, fees, and contingency. Save assumptions to update rankings.
- Use Analyze a listing to paste your own title and seller description. Manual entries last only for the current page session; they are not saved as vehicles after reload. Title status starts unverified and therefore does not pass the clean-title filter. Use the workbench to enter every cost before relying on a number.

## Understand the code

- `index.html`: accessible page structure and dialogs.
- `src/styles.css`: responsive dashboard styling; no external assets or fonts.
- `src/data.js`: six FICTIONAL vehicles in a shared listing format.
- `src/domain.js`: pure profit, keyword-analysis, and filtering functions.
- `src/app.js`: rendering, events, dialogs, and browser persistence.
- `tests/domain.test.js`: core calculation and filtering checks.

Read domain.js first, then data.js, then app.js. This deliberately uses plain JavaScript so you can understand each step before migrating to TypeScript or React.

## Honest scope

This is a local interface and domain-logic prototype. It does NOT search the internet, fetch listings, run an LLM, diagnose cars, or estimate real market values. Every sample listing, distance, repair budget, and resale value is fictional. The vehicle illustrations are generic, not model-accurate photographs. Keyword rules do not understand negation or complex context. A seller claim is not verified evidence.

Watchlist IDs and cost overrides for sample vehicles are saved in this browser using localStorage when available. Nothing is uploaded. Manual descriptions stay in page memory. Clearing site data resets saved state. No authentication, database, background worker, or backend is included.

## Profit model

Profit = expected resale − purchase − parts − labor − transport − taxes/fees − contingency.

All budgets are editable. Costs that you leave out are not accounted for. Negative results are retained, rather than clamped to zero. Current dollars are whole-number prototype estimates; production financial code should store integer cents.

## Tests

If Node.js is installed:

```sh
node --test tests/domain.test.js
```

## Next implementation milestones

1. Add a backend source adapter for ONE authorized listings provider. Validate access, cost, local coverage, update frequency, and storage/display rights first.
2. Normalize provider results to the shared listing format. Store source IDs, original URLs, timestamps, and description provenance. Deduplicate by source ID and VIN where present.
3. Add server-side structured AI extraction separating seller claims, symptoms, unknowns, and inspection questions. Keep API keys on the server; never in this browser code.
4. Add comparable asking-price evidence with source URLs and timestamps. Use mileage/year/trim/title matching and show uncertainty. Removed listings are not confirmed sales.
5. Add persistence, saved searches, a scheduled collector, error handling, and rate-limit management.
6. Evaluate AI extraction on manually labeled descriptions; track estimated versus actual repair costs and realized sale prices.

A reasonable next stack is TypeScript + Next.js + PostgreSQL/Prisma. Keep domain rules independent of the framework. Describe the present project honestly as a prototype; add live-data and AI claims to your portfolio only after implementing and evaluating them.
