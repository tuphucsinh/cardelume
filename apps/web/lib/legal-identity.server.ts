import "server-only";

export function legalIdentity(){
  return{
    name:(process.env.LEGAL_ENTITY_NAME??"CardeLume").trim(),
    email:(process.env.LEGAL_CONTACT_EMAIL??"").trim(),
    address:(process.env.LEGAL_ENTITY_ADDRESS??"").trim(),
    effectiveDate:(process.env.LEGAL_EFFECTIVE_DATE??"2026-09-03").trim()
  };
}
