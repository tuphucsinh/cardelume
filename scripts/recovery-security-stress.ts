import { strict as assert } from "node:assert";
import { createHash, randomBytes } from "node:crypto";

function secret(){return randomBytes(32).toString("base64url");}
function hash(value:string){return createHash("sha256").update(value).digest("hex");}
function cookieName(id:string){return `cardelume_recovery_${hash(id).slice(0,14)}`;}

const seen=new Set<string>();
for(let i=0;i<2_000;i++){
  const s=secret();
  assert.match(s,/^[A-Za-z0-9_-]{40,100}$/);
  assert.equal(hash(s).length,64);
  assert(!seen.has(s),"recovery secret collision");
  seen.add(s);
}

const a="550e8400-e29b-41d4-a716-446655440000";
const b="550e8400-e29b-41d4-a716-446655440001";
assert.notEqual(cookieName(a),cookieName(b));
assert.match(cookieName(a),/^cardelume_recovery_[a-f0-9]{14}$/);

console.log(JSON.stringify({ok:true,secrets:seen.size,cookieA:cookieName(a)}));
