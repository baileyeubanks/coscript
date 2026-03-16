# Internal Gemini Orchestration Notes

This document is intentionally non-canonical for the product surface.

Co-Script's primary writing workflow uses the editor-native Anthropic routes:

- `POST /api/ai/generate`
- `POST /api/ai/rewrite`
- `POST /api/ai/score`
- `POST /api/ai/hooks`

`POST /api/ai/gemini-orchestrate` is retained only as an internal experiment for research-heavy or tool-enabled prompts. It should not define the user-facing product model, navigation, or editor language.

## Experimental stages

- `script`: research-backed drafting experiment
- `edit`: internal editing-support experiment
- `deliver`: internal packaging-support experiment

## Internal contract

When `force_claude_handoff` is enabled, Gemini is constrained to call:

- `handoff_to_claude`

Arguments schema:

- `pipeline_stage`: `script | edit | deliver`
- `objective`: string
- `inputs`: object
- `constraints`: string[]
- `required_outputs`: string[]
- `quality_checks`: string[]

This is a tooling bridge for internal experimentation, not the canonical Co-Script workflow.
