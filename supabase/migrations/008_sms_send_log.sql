-- ============================================================
-- ShiftPay — Migration 008: SMS send log
-- ============================================================

CREATE TABLE sms_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers ON DELETE CASCADE,
  shift_id UUID REFERENCES shifts ON DELETE SET NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sms_send_log_worker_created
  ON sms_send_log(worker_id, created_at DESC);

ALTER TABLE sms_send_log ENABLE ROW LEVEL SECURITY;

-- Edge functions write this table with the service role. No client read/write
-- policies are exposed because phone numbers and notification history are
-- operational data.
