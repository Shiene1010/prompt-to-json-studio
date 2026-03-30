# Architecture

## Overview

Prompt-to-JSON Studio is a contract-first router between user text input and connected execution services.

## Layers

1. Studio UI
2. Parse API
3. Validation layer
4. Service registry lookup
5. Handoff builder
6. External execution service
7. History and training-case storage

## Core design

User input does not directly call external services.
It is first converted into structured JSON.
That JSON is validated against schema.
Only then is it handed off.

## Source of truth

- service meta `config/service-registry.json`
- schema meta `config/schema-registry.json`
- schema contracts: `schemas/*.json`

## Current live integrations

- bus alert service
- bookkeeping receipt service
- English expression service

## Expected expansion path

Current state:
- 3 active services
- query payload handoff

Future state:
- token-based handoff
- admin registry management
- reviewed training-case pipeline
- small-model parser replacement
