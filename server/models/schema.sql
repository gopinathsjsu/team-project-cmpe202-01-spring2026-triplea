-- Final EventHub SJSU database schema.
-- This file is ordered for execution and mirrors the final Supabase table structure.

DROP TABLE IF EXISTS public.event_update_requests CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.registrations CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

CREATE TABLE public.users (
    id BIGSERIAL NOT NULL,
    full_name CHARACTER VARYING NOT NULL,
    email CHARACTER VARYING NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role CHARACTER VARYING NOT NULL CHECK (
        role::TEXT = ANY (
            ARRAY[
                'attendee'::CHARACTER VARYING,
                'organizer'::CHARACTER VARYING,
                'admin'::CHARACTER VARYING
            ]::TEXT[]
        )
    ),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_pkey PRIMARY KEY (id)
);

CREATE TABLE public.events (
    id BIGSERIAL NOT NULL,
    organizer_id BIGINT NOT NULL,
    title CHARACTER VARYING NOT NULL,
    event_description TEXT NOT NULL,
    category CHARACTER VARYING,
    event_date DATE NOT NULL,
    start_time TIME WITHOUT TIME ZONE NOT NULL,
    end_time TIME WITHOUT TIME ZONE,
    location_name CHARACTER VARYING,
    location_address CHARACTER VARYING,
    location_city CHARACTER VARYING,
    location_state CHARACTER VARYING,
    location_zip_code CHARACTER VARYING,
    latitude NUMERIC,
    longitude NUMERIC,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    approval_status CHARACTER VARYING NOT NULL DEFAULT 'pending'::CHARACTER VARYING CHECK (
        approval_status::TEXT = ANY (
            ARRAY[
                'pending'::CHARACTER VARYING,
                'approved'::CHARACTER VARYING,
                'rejected'::CHARACTER VARYING
            ]::TEXT[]
        )
    ),
    is_free BOOLEAN NOT NULL DEFAULT TRUE,
    ticket_price NUMERIC NOT NULL DEFAULT 0 CHECK (ticket_price >= 0::NUMERIC),
    schedule_notes TEXT,
    calendar_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    rejection_reason TEXT,
    CONSTRAINT events_pkey PRIMARY KEY (id),
    CONSTRAINT events_organizer_id_fkey FOREIGN KEY (organizer_id) REFERENCES public.users(id)
);

CREATE TABLE public.registrations (
    id BIGSERIAL NOT NULL,
    user_id BIGINT NOT NULL,
    event_id BIGINT NOT NULL,
    registration_status CHARACTER VARYING NOT NULL DEFAULT 'registered'::CHARACTER VARYING CHECK (
        registration_status::TEXT = ANY (
            ARRAY[
                'registered'::CHARACTER VARYING,
                'cancelled'::CHARACTER VARYING
            ]::TEXT[]
        )
    ),
    registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    removal_reason TEXT,
    removed_by BIGINT,
    CONSTRAINT registrations_pkey PRIMARY KEY (id),
    CONSTRAINT registrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
    CONSTRAINT registrations_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id),
    CONSTRAINT registrations_removed_by_fkey FOREIGN KEY (removed_by) REFERENCES public.users(id)
);

CREATE TABLE public.notifications (
    id BIGSERIAL NOT NULL,
    user_id BIGINT NOT NULL,
    event_id BIGINT,
    notif_type CHARACTER VARYING NOT NULL CHECK (
        notif_type::TEXT = ANY (
            ARRAY[
                'registration_confirmation'::CHARACTER VARYING,
                'approval_notification'::CHARACTER VARYING,
                'rejection_notification'::CHARACTER VARYING,
                'event_reminder'::CHARACTER VARYING,
                'registration_cancelled'::CHARACTER VARYING,
                'event_deleted'::CHARACTER VARYING,
                'attendee_removed'::CHARACTER VARYING
            ]::TEXT[]
        )
    ),
    notif_message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT notifications_pkey PRIMARY KEY (id),
    CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
    CONSTRAINT notifications_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id)
);

CREATE TABLE public.event_update_requests (
    id BIGSERIAL NOT NULL,
    event_id BIGINT NOT NULL,
    requested_by BIGINT NOT NULL,
    pending_data JSONB NOT NULL,
    status CHARACTER VARYING NOT NULL DEFAULT 'pending'::CHARACTER VARYING CHECK (
        status::TEXT = ANY (
            ARRAY[
                'pending'::CHARACTER VARYING,
                'approved'::CHARACTER VARYING,
                'rejected'::CHARACTER VARYING
            ]::TEXT[]
        )
    ),
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT event_update_requests_pkey PRIMARY KEY (id),
    CONSTRAINT event_update_requests_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id),
    CONSTRAINT event_update_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(id)
);
