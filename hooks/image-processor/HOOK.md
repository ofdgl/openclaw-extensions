---
name: image-processor
description: "Processes images with Gemini Flash vision API"
metadata: { "openclaw": { "emoji": "🖼️", "events": ["agent:message"] } }
---

# Image Processor Hook

Processes image attachments using Gemini Flash vision API.

## Flow

1. Detect image attachments in incoming messages
2. Preprocess image (resize, format conversion if needed)
3. Call Gemini Flash API with fallback:
   - Primary: `gemini-3-flash-preview`
   - Fallback: `gemini-2.5-flash`
4. Extract text description
5. Include description in message context

## Error Handling

- Quota exceeded → Use fallback model
- API error → Log and skip image
- Processing timeout → Skip with warning

## Configuration

Requires `GEMINI_API_KEY` environment variable.
