import { useEffect, useState } from "react";
import { getRsvpStatus, registerForEvent, unregisterFromEvent } from "../services/eventService";
import { decodeJwtPayload } from "../utils/decodeJwtPayload";

function initialCheckingRegistration() {
  const t = localStorage.getItem("token");
  if (!t) {
    return false;
  }
  const role = decodeJwtPayload(t)?.role;
  if (role === "organizer" || role === "admin") {
    return false;
  }
  return true;
}

export default function RSVPButton({
  eventId,
  capacityLimit,
  registeredCount,
  onSuccess,
}) {
  const [checkingRegistration, setCheckingRegistration] = useState(initialCheckingRegistration);
  const [isRegistered, setIsRegistered] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [calendarLink, setCalendarLink] = useState(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const tokenRole = token ? decodeJwtPayload(token)?.role : null;
  const isNonAttendee = tokenRole === "organizer" || tokenRole === "admin";
  const tokenPresent = !!token;

  const capNum = Number(capacityLimit);
  const countNum = Number(registeredCount);
  const hasValidCapacity = Number.isFinite(capNum) && capNum > 0;
  const hasValidCount = Number.isFinite(countNum) && countNum >= 0;
  const isFull = hasValidCapacity && hasValidCount && countNum >= capNum;

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      const t = localStorage.getItem("token");
      const role = t ? decodeJwtPayload(t)?.role : null;

      if (!t || eventId == null || role === "organizer" || role === "admin") {
        setCheckingRegistration(false);
        setIsRegistered(false);
        return;
      }

      setCheckingRegistration(true);
      try {
        const res = await getRsvpStatus(eventId, t);
        if (!cancelled) {
          setIsRegistered(Boolean(res?.data?.registered));
        }
      } catch {
        if (!cancelled) {
          setIsRegistered(false);
        }
      } finally {
        if (!cancelled) {
          setCheckingRegistration(false);
        }
      }
    }

    loadStatus();

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const handleRegister = async () => {
    if (isFull && !isRegistered) {
      return;
    }
    const t = localStorage.getItem("token");
    if (!t || isNonAttendee) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await registerForEvent(eventId, t);
      const link =
        res?.data?.google_calendar_link ||
        res?.data?.calendar_link ||
        null;
      
        setCalendarLink(link);
        window.alert("RSVP registration successful");
        setIsRegistered(true);
        await onSuccess?.();
    } catch (error) {
      window.alert(error?.message || "RSVP failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnregister = async () => {
    const t = localStorage.getItem("token");
    if (!t || isNonAttendee) {
      return;
    }

    setActionLoading(true);
    try {
      await unregisterFromEvent(eventId, t);
      window.alert("You have been unregistered from this event");
      setCalendarLink(null);
      setIsRegistered(false);
      await onSuccess?.();
    } catch (error) {
      window.alert(error?.message || "Unregister failed");
    } finally {
      setActionLoading(false);
    }
  };

  const registerBlocked = isFull && !isRegistered;
  const unregisterMode =
    tokenPresent && isRegistered && !checkingRegistration && !isNonAttendee;

  const disableRegisterPath =
    checkingRegistration || actionLoading || registerBlocked || !tokenPresent || isNonAttendee;
  const disableUnregisterPath = checkingRegistration || actionLoading || isNonAttendee;
  const disableButton = unregisterMode ? disableUnregisterPath : disableRegisterPath;

  let buttonLabel = "Register / RSVP";
  if (checkingRegistration && tokenPresent && !isNonAttendee) {
    buttonLabel = "Checking…";
  } else if (actionLoading) {
    buttonLabel = isRegistered ? "Unregistering…" : "Registering…";
  } else if (unregisterMode) {
    buttonLabel = "Unregister";
  }

  const handleClick = unregisterMode ? handleUnregister : handleRegister;

  return (
    <div className="rsvp-wrap" aria-live="polite">
      {registerBlocked ? (
        <p className="rsvp-msg text-error" role="alert">Sorry, this event is full.</p>
      ) : null}
      {!registerBlocked && tokenPresent && isNonAttendee ? (
        <p className="rsvp-msg text-muted" role="status">Log in with an attendee account to register.</p>
      ) : null}
      {!tokenPresent && !registerBlocked ? <p className="rsvp-msg text-muted" role="status">Log in to register for this event.</p> : null}
      {tokenPresent && !checkingRegistration && isRegistered && !isNonAttendee ? (
        <p className="rsvp-msg text-muted" role="status">You are registered for this event.</p>
      ) : null}
      {calendarLink ? (
        <a
          href={calendarLink}
          target="_blank"
          rel="noreferrer"
          className="btn btn-secondary btn-block"
          style={{ marginBottom: "0.5rem" }}
        >
          Save to Google Calendar
        </a>
      ) : null}
      <button
        type="button"
        className="btn btn-primary btn-block"
        onClick={handleClick}
        disabled={disableButton}
      >
        {buttonLabel}
      </button>
    </div>
  );
}
