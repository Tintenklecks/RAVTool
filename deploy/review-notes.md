# Review Notes

## Test account

No account is provided. Reviewers can test the extension on a publicly visible LinkedIn job page for the READ action. The Job-Room paste action requires access to a Job-Room form page.

## How to test

1. Open a LinkedIn job page.
2. Open the extension popup.
3. Click READ LinkedIn job.
4. Confirm that the popup shows the extracted job data.
5. Open a Job-Room work-effort/application form page.
6. Open the extension popup.
7. Click PASTE into Job-Room.
8. Confirm that fields are filled, but the form is not submitted.

## Important behavior

The extension never submits a Job-Room form automatically. The user must review and submit manually.

## Permission justification

- LinkedIn host access is needed to read job title, company, location, URL, and applied-on date from the active job page.
- Job-Room host access is needed to fill the user's Job-Room form fields after the user clicks PASTE.
- Storage is needed to keep the last read job locally between the LinkedIn page and Job-Room page.
- Active tab and scripting are needed to run the content script only on the current page after the user clicks the extension popup.
