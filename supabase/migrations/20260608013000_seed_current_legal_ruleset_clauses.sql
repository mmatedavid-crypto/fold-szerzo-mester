-- Dr Föld legal ruleset seed
-- Purpose: move document generation from generic text toward versioned,
-- current-law clause templates with explicit legal source notes.

INSERT INTO public.legal_template_versions (version, status, effective_from, notes, legal_sources)
VALUES (
  '2026.06.08',
  'active',
  now(),
  'Dr Föld hatályos jogszabályi ruleset alapú haszonbérleti szerződés sablon.',
  '2013. évi CXXII. törvény (Földforgalmi tv.) 1-5. §, 42. §, 44-55. §; 2013. évi CCXII. törvény (Fétv.) eljárási rendelkezések; 2013. évi V. törvény (Ptk.) szerződéses háttérszabályok; 2009. évi XXXVII. törvény (Erdőtörvény) erdő eltérések.'
)
ON CONFLICT (version) DO UPDATE SET
  status = EXCLUDED.status,
  effective_from = EXCLUDED.effective_from,
  notes = EXCLUDED.notes,
  legal_sources = EXCLUDED.legal_sources;

UPDATE public.legal_template_versions
SET status = 'archived'
WHERE version <> '2026.06.08' AND status = 'active';

WITH tpl AS (
  SELECT id FROM public.legal_template_versions WHERE version = '2026.06.08'
)
INSERT INTO public.clauses (legal_template_version_id, category, title, clause_key, text, sort_order)
SELECT id, 'preamble', 'Felek és szerződéses minőség', 'preamble',
  'Amely létrejött egyrészről {{lessor_block}} mint haszonbérbeadó(k), másrészről {{lessee_name}} (lakcím/székhely: {{lessee_address}}, adószám/adóazonosító: {{lessee_tax}}) mint haszonbérlő között. A felek rögzítik, hogy a szerződés termőföld haszonbérleti szerződés-előkészítő dokumentum, amely a Földforgalmi tv., a Fétv. és a Ptk. vonatkozó szabályain alapul.',
  10
FROM tpl
UNION ALL
SELECT id, 'subject', 'A haszonbérlet tárgya', 'subject',
  'Haszonbérbeadó haszonbérbe adja, Haszonbérlő haszonbérbe veszi az alábbi mező- vagy erdőgazdasági hasznosítású föld(ek)et. A felek tudomásul veszik, hogy kivett vagy a Földforgalmi tv. hatálya alá nem tartozó ingatlan esetén jelen sablon nem alkalmazható automatikusan. Földterületek: {{parcels_block}}',
  20
FROM tpl
UNION ALL
SELECT id, 'term', 'Haszonbérleti időtartam', 'term',
  'A haszonbérlet határozott időtartamra, {{term_start}} napjától {{term_end}} napjáig szól. Az első gazdasági év: {{first_economic_year}}. A birtokbaadás napja: {{possession_date}}. A felek tudomásul veszik, hogy a haszonbérleti időtartam és annak módosítása a Földforgalmi tv. időtartami és jóváhagyási szabályai szerint vizsgálandó.',
  30
FROM tpl
UNION ALL
SELECT id, 'rent', 'Haszonbérleti díj', 'rent',
  'A haszonbérleti díj: {{rent_description}}. Fizetési határidő: {{rent_deadline}}. Fizetés módja: {{rent_method}}. {{rent_indexation}} A felek rögzítik, hogy a díj és annak módosítása nem lehet nyilvánvalóan jogszabálysértő vagy a jóváhagyási eljárást megkerülő tartalmú.',
  40
FROM tpl
UNION ALL
SELECT id, 'lessee_declarations', 'Haszonbérlő nyilatkozatai', 'lessee_declarations',
  'Haszonbérlő kijelenti, hogy a Földforgalmi tv. 42. § szerinti, a szerződés jóváhagyásához és a földhasználat megszerzéséhez szükséges nyilatkozatokat megteszi, a földhasználati korlátozásokat ismeri, és az általa megjelölt jogállást, ranghelyet és jogosultságot igazoló okiratokat rendelkezésre bocsátja.',
  45
FROM tpl
UNION ALL
SELECT id, 'prelease', 'Előhaszonbérleti jog és ranghely', 'prelease',
  'A felek rögzítik, hogy az előhaszonbérleti jogosultság és ranghely a Földforgalmi tv. 46-49. § szerinti szabályok alapján vizsgálandó. Megjelölt ranghely: {{prelease_rank}}. Jogalap: {{prelease_basis}}. A jogalapot bizonyító okiratok csatolása és a törvényi jogalap pontos megjelölése szükséges; ennek hiánya az elfogadó jognyilatkozat vagy a szerződés figyelembevételét akadályozhatja.',
  50
FROM tpl
UNION ALL
SELECT id, 'publication_approval', 'Közzététel és hatósági jóváhagyás', 'publication_approval',
  'A felek tudomásul veszik, hogy a haszonbérleti szerződés a Földforgalmi tv. és a Fétv. szerinti hirdetményi közléshez, előhaszonbérleti eljáráshoz és mezőgazdasági igazgatási szerv általi jóváhagyáshoz kötött lehet. A szerződés jóváhagyása, megtagadása, illetve az előhaszonbérletre jogosult belépése a hatósági eljárás eredményétől függ.',
  55
FROM tpl
UNION ALL
SELECT id, 'use', 'Földhasználat és gazdálkodási kötelezettségek', 'use',
  'Haszonbérlő köteles a földet rendeltetésszerűen, a jó gazda gondosságával művelni, a művelési ágat és a föld termőképességét megőrizni, a talajvédelmi, természetvédelmi, erdő esetén erdőgazdálkodási előírásokat betartani. A használat harmadik személy részére történő átengedése kizárólag a hatályos jogszabályok és a szerződés rendelkezései szerint történhet.',
  60
FROM tpl
UNION ALL
SELECT id, 'termination', 'Megszűnés és módosítás', 'termination',
  'A szerződés a határozott idő lejártával, közös megegyezéssel, jogszabályban vagy szerződésben meghatározott megszűnési okkal, illetve rendkívüli felmondással szűnhet meg. A szerződés időtartamának meghosszabbítása vagy a haszonbér mértékének csökkentése külön jóváhagyási és jogszabályi vizsgálatot igényelhet.',
  70
FROM tpl
UNION ALL
SELECT id, 'misc', 'Záró rendelkezések és jogi tájékoztatás', 'misc',
  'A jelen dokumentumban nem szabályozott kérdésekben a Ptk., a Földforgalmi tv., a Fétv., erdő esetén az Erdőtörvény és az egyéb hatályos jogszabályok rendelkezései irányadók. A Dr Föld dokumentumgeneráló és döntéstámogató szolgáltatás, nem ügyvédi iroda. Egyedi, vitás vagy nagy értékű ügyben ügyvédi ellenőrzés javasolt.',
  80
FROM tpl
ON CONFLICT (legal_template_version_id, clause_key) DO UPDATE SET
  category = EXCLUDED.category,
  title = EXCLUDED.title,
  text = EXCLUDED.text,
  sort_order = EXCLUDED.sort_order,
  active = true,
  updated_at = now();
