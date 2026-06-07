# foldberletiszerzodes.hu SEO domain

Domain: foldberletiszerzodes.hu

Purpose: SEO and campaign domain for the land lease contract feature.

Current status: Purchased, not connected.

Decision needed:

1. 301 redirect to Dr Föld `/foldberleti-szerzodes`
2. Dedicated SEO landing under Dr Föld branding
3. Alias domain with canonical handling
4. Keep parked for later

Recommendation:

Start with a strong `/foldberleti-szerzodes` SEO landing inside Dr Föld. Do not connect the separate domain until routing, canonical, analytics and conversion tracking decisions are made.

Implementation constraints:

- Do not change DNS from the app.
- Do not assume production domain configuration.
- Do not add hardcoded redirect from `foldberletiszerzodes.hu` unless environment/domain routing already supports it.
- Do not serve duplicate content across domains without a canonical strategy.
- Keep the page visually and functionally under the Dr Föld brand.

Canonical note:

The current in-app landing should canonicalize to `https://drfold.hu/foldberleti-szerzodes`. If `foldberletiszerzodes.hu` later serves the same app or a dedicated landing, decide whether that domain should canonicalize back to Dr Föld or whether a separate canonical content strategy is justified.
