import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
vi.mock("@/lib/logger",()=>({logger:{error:vi.fn()}}));
import { AppSessionProvider } from "@/providers/SessionProvider";
import { RouteError } from "@/components/shared/RouteError";
import DashboardLoading from "@/app/dashboard/loading";
const session={authUserId:"actor",name:"Partner",email:"partner@isolated.invalid",role:"partner" as const,partnerLocale:"nl" as const};
it("keeps the Partner route failure localized without exposing server diagnostics",()=>{
 const html=renderToStaticMarkup(<AppSessionProvider value={session}><RouteError error={new Error("PRIVATE_DATABASE_DIAGNOSTICS")} reset={()=>{}}/></AppSessionProvider>);
 expect(html).toContain("Deze pagina kon niet worden geladen");expect(html).toContain("Opnieuw proberen");expect(html).not.toContain("PRIVATE_DATABASE_DIAGNOSTICS");
});
it("announces the Partner loading state in the selected workspace language",()=>{
 const html=renderToStaticMarkup(<AppSessionProvider value={session}><DashboardLoading/></AppSessionProvider>);
 expect(html).toContain('aria-busy="true"');expect(html).toContain("Je werkruimte laden");
});
