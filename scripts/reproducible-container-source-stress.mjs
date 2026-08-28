import {readFileSync} from "node:fs";
function need(v,m){if(!v)throw new Error(m)}
const web=readFileSync("docker/web.Dockerfile","utf8"),worker=readFileSync("docker/worker.Dockerfile","utf8"),compose=readFileSync("docker-compose.yml","utf8"),freeze=readFileSync("scripts/freeze-dependencies.sh","utf8");
for(const [name,text] of [["web",web],["worker",worker]]){
  need(text.includes("node:22.22.3-bookworm-slim@sha256:e21fc383b50d5347dc7a9f1cae45b8f4e2f0d39f7ade28e4eef7d2934522b752"),`${name} Node image not digest-pinned`);
  need(text.includes("COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./"),`${name} does not require lockfile`);
  need(text.includes("pnpm install --frozen-lockfile")&&!text.includes("--no-frozen-lockfile"),`${name} install is not frozen`);
}
need(compose.includes("cloudflare/cloudflared:2026.8.2@sha256:0aa26e284f05e6c77ae375b8c9c11d9eb6a448fb7bcd8d40f31cb6176189eb38"),"cloudflared image/version not pinned");
need(freeze.includes("--lockfile-only")&&freeze.includes("--frozen-lockfile")&&freeze.includes("pnpm-lock.yaml.sha256"),"dependency freeze helper incomplete");
console.log("reproducible container source stress: PASS");
