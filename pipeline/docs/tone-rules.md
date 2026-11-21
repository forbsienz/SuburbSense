# Narrative tone rules

Suburb Sense builds short comparison sentences from **deterministic templates** in `crimetracker/narrative/tone.py` (fixed phrasing filled with aggregate numbers). They must **inform, not alarm**.

## Voice

| Avoid | Prefer |
| --- | --- |
| "You are at risk on Saturday nights" | "Reported theft in Otatara tends to occur on Saturdays around 10pm–2am" |
| "Crime peaks at 10pm" | "Most reported incidents with a known time fall between 10pm–2am" |

## Confidence gates

- **Pattern messages** (peak day/hour): confidence ≥ medium **and** unknown time share &lt; 40%  
- **Latest month comparison**: only exported / emphasised when confidence ≥ medium  
- **Low confidence**: prefer counts with a warning; suppress or de-emphasise rates  

Thresholds are configured in `pipeline/config/sources.yaml` and applied in `aggregates/confidence.py`.

## Unknown times

When more than **40%** of records for a crime type have unknown hour or day, the narrative must say so. Incomplete time fields are common in Police extracts.
