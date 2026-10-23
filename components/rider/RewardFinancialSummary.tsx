type Financial = {
 originalPointsCharged:number|null;pointsRefunded:number|null;reservationReleased:number;
 outstandingRefund:number|null;netPointsSpent:number|null;reconciliationRequired:boolean;
 cancellationActor:"admin"|"merchant"|"system"|null;cancellationReason:string|null;
};
export function RewardFinancialSummary({financial:f,locale="en"}:{financial?:Financial;locale?:"en"|"nl"}) {
 if(!f)return <p className="text-sm text-muted-foreground">{locale==="nl"?"Financiële status niet beschikbaar":"Financial state unavailable"}</p>;
 const nl=locale==="nl";const lines:string[]=[];
 if(f.cancellationActor)lines.push(nl?(f.cancellationActor==="merchant"?"Geannuleerd door de aanbieder":f.cancellationActor==="admin"?"Geannuleerd door MOVRR":"Geannuleerd"):(f.cancellationActor==="merchant"?"Cancelled by merchant":f.cancellationActor==="admin"?"Cancelled by MOVRR":"Cancelled"));
 if(f.originalPointsCharged!=null)lines.push(`${f.originalPointsCharged} MOVRR ${nl?"Punten oorspronkelijk afgeschreven":"Points originally charged"}`);
 if(f.pointsRefunded!=null && f.pointsRefunded>0)lines.push(`${f.pointsRefunded} MOVRR ${nl?"Punten terugbetaald":"Points refunded"}`);
 if(f.reservationReleased>0)lines.push(`${f.reservationReleased} ${nl?"gereserveerde MOVRR Punten vrijgegeven":"reserved MOVRR Points released"}`);
 if(f.outstandingRefund!=null&&f.outstandingRefund>0)lines.push(nl?`Terugbetaling van ${f.outstandingRefund} MOVRR Punten staat open`:`${f.outstandingRefund} MOVRR Points refund outstanding`);
 if(f.netPointsSpent!=null)lines.push(`${f.netPointsSpent} MOVRR ${nl?"Punten netto besteed":"Points net spent"}`);
 if(f.reconciliationRequired)lines.push(nl?"Financiële afstemming vereist":"Financial reconciliation required");
 if(f.cancellationReason)lines.push(f.cancellationReason);
 else if(f.cancellationActor)lines.push(nl?"Er is geen annuleringsreden voor de fietser vastgelegd.":"No rider-facing cancellation reason was recorded.");
 return <div className="space-y-1 text-sm text-muted-foreground">{lines.map((line,i)=><p key={i}>{line}</p>)}</div>;
}
