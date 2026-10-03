"use client";

import { useActionState } from "react";
import { registerParticipant } from "@/server/actions/register";

interface RegistrationFormProps {
  eventId: string;
  attendeeName: string;
  attendeeEmail: string;
}

export function RegistrationForm({ eventId, attendeeName, attendeeEmail }: RegistrationFormProps) {
  const [state, formAction, pending] = useActionState(registerParticipant, null);
  const fieldErrors = state?.success === false ? state.fieldErrors : undefined;

  return (
    <form action={formAction}>
      <input type="hidden" name="eventId" value={eventId} />

      <div className="form-group">
        <span className="form-label">Pemeserta</span>
        <div className="reg-identity">
          <p className="reg-identity__name">{attendeeName}</p>
          <p className="reg-identity__email">{attendeeEmail}</p>
        </div>
        <p className="reg-identity__note">
          Data diambil dari akun Anda. Tiket dan email konfirmasi mengikuti data ini.
        </p>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="reg-phone">Nomor Telepon (opsional)</label>
        <input
          id="reg-phone" name="phone" type="tel" className="form-input" placeholder="08xxxxxxxxxx"
          maxLength={20}
          aria-describedby={fieldErrors?.phone ? "reg-phone-error" : undefined}
        />
        {fieldErrors?.phone && <p id="reg-phone-error" role="alert" className="event-card__stock">{fieldErrors.phone}</p>}
      </div>

      {state?.success === false && state.error && (
        <p role="alert" className="event-card__stock" style={{ marginBottom: "var(--landing-space-md)" }}>
          {state.error}
        </p>
      )}

      <button type="submit" className="btn btn--primary btn--large btn--block" disabled={pending}>
        {pending ? "Mendaftarkan..." : "Daftar"}
      </button>
    </form>
  );
}