# Handoff Contract

## Current handoff mode

Current mode: `query_payload`

Payload is Base64-encoded JSON attached to the target URL.

## Query parameters

- `payload`: encoded structured JSON
- `sv`: schema version

## Required payload envelope

```json
{
  "service_key": "bus.arrival.alert",
  "schema_version": 1,
  "domain": "bus",
  "status": "clarify",
  "slots": {},
  "missing_slots": [],
  "message": ""
}
Connected service responsibility
Each connected service must:
	1.	read query payload
	2.	decode payload safely
	3.	verify  service_key 
	4.	verify  schema_version 
	5.	hydrate app state from  slots 
	6.	fall back gracefully if required values are missing
Future migration path
Possible future mode:  handoff_id 
In that mode:
	•	Studio stores payload server-side
	•	target service receives short ID only
	•	target fetches payload by ID

***

# 10) docs/DATA_POLICY.md

```md
# Data Policy

## What is stored

- raw prompt input
- parser output JSON
- edited JSON
- execution logs
- reviewed gold cases

## Why it is stored

- debugging
- product improvement
- schema refinement
- future small-model training

## Storage principle

Do not assume all stored data is clean enough for training.
Training data must be reviewed and promoted through states:

- `candidate`
- `reviewed`
- `gold`

## Privacy note

Receipt and user text data may contain sensitive information.
Masking or token-based handoff should be considered in future versions.
