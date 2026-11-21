import type { Metadata } from "next";
import LegalPage from "../components/LegalPage";
import { business } from "@/lib/business";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${business.name} collects, uses and protects your information when you order, message or visit our website.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="November 21, 2026">
      <p>
        {business.name} (&ldquo;FTO,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;) is a veteran-owned smokehouse at{" "}
        {business.address.full}. This policy explains what we collect when you order from us, message us or visit{" "}
        {business.url.replace("https://", "")}, and what we do with it. Short version: we use your info to get you
        your food, and we never sell it.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Order details:</strong> your name, phone number, email, what you ordered, your pickup time, any
          tip, and for delivery, your address and drop-off notes.
        </li>
        <li>
          <strong>Payment:</strong> card payments are processed by Square. We never see or store your full card
          number.
        </li>
        <li>
          <strong>Messages:</strong> if you text, chat or message us (including through Google Search or Maps,
          Facebook, or email), we receive your name or number and what you send.
        </li>
        <li>
          <strong>Catering and event requests:</strong> the contact and event details you give us in the form.
        </li>
        <li>
          <strong>Website basics:</strong> we use Vercel Web Analytics for simple, anonymous visit counts (no
          advertising cookies). Your browser saves your cart and checkout details on your own device so your next
          order is faster; you can clear them any time by clearing your browser data.
        </li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To make, hand off and deliver your order, and to contact you about it.</li>
        <li>To send your order confirmation and receipt, and occasionally a quick follow-up about your order.</li>
        <li>To answer your questions and messages.</li>
        <li>To run and improve our menu, website and service.</li>
      </ul>
      <p>We don&rsquo;t send marketing texts unless you ask for them.</p>

      <h2>Who we share it with</h2>
      <p>Only the services that help us fill your order:</p>
      <ul>
        <li>
          <strong>Square</strong> processes payments and manages our orders.
        </li>
        <li>
          <strong>Uber Direct</strong> delivers website delivery orders. Your driver gets your name, phone number,
          address, drop-off notes and order items, and Uber may text you delivery updates.
        </li>
        <li>
          <strong>Our email and website providers</strong> (Resend for order emails, Vercel for hosting).
        </li>
        <li>
          <strong>Google</strong>, if you message us through Google Search or Maps.
        </li>
      </ul>
      <p>
        If you order from us through DoorDash or another app, that app&rsquo;s own privacy policy applies to the
        information you give it. We may also share information if the law requires it.
      </p>
      <p>
        <strong>We never sell or rent your personal information.</strong> We do not share your mobile number or
        text-messaging consent with anyone for their marketing.
      </p>

      <h2>Text and chat messages</h2>
      <p>
        When you message us, we (or an automated assistant working for us) will reply about your question or order.
        Message frequency depends on the conversation. Message and data rates may apply. Reply <strong>STOP</strong>{" "}
        to stop receiving messages, or <strong>HELP</strong> for help, or call us at {business.phone}.
      </p>

      <h2>How long we keep it and how we protect it</h2>
      <p>
        We keep order and message records as long as we need them to run the business and meet tax and legal
        requirements. Payment and order systems are run by established providers with their own security
        safeguards. No method of storage or transmission is perfectly secure, but we take reasonable steps to
        protect your information.
      </p>

      <h2>Your choices</h2>
      <p>
        You can ask us what information we have about you, or ask us to correct or delete it, by emailing{" "}
        <a href={business.emailHref}>{business.email}</a> or calling {business.phone}.
      </p>

      <h2>Kids</h2>
      <p>Our website isn&rsquo;t meant for children under 13, and we don&rsquo;t knowingly collect their information.</p>

      <h2>Changes</h2>
      <p>If we change this policy, we&rsquo;ll post the new version here with a new date.</p>

      <h2>Contact us</h2>
      <p>
        {business.name}
        <br />
        {business.address.full}
        <br />
        <a href={business.phoneHref}>{business.phone}</a> &middot; <a href={business.emailHref}>{business.email}</a>
      </p>
    </LegalPage>
  );
}
