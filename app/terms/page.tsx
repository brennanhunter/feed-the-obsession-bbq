import type { Metadata } from "next";
import LegalPage from "../components/LegalPage";
import { business } from "@/lib/business";
import { DELIVERY_AREA_LABEL, DELIVERY_MIN_CENTS } from "@/lib/delivery";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `The terms for ordering pickup and delivery from ${business.name} and using our website and messaging.`,
  alternates: { canonical: "/terms" },
};

const deliveryMin = `$${(DELIVERY_MIN_CENTS / 100).toFixed(0)}`;

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="November 21, 2026">
      <p>
        These terms apply when you use the {business.name} (&ldquo;FTO,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;)
        website, order from us online, or message us. By using them, you agree to these terms. Questions? Call us at{" "}
        <a href={business.phoneHref}>{business.phone}</a>.
      </p>

      <h2>Ordering</h2>
      <ul>
        <li>
          Menu items, prices and specials can change, and BBQ can sell out. If something you ordered runs out,
          we&rsquo;ll contact you and refund or swap it.
        </li>
        <li>Your order is placed once your payment goes through and you see your confirmation.</li>
        <li>Pickup and ready times are our best estimate; we smoke everything fresh, and busy days happen.</li>
        <li>Payments are processed by Square. Sales tax is added where required.</li>
      </ul>

      <h2>Delivery from our website</h2>
      <ul>
        <li>
          We deliver to {DELIVERY_AREA_LABEL}, with a {deliveryMin} food minimum. Some addresses may be too far or
          unavailable at busy times.
        </li>
        <li>
          Deliveries are made by independent drivers through Uber Direct. The delivery fee, our service fee and
          your driver tip are shown before you pay. 100% of the driver tip goes to your driver.
        </li>
        <li>
          Delivery times are estimates. Please make sure your address and phone number are right and someone can
          receive the order. If a driver can&rsquo;t reach you, they may leave your order at the door.
        </li>
        <li>If we can&rsquo;t get a driver for your order, we&rsquo;ll refund it in full.</li>
      </ul>

      <h2>If something&rsquo;s wrong</h2>
      <p>
        Call us at {business.phone} as soon as you can and we&rsquo;ll make it right. Orders placed through
        DoorDash or other apps follow that app&rsquo;s refund rules, but we still want to hear from you.
      </p>

      <h2>Allergies</h2>
      <p>
        Our kitchen and smokers handle common allergens, including wheat, dairy and eggs. We can&rsquo;t guarantee
        any item is allergen-free. If you have a food allergy, please call us before ordering.
      </p>

      <h2>Text and chat messages</h2>
      <p>
        If you message us (including through Google Search or Maps), you agree to receive replies about your
        question or order. Some replies may come from an automated assistant working for us; it can make mistakes,
        so please call us to confirm anything important, like allergies or large orders. Message frequency varies,
        and message and data rates may apply. Reply <strong>STOP</strong> to opt out or <strong>HELP</strong> for
        help. See our <a href="/privacy">Privacy Policy</a> for how we handle your information.
      </p>

      <h2>Our website</h2>
      <p>
        Our name, logo, photos and content belong to {business.name}. Please don&rsquo;t copy them without asking.
        We work to keep the site accurate and running, but it&rsquo;s provided &ldquo;as is,&rdquo; and to the
        extent the law allows we aren&rsquo;t liable for indirect losses from using it. Nothing here limits any
        rights you have under the law.
      </p>

      <h2>The legal stuff</h2>
      <p>
        These terms are governed by the laws of the State of Florida. We may update them from time to time; the
        version posted here, with its date, is the one that applies.
      </p>

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
