CREATE TABLE IF NOT EXISTS event_update_requests (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    requested_by BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pending_data JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_event_update_requests_event_status
    ON event_update_requests(event_id, status);

CREATE INDEX IF NOT EXISTS idx_event_update_requests_status
    ON event_update_requests(status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_event_update_requests_one_pending
    ON event_update_requests(event_id)
    WHERE status = 'pending';
