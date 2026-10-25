export type VoucherOutcome = "validated" | "invalid" | "unavailable" | "restricted" | "retry";
export type VoucherValidationState = { outcome?: VoucherOutcome; fulfilmentId?: string };

export const voucherCopy = {
  en: {
    title: "Scan a reward", description: "Scan the rider’s QR code, then confirm the handover.",
    start: "Start camera", stop: "Stop camera", scanning: "Hold the QR code inside the frame.",
    cameraError: "Camera unavailable. Allow camera access in your browser settings or enter the code below.",
    manual: "Enter a code instead", code: "Reward code", review: "QR code captured. Check that the rider is ready to collect.",
    submit: "Validate reward", pending: "Checking reward…", offline: "You’re offline. Reconnect to validate or confirm a reward.",
    restricted: "Your role cannot validate rewards. Ask your manager for access.",
    validated: "Reward validated. Confirm collection only after handing it to the rider.",
    invalid: "This code could not be recognised. Ask the rider to open their reward again.",
    unavailable: "This reward is expired, cancelled, refunded or already used. Do not hand it over. Check Collections for a previously validated reward.",
    retry: "We couldn’t confirm the result. Retry this check using the same code, or check Collections before handing over the reward.",
    next: "Review collection", another: "Scan another reward", ready: "Code ready for validation",
  },
  nl: {
    title: "Scan een beloning", description: "Scan de QR-code van de fietser en bevestig daarna de overdracht.",
    start: "Camera starten", stop: "Camera stoppen", scanning: "Houd de QR-code binnen het kader.",
    cameraError: "Camera niet beschikbaar. Geef cameratoegang in je browserinstellingen of voer de code hieronder in.",
    manual: "Voer een code in", code: "Beloningscode", review: "QR-code vastgelegd. Controleer of de fietser klaar is om de beloning op te halen.",
    submit: "Beloning controleren", pending: "Beloning controleren…", offline: "Je bent offline. Maak verbinding om een beloning te controleren of te bevestigen.",
    restricted: "Je rol kan geen beloningen controleren. Vraag je manager om toegang.",
    validated: "Beloning gecontroleerd. Bevestig het ophalen pas nadat je de beloning hebt overhandigd.",
    invalid: "Deze code wordt niet herkend. Vraag de fietser om de beloning opnieuw te openen.",
    unavailable: "Deze beloning is verlopen, geannuleerd, terugbetaald of al gebruikt. Niet overhandigen. Kijk bij Ophalen of de beloning al gecontroleerd is.",
    retry: "Het resultaat kon niet worden bevestigd. Probeer dezelfde code opnieuw of controleer Ophalen voordat je de beloning overhandigt.",
    next: "Ophalen bekijken", another: "Andere beloning scannen", ready: "Code klaar voor controle",
  },
} as const;
