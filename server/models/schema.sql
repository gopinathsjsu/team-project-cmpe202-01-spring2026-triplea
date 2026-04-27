DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('attendee', 'organizer', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    organizer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    event_description TEXT NOT NULL,
    category VARCHAR(100),
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    location_name VARCHAR(255),
    location_address VARCHAR(255),
    location_city VARCHAR(100),
    location_state VARCHAR(100),
    location_zip_code VARCHAR(20),
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    approval_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    is_free BOOLEAN NOT NULL DEFAULT true,
    ticket_price NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (ticket_price >= 0),
    schedule_notes TEXT,
    calendar_link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (
        (is_free = true AND ticket_price = 0.00)
        OR
        (is_free = false AND ticket_price >= 0.00)
    ),
    CHECK (end_time IS NULL OR end_time > start_time)
);

CREATE TABLE registrations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    registration_status VARCHAR(20) NOT NULL DEFAULT 'registered'
        CHECK (registration_status IN ('registered', 'cancelled')),
    registered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, event_id)
);

CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id BIGINT REFERENCES events(id) ON DELETE SET NULL,
    notif_type VARCHAR(50) NOT NULL CHECK (
        notif_type IN (
            'registration_confirmation',
            'approval_notification',
            'rejection_notification',
            'event_reminder'
        )
    ),
    notif_message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_events_organizer_id ON events(organizer_id);
CREATE INDEX idx_events_approval_status ON events(approval_status);
CREATE INDEX idx_events_event_date ON events(event_date);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_city ON events(location_city);
CREATE INDEX idx_registrations_event_id ON registrations(event_id);
CREATE INDEX idx_registrations_user_id ON registrations(user_id);
CREATE INDEX idx_registrations_user_status ON registrations(registration_status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notification_event_id ON notifications(event_id);
CREATE INDEX idx_notifications_type ON notifications(notif_type);

