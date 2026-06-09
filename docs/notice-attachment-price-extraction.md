# Notice attachment price extraction

The rent and sale price compass needs normalized price points from official notice details and attachments. The list API can populate notice metadata, but it does not provide normalized `Ft/ha/év` or `Ft/ha` values by itself.

## Current production state

- The database has the required columns and observation tables.
- County-level rent and sale stats views are ready.
- The views stay empty until notices receive normalized price fields or attachment-derived observations.
- The current live `notices` data has `original_detail_url` values, so the extractor can call the official detail API even when `original_attachment_url` is empty.
- Important: the public detail page (`/reszletezo/:id`) is an Angular shell. The useful structured values come from `/api/hirdetmenyek/reszletezo/:id`, and downloadable PDFs use `/api/csatolmany/:id`.

## Pipeline

1. Populate notices with `original_detail_url` or `original_attachment_url`.
   - `original_detail_url` is enough when it points to `https://hirdetmenyek.gov.hu/reszletezo/:id`.
   - The extractor resolves this to the official detail API and reads structured `haszonber`, `vetelar`, `terulet`, `telepules`, and attachment ids.
   - If a detail row has `tulhanyad` lower than `1/1`, the extractor normalizes sale/rent values against the effective ownership-share area instead of the full parcel area.
2. Run the attachment extractor:

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run notices:extract-prices
```

For a safe read-only check:

```bash
DRY_RUN=1 PRICE_EXTRACT_LIMIT=20 npm run notices:extract-prices
```

3. The script first reads the official detail JSON. It also follows official PDF/XLSX/text/html attachments when available.
4. In normal write mode, the script updates normalized fields on `notices`:

- `area_ha`
- `settlement`
- `county`
- `cultivation_branch`
- `rent_raw`
- `rent_normalized_huf_per_ha_year`
- `rent_unit`
- `price_raw`
- `price_total_huf`
- `price_normalized_huf_per_ha`

5. Production triggers then write:

- `notice_rent_observations`
- `notice_sale_price_observations`

6. Stats views expose county and settlement price statistics for the compass UI.

## Lovable production prompt

Run the new `npm run notices:extract-prices` job with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. It can use `notices.original_detail_url` and does not require a direct PDF link. First run it as `DRY_RUN=1 PRICE_EXTRACT_LIMIT=20` and report:

- candidate count
- downloaded attachment count
- rent observations found
- sale observations found
- any parser errors

If dry-run finds observations, run the write job without `DRY_RUN`. If candidates are still 0, check that `notices.original_detail_url` is filled with `https://hirdetmenyek.gov.hu/reszletezo/:id` URLs.
