import { useEffect, useState } from "react";
import { getRsvpStatus, registerForEvent, unregisterFromEvent } from "../services/eventService";

export default function RSVPButton({
  eventId,
  capacityLimit,
  registeredCount,
  onSuccess,
}) {
  const [checkingRegistration, setCheckingRegistration] = useState(() => !!localStorage.getItem("token"));
  const [isRegistered, setIsRegistered] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const capNum = Number(capacityLimit);
  const countNum = Number(registeredCount);
  const hasValidCapacity = Number.isFinite(capNum) && capNum > 0;
  const hasValidCount = Number.isFinite(countNum) && countNum >= 0;
  const isFull = hasValidCapacity && hasValidCount && countNum >= capNum;

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      const token = localStorage.getItem("token");
      if (!token || eventId == null) {
        setCheckingRegistration(false);
        setIsRegistered(false);
        return;
      }

      setCheckingRegistration(true);
      try {
        const res = await getRsvpStatus(eventId, token);
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
    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    setActionLoading(true);
    try {
      await registerForEvent(eventId, token);
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
    const token = localStorage.getItem("token");
    if (!token) {
      window.alert("Please log in first");
      return;
    }

    setActionLoading(true);
    try {
      await unregisterFromEvent(eventId, token);
      window.alert("You have been unregistered from this event");
      setIsRegistered(false);
      await onSuccess?.();
    } catch (error) {
      window.alert(error?.message || "Unregister failed");
    } finally {
      setActionLoading(false);
    }
  };

  const tokenPresent = !!localStorage.getItem("token");
  const registerBlocked = isFull && !isRegistered;
  const unregisterMode = tokenPresent && isRegistered && !checkingRegistration;

  const disableRegisterPath =
    checkingRegistration || actionLoading || registerBlocked || !tokenPresent;
  const disableUnregisterPath = checkingRegistration || actionLoading;
  const disableButton = unregisterMode ? disableUnregisterPath : disableRegisterPath;

  let buttonLabel = "Register / RSVP";
  if (checkingRegistration && tokenPresent) {
    buttonLabel = "Checking…";
  } else if (actionLoading) {
    buttonLabel = isRegistered ? "Unregistering…" : "Registering…";
  } else if (unregisterMode) {
    buttonLabel = "Unregister";
  }

  const handleClick = unregisterMode ? handleUnregister : handleRegister;

  return (
    <div style={{ width: "100%" }}>
      {registerBlocked ? (
        <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#b00020" }}>Sorry, this event is full.</p>
      ) : null}
      {!tokenPresent && !registerBlocked ? (
        <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#444" }}>Please log in to register</p>
      ) : null}
      {tokenPresent && !checkingRegistration && isRegistered ? (
        <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#444" }}>
          You have already registered for this event.
        </p>
      ) : null}
      <button type="button" onClick={handleClick} disabled={disableButton} style={{ width: "100%" }}>
        {buttonLabel}
      </button>
    </div>
  );
}
