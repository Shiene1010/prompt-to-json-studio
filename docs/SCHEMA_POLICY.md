# Schema Policy

## Goal

Schemas are contracts, not suggestions.

## Required fields

Every active schema must define:

- `service_key`
- `schema_version`
- `domain`
- `status`
- `slots`

Recommended:

- `missing_slots`
- `message`
- `confidence`

## Versioning policy

Do not increment `schema_version` for:
- text description changes
- example changes
- internal code cleanup

Increment `schema_version` only for:
- renamed fields
- removed required fields
- changed field meaning
- incompatible enum changes

## Naming policy

Schema file format:

`{service_key}.v{schema_version}.schema.json`

Examples:
- `bus.arrival.alert.v1.schema.json`
- `receipt.scan.record.v1.schema.json`
- `english.expression.check.v1.schema.json`
