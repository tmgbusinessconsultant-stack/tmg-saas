import type { Metadata } from "next";
import BookingPage from "../booking/page";

export const metadata: Metadata = {
  title: "Request a Consulting Quote",
  description: "Tell TMG Business Consulting about your project and request a tailored proposal.",
  alternates: { canonical: "/quote" },
};

export default function QuotePage() {
  return <BookingPage source="quote" />;
}
