# `design-system.md` — the generated rule

Applies to **frontend projects only**. Generalize the specifics below to the project's actual stack.

Invoke `/impeccable` whenever designing, redesigning, auditing, or polishing any UI — it owns the visual and interaction quality bar, and everything below is the repo's structural layer beneath it. Gated on the installed-check (wording in SKILL.md) — install command in [skill.deps.json](../skill.deps.json).

## Atomic-design vocabulary

Atomic design's five levels — atoms, molecules, organisms, templates, pages — are the shared vocabulary for component **granularity**, used in design conversations, critiques, and PR discussion. Never as folder names: folders stay domain-based, and components are named for what they are (`SearchForm`, not `MoleculeSearch`).

Atoms are mostly the vendored primitives (in JS projects, the shadcn components in `components/ui/`); everything above them earns extraction the usual way — the model is concurrent, not linear, so never pre-build a component library. The vocabulary answers "how big is this?", not "should this be shared?" — a header accumulating search, nav, and session state is an organism pretending to be a molecule: split it.

Templates prove content *structure*; pages prove it against real content.

## Content and state extremes

Every designed screen and every implemented view gets exercised with the content and state extremes before it's called done:

- longest realistic name/headline — does it wrap or truncate well?
- unbroken strings (emails, URLs, IDs/tokens) — no spaces means normal wrapping never kicks in; they blow out flex/grid containers unless `overflow-wrap` or truncation is designed in;
- empty vs one vs many, for every list;
- numeric/date extremes — 0, negative, 1,000,000+, long currency and timezone-qualified dates; alignment, badges, and axes break at the ends of the range;
- async and error states — loading skeleton, failed fetch, offline; every screen has more states than the happy mock, and a state that isn't designed gets improvised in code;
- locale expansion and RTL — text ~30% longer than English, mirrored layout; labels designed at English length clip first;
- sections suppressed by permissions or feature flags.

Extremes that break move the fix down to the molecule that owns it, not a page-level patch.

Mock repeated and data-driven content in the design file from instances driven by real values — read from the live system, not invented, and generated rather than hand-duplicated — so a mock that cannot happen is caught in design; the design tool's mechanics are the design-tooling skill's.

## Motion

One animation library per project (GSAP in web JS projects; react-native-reanimated in Expo/React Native), added when the UI first animates; feedback animation budgets 100–200ms; every animated moment ships a `prefers-reduced-motion` variant (color or opacity change); and high-stakes moments — payments, destructive actions, errors involving loss — get calm, plain feedback, no playfulness.

## Theming

Surfaces follow the active theme — light theme means light surfaces, dark theme dark ones, never an inverted, opposite-theme fill. Floating elements (tooltips, toasts, popovers, menus) are `$surface` with a `$border` stroke and an ink shadow. Every color on a themed element resolves through a theme-bound variable; a one-off token that flips against the theme axis is the tell that this rule is about to be broken.

## Responsive

Every screen and view ships **both** desktop and mobile treatments — a desktop-only mock is unfinished, because mobile is where the layout actually breaks (a header row that fits at desktop width collides at phone width; a table must scroll or restack; actions move into a menu) and the missing treatment gets improvised in code.

Where the layout diverges structurally — tables, toolbars, multi-column rows — the mobile treatment is its own component (a `<Screen> Mobile` companion), not a narrowed desktop frame; where a card only reflows, a phone-width instance suffices, but it is still built and exercised.

Every content and state extreme above gets re-checked at phone width, where they break first. This axis composes with theming — viewport × theme is four real renders (desktop and mobile, each in light and dark), never assumed.

On Expo/React Native the axis is platform, not viewport — iOS and Android (plus web via RN-web where enabled) across phone and tablet size classes; platform × theme is the render matrix.
