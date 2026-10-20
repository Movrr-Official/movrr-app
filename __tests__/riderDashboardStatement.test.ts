import {beforeEach,expect,it,vi} from "vitest";
const state=vi.hoisted(()=>({guard:vi.fn(),statement:vi.fn(),campaigns:vi.fn(),rides:vi.fn(),notifications:vi.fn(),preferences:vi.fn()}));
vi.mock("@/lib/env",()=>({SUPPORT_EMAIL:"support@isolated.test"}));
vi.mock("@/lib/appUser",()=>({requireProductSession:state.guard}));
vi.mock("@/lib/platform/riderPlatform",()=>({getWalletStatement:state.statement}));
vi.mock("@/lib/platform/campaignPlatform",()=>({listRiderCampaigns:state.campaigns}));
vi.mock("@/lib/platform/riderSelfService",()=>({listRideSummaries:state.rides}));
vi.mock("@/lib/notifications",()=>({listUserNotifications:state.notifications,getUserNotificationPreferences:state.preferences}));
vi.mock("@/lib/supabase-server",()=>({createSupabaseServerClient:async()=>({from:()=>{const q={select:()=>q,eq:()=>q,order:()=>q,range:async()=>({data:[],error:null})};return q}})}));
import {getRiderDashboardData, getRiderRewardsData, getRiderSettingsData, getRiderNotificationsData, getRiderRoutesData} from "@/services/rider";
beforeEach(()=>{state.campaigns.mockReset().mockResolvedValue([]);state.rides.mockReset().mockResolvedValue({summaries:[]});state.notifications.mockReset().mockResolvedValue([]);state.preferences.mockReset().mockResolvedValue(true);});
beforeEach(()=>{state.guard.mockReset().mockResolvedValue({appUser:{id:'owner',email:'owner@isolated.test',languagePreference:'en-US'},authUser:{},riderProfile:{id:'rider'}});state.statement.mockReset().mockResolvedValue({balance:{pointsBalance:90,lifetimePointsEarned:200},entries:[['route',100],['route',20],['route',-5],['other',30],['other',-7],['redemption',-50],['refund',50],['adjustment',-48]].map(([category,points],index)=>({id:String(index),category,points,description:'Recorded activity',createdAt:'2026-10-20T00:00:00Z'}))})});
it('reconciles the signed statement breakdown including bonuses, other credits and earning reversals',async()=>{const d=await getRiderDashboardData();expect(d.pointsBalance).toBe(90);expect(d.lifetimePointsEarned).toBe(200);expect(d.rewardsSummary).toMatchObject({awardedPoints:150,redeemedPoints:50,adjustmentPoints:-10});expect(d.rewardsSummary.awardedPoints-d.rewardsSummary.redeemedPoints+d.rewardsSummary.adjustmentPoints).toBe(d.pointsBalance);expect(d.rewards[2].type).toBe('adjusted');expect(d.rewards[4].type).toBe('adjusted');expect(d.currentCompliance).toBeNull()});
it('does not fabricate a rider identity or wallet when onboarding has no profile',async()=>{state.guard.mockResolvedValue({appUser:{},riderProfile:null});await expect(getRiderDashboardData()).rejects.toThrow('onboarding');expect(state.statement).not.toHaveBeenCalled()});
it('stops a restricted session before reading financial data',async()=>{state.guard.mockRejectedValue(new Error('restricted'));await expect(getRiderDashboardData()).rejects.toThrow('restricted');expect(state.statement).not.toHaveBeenCalled()});
it('loads real profile and inbox independently of an unavailable wallet',async()=>{
  state.statement.mockRejectedValue(new Error('wallet unavailable'));
  expect(await getRiderSettingsData()).toMatchObject({profile:{email:'owner@isolated.test',languagePreference:'en-US'},preferences:{productNotifications:true}});
  expect(await getRiderNotificationsData()).toMatchObject({notifications:[],preferences:{productNotifications:true}});
  expect(await getRiderRoutesData()).toEqual({routes:[],activeRoutes:0,currentCompliance:null,lastMobileSyncAt:null});
  expect(state.statement).not.toHaveBeenCalled();
});
it('authorizes settings and inbox before private reads',async()=>{
  state.guard.mockRejectedValue(new Error('restricted'));
  await expect(getRiderSettingsData()).rejects.toThrow('restricted');
  await expect(getRiderNotificationsData()).rejects.toThrow('restricted');
});
it('does not request notifications or preferences for the overview',async()=>{
  state.notifications.mockRejectedValue(new Error('inbox offline'));
  state.preferences.mockRejectedValue(new Error('preferences offline'));
  expect((await getRiderDashboardData()).pointsBalance).toBe(90);
  expect(state.notifications).not.toHaveBeenCalled();
  expect(state.preferences).not.toHaveBeenCalled();
});
it('loads the financial page without campaign, ride or inbox dependencies and preserves signed totals',async()=>{
  state.campaigns.mockRejectedValue(new Error('campaigns offline'));
  state.rides.mockRejectedValue(new Error('rides offline'));
  const data=await getRiderRewardsData();
  expect(data.rewardsSummary).toMatchObject({availablePoints:90,awardedPoints:150,redeemedPoints:50,adjustmentPoints:-10});
  expect(state.statement).toHaveBeenCalledOnce();
  expect(state.campaigns).not.toHaveBeenCalled();
  expect(state.rides).not.toHaveBeenCalled();
  expect(state.notifications).not.toHaveBeenCalled();
  state.guard.mockRejectedValue(new Error('restricted'));
  await expect(getRiderRewardsData()).rejects.toThrow('restricted');
  state.guard.mockResolvedValue({riderProfile:{id:'rider'}});
  state.statement.mockRejectedValue(new Error('Wallet unavailable'));
  await expect(getRiderRewardsData()).rejects.toThrow('Wallet unavailable');
});
