import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {beforeEach,expect,it,vi} from "vitest";
const {fetcher}=vi.hoisted(()=>({fetcher:vi.fn()}));
vi.mock("@/lib/appUser",()=>({requirePartnerSession:vi.fn(async()=>({partnerContext:{capabilities:["fulfilment.cancel","fulfilment.confirm"]}}))}));
vi.mock("@/lib/platform/client",()=>({platformFetch:fetcher,createCorrelationId:()=>"unused"}));
import {cancelPartnerFulfilment,confirmPartnerCollection} from "@/services/partner";
import {capabilitiesForMembershipRole} from "@/lib/platform/capabilities";
import {RewardFinancialSummary} from "@/components/rider/RewardFinancialSummary";
beforeEach(()=>{vi.clearAllMocks();fetcher.mockResolvedValue({});});
it("sends current version, explicit rider reason and stable cancellation identity to Platform",async()=>{
 await cancelPartnerFulfilment("reward",3,"Product unavailable","stable-operation");
 expect(fetcher).toHaveBeenCalledWith("/fulfilment/reward/cancel",{method:"POST",idempotencyKey:"stable-operation",body:{expectedVersion:3,reason:"Product unavailable",riderReason:"Product unavailable"}});
 await confirmPartnerCollection("reward",4,"collection_confirmed","stable-collection");
 expect(fetcher).toHaveBeenLastCalledWith("/partners/collections/confirm",{method:"POST",idempotencyKey:"stable-collection",body:{fulfilmentId:"reward",expectedVersion:4,reason:"collection_confirmed"}});
});
it.each([undefined,NaN,-1])("fails closed on missing or invalid collection version %s",async version=>{
 await expect(confirmPartnerCollection("reward",version as number,"collection_confirmed","operation")).rejects.toThrow("Current version");expect(fetcher).not.toHaveBeenCalled();
});
it("mirrors cancellation/refund capabilities without extending staff or viewer authority",()=>{
 for(const role of ["owner","manager","partner_operations_manager"])expect(capabilitiesForMembershipRole(role)).toContain("fulfilment.cancel");
 for(const role of ["staff","viewer"])expect(capabilitiesForMembershipRole(role)).not.toContain("fulfilment.cancel");
});
const financial={originalPointsCharged:400,pointsRefunded:0,reservationReleased:400,outstandingRefund:400,netPointsSpent:400,cancellationActor:"admin" as const,cancellationReason:null,reconciliationRequired:true};
it("shows outstanding points and Admin attribution without a false refunded claim",()=>{
 const html=renderToStaticMarkup(<RewardFinancialSummary financial={financial}/>);expect(html).toContain("400 MOVRR Points refund outstanding");expect(html).toContain("Cancelled by MOVRR");expect(html).not.toContain("400 MOVRR Points refunded");
});
it("renders confirmed refund and original charge in both product languages",()=>{
 const done={...financial,pointsRefunded:400,outstandingRefund:0,netPointsSpent:0,reconciliationRequired:false};
 expect(renderToStaticMarkup(<RewardFinancialSummary financial={done}/>)).toContain("400 MOVRR Points refunded");
 expect(renderToStaticMarkup(<RewardFinancialSummary financial={done} locale="nl"/>)).toContain("400 MOVRR Punten terugbetaald");
});
