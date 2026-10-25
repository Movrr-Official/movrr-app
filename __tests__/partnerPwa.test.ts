import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { expect, it, vi } from "vitest";
import manifest from "@/app/manifest";
import QRCode from "qrcode";
import decode from "jsqr";
it("ships installable manifest assets at real advertised dimensions", () => {
  const m=manifest(); expect(m.display).toBe("standalone"); expect(m.start_url).toBe("/dashboard"); expect(m.scope).toBe("/");
  for(const size of [192,512]) { const png=readFileSync(`public/pwa/icon-${size}.png`); expect(png.readUInt32BE(16)).toBe(size); expect(png.readUInt32BE(20)).toBe(size); }
});
it("decodes the actual canonical opaque QR payload with the cross-browser decoder", () => {
  const token="0123456789abcdef".repeat(4), qr=QRCode.create(token), scale=5, margin=4, size=(qr.modules.size+margin*2)*scale;
  const pixels=new Uint8ClampedArray(size*size*4).fill(255);
  for(let y=0;y<qr.modules.size;y++)for(let x=0;x<qr.modules.size;x++)if(qr.modules.get(y,x))for(let dy=0;dy<scale;dy++)for(let dx=0;dx<scale;dx++) {const i=(((y+margin)*scale+dy)*size+(x+margin)*scale+dx)*4;pixels[i]=pixels[i+1]=pixels[i+2]=0;}
  expect(decode(pixels,size,size)?.data).toBe(token);
});
it("caches only a public offline page, never API reads or mutations", async () => {
  type WorkerEvent = { waitUntil?: (p: Promise<unknown>) => void; respondWith?: (p: Promise<unknown>) => void; request?: { method: string; mode: string; url: string } };
  const handlers: Record<string,(event: WorkerEvent)=>void>={}, add=vi.fn(), match=vi.fn(async()=>"OFFLINE"), fetch=vi.fn(async()=>"NETWORK"), deleteCache=vi.fn(), claim=vi.fn();
  runInNewContext(readFileSync("public/sw.js","utf8"),{self:{location:{origin:"https://workspace.invalid"},clients:{claim},addEventListener:(kind:string,fn:(event: WorkerEvent)=>void)=>{handlers[kind]=fn;}},caches:{open:async()=>({add}),keys:async()=>["other-app","movrr-partner-offline-old"],delete:deleteCache,match},fetch,URL,Response});
  let work:Promise<unknown>|undefined; const waitUntil=(p:Promise<unknown>)=>{work=p;};
  handlers.install({waitUntil});await work;expect(add).toHaveBeenCalledWith("/offline.html");
  handlers.activate({waitUntil});await work;expect(deleteCache).toHaveBeenCalledTimes(1);expect(deleteCache).toHaveBeenCalledWith("movrr-partner-offline-old");
  const respondWith=vi.fn((p)=>{work=p;});
  for(const [method,mode,url] of [["POST","navigate","https://workspace.invalid/dashboard/validate"],["GET","cors","https://workspace.invalid/api/private"],["GET","navigate","https://elsewhere.invalid/"]]) handlers.fetch({request:{method,mode,url},respondWith});
  expect(respondWith).not.toHaveBeenCalled();expect(fetch).not.toHaveBeenCalled();
  handlers.fetch({request:{method:"GET",mode:"navigate",url:"https://workspace.invalid/dashboard"},respondWith});await work;expect(match).not.toHaveBeenCalled();
  fetch.mockRejectedValue(new Error("offline"));handlers.fetch({request:{method:"GET",mode:"navigate",url:"https://workspace.invalid/dashboard"},respondWith});expect(await work).toBe("OFFLINE");
});
