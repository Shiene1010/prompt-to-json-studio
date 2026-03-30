# Instructions

This file is for contributors and coding agents working inside this repository.

## Primary rule

Do not invent fake service URLs, fake service keys, or fake schema versions.

Always use the live configured values from:

- `config/service-registry.json`
- `config/schema-registry.json`

## Current service keys

- `bus.arrival.alert`
- `receipt.scan.record`
- `english.expression.check`

## Current schema versions

All active services currently use `schema_version = 1`.

## Required output contract

Every parser output must include:

- `service_key`
- `schema_version`
- `domain`
- `status`
- `slots`
- `missing_slots`
- `message`

Optional fields:

- `confidence`
- `request_id`
- `meta`

## Allowed status values

- `ready`
- `clarify`
- `unsupported`
- `error`

## Development behavior

- prefer stable naming over clever naming
- prefer contract-first design
- prefer backward-compatible changes
- treat schema files as product contracts
- do not change service keys lightly
- do not increase schema version unless compatibility breaks

## Handoff behavior

When generating handoff URLs:

1. resolve by `service_key` from service registry
2. use actual `target_url`
3. include `payload`
4. include `sv` query parameter for schema version

## Existing service integration rule

Connected services are external execution surfaces.
Do not rewrite them inside this repo.
Instead, adapt this repo to hand off clean payloads to them.

## Future expansion rule

To add a new service:

1. define `service_key`
2. create new schema file
3. add service to `config/service-registry.json`
4. add schema metadata to `config/schema-registry.json`
5. add sample prompts
6. add handoff compatibility to target service
