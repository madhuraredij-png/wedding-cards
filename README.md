# To the Wedding

A one-minute card game presenting Madhura Redij's illustrated wedding deck for Ketaki and Prasanna. Static site: plain HTML, CSS and JavaScript in `public/`, with no build step.

## Run it locally

```bash
python3 -m http.server -d public 8000
```

Then open http://localhost:8000. The page must be served, not opened as a file, because it loads `cards.json`.

## Adding card illustrations and text

Everything about the cards lives in **`public/cards.json`**. Edit that file; no code changes are needed.

Each card is one line:

```json
{ "card": "7C", "label": "Brass lamp", "meaning": "The *samai* lit at the start of the pooja", "image": "7c.png", "alt": "Seven of Clubs: a lit brass lamp" },
```

| Field | What it does | If left blank `""` |
|---|---|---|
| `card` | Rank then suit: `A 2–10 J Q K` + `D C H S`. Don't change it. | — |
| `label` | Short name under the card in the spread | Shows the card name, e.g. "Seven of Clubs" |
| `meaning` | The sentence in the strip when the card is lifted | Shows "Meaning to come." |
| `image` | File name in `public/cards/` | Shows the "Art coming" face |
| `alt` | What the picture shows, read aloud by screen readers | Uses the card name |

Wrap words in `*asterisks*` for italics, for example `*Saat phere*`. Type `&`, apostrophes and accents as normal text.

### To add an illustration

1. Export the card at about 750×1050 and name it `<rank><suit>.png` in lowercase, for example `7c.png`, `10h.png`, `jd.png`.
2. Put it in `public/cards/`. Replacing an existing file with the same name just works.
3. In `cards.json`, set that card's `"image": "7c.png"` and write an `alt`.
