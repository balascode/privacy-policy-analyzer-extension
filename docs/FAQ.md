# FAQ

## Does this extension run analysis locally in the browser?
No. It sends selected text to configured backend API.

## Can I use only a hosted backend?
Yes. Set hostedApiUrl in api-config.js and keep local fallback optional.

## Why do I sometimes see no results?
Typical causes:
- backend endpoint is down
- API response shape is incomplete
- extension was not reloaded after config change

## Why does the analysis show low risk in some clauses?
Hybrid logic can classify clauses as low risk when harmful or third-party sharing signals are not triggered by rule logic.
ML prediction is still included in reasons for transparency.

## How do I know which model is active?
Check backend health endpoint model field.

## Why did Git push fail for weights?
Large files require Git LFS when they exceed standard GitHub file size limits.

## Can I keep backend private and frontend public?
Yes. That is a common and recommended setup.
