// Real next-token data for the start-page demo, the sampler and "One word at a time".
// Measured once with scripts/next-token-probs.py; the numbers live in src/data/next-token-probs.json.
import D from '../data/next-token-probs.json';
const of=id=>D.prompts.find(x=>x.id===id);
// p: prompt · toks: the model's own split of the prompt · c: its most likely next tokens as [text, logit, probability]
const ex=(id,l)=>{const d=of(id);return{l,p:d.prompt,toks:d.prompt_tokens,c:d.top.slice(0,8).map(t=>[t.token.trim()||t.token,t.logit,t.p])}};
export const MODEL={name:D.model.split('/').pop(),vocab:D.vocabulary};
export const P=[ex('firewall','Firewall'),ex('python','Python'),ex('australia','Capital')];
// chapter 1: three possible first words with their real probability, and what the model writes after each
const au=of('australia');
export const NW={start:au.prompt,others:au.top.filter(t=>!au.candidates.some(c=>c.word===t.token.trim())).slice(0,2).map(t=>[t.token.trim(),t.p]),
 opts:au.candidates.map(c=>({word:c.word,p:c.first_token_p,cont:(au.forced.find(f=>f.first_word===c.word)||{}).continuation||''}))};
