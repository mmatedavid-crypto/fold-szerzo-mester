-- Tighten the public INSERT policy on land_sale_intakes so the WITH CHECK
-- is no longer an unconditional `true`. We still allow anonymous submissions
-- (it's a public lead-capture form), but require basic data integrity and
-- prevent spoofing of the submitter_user_id field.

DROP POLICY IF EXISTS "Anyone can submit a land sale intake" ON public.land_sale_intakes;

CREATE POLICY "Anyone can submit a land sale intake"
ON public.land_sale_intakes
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Required minimum data: a real name and a plausible email address
  char_length(btrim(full_name)) BETWEEN 2 AND 120
  AND char_length(btrim(email)) BETWEEN 5 AND 255
  AND position('@' in email) > 1
  AND role_in_deal IN ('seller','buyer','both','other')
  -- Length caps on every free-text field, mirroring the app-level validation
  AND (phone IS NULL OR char_length(phone) <= 60)
  AND (settlement IS NULL OR char_length(settlement) <= 120)
  AND (parcel_numbers IS NULL OR char_length(parcel_numbers) <= 500)
  AND (cultivation_branch IS NULL OR char_length(cultivation_branch) <= 120)
  AND (counterparty_name IS NULL OR char_length(counterparty_name) <= 120)
  AND (counterparty_contact IS NULL OR char_length(counterparty_contact) <= 255)
  AND (preferred_contact IS NULL OR char_length(preferred_contact) <= 255)
  AND (notes IS NULL OR char_length(notes) <= 3000)
  -- Numeric sanity
  AND (area_ha IS NULL OR (area_ha > 0 AND area_ha <= 100000))
  AND (price_huf IS NULL OR (price_huf > 0 AND price_huf <= 100000000000))
  -- Anonymous submitters must not pre-fill a submitter_user_id;
  -- authenticated submitters may only set it to their own auth.uid().
  AND (
    submitter_user_id IS NULL
    OR submitter_user_id = auth.uid()
  )
);