# Phase-1 Free HA Failover Test Plan

| Test | Action | Expected |
|---|---|---|
| Pi process crash | stop `cardelume-web` on Pi | Pi watchdog stops Pi tunnel; VPS continues |
| Pi host down | shutdown Pi | VPS continues |
| Home WAN down | disconnect Pi WAN path | VPS continues |
| VPS app crash | stop VPS web | VPS watchdog removes tunnel; Pi continues |
| VPS host down | shutdown VPS | Pi continues |
| WireGuard down | stop WG if installed | public site unaffected |
| Pi worker down | stop Pi worker | VPS worker can process durable jobs |
| VPS worker down | stop VPS worker | Pi worker continues |
| Both origins healthy | repeated requests | correctness independent of origin |
| Bad deploy one node | make `/health/live` fail | other node serves |

## Mutation safety

Run generation/checkout during failover.

Confirm:

- one idempotency key creates one logical operation
- no duplicate generation job
- no duplicate payment event
- exactly one final entitlement
- deterministic final object key

Record timestamps, HTTP statuses, node logs, tunnel logs and queue state.
