"use client";

import { useState } from "react";

type Status = "idle" | "sending" | "success" | "error";

const field =
  "w-full p-3 rounded-lg bg-black/40 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-brand-primary";

export default function CateringForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    eventDate: "",
    guests: "",
    eventType: "",
    details: "",
    company: "", // honeypot
  });
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  const on = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/catering", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
        setError((await res.text()) || "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setError("Couldn't reach the server. Please call us.");
    }
  };

  if (status === "success") {
    return (
      <div className="max-w-xl mx-auto bg-brand-secondary rounded-2xl p-8 text-center border border-white/10">
        <p className="text-2xl font-display tracking-wider text-brand-primary mb-2">Got it! 🍖</p>
        <p className="text-white/80">
          Thanks — we&apos;ll be in touch shortly about your event. For anything urgent, call{" "}
          <a href="tel:812-205-0559" className="text-brand-primary font-semibold">812-205-0559</a>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="max-w-xl mx-auto text-left grid sm:grid-cols-2 gap-4">
      <input name="name" placeholder="Name*" value={form.name} onChange={on} required className={field} />
      <input name="phone" placeholder="Phone*" value={form.phone} onChange={on} required className={field} />
      <input type="email" name="email" placeholder="Email*" value={form.email} onChange={on} required className={`${field} sm:col-span-2`} />
      <input type="date" name="eventDate" value={form.eventDate} onChange={on} className={field} aria-label="Event date" />
      <input name="guests" placeholder="Approx. guests" value={form.guests} onChange={on} className={field} />
      <input name="eventType" placeholder="Event type (party, wedding, corporate…)" value={form.eventType} onChange={on} className={`${field} sm:col-span-2`} />
      <textarea name="details" placeholder="Tell us about your event" value={form.details} onChange={on} rows={4} className={`${field} sm:col-span-2 resize-none`} />

      {/* Honeypot */}
      <input name="company" value={form.company} onChange={on} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

      {status === "error" && <p className="sm:col-span-2 text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={status === "sending"}
        className="sm:col-span-2 py-3 rounded-full bg-brand-primary text-white font-bold hover:opacity-80 transition-all disabled:opacity-50"
      >
        {status === "sending" ? "Sending…" : "Request Catering Info"}
      </button>
    </form>
  );
}
