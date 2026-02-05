---
name: contact-enricher
description: "Enriches contacts with profile name from WhatsApp metadata"
metadata: { "openclaw": { "emoji": "👤", "events": ["agent:message"] } }
---

# Contact Enricher Hook

Extracts and stores contact profile names from WhatsApp metadata.

## Flow

1. Message arrives from WhatsApp
2. Extract `pushName` from channel metadata
3. Check if contact exists in `storage/contacts/`
4. New contact? → Create contact record
5. Existing contact? → Update `last_seen`
6. Store as JSON: `+905551234567.json`

## Contact Record

```json
{
  "id": "+905551234567",
  "name": "Ahmet Yılmaz",
  "category": "unknown",
  "phone": "+905551234567",
  "created_at": 1707156789000,
  "last_seen": 1707156789000,
  "message_count": 5
}
```

## Integration

Used by `router-guard` for contact-based routing decisions.
