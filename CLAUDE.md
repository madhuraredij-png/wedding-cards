# To the Wedding

A one-minute, single-player card game that presents Madhura Redij's illustrated wedding deck for Ketaki and Prasanna as a digital design piece. The player deals short spreads of cards, reads what each card depicts, and places each king and queen at their ceremony. When all four couples are placed, the full 52-card deck is revealed.

The site is `public/index.html`, `public/styles.css`, `public/game.js` and `public/cards.json`: plain static files, no framework, no build step. It was split out of a single-file prototype (first commit) and is the source of truth for look and behavior. The full PRD lives in Claude Docs ("Wedding Deck Game — PRD & Strategy"); the decisions that matter are summarized below.

## Run it

Serve `public/` with any static server, for example `npx serve public` or `python3 -m http.server -d public`. Open `index.html`. Images load by relative path.

## Test it

`npm test` (Playwright, `tests/game.spec.js`) plays full games by pointer and keyboard at 1440×900 and 390×844, checks screen-reader names and `cards.json`, and fails on console errors. `@playwright/test` is pinned to an exact version; run `npx playwright install chromium` once on a new machine.

## Deck and ceremonies

- 52 cards, 4 suits. Each suit's king and queen show the couple's real outfits for one ceremony:
  - ♦ Diamonds: The Engagement
  - ♣ Clubs: Satyanarayan Pooja
  - ♥ Hearts: The Wedding
  - ♠ Spades: Wedding Reception
- Niche order left to right: The Engagement, Satyanarayan Pooja, The Wedding, Wedding Reception.
- All other cards (A–10, J) depict objects and rituals. They are not characters or guests.

## Rules

1. Shuffle at start. Each spread deals 6 cards from the remaining deck.
2. Every spread has at least 1 and at most 2 unplaced royals while any remain.
3. Ordinary cards already shown are set aside, not dealt again. When ordinary cards run out, reshuffle the set-aside pile back in.
4. Royals left unplaced when the player deals again go back into the royal pool.
5. A royal goes only in its own ceremony's matching slot (king in K, queen in Q). Wrong placements are never penalized: the card shakes and a hint appears.
6. When both slots of a ceremony are filled, the pair locks and the ceremony-complete moment plays in place, on the play screen.
7. After the fourth lock (and its in-place moment), the Just Married screen plays; its "See the whole deck" opens the finale.
8. "Deal again" works at any time. "View the deck" skips the game and shows the full deck.

## Interaction

- Select and place: click or tap a royal, then click its slot; or drag the royal onto a niche. While a royal is selected, empty slots of its rank glow soft green.
- Reading: hovering, tapping or focusing a card lifts it to 130% scale (it may overlap neighbors) and shows its meaning in the strip below the spread.
- Meaning strip: single row, stamp-style (perforated cream edge). Rank and suit symbol first, for example "5 ♥", in red for ♥/♦. Then one sentence, on one line.
- Foil sheen appears only on a royal that is lifted (selected in the spread, or in its niche during the ceremony-complete moment). Cards at rest never shine.
- A completed pair leans together and overlaps inside its niche, which gains a marigold glow.
- Ceremony complete (in place, no separate screen): the pair leans together in its niche, a foil shimmer sweeps the niche and both cards twice, the marigold glow pulses, a few bougainvillea petals and marigold beads drift from the arch, and the label under the niche reads "Ceremony complete" ("Just Married!" for The Wedding) for about 3 seconds before returning to the ceremony name. Play continues on the same screen. With reduced motion: static sheen and caption only, no petals or pulse.
- Just Married (once, after all four ceremonies, about 1.5s after the fourth pair locks): the large arch in The Wedding's colours with the hearts couple (wedding outfits) overlapping with foil, a marigold-and-bougainvillea garland around the arch and a varmala across the cards, on a patterned plinth. "ALL FOUR CEREMONIES COMPLETE" over "Just Married!", then "See the whole deck". "Play again" sits in the header. A full-window shower of petals and marigold beads falls over it in two waves (under the frame); none with reduced motion.
- Just Married entrance (about 2.5s, never a hard cut): the play screen fades and drifts out while this screen fades in over it; the arch rises; the king and queen glide in from either side and meet; the garland and varmala bloom bead by bead; the petals start; then the caption, "Just Married!" and the button rise in one after another. Reduced motion: a short plain fade.
- Play header: the title on the left and "View the deck" on the right. There is no visible ceremony counter; progress is announced to screen readers only.
- Keyboard: Tab to a royal, Enter picks it up; Tab and Shift+Tab then cycle between that card and the empty slots of its rank; Enter places; Escape puts it back. After placing, focus moves to the next royal (or Deal again); on the Just Married screen it is on See the whole deck. Focus is only moved for keyboard users.
- Screen readers: every card button is named by card, label and meaning (royals add "Royal card" and `aria-pressed` while picked up); slots read "<ceremony>, king slot, empty"; placements and progress are announced through hidden status lines.
- Respect `prefers-reduced-motion`: no deal-in slide, static sheen.

## Visual design (Direction B)

- Feel: arched niches, block-print borders and cut-paper depth on a cream ground, in the deck's own palette. Inspired by the wedding's pink bougainvillea and marigolds, which are also on the card back.
- Palette: ground #F4ECDD, paper #FFFBF3, ink #3B2B27, soft ink #5E4840, bougainvillea pink #A93B63 (deep #7E2648, bright #D9478A), marigold #E7A93C, sage #6F8F4E, leaf #6E9150, suit red #B23A3A.
- Type: Cormorant Garamond (italic for titles, spaced capitals for labels); Figtree for interface text.
- Frame: `border.svg`'s bands and rosettes on every screen, drawn by game.js around the whole browser window (edge to edge, no page margin); on phone the scrolling finale is framed top to bottom. Band thickness scales with the stage (66px at 1440×900 scale, 33px on phone) so content never meets it. Sage band, pink zigzag, deep-pink flower band, sage diamond band, rosette tiles in the corners. Keep content inside about 66px from each edge.
- Niches (recess / inner rim): Engagement pink / sage; Pooja warm orange / sage; Wedding golden yellow / red #A8322E; Reception dusky blue / pink. All have a marigold outer rim, a dotted inner rim, an inner shadow and a striped ledge with the name in spaced capitals.
- Spread: 6 cards spaced apart with no overlap, on a gentle arc (center higher, small outward tilt), each card leaning back in its own perspective (not one shared tilted plane, which keystoned the end cards) over a soft floor shadow. A lifted card straightens up. Short label under each card. Royals have a thin marigold outline.
- Buttons: one primary style everywhere (Deal, Deal again, See the whole deck, Play again): filled pink pill, 50px tall, cream spaced capitals, raised darker bottom edge. Secondary actions (View the deck, Back) are underlined text links stacked under the primary button.
- Intro: names in spaced capitals, the title "To the Wedding", the line "Bring the couple to each of their four ceremonies." under it, a large arch holding a 3D stack of card backs on a plinth, Deal and View the deck stacked below. Two mirrored flower stems flank the arch.
- Play screen corners: a short folk sprig in each bottom corner (one leaf pair, two bougainvillea bracts, a marigold), mirrored. No flower pots.
- Finale: "The wedding is complete." with the four couples, then the other 44 cards fanned by suit in a 2×2 grid. Any card shows its meaning when lifted. Its only action is Play again. The deck view is the same screen with the title "The whole deck", plus a "Back" link (to the game in progress, or the start).

## Phone layout (390×844, mockups P1–P4 on the design canvas)

- Used below 700px wide (`@media (max-width: 699px)` in styles.css, `isPhone()` in game.js). Same screens, flow and styling as desktop, with a thinner border (about 33px at 390 wide).
- Built on a 390×844 stage scaled to fit the screen, like desktop's 1440×900. On short screens (e.g. Safari with its bars) the stage shrinks and cream shows at its sides, still inside the window-wide frame; nothing is cropped. The finale is a 390×1234 page scaled to the width and scrolled.
- Wording on phone says "Tap" where desktop says "Hover" (meaning strip prompt, finale subtitle).
- Intro: names, title (42px) and instruction at the top; a 270px arch with three card backs on a plinth; Deal and View the deck stacked below; small mirrored folk sprigs in the bottom corners.
- Play: header with the title and "View the deck" (no ceremony counter; it was removed on desktop too and is kept only as screen-reader text). Niches in a 2×2 grid (132×104 arches, 38×53 slots, 9.5px ceremony labels). The spread is two rows of three cards (84×118), each row on a gentle arc. The lifted card scales to 125%. The meaning strip may wrap to two lines on phone. Deal again (44px tall) sits under the strip. No corner sprigs on this screen.
- Ceremony complete: the same in-place moment as desktop, in the 2×2 niches (caption 15px).
- Just Married: mockup P3's layout (300px arch, couple at 104×146, garland and varmala, plinth, 40px heading), with "ALL FOUR CEREMONIES COMPLETE" and See the whole deck; smaller, fewer petals in the shower.
- Finale: a scrolling page. Title and subtitle, the four couples in a 2×2 grid, then the four suits as stacked fans of 11 cards (50×70, overlapping by 25px), the meaning strip and Play again (plus Back on the deck view).

## Content

Card data lives in `public/cards.json` (labels, meanings, image file names, alt text; `*asterisks*` for italics). See README.md for how to edit it. Card images are in `public/cards/` named `<rank><suit>.jpg` (lowercase, for example `5h.jpg`, `kd.jpg`), 750×1050, exported from Madhura's Drive folder "wedding cards" (Artboard numbers mapped to cards in the copy doc). `back.png` is the card back. Every card face gets a CSS paper finish (styles.css, "Printed-card finish"): fibres and grain drawn with plain transparency, a warm top-left highlight, a soft shade and an edge vignette. No blend modes, so it renders the same in every browser; the image files stay flat art.

Confirmed meanings (Madhura's own captions):
- 5♥ *Saat phere*: the seven sacred rounds around the holy fire
- 4♦ The ceremony of application of henna to the bride's hands
- 2♠ The bridesmaids hold the groom's shoes for ransom
- 6♥ The *mangalsutra* is filled with *haldi* and *kumkum*
- 8♠ A masked woman dressed up at the pandemic wedding
- 2♣ Betel leaves used in various *poojas* during the ceremony

Gaps to fill:
- All 52 card images are in. Cards without an image would render a placeholder face that says "Art coming".
- Every card's label and meaning is approved (Claude Doc "To the Wedding: suggested card copy", all rows Approved or Confirmed) and in `cards.json`. Edit there or in `cards.json` directly.
- The suit theme names are not yet decided.

## Next steps

- Keep everything a static site so it can be hosted on Madhura's portfolio.
