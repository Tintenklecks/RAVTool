# JobRoom Helper Deployment

This folder contains the store copy and generated artwork for publishing JobRoom Helper.

The extension itself includes WebExtension locale bundles for English, German, French, and Italian. Store listing localization still needs to be entered separately in the Chrome Web Store dashboard and App Store Connect if you want localized public store pages.

## Generated assets

- `store-assets/chrome/store-icon-128.png`
- `store-assets/chrome/screenshot-1280x800.png`
- `store-assets/chrome/promo-small-440x280.png`
- `store-assets/chrome/promo-marquee-1400x560.png`
- `store-assets/safari/app-icon-1024.png`
- `store-assets/safari/screenshot-mac-1280x800.png`

Regenerate them with:

```sh
python3 tools/generate_deploy_assets.py
```

Build upload zips with:

```sh
bash tools/package_extensions.sh
```

## Chrome Web Store

Upload `dist/jobroom-helper-chrome-<version>.zip` in the Chrome Web Store Developer Dashboard.

Use the text from `chrome-listing.md`, `chrome-privacy-fields.md`, `privacy-policy.md`, and `review-notes.md`.

## Safari / Mac App Store

Open:

```sh
safari-build/JobRoom Helper Safari/JobRoom Helper Safari.xcodeproj
```

Select your Apple Developer team, set a production bundle identifier, archive the app in Xcode, and upload through Organizer or Transporter.

Use the text from `safari-listing.md`, `safari-app-privacy.md`, `privacy-policy.md`, and `review-notes.md`.
