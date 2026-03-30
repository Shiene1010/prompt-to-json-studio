# Handoff Skill

## Goal

Safely route structured payloads from Studio to connected live services.

## Current live targets

- bus: `https://sunny-valley30bus-oi05v4fw5-shiene1010s-projects.vercel.app`
- receipt: `https://shiene1010.github.io/BookKeepingApp/`
- english: `https://shiene1010.github.io/HedgeExpression/`

## Current transport

- Base64 JSON
- query parameter `payload`
- schema version parameter `sv`

## Rules

- always resolve target from registry
- always pass actual schema version
- always include `service_key`
- fail closed if service key unknown
- prefer graceful fallback on target service
