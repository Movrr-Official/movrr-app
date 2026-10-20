"use server";
import { requireProductSession } from "@/lib/appUser";
import QRCode from "qrcode";
import { getRewardCredential } from "@/lib/platform/riderPlatform";
export async function revealRewardCredential(_previous: unknown, form: FormData) {
  try {
    const session = await requireProductSession(["rider"]);
    if (form.get("accountId") !== session.appUser.id) throw new Error("Account changed");
    const credential = await getRewardCredential(String(form.get("fulfilmentId") ?? ""));
    return {
      accountId: session.appUser.id,
      fulfilmentId: String(form.get("fulfilmentId")),
      credential: {
        ...credential,
        qrDataUrl:
          credential.tokenType === "qr"
            ? await QRCode.toDataURL(credential.displayHint, { width: 256, margin: 2 })
            : null,
      },
      error: null,
    };
  } catch {
    return {
      credential: null,
      error: "Reward credential unavailable. Refresh the reward and try again.",
    };
  }
}
