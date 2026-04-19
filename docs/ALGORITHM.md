# Algorithm

This system uses a hybrid analysis approach.
It combines machine learning and rule-based logic.

## Pipeline

1. Input text is split into clauses.
2. Each clause is scored by ML model.
3. Rule engine checks policy risk patterns.
4. Intent checks identify sharing and third-party behavior.
5. Final decision is chosen from hybrid decision logic.
6. Results are aggregated into summary metrics.

## Rule Engine Logic

The rule layer checks for:
- harmful actions (for example, exploit, sell, misuse, abuse, leak)
- sharing and disclosure patterns
- third-party context
- explicit negation context (for example, not share)

## Hybrid Decision Flow

For each clause:

1. If harmful handling is detected by rules, mark risky.
2. Else if third-party sharing is detected, mark risky.
3. Else mark according to hybrid baseline rule strategy.
4. Keep ML prediction in output for transparency.

## Output Fields

Expected fields in API response:
- success
- isPrivacyPolicy
- totalClauses
- riskyCount
- overallRisk
- avgScore
- clauses
- timestamp

Each clause should include:
- text
- fullText
- riskLevel
- isRisky
- reasons
- score
- intent

## Performance Notes

- Clause limit should remain bounded for stable response times.
- Backend should validate minimum input length.
- Frontend should handle missing optional fields safely.
