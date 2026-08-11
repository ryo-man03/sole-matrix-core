# Export and deletion requests

Authenticated users may create one pending export and one pending deletion request. Requests are rate-limited and deduplicated. The API never returns private export material inline and does not immediately erase production records. A deletion request requires the exact confirmation phrase `DELETE MY ACCOUNT` and records an auditable pending request for the approved asynchronous process.
