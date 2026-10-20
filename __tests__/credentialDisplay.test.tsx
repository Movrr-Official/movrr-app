// @vitest-environment jsdom
import React, {act} from "react";
import {createRoot,type Root} from "react-dom/client";
import {beforeEach,afterEach,expect,it,vi} from "vitest";
const state=vi.hoisted(()=>({response:{accountId:"owner",fulfilmentId:"fulfillment",error:null,credential:{displayHint:"PRIVATE-ISSUED-CODE",tokenType:"voucher",qrDataUrl:null,expiresAt:""}}}));
vi.mock("react",async original=>({...await original<typeof import("react")>(),useActionState:()=>[state.response,()=>{},false]}));
vi.mock("@/app/actions/rewardCredential",()=>({revealRewardCredential:vi.fn()}));
import {RewardCredential} from "@/components/rider/RewardCredential";
let root:Root,host:HTMLDivElement;
beforeEach(()=>{vi.useFakeTimers();vi.setSystemTime(new Date('2026-10-20T00:00:00Z'));Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});state.response.credential.expiresAt=new Date(Date.now()+2147483647+60000).toISOString();host=document.createElement('div');document.body.append(host);root=createRoot(host)});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.useRealTimers()});
it('does not expire a long-lived voucher at the browser timer limit',async()=>{await act(async()=>root.render(<RewardCredential accountId="owner" fulfilmentId="fulfillment"/>));expect(host.textContent).toContain('PRIVATE-ISSUED-CODE');await act(async()=>vi.advanceTimersByTime(2147483647));expect(host.textContent).toContain('PRIVATE-ISSUED-CODE');await act(async()=>vi.advanceTimersByTime(60000));expect(host.textContent).not.toContain('PRIVATE-ISSUED-CODE');expect(host.textContent).toContain('Reward expired')});
it('hides the previous account or fulfillment credential immediately on identity change',async()=>{await act(async()=>root.render(<RewardCredential accountId="owner" fulfilmentId="fulfillment"/>));await act(async()=>root.render(<RewardCredential accountId="another-owner" fulfilmentId="fulfillment"/>));expect(host.textContent).not.toContain('PRIVATE-ISSUED-CODE');await act(async()=>root.render(<RewardCredential accountId="owner" fulfilmentId="different-fulfillment"/>));expect(host.textContent).not.toContain('PRIVATE-ISSUED-CODE')});
