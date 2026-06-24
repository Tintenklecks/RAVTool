# JobRoom Helper

Small Chrome extension for a manual LinkedIn to Job-Room workflow:

1. Open a LinkedIn job page.
2. Click **READ LinkedIn job**.
3. Open the Job-Room work-effort page.
4. Click **PASTE into Job-Room**.

It stores only the last read job in `chrome.storage.local` and does not submit forms.

The extension UI is localized for English, German, French, and Italian.

## Install

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this folder: `jobroom-helper`.

## What It Reads

The LinkedIn reader stores:

```json
{
  "title": "...",
  "company": "...",
  "location": "...",
  "city": "Zürich",
  "url": "https://www.linkedin.com/jobs/view/...",
  "appliedOn": "2026-06-10",
  "readAt": "..."
}
```

For LinkedIn location lines like `Geneva, Switzerland · 1 week ago · Over 100 applicants`, the extension stores `Geneva, Switzerland` as the location and fills the Job-Room `PLZ / ORT` field with a mapped postal city when possible:

- `Geneva`, `Genève`, `Geneve`, `Genf` -> `Geneva`
- `Zurich`, `Zürich` -> `Zürich`
- `Lausanne` -> `Lausanne`
- `Bern`, `Berne` -> `Bern`

If no city can be derived from the LinkedIn location text, the extension uses `Zürich`.

On paste, it also tries to set:

- `Erfolgte die Bewerbung aufgrund einer Zuweisung des RAV?` -> `Nein`
- `Für welches Arbeitspensum haben Sie sich beworben?` -> `Vollzeit`
- `Wie lautet das Ergebnis Ihrer Bewerbung?` -> `Noch offen`
- the application date / `Bewerbungsdatum` -> the date captured when you clicked **READ LinkedIn job**

## Tuning Job-Room Selectors

The paste side uses best-effort selectors in `content.js`. If Job-Room fields do not fill, inspect the target inputs and add their exact `name`, `id`, `aria-label`, or `placeholder` selector to the matching field block in `pasteIntoJobRoom`.

The setter uses the native input value setter and dispatches `input`, `change`, `keydown`, and `keyup` events so React-style controlled inputs have a chance to update internal state. For checkboxes, radios, selects, and custom option buttons, it looks for the German question text and then clicks/selects the requested answer near that question.
