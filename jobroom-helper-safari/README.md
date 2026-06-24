# JobRoom Helper Safari

Safari WebExtension source for the LinkedIn -> Job-Room helper.

It uses the same workflow as the Chrome version:

1. Open a LinkedIn job page.
2. Click **READ LinkedIn job**.
3. Open the Job-Room work-effort page.
4. Click **PASTE into Job-Room**.

It stores only the last read job in extension local storage and does not submit forms.

The extension UI is localized for English, German, French, and Italian.

## Safari Install

Safari does not load unpacked WebExtension folders directly like Chrome. It needs a containing macOS app.

Use Apple's converter from this repository root:

```sh
xcrun safari-web-extension-converter ./jobroom-helper-safari \
  --project-location ./safari-build \
  --app-name "JobRoom Helper Safari" \
  --bundle-identifier "local.jobroom.helper.safari"
```

Then open the generated Xcode project in `safari-build`, run the app, and enable the extension in:

Safari -> Settings -> Extensions

You may also need to enable unsigned local extensions from Safari's Develop menu.

## City Mapping

For LinkedIn location lines like `Geneva, Switzerland · 1 week ago · Over 100 applicants`, the extension stores `Geneva, Switzerland` as the location and fills the Job-Room `PLZ / ORT` field with:

- `Geneva`, `Genève`, `Geneve`, `Genf` -> `Geneva`
- `Zurich`, `Zürich` -> `Zürich`
- `Lausanne` -> `Lausanne`
- `Bern`, `Berne` -> `Bern`

If no city can be derived from the LinkedIn location text, the extension uses `Zürich`.

## Defaults Filled

On paste, it also tries to set:

- `Erfolgte die Bewerbung aufgrund einer Zuweisung des RAV?` -> `Nein`
- `Für welches Arbeitspensum haben Sie sich beworben?` -> `Vollzeit`
- `Wie lautet das Ergebnis Ihrer Bewerbung?` -> `Noch offen`
- `Wie haben Sie sich beworben?` -> `Elektronisch`
- the application date / `Bewerbungsdatum` -> the date captured when you clicked **READ LinkedIn job**
