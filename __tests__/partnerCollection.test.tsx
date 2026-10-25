import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
vi.mock("@/lib/partnerLocaleServer",()=>({getPartnerLocale:async()=>"en"}));
vi.mock("@/app/actions/partner",()=>({confirmCollectionAction:vi.fn(),cancelCollectionAction:vi.fn()}));
import { CollectionDetail } from "@/components/partner/CollectionDetail";
import { CollectionsTable } from "@/components/partner/CollectionsTable";
const item={id:"00000000-0000-4000-8000-000000000001",version:2,state:"validated",rewardTitle:"Coffee",riderId:"PRIVATE-RIDER",catalogItemId:"PRIVATE-CATALOG",fulfilmentType:"qr_barcode"};
it("requires a validated voucher, capability and explicit handover acknowledgement",()=>{
  const html=renderToStaticMarkup(<CollectionDetail item={item} canConfirm operationId="stable"/>);
  expect(html).toContain('type="checkbox" required');expect(html).toContain("I have handed this reward to the rider");expect(html).toContain('value="2"');expect(html).toContain('value="stable:collect"');
  for(const state of ["ready","completed","cancelled","refunded"]) expect(renderToStaticMarkup(<CollectionDetail item={{...item,state}} canConfirm canCancel operationId="stable"/>)).not.toContain('name="reason" value="collection_confirmed"');
  expect(renderToStaticMarkup(<CollectionDetail item={item} canConfirm={false} operationId="stable"/>)).not.toContain('type="checkbox"');
});
it("keeps internal identifiers out of visible merchant copy",async()=>{
  const html=renderToStaticMarkup(await CollectionsTable({items:[item]}));expect(html).toContain("Coffee");expect(html).toContain("Ready for handover");expect(html).not.toContain("PRIVATE-RIDER");expect(html).not.toContain("PRIVATE-CATALOG");
});
