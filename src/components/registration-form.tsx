"use client";

import { useActionState } from "react";
import { registerParticipant } from "@/server/actions/register";

interface RegistrationFormProps {
  eventId: string;
  defaultName: string;
  defaultEmail: string;
}

export function RegistrationForm({ eventId, defaultName, defaultEmail }: RegistrationFormProps) {
  const [state, formAction, pending] = useActionState(registerParticipant, null);
  const fieldErrors = state?.success === false ? state.fieldErrors : undefined;

  return (
    <form action={formAction}>
      <input type="hidden" name="eventId" value={eventId} />

      <div className="form-group">
        <label className="form-label" htmlFor="reg-name">Nama</label>
        <input
          id="reg-name" name="name" className="form-input" placeholder="Nama lengkap"
          defaultValue={defaultName} required maxLength={100}
          aria-describedby={fieldErrors?.name ? "reg-name-error" : undefined}
        />
        {fieldErrors?.name && <p id="reg-name-error" role="alert" className="event-card__stock">{fieldErrors.name}</p>}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="reg-email">Email</label>
        <input
          id="reg-email" name="email" type="email" className="form-input" placeholder="email@contoh.com"
          defaultValue={defaultEmail} required maxLength={200}
          aria-describedby={fieldErrors?.email ? "reg-email-error" : undefined}
        />
        {fieldErrors?.email && <p id="reg-email-error" role="alert" className="event-card__stock">{fieldErrors.email}</p>}
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
