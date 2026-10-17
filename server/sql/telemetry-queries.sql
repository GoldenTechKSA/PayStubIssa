-- Starter queries for reading the telemetry pipeline.
-- Run with:  node scripts/query.js <name> [args…]      (from the server/ folder on the VPS)
-- Blocks are separated by `-- name: <id>` lines; `?` placeholders bind positional args in order.
-- Codes: client 1000–1999 (src/telemetry/codes.ts), server 2000–2999 (server/src/telemetry/codes.ts).

-- name: sessions
-- One row per visit in the last 7 days, newest first, with the funnel flags.
SELECT session_id,
       visitor_id,
       started_at,
       last_seen_at,
       events,
       entered_wizard,
       max_step_completed,
       picked_template,
       started_payment,
       paid,
       order_id,
       printed_or_downloaded,
       errors
FROM telemetry_sessions
WHERE started_at > datetime('now', '-7 days')
ORDER BY started_at DESC;

-- name: timeline
-- Everything one session did, in order. Arg 1: the session id (s_…).
SELECT ts,
       source,
       printf('[%04d] %s', code, name) AS event,
       level,
       props_json
FROM telemetry_events
WHERE session_id = ?
ORDER BY ts, id;

-- name: funnel
-- Per day: how many visits, how many entered the wizard, reached Review, started paying, paid.
SELECT date(started_at)                                          AS day,
       COUNT(*)                                                  AS sessions,
       SUM(entered_wizard)                                       AS entered_wizard,
       SUM(CASE WHEN max_step_completed >= 4 THEN 1 ELSE 0 END)  AS reached_review,
       SUM(started_payment)                                      AS started_payment,
       SUM(paid)                                                 AS paid
FROM telemetry_sessions
GROUP BY date(started_at)
ORDER BY day DESC;

-- name: errors
-- Error-level events in the last 24 hours, grouped by site code.
SELECT printf('[%04d] %s', code, name) AS event,
       source,
       COUNT(*)                        AS count,
       MAX(ts)                         AS last_seen
FROM telemetry_events
WHERE level = 'error'
  AND received_at > datetime('now', '-1 day')
GROUP BY code, name, source
ORDER BY count DESC;

-- name: paid
-- Paid sessions cross-checked against the orders ledger.
SELECT s.session_id,
       s.started_at,
       s.order_id,
       o.status            AS order_status,
       o.captured_cents,
       o.captured_at,
       s.printed_or_downloaded
FROM telemetry_sessions s
LEFT JOIN orders o ON o.id = s.order_id
WHERE s.paid = 1
ORDER BY s.started_at DESC;
