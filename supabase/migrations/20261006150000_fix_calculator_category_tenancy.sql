-- C.R.E.A.M. 5.33: make calculator categories tenant-scoped.
-- Existing transaction/category rows are preserved. Missing user-owned categories
-- referenced by existing transactions are copied before the composite FK is restored.

ALTER TABLE public.calculator_transactions
  DROP CONSTRAINT IF EXISTS calculator_transactions_category_fk;

ALTER TABLE public.calculator_categories
  DROP CONSTRAINT IF EXISTS calculator_categories_pkey;

ALTER TABLE public.calculator_categories
  ADD CONSTRAINT calculator_categories_pkey PRIMARY KEY (id, user_id);

INSERT INTO public.calculator_categories (
  id, user_id, name, icon, color, text_color, type, created_at
)
SELECT DISTINCT ON (t.user_id, t.category_id)
  t.category_id,
  t.user_id,
  c.name,
  c.icon,
  c.color,
  c.text_color,
  c.type,
  c.created_at
FROM public.calculator_transactions t
JOIN public.calculator_categories c
  ON c.id = t.category_id
WHERE NOT EXISTS (
  SELECT 1
  FROM public.calculator_categories own
  WHERE own.id = t.category_id
    AND own.user_id = t.user_id
)
ORDER BY t.user_id, t.category_id, c.created_at NULLS LAST;

CREATE INDEX IF NOT EXISTS calculator_transactions_user_category_idx
  ON public.calculator_transactions (user_id, category_id);

ALTER TABLE public.calculator_transactions
  ADD CONSTRAINT calculator_transactions_category_fk
  FOREIGN KEY (category_id, user_id)
  REFERENCES public.calculator_categories (id, user_id);

-- Verification: every movement must now have a category owned by its same user.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.calculator_transactions t
    LEFT JOIN public.calculator_categories c
      ON c.id = t.category_id
     AND c.user_id = t.user_id
    WHERE c.id IS NULL
  ) THEN
    RAISE EXCEPTION 'C.R.E.A.M. category migration verification failed: orphan tenant category reference remains';
  END IF;
END $$;