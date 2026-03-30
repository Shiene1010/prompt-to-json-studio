# Router Skill

## Output objective

Convert free-form text into one of the active service keys.

## Current active service keys

- `bus.arrival.alert`
- `receipt.scan.record`
- `english.expression.check`

## Output states

- `ready`
- `clarify`
- `unsupported`
- `error`

## Router rules

- choose only from active registry services
- if required slots missing, use `clarify`
- if request does not match active services, use `unsupported`
- never invent new service keys
- never invent new schema versions
