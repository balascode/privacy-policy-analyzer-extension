# Installation Guide

## Requirements

- Chromium based browser
- Access to backend API endpoint

## Load Extension

1. Go to chrome://extensions.
2. Enable Developer mode.
3. Load unpacked extension folder.

## Configure Endpoint

In src/popup/api-config.js:
- hostedApiUrl: production backend /analyze endpoint
- localApiUrl: optional local backend endpoint

## Verify Setup

1. Open backend health URL.
2. Run extension analysis on selected text.
3. Confirm popup displays summary and clause results.

## Troubleshooting

- API not reachable: check endpoint and deployment status.
- Spinner stuck: verify response schema includes required fields.
- Invalid date: ensure timestamp is returned by backend.
