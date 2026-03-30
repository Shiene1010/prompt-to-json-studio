# Project Brief

## Product name

Prompt-to-JSON Studio

## Product type

Developer-facing and operator-facing web application for natural-language-to-structured-action conversion.

## Problem

There are multiple independent services already running:

- bus arrival alert
- receipt scan and bookkeeping
- English expression concept checking

Users should be able to type into one input surface and have the system determine which connected service should receive the request.

## Solution

Build a single Studio that:

1. accepts natural language input,
2. converts it into service-specific structured JSON,
3. validates the payload against schema,
4. hands off the payload to the actual connected service,
5. stores prompt/result data for future small-model training.

## Current connected services

| service_key | schema_version | target_url |
|---|---:|---|
| `bus.arrival.alert` | 1 | `https://sunny-valley30bus-oi05v4fw5-shiene1010s-projects.vercel.app` |
| `receipt.scan.record` | 1 | `https://shiene1010.github.io/BookKeepingApp/` |
| `english.expression.check` | 1 | `https://shiene1010.github.io/HedgeExpression/` |

## Non-goals for MVP

- no full autonomous tool orchestration
- no large-model dependency as a hard requirement
- no complex account/billing system
- no dynamic service marketplace yet

## MVP success criteria

- parse input into one of 3 active service keys
- produce valid payload against registered schema
- hand off successfully to real running service
- store prompt and result history
- support future service expansion through registry
