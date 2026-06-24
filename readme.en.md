# JobRoom Helper

[Deutsch](README.md) | English | [Français](readme.fr.md) | [Italiano](readme.it.md)

JobRoom Helper is a browser extension for a manual LinkedIn-to-Job-Room workflow. It helps copy details from a LinkedIn job posting and paste them into the Job-Room work-effort form.

The tool does not apply for jobs, does not submit forms automatically, and does not send your data to a separate backend. It only stores the most recently read job locally inside the browser extension.

## What It Does

The usual workflow is:

1. Open a LinkedIn job posting in the browser.
2. Click **READ LinkedIn job** in the extension.
3. Open the Job-Room work-effort page.
4. Click **PASTE into Job-Room** in the extension.
5. Review the inserted data and submit the form manually.

The extension tries to capture:

- job title
- company
- location
- job URL
- application date

Where the fields can be detected, it also tries to set useful defaults:

- application based on a RAV assignment: `No`
- workload: `Full-time`
- application result: `Still open`
- application method: `Electronic`

## Primary Installation in Chrome

Chrome is currently the recommended and easiest way to use JobRoom Helper.

1. Download or clone this repository.
2. Open Chrome.
3. Enter `chrome://extensions` in the address bar.
4. Enable **Developer mode** in the top right corner.
5. Click **Load unpacked**.
6. Select the `jobroom-helper` folder from this project.
7. Pin the extension in Chrome so it is easy to access.

Chrome must be in Developer mode for locally loaded extensions that are not installed through the Chrome Web Store. This is expected for a manually loaded extension.

## Usage

After installation:

1. Open a LinkedIn job page.
2. Open JobRoom Helper.
3. Click **READ LinkedIn job**.
4. Open Job-Room and go to the work-effort entry form.
5. Open JobRoom Helper again.
6. Click **PASTE into Job-Room**.
7. Check the fields and save or submit manually.

## Privacy

JobRoom Helper runs locally in the browser. It stores only the most recently read job in `chrome.storage.local`. It does not send data to a custom server and does not submit forms automatically.

The extension needs access to LinkedIn and Job-Room pages so it can read job details and fill form fields on those pages.

## Safari, macOS, and iOS

A Safari/macOS variant is already prepared in this project. The iOS and macOS versions are planned to be available in the App Store soon. Until then, Chrome with the locally loaded extension is the recommended installation path.

## Project Layout

- `jobroom-helper/`: Chrome extension
- `jobroom-helper-safari/`: Safari WebExtension source
- `safari-build/`: generated Xcode project for Safari/macOS/iOS
- `deploy/`: copy and assets for store publishing
- `dist/`: packaged extension builds
