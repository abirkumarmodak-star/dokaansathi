# Purulia Dhaba Deployment and Migration Runbook

**Status:** Preparation checklist. This is not approval to run a migration or launch production.

This runbook covers the single-restaurant Purulia Dhaba deployment using the existing DokaanSathi application. It does not authorize use of the Jana Food Hub production database, a multi-restaurant deployment, or a downgrade of the database schema.

## 1. Go/no-go evidence

Do not schedule the migration until the deployment owner has collected and approved every item in this section. Keep evidence in the approved operational record; do not paste secrets, connection strings, tokens, or customer data into this repository.

### Database identity and separation

- [ ] Record the Purulia MySQL provider, account/project, region, instance/cluster identifier, and a non-secret host identity supplied through the provider console or DBA. Confirm it matches the intended Purulia environment.
- [ ] Separately identify the Jana Food Hub production MySQL instance and schema through its owner/DBA. Compare provider instance identity and schema identity; a schema name alone does not prove which server is being used.
- [ ] Confirm Purulia uses the dedicated schema `purulia_dhaba_db` and that Jana's production schema is a different schema. Prefer a separate MySQL instance. If sharing an instance, document the isolation decision and prove grants prevent Purulia accounts from reading or changing Jana schemas.
- [ ] Confirm the deployment configuration's `DB_NAME` and `PURULIA_EXPECTED_DB_NAME` are exactly `purulia_dhaba_db` using a redacted review. Do not print or copy secret values.
- [ ] Obtain DBA evidence that the migration connection resolves to the approved Purulia server and schema. The code's `DATABASE()` check validates the selected schema name on the held connection; it does not validate physical host identity, provider account, or grants.
- [ ] Confirm the migration account cannot change Jana schemas. Confirm the application runtime account is scoped to Purulia and cannot access Jana schemas.

### Grants and migration account

- [ ] Review the actual grants for both migration and application identities with the DBA. Capture redacted evidence, including schema scope; do not include passwords or connection strings.
- [ ] The migration runner needs to inspect tables and schema definitions, obtain/release its MySQL named lock, and create the migration objects. Confirm the migration identity has only the required privileges for the Purulia schema and metadata inspection.
- [ ] The runner currently loads the standard server database configuration. Do not assume it has a separate migration credential path. Agree on a controlled, audited way to provide temporary migration privileges and revoke them after migration, or explicitly approve a narrowly scoped credential and its risk before proceeding.
- [ ] Confirm the application runtime identity has no schema DDL privileges unless separately justified. Test that its normal application operations work with the intended restricted grants in a non-production environment.

### Backup and recovery

- [ ] Take a provider-supported, consistent backup/snapshot of the confirmed Purulia target immediately before migration. Record its identifier, timestamp, retention, and owner.
- [ ] Restore a recent backup to an isolated non-production environment and verify the restore procedure, application compatibility, and measured recovery time. A successful backup job alone is not restore evidence.
- [ ] Document recovery point and recovery time objectives, who can authorize restore, and how orders created after the snapshot will be reconciled.
- [ ] Migration 0007 is additive and creates one table, but a failed or interrupted DDL operation may still require schema reconciliation. Do not rely on transactional rollback of MySQL DDL.
- [ ] Agree in advance that ordinary application rollback leaves migration 0007 in place. Do not drop the capability table as a routine rollback step.

## 2. Redacted configuration preflight

Review configuration through the approved secret manager or deployment console. Never use commands that print `.env`, secret-manager values, passwords, JWT signing keys, or full connection URLs. Record only pass/fail, configuration version, and redacted evidence.

- [ ] Backend deployment selects the reviewed Purulia secret/configuration version. Confirm `DB_NAME` equals `PURULIA_EXPECTED_DB_NAME`, and both are `purulia_dhaba_db`; separately verify host identity with the DBA.
- [ ] Review `JWT_SECRET`, payment/notification integrations, and other required secrets for presence, rotation ownership, and production suitability without displaying values.
- [ ] Confirm frontend `VITE_API_BASE_URL` is the approved absolute HTTPS API URL ending in `/api`, with no credentials, query string, or duplicate `/api` path segment.
- [ ] Review `TRUST_PROXY` against the actual reverse-proxy topology. Configure only the exact trusted hop count or trusted proxy addresses/networks; do not trust arbitrary forwarded headers or use a blanket trust-all setting.
- [ ] Review positive integer settings for `LOGIN_RATE_LIMIT_WINDOW_MS`, `LOGIN_RATE_LIMIT_MAX`, `TRACKING_RATE_LIMIT_WINDOW_MS`, `TRACKING_RATE_LIMIT_MAX`, `CANCEL_RATE_LIMIT_WINDOW_MS`, and `CANCEL_RATE_LIMIT_MAX`. The current implementation is in-memory per process; it resets on restart and does not coordinate multiple instances.
- [ ] Confirm HTTPS from customer browser through the trusted edge and that edge/application logs do not record authorization headers or `X-Order-Tracking-Capability` values.
- [ ] Confirm QR codes, payment instructions, owner contact information, shop name/address/hours, and customer-facing links refer to Purulia Dhaba, not Jana Food Hub.
- [ ] Confirm no production configuration points to Jana credentials, Jana schema, Jana payment identity, Jana push keys, or Jana domain.

## 3. Release sequence

Use a planned maintenance window. Keep a named release owner and DBA/operator available throughout. Do not continue if any go/no-go evidence is missing.

1. **Announce and prepare.** Set customer ordering expectations, select controlled staff/customer test accounts, and record the current application release and Purulia backup identifier.
2. **Stop old-version traffic.** Place the storefront in a planned maintenance state. Stop new checkout and cancellation traffic, drain every old backend instance, and stop/disable old background workers and scheduled jobs. Verify no old backend instance remains reachable through the load balancer, alternate hostname, or direct origin. Old instances accept the human-readable order token for tracking/cancellation and must not remain exposed alongside the new version.
3. **Review the target one last time.** DBA confirms provider instance identity, selected schema, grants, and backup identifier immediately before execution. Abort on any mismatch. The migration runner's schema-name guard is not a substitute for this check.
4. **Apply migrations using the approved operator procedure.** From the reviewed release artifact, the runner entry point is `node server/scripts/migrate.js`. It loads `server/.env` at runtime and targets only a configuration whose expected database name is `purulia_dhaba_db`. An authorized operator—not this documentation task—must decide whether to invoke it after confirming the exact protected environment and privileges. Capture sanitized version/result evidence; never capture secret values.
5. **Verify migration result.** Confirm migration history records the expected checksums and schema fingerprint through the approved DBA/deployment procedure. Confirm `order_tracking_capabilities` exists in Purulia and has the expected primary key, unique hash index, and restrictive FK. Do not alter schema history manually to make a run pass.
6. **Deploy the compatible backend.** Deploy the version that generates/stores capability hashes, requires the capability for public tracking/cancellation, and applies the intended staff role checks. Do not route public traffic to any older backend. Start background workers only after database identity and backend health checks pass.
7. **Deploy the compatible frontend.** Publish the matching checkout/tracking UI. Purge or expire stale frontend assets/service-worker caches as applicable. Confirm the page does not put the capability in a URL or logs and retains it only in the checkout browser storage used by the tracking flow.
8. **Initialize Purulia shop and owner.** Use the protected one-time first-owner bootstrap only after the Purulia backend/database identity is verified. Use an owner-supplied secret through the approved secure channel; never place credentials in source, shell history, or logs. Set shop details and status through the authorized owner flow.
9. **Run smoke tests below.** Use clearly identified test records and controlled staff accounts. Do not represent test payments as customer settlement. Record outcomes without personal data or credentials.
10. **Open traffic gradually.** Resume customer ordering only after critical smoke tests pass, old backends are confirmed drained, logs are checked for secret exposure, and the release owner signs off.

## 4. Smoke-test checklist

Use non-sensitive test data and keep order IDs/tokens out of public reports. Observe browser/network behavior without copying the capability header into tickets or logs.

### Customer checkout and tracking capability

- [ ] Browse the Purulia menu and QR entry point; verify the shop identity and prices.
- [ ] Place a low-value controlled checkout. Confirm it returns the human-readable order number plus a separate capability, and the capability is stored by the checkout browser. Confirm no capability appears in the URL, application logs, analytics, or shared screenshots.
- [ ] Track using the checkout browser. Confirm the header-based capability succeeds and the response does not expose the stored hash.
- [ ] In a separate clean browser, try the same human-readable order number without the capability. Confirm tracking fails with the generic unavailable response and no customer/order details.
- [ ] Use a wrong capability and confirm it does not reveal whether the order exists.
- [ ] For a controlled Pending or Accepted order, cancel with the valid capability and confirm the existing cancellation behavior. Confirm cancellation fails after preparation begins and a delivery cancellation remains blocked after delivery starts.
- [ ] Confirm legacy orders without a capability remain unavailable to public tracking/cancellation while staff dashboards can still access their operational records.

### Kitchen, payment, delivery, and staff access

- [ ] From an authorized kitchen/staff account, move a test order through Pending → Accepted → Preparing → Ready → Completed. Confirm unauthorized roles cannot perform restricted management actions.
- [ ] Record a controlled cash payment through the authorized payment workflow. Verify the expected payment status and method.
- [ ] Verify UPI instructions/QR display correctly. Use a test payment identity or a deliberately non-settling flow; only record Paid after the responsible operator confirms actual settlement.
- [ ] Create a controlled delivery order. Verify assignment, delivery-staff access, status progression, and customer tracking. Do not dispatch a real delivery unless explicitly planned.
- [ ] Verify unauthenticated, incorrect-role, and authorized staff cases for Owner, Manager, Kitchen, Counter, Waiter, and DeliveryBoy operations that are deployed.
- [ ] Open each Purulia QR URL from a clean device/session. Confirm it resolves to the intended Purulia menu/table and does not depend on a Jana host or stale QR destination.

### Health and monitoring

- [ ] Check `GET /api/health` from the approved external health probe and confirm the expected release is serving.
- [ ] Treat this endpoint as a shallow process/HTTP check: its current response does not by itself prove database isolation, migration state, checkout, or staff authorization. Confirm database identity through the approved secured operations procedure and perform the user flows above.
- [ ] Review sanitized application, proxy, and database logs for errors, secret/header exposure, unexpected Jana references, and rate-limit behavior.

## 5. Rollback and incident response

- **Do not roll back to an old backend that accepts order tokens alone.** That reopens access to another customer's order by guessing its human-readable number. Keep public tracking/cancellation disabled or route them only to a capability-aware backend during recovery.
- If the new release has an application defect, first stop checkout and sensitive public tracking/cancellation traffic. Roll back only to a backend release that supports the capability table and capability validation. A frontend rollback is acceptable only if it still handles capability delivery/retention correctly; otherwise keep tracking/cancellation unavailable and provide staff-assisted support.
- Leave migration 0007 and its table in place during ordinary application rollback. It is additive and older code can ignore the table, but an older backend remains unsafe if publicly reachable.
- If migration fails or schema fingerprints disagree, stop. Preserve logs and the backup; do not edit migration history, rerun blindly, or drop objects. Have the DBA compare the actual Purulia schema to the migration history and use the documented restore/reconciliation plan.
- Restore a backup only under the named recovery approval, after assessing orders/payments written since the backup. Never restore or redirect to the Jana database as a shortcut.
- After recovery, verify no old token-only endpoint is reachable, confirm database identity and grants again, and rerun critical smoke tests before reopening.

## 6. What is and is not verified

### Static code review completed

- Migration 0007 is ordered after 0006 and creates only `order_tracking_capabilities`.
- The migration runner requires the Purulia schema name and records/verifies checksums and schema fingerprints. Migration 0007 owns a new table, so it does not intentionally change earlier migration-owned table fingerprints.
- The new table has an order primary key, a unique hash index, and a restrictive order FK.
- New checkout/tracking/cancellation code uses a separate capability; legacy orders fail closed in public handlers.
- Failed-order cleanup includes the capability child row in its transaction.
- The code review found old-version coexistence to be unsafe for public tracking/cancellation.

These are source-level findings only. They do not establish live target identity, actual grants, successful migration, database behavior, deployment routing, browser behavior, or production security.

### Requires real deployment evidence or runtime verification

- MySQL provider/account/instance identity and separation from Jana Food Hub.
- Actual selected Purulia schema, exact grants, application/migration credential behavior, and no Jana access.
- Backup existence, successful isolated restore, and acceptable RPO/RTO.
- Approved redacted configuration, TLS/proxy behavior, rate limiting across the actual number of instances, and secret-safe logging.
- Migration execution and fingerprint result on the intended Purulia database.
- Decommissioning/draining all old backends and caches.
- Owner bootstrap, shop setup, and every smoke test above.

## 7. Go/no-go sign-off

Migration/launch is **NO-GO** until all required evidence in Sections 1–2 is recorded, the controlled release sequence is staffed, and the recovery owner approves the plan. Record:

- Release owner: ____________________
- DBA/operator: ____________________
- Approved Purulia environment/config version (redacted): ____________________
- Purulia host/instance identity evidence reference: ____________________
- Jana separation/grants evidence reference: ____________________
- Backup and restore evidence reference: ____________________
- Maintenance window and recovery approver: ____________________
- Smoke-test record and final sign-off: ____________________
