# Environment

This project uses environment variables for API behavior, history storage, and handoff configuration.

## Philosophy

- real service URLs should remain in registry JSON files
- secrets should go in environment variables
- local and production environments should keep the same service keys and schema versions

## Required environment variables

### Backend
- `API_PORT`
- `API_BASE_URL`
- `DATABASE_URL`
- `CORS_ORIGIN`

### Frontend
- `VITE_API_BASE_URL`

### Optional parser settings
- `PARSER_MODE` (`rule`, `hybrid`, `model`)
- `DEFAULT_LOCALE`
- `ENABLE_HISTORY`
- `ENABLE_EXECUTION_LOGS`

### Optional security and storage
- `HANDOFF_TOKEN_MODE`
- `PAYLOAD_SIGNING_SECRET`
- `LOG_LEVEL`

## Current deployment assumptions

- backend may run separately from connected services
- frontend Studio may run on Vercel or similar
- connected services remain at their current external URLs

## Notes

Do not move current service URLs into `.env` unless there is a strong operational reason.
Registry files are easier to audit, document, and review than hidden environment values.
