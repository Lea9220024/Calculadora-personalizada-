-- C.R.E.A.M. 5.33: make calculator transactions tenant-scoped.
-- Existing rows are preserved; identity becomes (id, user_id).

ALTER TABLE public.calculator_transactions
  DROP CONSTRAINT IF EXISTS calculator_transactions_pkey;

ALTER TABLE public.calculator_transactions
  ADD CONSTRAINT calculator_transactions_pkey PRIMARY KEY (id, user_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.calculator_transactions
    WHERE user_id IS NULL
  ) THEN
    RAISE EXCEPTION 'C.R.E.A.M. transaction migration verification failed: NULL user_id remains';
  END IF;
END $$;
