# Deployment snapshot

`deployed/public_html/` is the current static website snapshot, including the approved metallic-logo hero, its four matching specifications, Events page/media, image removals, model-tab cleanup and application-note watermarks.

`source/` contains the website project source, the fixed PHP-string serializer in `scripts/build-php.mjs`, and its public assets. This source predates several direct hosted-file edits. Treat the deployed snapshot as authoritative; reconcile the deployed changes into source before making a future source build. Do not deploy a fresh build over the website blindly.

Restore public website files from `deployed/public_html/`. The working server enquiry configuration remains one level ABOVE public_html and is deliberately excluded from GitHub. Preserve that configuration during any restore. The local generated smtp_pass differs from the live value and must not be uploaded. No mailbox contents, databases, environment files or password values are included.

The hero is a conventional photo composite on a generic road, not filmed driving footage or the Benoni branch. No Google Street View recording or event footage is used in the hero. The 94-second event recap stays on /events.

The repository is public, as confirmed by Greg.
