// The three example prompts of the start-page demo, with illustrative next-token scores (logits).
// Shared by HeroPipeline.astro (which tokenizes them at build time) and demos.js.
export const P=[
 {l:"Firewall",p:"The firewall blocked the",c:[["connection",3.1],["request",2.8],["traffic",2.6],["attack",2.1],["port",1.7],["IP",1.5],["user",1.0],["banana",-2.5]]},
 {l:"Python",p:"for i in range(",c:[["len",3.4],["n",3.0],["10",2.4],["0",2.2],["1",1.9],["self",0.9],["x",0.8],["banana",-3]]},
 {l:"Deutsch",p:"Die Hauptstadt von Deutschland ist",c:[["Berlin",5.0],["die",1.8],["eine",1.4],["seit",1.0],["Bonn",0.8],["nicht",0.6],["München",0.2],["Banane",-4]]}
];
