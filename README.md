# Prompt-to-JSON Studio

Prompt-to-JSON Studio is a routing and structured-output web service that converts free-form user text into executable JSON payloads for connected domain services.

## Current connected services

- `bus.arrival.alert` → https://sunny-valley30bus-oi05v4fw5-shiene1010s-projects.vercel.app
- `receipt.scan.record` → https://shiene1010.github.io/BookKeepingApp/
- `english.expression.check` → https://shiene1010.github.io/HedgeExpression/

## What this project does

A user types a natural language request such as:

- "30번 버스 두 정거장 전에 알려줘"
- "이 영수증 가계부에 기록해줘"
- "이 영어 표현 자연스러운지 봐줘"

The Studio converts the input into a structured JSON payload with:

- `service_key`
- `schema_version`
- `domain`
- `status`
- `slots`
- `missing_slots`
- `message`

The payload is then handed off to the target service.

## Core principles

1. Use real production target URLs in registry and code.
2. Keep `service_key` stable even if service URLs change.
3. Increase `schema_version` only when backward compatibility breaks.
4. Treat `clarify` and `unsupported` as valid product states.
5. Store prompt/result pairs as future training data candidates.

## Main folders

- `docs/` design and product documentation
- `skills/` agent and contributor execution rules
- `config/` service and schema registry
- `schemas/` JSON schema contracts
- `backend/` parser, validation, history APIs
- `frontend/` Studio UI

## Quick start

1. Copy `.env.example` to `.env`
2. Fill required values
3. Start backend
4. Start frontend
5. Verify service registry and schema registry
6. Test handoff to all 3 connected services

## Stable service keys

- `bus.arrival.alert`
- `receipt.scan.record`
- `english.expression.check`

## Stable schema versions

- `bus.arrival.alert` → `1`
- `receipt.scan.record` → `1`
- `english.expression.check` → `1`
