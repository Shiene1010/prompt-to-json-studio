# Service Registry Policy

## Purpose

The service registry is the live map between `service_key` and actual executable service URL.

## Rules

- use real current production URLs
- one active row per service key
- keep `service_key` stable
- update URL in registry if deployment URL changes
- do not change schema version in registry unless schema contract changes

## Active services

### bus.arrival.alert
- schema version: 1
- target: `https://sunny-valley30bus-oi05v4fw5-shiene1010s-projects.vercel.app`

### receipt.scan.record
- schema version: 1
- target: `https://shiene1010.github.io/BookKeepingApp/`

### english.expression.check
- schema version: 1
- target: `https://shiene1010.github.io/HedgeExpression/`

## Adding new services

Every new service must provide:

- stable `service_key`
- initial `schema_version = 1`
- actual target URL
- sample prompts
- compatible payload import behavior
