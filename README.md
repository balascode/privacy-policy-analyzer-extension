# Privacy Policy Analyzer Extension

This project is a browser extension that analyzes selected privacy policy text.

The extension calls a backend API that uses a hybrid approach:
- machine learning model prediction
- rule-based privacy checks

This repository contains the extension frontend.

## Main Features

- Right-click analysis lets you select text on any webpage and send it to the analyzer from the context menu.
- Popup results show the overall risk level, risk score, total clauses, and risky clause count in one window.
- Clause breakdowns explain why each part of the policy was marked low, medium, or high risk.
- Hybrid analysis combines machine learning predictions with rule-based privacy checks for more useful results.
- Save Analysis stores the current result in browser local storage so you can review it later in the same browser profile.
- History support keeps up to 50 saved analyses in `analysisHistory`.
- Hosted backend mode uses the Render API by default, with local fallback available for development.
- No-selection handling tells you when the highlighted text is missing or too short to analyze.
- Error handling shows clear messages when the backend is unreachable or the response format is unexpected.

## Save Analysis Button

The Save Analysis button stores the current popup result in browser local storage.

- It does not send data to the backend.
- It saves the full analysis result under `analysisHistory`.
- It keeps up to 50 saved analyses.
- It adds a `savedAt` timestamp for each saved item.
- It is useful for reviewing past results later from the same browser profile.

## How Analysis Works

1. User selects privacy policy text.
2. User clicks Analyze Privacy Policy from context menu.
3. Extension sends text to backend API.
4. Backend returns hybrid analysis output.
5. Popup renders summary and clause details.

## Project Structure

- manifest.json: Extension manifest.
- src/background/background.js: Context menu and messaging.
- src/content/content.js: Text selection support.
- src/popup/popup.html: Popup markup.
- src/popup/popup.css: Popup styles.
- src/popup/popup.js: Popup logic and rendering.
- src/popup/api-config.js: Backend endpoint configuration.
- docs/: Documentation.

## Backend Integration

Set endpoint values in src/popup/api-config.js.

Sometimes the hosted backend may not work or may be temporarily unavailable.
If you want me to set up the backend locally and run it for you, please open a comment or issue stating add me as a collaborator to backend repo.
Then we can give you access to the backend and you can start it locally.

Example:

window.API_CONFIG = {
  hostedApiUrl: "https://privacy-policy-analyzer-backend-xl7v.onrender.com",
  localApiUrl: "http://127.0.0.1:8000/analyze",
};

## Installation

1. Open chrome://extensions.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select this project folder.
5. Reload after any code change.

## Notes

- This frontend expects backend response fields such as success, overallRisk, avgScore, and clauses.
- The backend should return a timestamp for valid analysis date display.

## License

MIT License. See LICENSE.
