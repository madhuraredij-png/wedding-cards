# To the Wedding

A one-minute, single-player card game that presents Madhura Redij's illustrated wedding deck for Ketaki and Prasanna as a digital design piece. The player deals short spreads of cards, reads what each card depicts, and places each king and queen at their ceremony. When all four couples are placed, the full 52-card deck is revealed.

The site is `public/index.html`, `public/styles.css`, `public/game.js` and `public/cards.json`: plain static files, no framework, no build step. It was split out of a single-file prototype (first commit) and is the source of truth for look and behavior. The full PRD lives in Claude Docs ("Wedding Deck Game — PRD & Strategy"); the decisions that matter are summarized below.

## Run it

Serve `public/` with any static server, for example `npx serve public` or `python3 -m http.server -d public`. Open `index.html`. Images load by relative path.

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
6. When both slots of a ceremony are filled, the pair locks and the lock moment plays.
7. After the fourth lock, the finale shows the whole deck.
8. "Deal again" works at any time. "View the deck" skips the game and shows the full deck.

## Interaction

- Select and place: click or tap a royal, then click its slot; or drag the royal onto a niche. While a royal is selected, empty slots of its rank glow soft green.
- Reading: hovering, tapping or focusing a card lifts it to 130% scale (it may overlap neighbors) and shows its meaning in the strip below the spread.
- Meaning strip: single row, stamp-style (perforated cream edge). Rank and suit symbol first, for example "5 ♥", in red for ♥/♦. Then one sentence, on one line.
- Foil sheen appears only on a royal that is lifted (selected in the spread, or at the lock moment). Cards at rest never shine.
- A completed pair leans together and overlaps inside its niche, which gains a marigold glow.
- Lock moment: a large arch in that ceremony's colors, the couple overlapping with foil, a marigold-and-bougainvillea garland around the arch and a varmala across the cards, on a patterned plinth. "CEREMONY COMPLETE" over the ceremony name. For The Wedding the heading is "Just Married!". "Continue" returns to play; after the fourth pair it reads "See the whole deck". "Play again" sits in the header.
- Play header: the title on the left and "View the deck" on the right. There is no visible ceremony counter; progress is announced to screen readers only.
- Respect `prefers-reduced-motion`: no deal-in slide, static sheen.

## Visual design (Direction B)

- Feel: arched niches, block-print borders and cut-paper depth on a cream ground, in the deck's own palette. Inspired by the wedding's pink bougainvillea and marigolds, which are also on the card back.
- Palette: ground #F4ECDD, paper #FFFBF3, ink #3B2B27, soft ink #5E4840, bougainvillea pink #A93B63 (deep #7E2648, bright #D9478A), marigold #E7A93C, sage #6F8F4E, leaf #6E9150, suit red #B23A3A.
- Type: Cormorant Garamond (italic for titles, spaced capitals for labels); Figtree for interface text.
- Frame: `border.svg` on every screen. Sage band, pink zigzag, deep-pink flower band, sage diamond band, rosette tiles in the corners. Keep content inside about 66px from each edge.
- Niches (recess / inner rim): Engagement pink / sage; Pooja warm orange / sage; Wedding golden yellow / red #A8322E; Reception dusky blue / pink. All have a marigold outer rim, a dotted inner rim, an inner shadow and a striped ledge with the name in spaced capitals.
- Spread: 6 cards spaced apart with no overlap, on a gentle arc (center higher, small outward tilt), leaning back in perspective over a soft floor shadow. Short label under each card. Royals have a thin marigold outline.
- Buttons: one primary style everywhere (Deal, Deal again, Continue, Play again): filled pink pill, 50px tall, cream spaced capitals, raised darker bottom edge. Secondary actions (View the deck, Back) are underlined text links stacked under the primary button.
- Intro: names in spaced capitals, the title "To the Wedding", the line "Bring the couple to each of their four ceremonies." under it, a large arch holding a 3D stack of card backs on a plinth, Deal and View the deck stacked below. Two mirrored flower stems flank the arch.
- Play screen corners: a short folk sprig in each bottom corner (one leaf pair, two bougainvillea bracts, a marigold), mirrored. No flower pots.
- Finale: "The wedding is complete." with the four couples, then the other 44 cards fanned by suit in a 2×2 grid. Any card shows its meaning when lifted. The deck view is the same screen with the title "The whole deck".

## Phone layout (390×844, mockups P1–P4 on the design canvas)

- Use it below about 700px wide. Same screens, flow and styling as desktop, with a thinner border (about 33px).
- Intro: names, title (42px) and instruction at the top; a 270px arch with three card backs on a plinth; Deal and View the deck stacked below; small mirrored folk sprigs in the bottom corners.
- Play: header with the title and "View the deck" (no ceremony counter; it was removed on desktop too and is kept only as screen-reader text). Niches in a 2×2 grid (132×104 arches, 38×53 slots, 9.5px ceremony labels). The spread is two rows of three cards (84×118), each row on a gentle arc. The lifted card scales to 125%. The meaning strip may wrap to two lines on phone. Deal again (44px tall) sits under the strip. No corner sprigs on this screen.
- Lock moment: a 300px arch in the ceremony's colors with the couple at 104×146, garland and varmala, plinth, "CEREMONY COMPLETE", the ceremony heading at 40px ("Just Married!" for The Wedding), Continue, and View the deck. Play again in the header.
- Finale: a scrolling page. Title and subtitle, the four couples in a 2×2 grid, then the four suits as stacked fans of 11 cards (50×70, overlapping by 25px), the meaning strip, Play again and Back to start.

## Content

Card data lives in `public/cards.json` (labels, meanings, image file names, alt text; `*asterisks*` for italics). See README.md for how to edit it. Card images are in `public/cards/` named `<rank><suit>.png` (lowercase, for example `5h.png`, `kd.png`).

Confirmed meanings (Madhura's own captions):
- 5♥ *Saat phere*: the seven sacred rounds around the holy fire
- 4♦ The ceremony of application of henna to the bride's hands
- 2♠ The bridesmaids hold the groom's shoes for ransom
- 6♥ The *mangalsutra* is filled with *haldi* and *kumkum*
- 8♠ A masked woman dressed up at the pandemic wedding
- 2♣ Betel leaves used in various *poojas* during the ceremony

Gaps to fill:
- Only 22 card images exist, cropped from screenshots at 200×280. Replace them with full-resolution exports (about 750×1050, same names). Cards without art render a placeholder face that says "Art coming".
- Every other card's meaning shows "Meaning to come." Labels like "Haldi", "Kalash", "Wedding meal", "Marathi lettering", "The knot", "Garlands" and "Mr. & Mrs. chairs" were guessed from the art and need confirming.
- The suit theme names are not yet decided.

## Next steps

- Build the phone layout (below). Today the 1440×900 stage just scales down.
- Keyboard play end to end (Tab to a royal, Enter to select, Tab to a slot, Enter to place) and screen-reader labels on every card.
- Keep everything a static site so it can be hosted on Madhura's portfolio.
