import { partnerText } from "@/lib/partnerLocale";
export function partnerLabel(value?: string | null, locale: "en" | "nl" = "en") {
  const labels: Record<string, string> = {
    collected: "Collected", delivered: "Delivered", dispatched: "Dispatched", failed: "Failed", processing: "Processing", created: "Created",
    qr_barcode: "QR voucher", instant_digital: "Digital voucher", physical_collection: "Collect in store",
    awaiting_collection: "Ready to scan", ready: "Preparing", reserved: "Reserved", validated: "Ready for handover",
    completed: "Collected", cancelled: "Cancelled", refunded: "Refunded", expired: "Expired", reversed: "Reversed",
    partner_operations_manager: "Operations manager",
  };
  const dutch: Record<string,string> = { collected: "Opgehaald", delivered: "Geleverd", dispatched: "Verzonden", failed: "Niet gelukt", processing: "In behandeling", created: "Aangemaakt", qr_barcode: "QR-voucher", instant_digital: "Digitale voucher", physical_collection: "Ophalen in de winkel", awaiting_collection: "Klaar om te scannen", ready: "In voorbereiding", reserved: "Gereserveerd", validated: "Klaar voor overdracht", completed: "Opgehaald", cancelled: "Geannuleerd", refunded: "Terugbetaald", expired: "Verlopen", reversed: "Teruggedraaid" };
  if (locale === "nl") return value ? dutch[value] ?? partnerText(locale, labels[value] ?? value.replaceAll("_", " ")) : "Wachten op een update";
  return value ? labels[value] ?? value.replaceAll("_", " ") : "Awaiting update";
}
