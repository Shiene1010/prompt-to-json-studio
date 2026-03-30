# Schema Skill

## Role

Maintain compatibility between parser output and connected service expectations.

## Required discipline

- schema-first change design
- explicit required fields
- explicit enums
- no silent field drift

## Current version discipline

All active services are on version 1.
Do not create version 2 without a documented breaking reason.

## Review checklist

- does payload validate?
- does connected service understand it?
- does handoff preserve schema version?
