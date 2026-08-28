import { readFileSync } from "node:fs";
function need(v:boolean,m:string){if(!v)throw new Error(m);}
const backup=readFileSync("scripts/backup-db.sh","utf8"),restore=readFileSync("scripts/restore-db.sh","utf8");
need(backup.includes("umask 077")&&backup.includes("--format=custom")&&backup.includes("sha256sum"),"backup hardening missing");
need(!backup.includes("echo $DATABASE_URL")&&!backup.includes("echo \"$DATABASE_URL\""),"backup leaks database URL");
need(restore.includes("YES_RESTORE_ISOLATED_DB")&&restore.includes("RESTORE_DATABASE_URL")&&restore.includes("--clean --if-exists"),"restore confirmation/isolation guard missing");
need(!restore.includes('RESTORE_DATABASE_URL:-${DATABASE_URL}')&&!restore.includes('RESTORE_DATABASE_URL=${DATABASE_URL}'),"restore must not default to production DATABASE_URL");
need(restore.includes('RESTORE_DATABASE_URL" = "$DATABASE_URL'),"restore must refuse an explicit production-target match");
console.log("backup/restore source stress: PASS");
