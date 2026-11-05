# Live verification

Homepage https://www.trukafrik.com/: approved metallic-logo desktop/mobile videos, 28 seconds, H.264 without audio; four selectors seek to 0.1, 7.1, 14.1 and 21.1 seconds with matching specification text. Desktop and phone-width browser checks passed without JavaScript errors or horizontal overflow.

About, Finance, Parts and Pre-owned: rejected illustrative figures removed from HTML and navigation payloads. Specification provenance footers removed in the current and older truck panels; technical table values preserved. Missing 3D model tabs are hidden; existing supplied model derivatives remain available. Application notes use a faint site-owned image matching the selected one of four truck models.

Events, privacy and range pages return HTTP 200. The privacy closing line is preserved. An empty JSON POST to the enquiry endpoint returns HTTP 400 with name, email and consent validation errors; no email was sent. Both enquiry PHP scripts and the private server mail configuration were hash-checked unchanged during deployment.

The source build script uses PHP single-quoted serialization (only backslashes and apostrophes escaped); dummy dollar-sign round-trip and full local build passed. The local environment password still includes literal backslashes before dollar signs, unlike the live server value; generated private settings were not uploaded or committed.

All range cards and their navigation payloads also have dealer-source notes, source/capture footers and copied-specification commentary removed; every specification table value was checked unchanged.
