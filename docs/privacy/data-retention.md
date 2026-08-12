# Data retention

Account records are retained while the account is active and while a privacy request is pending. Recommendation and daily-pick history is optional and consent-controlled. Export and deletion run as reviewed asynchronous operations; the API does not return sensitive archives inline or destroy production data immediately. Additive migrations are rolled back at the application layer so a deployment rollback never discards user data.
