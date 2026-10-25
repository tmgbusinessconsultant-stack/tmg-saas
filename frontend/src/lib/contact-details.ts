// src/lib/contact-details.ts - TMG Central Contact Source

export const contactEmail =
    process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "hello@tmgbusinessconsulting.com";

export const whatsappNumber =
    (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "97470454450").replace(/\D/g, "").trim() ||
    "97470454450";

export const phoneNumber =
    process.env.NEXT_PUBLIC_PHONE_NUMBER?.trim() || whatsappNumber;

export const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    "Hello TMG, I'm interested in your business services."
)}`;

export const contactDetails = {
    email: contactEmail,
    whatsapp: whatsappNumber,
    phone: phoneNumber,
    whatsappLink,
    location: "Doha, Qatar",
    brand: "TMG Business Consulting",
} as const;

export const getContactEmail = () => contactEmail;
export const getWhatsAppNumber = () => whatsappNumber;
export const getPhoneNumber = () => phoneNumber;
export const getContactDetails = () => contactDetails;