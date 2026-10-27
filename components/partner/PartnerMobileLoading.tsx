import { Skeleton } from "@/components/ui/skeleton";
import { partnerText, type PartnerLocale } from "@/lib/partnerLocale";

export type PartnerLoadingScreen = "home" | "activity" | "scan" | "rewards" | "account" | "inventory" | "team" | "settings" | "performance" | "notifications" | "reward-create" | "reward-edit" | "collection";
const screens: Record<PartnerLoadingScreen, { title: string; loading: string; eyebrow?: string; description?: string }> = {
  home: { title: "Welcome back", eyebrow: "Home", description: "A smooth handover starts with a scan.", loading: "Loading your workspace" },
  activity: { title: "Activity", eyebrow: "Collections", description: "Every handover, in one place.", loading: "Loading activity" },
  scan: { title: "Scan a reward", description: "Check a rider reward securely before handover.", loading: "Preparing scanner" },
  rewards: { title: "Rewards", eyebrow: "Your offering", loading: "Loading rewards" },
  account: { title: "Account", eyebrow: "Workspace and preferences", loading: "Loading account" },
  inventory: { title: "Voucher inventory", description: "Manage the voucher codes available for your rewards.", loading: "Loading inventory" },
  team: { title: "Team", description: "Invite your team and manage their access.", loading: "Loading team" },
  settings: { title: "Settings", description: "Your organisation and workspace access.", loading: "Loading settings" },
  performance: { title: "Activity", description: "Track reward progress and customer collections.", loading: "Loading performance" },
  notifications: { title: "Notifications", description: "Partner workspace notifications.", loading: "Loading notifications" },
  "reward-create": { title: "Create reward", description: "Prepare a reward for your customers.", loading: "Loading reward details" },
  "reward-edit": { title: "Edit reward", description: "Review and update your reward.", loading: "Loading reward details" },
  collection: { title: "Reward collection", loading: "Loading collection details" },
};
function Line({ wide = false }: { wide?: boolean }) { return <Skeleton className={wide ? "partner-loading-line is-wide" : "partner-loading-line"} />; }
function Rows({ count = 3, kind = "settings" }: { count?: number; kind?: "settings" | "activity" | "notification" | "inventory" | "summary" }) {
  return <div className={`partner-loading-rows is-${kind}`} data-loading-part={kind}>{Array.from({ length: count }, (_, index) => <div className="partner-loading-row" key={index}><Skeleton className="partner-loading-symbol" /><div className="partner-loading-copy"><Line wide /><Line />{kind === "activity" && <Line />}</div><Skeleton className="partner-loading-trailing" /></div>)}</div>;
}
function Fields({ count = 3 }: { count?: number }) { return <div className="partner-loading-fields" data-loading-part="fields">{Array.from({ length: count }, (_, index) => <div key={index}><Line /><Skeleton className="partner-loading-field" /></div>)}</div>; }
function Details() { return <div className="partner-loading-details" data-loading-part="details">{[0, 1].map(index => <div key={index}><Line /><Line wide /></div>)}</div>; }
function Panel({ children }: { children: React.ReactNode }) { return <div className="partner-loading-panel">{children}</div>; }
/** Initial retrieval only. No data, actions, fake values, requests or artificial delay. */
export function PartnerMobileLoading({ screen, locale }: { screen: PartnerLoadingScreen; locale: PartnerLocale }) {
  const copy = screens[screen], t = (text: string) => partnerText(locale, text);
  return <section className={`partner-desk-screen partner-mobile-loading is-${screen}`} role="status" aria-live="polite" aria-busy="true" data-loading-screen={screen}>
    <span className="sr-only">{t(copy.loading)}</span>
    <div className="partner-screen-title" aria-hidden="true">{copy.eyebrow && <p>{t(copy.eyebrow)}</p>}<h1>{t(copy.title)}</h1>{copy.description && <span>{t(copy.description)}</span>}</div>
    <div className="partner-loading-body" aria-hidden="true">
      {screen === "home" && <><Skeleton className="partner-loading-primary" data-loading-part="scan-action" /><Panel><div className="partner-loading-section"><Line /><Line /></div><Rows count={2} /></Panel><Line /><div className="partner-desk-shortcuts">{[0, 1].map(index => <Panel key={index}><Skeleton className="partner-loading-symbol" /><Line /><Line /></Panel>)}</div></>}
      {screen === "activity" && <><div className="partner-loading-tabs" data-loading-part="tabs"><Line wide /><Line wide /></div><div className="partner-loading-section"><Line /><Skeleton className="partner-loading-count" /></div><Rows kind="activity" /></>}
      {screen === "scan" && <><div className="partner-loading-camera" data-loading-part="camera"><Skeleton className="partner-loading-camera-guide" /></div><Skeleton className="partner-loading-field" /><Line /></>}
      {screen === "rewards" && <><Skeleton className="partner-loading-field" data-loading-part="search" /><div className="partner-loading-section"><Line /><Skeleton className="partner-loading-count" /></div><div className="partner-catalog-list" data-loading-part="catalog">{[0, 1].map(index => <Panel key={index}><div className="partner-loading-product"><Skeleton className="partner-loading-product-image" /><div className="partner-loading-copy"><Line wide /><Skeleton className="partner-loading-chip" /><Line wide /><Line /><div className="partner-loading-product-values"><div><Line /><Line /></div><div><Line /><Line /></div></div></div></div></Panel>)}</div></>}
      {screen === "account" && <><div className="partner-account-person"><Skeleton className="partner-loading-avatar" /><div className="partner-loading-copy"><Line /><Line wide /></div></div><div><Line /><Rows count={4} /></div><div><Line /><Rows count={2} /></div></>}
      {screen === "inventory" && <><Panel><Line /><Rows kind="inventory" count={2} /></Panel><Panel><Line /><Fields count={1} /><Skeleton className="partner-loading-textarea" /><Skeleton className="partner-loading-field" /></Panel></>}
      {screen === "team" && <><Panel><Rows count={3} /></Panel><Panel><Line /><Fields count={2} /><Skeleton className="partner-loading-field" /></Panel></>}
      {screen === "settings" && <><Panel><Line /><Rows kind="summary" count={2} /><Line /></Panel><Panel><Line /><Details /><Line /></Panel></>}
      {screen === "performance" && <Panel><Line /><Line wide /><Rows kind="summary" count={3} /></Panel>}
      {screen === "notifications" && <><Panel><Line wide /><Line wide /><div className="partner-loading-preference"><Skeleton className="partner-loading-check" /><Line wide /></div><Skeleton className="partner-loading-field" /><Skeleton className="partner-loading-field" /></Panel><Panel><Line /><Rows kind="notification" /></Panel></>}
      {(screen === "reward-create" || screen === "reward-edit") && <Panel><Line /><Fields count={2} /><Skeleton className="partner-loading-textarea" /><Fields count={3} /></Panel>}
      {screen === "collection" && <Panel><Line wide /><Line wide /><Skeleton className="partner-loading-chip" /><Line /><Line /><Details /></Panel>}
      
    </div>
  </section>;
}
