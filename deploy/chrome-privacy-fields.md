# Chrome Privacy Fields

Use this as the starting point for the Chrome Web Store Privacy practices tab.

## Single purpose

JobRoom Helper reads job details from a LinkedIn job page and pastes them into Job-Room form fields when the user clicks the extension popup buttons.

## Permission justifications

### `activeTab`

Needed so the extension can access the current LinkedIn or Job-Room tab only after the user clicks a popup button.

### `scripting`

Needed to inject the content script into the current tab when the user clicks READ LinkedIn job or PASTE into Job-Room.

### `storage`

Needed to store the last LinkedIn job locally between the READ action on LinkedIn and the PASTE action on Job-Room.

### `https://www.linkedin.com/*` and `https://*.linkedin.com/*`

Needed to read job title, company, location, URL, and applied-on date from LinkedIn job pages.

### `https://www.job-room.ch/*` and `https://*.job-room.ch/*`

Needed to fill matching Job-Room form fields after the user clicks PASTE into Job-Room.

## Remote code

No remote code is used. All extension JavaScript, CSS, and images are packaged in the extension.

## Data use

The extension reads job page content only after the user clicks the extension popup. It stores the last read job locally in browser extension storage. It does not transmit job data to external servers, does not use analytics, does not use advertising, and does not sell or share data.

## Data categories

The safest disclosure is to state that the extension handles website content locally for its single purpose, but does not collect or transmit it off-device. Match the final checkbox wording in the dashboard at submission time.
