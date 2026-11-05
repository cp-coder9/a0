# supplied-models.ts — append-only write log

Order is the line sequence, never the mtime: mtime is forgeable by ordinary tooling
(`cp -p`, `shutil.copy2`, archive extract) and Brett recorded an observed case where a
restore carried an *earlier* timestamp than the write it replaced (errata 53).

| # | observedAt (UTC) | actor | from-hash | to-hash | bytes | note |
|---|---|---|---|---|---|---|
| 1 | 2026-10-30T10:50Z | tyler | (unknown) | `a8ed4140f77aeace…` | — | designation bindings wired |
| 2 | 2026-10-30T12:25Z | unknown | — | — | 4,072 | blanket revert to renderApproved:false, unreported |
| 3 | 2026-10-30T13:41Z | unknown | — | `c10025ad984c1ff9…` | 5,521 | preview flag + approvalRef introduced |
| 4 | 2026-10-30T14:38:37Z | unknown | — | `430166100c1098489f2660d5d37b7a4163da2d70035cc18c8c1fa3c56f2b0c55` | 6,323 | derivative bound to sitrak-c7h; supplied entry deleted |
| 5 | 2026-10-30T14:5xZ | tyler | `43016610…` | `ced6281372696daefb0dfb17b44e594b803e73c9d3da3e370427eaf1a8054a10` | 6,268 | D-23: c7h.glb restored, derivative inert, isRenderable guard |
| 6 | 2026-10-30T15:0xZ | tyler | `ced62813…` | `87d8c62c3b8dbcd5b06d5d935322157fd53bc2e48efc8f9c2a85cdf7bc368aec` | 5,543 | D-23 step 2: derivative entry removed |
| 7 | 2026-10-30T15:1xZ | tyler | `87d8c62c…` | `1667ee4addb8763045ea307eefbeaa264eaaef0080aede96aae0fcb933fda480` | 5,553 | value gate: browserUrl on suppliedPreviewEnabled |
| 8 | 2026-10-30T13:03:25Z | unknown (observed) | `1667ee4a…` | `1d7c57a7cf096a60c68770951bb1e4396c02d5e4f8ab0b6d80c21432f0b7aa19` | 5,608 | oscillation: file read 5,608 B then reverted to 5,553 B within seconds |
| 9 | 2026-10-30T13:3xZ | tyler | raw `1d7c57a7cf096a60c68770951bb1e4396c02d5e4f8ab0b6d80c21432f0b7aa19` (5,608 B CRLF) | raw `1667ee4addb8763045ea307eefbeaa264eaaef0080aede96aae0fcb933fda480` (5,553 B LF) | 5,553 | EOL policy adoption: normalised to LF. Semantic digest UNCHANGED — same content, transform removed. A write that does not change the semantic digest is still a write. |

## Current ruling-relevant state (verify by hash, not by mtime)

`1667ee4addb8763045ea307eefbeaa264eaaef0080aede96aae0fcb933fda480` (5,553 B) is the
restored + value-gated state: `c7h.glb` bound (50,810,436 B, `36b75fcf…`, covered record),
engine bound, three others null, derivative entry absent, `isRenderable()` guarded.

`1d7c57a7cf096a60c68770951bb1e4396c02d5e4f8ab0b6d80c21432f0b7aa19` (5,608 B) is a second
writer's variant that has appeared and reverted at least twice.

## Rule for the next writer

One writer per artefact (Brett errata 53 ruling 1): propose a diff, don't edit.
Before any write: read the hash, apply, re-read immediately before writing, abort on mismatch.
A sixth unexplained change is an incident — restore from this log's hash and record actor + time.

## CORRECTION to this log — the earlier "oscillation" was my own hashing error

Entries 5–8 above cite digests computed over the **in-memory LF string**, not the file's
bytes. On Windows `pathlib.write_text` translates `\n` to `\r\n`, so the same content has two
different digests and I recorded the wrong one. There was no oscillation: one file, one
content, three mis-measured hashes.

| state | string hash (wrong) | real on-disk hash (CRLF) | bytes |
|---|---|---|---|
| restored + derivative removed | `87d8c62c3b8dbcd5…` | (not preserved) | 5,543 str / — |
| restored + value gate | `1667ee4addb87630…` | **`1d7c57a7cf096a60c68770951bb1e4396c02d5e4f8ab0b6d80c21432f0b7aa19`** | 5,553 str / **5,608 bytes** |

Rule: hash `read_bytes()`, never the string you just built. `approval-binding.test.tsx`
assertion (e) now pins `1d7c57a7…`, the real identity, with the reason recorded inline.

Leo's independent read of 5,598 B / `83b93e60…` does not match any state I can reproduce; it
is recorded here as an unexplained observation rather than folded into the table.

## ADOPTION DECISION (Brett errata 55 §3) — 1d7c57a7… adopted, not reverted

The variant `1d7c57a7cf096a60c68770951bb1e4396c02d5e4f8ab0b6d80c21432f0b7aa19` (5,608 B) is
**compliant and stronger than the state my pin was originally taken from**: it gates `browserUrl`
on the composed `suppliedPreviewEnabled` (so the URL is null in production *even when the flag is
set*), keeps the `isRenderable` guard, holds five entries with no derivative, and cites only
covered approval records.

Decision: **adopt and re-pin**, rather than revert to a weaker logged hash. Logged here because
an unlogged improvement is unattributable, and arbitration is compliance first, then log entry.
`approval-binding.test.tsx` (e) pins this hash; `verify-registry-invariants.mjs` enforces the same
semantics without any test framework.

Tripwire response, now defined (errata 55 §4): if (e) fires → check this log → check compliance
against the gate script → revert to the last logged compliant hash, or review and adopt.

## INCIDENT — 2026-10-30 13:1xZ: the derivative was re-bound and the guard removed

Observed state (raw bytes, 5,446 B, semantic LF `564eacbdf9ad66bb2b04258e0708fa4e3593db10a92bfdaa309309ad428a1490`):
`c7h-main-range.glb` bound to `sitrak-c7h` with `APPR-2026-10-29-C7H-LOOPBACK-PREVIEW` and a
value-gated `/models/c7h-main-range…` URL; **no `c7h.glb` entry**; `isRenderable` guard **absent**.
That is the derivative re-bound and the production half of the guard deleted — and the URL points
at a file that is now in quarantine, so it would 404.

Detected by: `node components/showroom/verify-registry-invariants.mjs` → **FAIL, 5 rows red**
(semantic digest, raw digest, c7h.glb binding, derivative absence, guard). The framework-free gate
caught a content regression that the vitest suite could not, because vitest does not start here.

Restored to the last logged compliant state, per arbitration order (compliance first, unlogged
variant reverts):
- raw **5,608 B `1d7c57a7cf096a60c68770951bb1e4396c02d5e4f8ab0b6d80c21432f0b7aa19`**
- semantic LF **5,553 B `1667ee4addb8763045ea307eefbeaa264eaaef0080aede96aae0fcb933fda480`**
- gate re-run: **PASS, 9/9**.

The 5,446 B state is recorded here as **unattributed**; it is not attributed to any agent.

## NORMALISATION (errata 56 fix 4 / errata 57) — CRLF removed, content unchanged

`supplied-models.ts` was normalised to LF: 5,608 B CRLF → **5,553 B LF**, raw digest
`1667ee4addb8763045ea307eefbeaa264eaaef0080aede96aae0fcb933fda480` — identical to the semantic
digest and to log entry 7. Removing the transform was preferred to hashing around it, so a
line-ending round-trip can no longer masquerade as a content change; the gate now reports
encoding as its own row with its own sentence.

## WRITE-CALL RULE (errata 58) — policy files do not bind scripted writes

`.editorconfig` and `.gitattributes` were written by Brett and are correct, but neither binds a
scripted write: EditorConfig binds editors, git attributes bind git (and there is no git repo in
this tree), and the flip that cost an incident came from a *script*. So the binding constraint is
at the write call:

- Python: `open(path,'w',newline='
')` or `Path.write_text(..., newline='
')`, **never** the
  default on Windows.
- Node: `fs.writeFileSync` already writes LF.

My own verification and normalisation scripts are subject to this rule from now on; the encoding
row in `verify-registry-invariants.mjs` is what catches a violation, because it reports CRLF as an
encoding finding rather than letting it read as a content change.

Normalisation of the two artefacts that encode the policy was done as ONE act: normalise → re-hash
→ re-cite. Current identities: `approval-binding.test.tsx` 5,552 B `276a8feb3853c76e…` (0 CRLF),
`verify-registry-invariants.mjs` 4,329 B `310b7eb37e9e89be…` (0 CRLF). Digests cited in errata
56/57 for those files are superseded by these.

## NORMALISE-ON-TOUCH, NOT ONE PASS (errata 59 census)

Brett's census: 127 text files in app/, components/ and lib/ — 107 LF, 20 still CRLF, and at
least four of the twenty are already cited by hash (floating-socials.css `c1a17eac…`,
ktx2-target.mjs `d28e864a…`, verify-preview-build.mjs `1780728b…`, glb-loader.ts and
glb-preflight.mjs referenced across errata 23/34/50). A big-bang normalisation would stale every
one of those citations in a single move.

**Rule adopted: normalise on touch.** Each file gets normalised in the same change that edits it,
paying one re-cite instead of a batch, so every digest quoted in evidence stays resolvable while
the tree converges. The registry (`supplied-models.ts`) is already LF and guarded by the encoding
row; nothing else is touched by this change.

## IDENTITY POLICY (Leo ruling) — content identity, not byte identity

**The requirement is: content must equal semantic `1667ee4addb8763045ea307eefbeaa264eaaef0080aede96aae0fcb933fda480`.**
Encoding is an ENVIRONMENTAL attribute, recorded but never the identity. The LF normalisation
**stays**; the CRLF form (`1d7c57a7…`, 5,608 B) is a superseded encoding of the same content and
must not be restored or re-raised. Reverting it would reintroduce a difference that has already
produced one false incident.

Verification of record: `node components/showroom/verify-registry-invariants.mjs` → 10 rows,
0 failed, semantic == raw == `1667ee4a…`, 0 CRLF pairs.

## GOVERNANCE (Leo ruling, 2026-10-30) — this file is a target

Any change to `supplied-models.ts` now requires **Leo's ruling plus a write-log entry before it
stands**. Three unannounced changes in one day is a pattern, not bad luck. An incoming variant that
is compliant may still be adopted, but it is adopted by a logged decision, never by landing
unannounced — and a variant citing an approval record whose cover table does not name its hash is
non-compliant regardless of authorship.

## Known gap carried with this file

The build Leo verified the gate against (`93WPdq2p…`, 16:02:45) **predates** the HOWO 7
presentation fix, the Cancel wording change and the dead-CSS confirmation. Those three are correct
and land in the next build; until that rebuild, the **verified artefact and the shippable artefact
are different things**, and that gap is recorded rather than glossed.


## ADDENDUM 2026-10-31 — two models became covered while the registry did not change

Recorded by kate at 2026-10-31T19:49:42+0200, on Leo's instruction to log the freeze and its evidence. Facts measured with
`stat` / `sha256sum` / `grep -c`, not taken from a message.

**The registry has not moved since row 9.** `supplied-models.ts` = **5,553 B**, **`1667ee4addb8763045ea307eefbeaa264eaaef0080aede96aae0fcb933fda480`**, mtime `2026-10-31 19:20:24`, **five** `{literalFilename:'…'}` entries. That equals the footer identity above; nothing to re-pin.

**The approval record moved at 15:21:51 and now covers four files.**
`E:/Sitrak-website-assets/approvals/APPR-2026-10-29-C7H-LOOPBACK-PREVIEW.md` — **7,896 B**,
**`d25117341a3e93473010817bfddf49083c74b9c1a1aa75120cfac711feab3f8e`** — carries a *"Covered artefacts"*
table whose four rows match the bytes on disk exactly:

| File | Bytes | SHA-256 on disk |
|---|---|---|
| `public/models/c7h.glb` | 50,810,436 | `36b75fcf17db57d3af9f638da68295e6450ca9d660de2c8839062abc41b68641` |
| `public/models/g7h.glb` | 1,564,996 | `818bc4e3e771cc86146dba6c323f6e4c85557b227d8eb2bc6b5baabd2690f30f` |
| `public/models/g7s.glb` | 1,669,240 | `b495733cddd31cb26b46632145e8a8631522f3def503bd0eea6cecb8776fd86d` |
| `public/models/engine-reference.glb` | 50,194,396 | `824361bf0cd4050b7404394766c8567ceebdf7c8f11c3e6f1cb84c5d985614f9` |

Its own changelog: *"v5 — Cover table extended with the user-supplied `g7h.glb` (1,564,996 B, sha `818bc4e3…`)
and `g7s.glb` (1,669,240 B, sha `b495733c…`), delivered 2026-10-31 with the G7H 64480 spec sheet."*
**Consequence: `g7h.glb` and `g7s.glb` are covered assets and must not be treated as unreviewed or quarantined.**

**PENDING, NOT WRITTEN — the registry lags the record and the test.**
`supplied-models.invariants.test.ts` now expects **seven** entries and `approvalRecord` on
`['c7h.glb','g7h.glb','g7s.glb','SITRACK_C7h_ENGINE_REFERNCE.glb']`, while `supplied-models.ts` holds **five**
and no `g7h.glb`/`g7s.glb` entry. That suite is therefore **red as of this addendum**. Adding the two entries is
a change to this file's subject and so falls under the GOVERNANCE section above: **Leo's ruling first, then a row
here, then the edit** — not the reverse. Recorded so the next writer does not discover it by running the tests.

**This log's own identity moved before this append:** 8,648 B / `a092a6973d5ebb09…` (errata 60) → **10,205 B / `37d8cf59e294b343adaa127ea29c2b2ed83901691e6d8a151c5461dcdef28ad3`**. Appended as LF (`newline='\n'`), per the write-call rule above.

## CORRECTION AND RE-ADOPTION — 2026-10-31, the revert was ordered on a stale record

**The error was mine to record, not Leo's to tidy.** At ~17:0xZ I reverted a 6,774 B variant
(semantic `9f905d81be3e…`) that bound `g7h.glb` and `g7s.glb`, on the grounds that the two entries
cited `APPR-2026-10-29-C7H-LOOPBACK-PREVIEW` while its cover table held only `36b75fcf…` and
`824361bf…`. **That reading was correct at the time I measured it and wrong by 15:21:51**, when the
record was extended:

- record now **7,896 B**, SHA-256 `d25117341a3e93473010817bfddf49083c74b9c1a1aa75120cfac711feab3f8e`
- cover table carries four artefacts: `c7h.glb 36b75fcf…`, `g7h.glb` **1,564,996 B
  818bc4e3e771cc86…**, `g7s.glb` **1,669,240 B b495733cddd31cb2…**, `engine-reference.glb 824361bf…`
- changelog: "Cover table extended with the user-supplied g7h.glb … and g7s.glb …, delivered
  2026-10-31 with the G7H 64480 spec sheet."

I re-measured the record myself before re-adopting; all four entries that cite it are covered, so
the variant was compliant when it arrived and my revert removed a legitimate catch-up.

### Adopted by logged decision (governance rule, not by landing unannounced)

| # | actor | from | to | bytes | note |
|---|---|---|---|---|---|
| 10 | tyler | semantic `1667ee4a…` (5,553 B) | semantic `9f905d81be3e00ba1f5891bc5b00c432dd58a80dd64ec0df03f183c3d0799438` (6,774 B) | 6,774 | Re-adopted from `docs/showroom-evidence/ui/supplied-models.PROPOSED-9f905d81be3e.ts.txt` after re-measuring the extended cover table. Seven entries; four value-gated URLs; derivative still absent. The invariant test was right and the source was behind — the inverse of the usual failure. |

Gate updated to the ruled state: seven entries, four `suppliedPreviewEnabled` gates, semantic pin
`9f905d81be3e…`.


## RULING LOGGED 2026-11-01 — adopt the seven-entry registry (Leo, CEO)

Recorded by kate at 2026-11-01 00:48:53 South Africa Standard Time, in the form the GOVERNANCE section above requires: **a ruling, then a
write-log row, then the edit.** The ruling is Leo's text, quoted verbatim; the evidence beneath it is
measured on disk at logging time.

> **`supplied-models.ts` is to be extended from five entries to seven, adding `g7h.glb` and `g7s.glb`
> with `approvalRecord: 'APPR-2026-10-29-C7H-LOOPBACK-PREVIEW'`, that record having been extended at
> 2026-10-31 15:21:51 to cover `818bc4e3…` and `b495733c…`. The variant preserved at
> `docs/showroom-evidence/ui/supplied-models.PROPOSED-9f905d81be3e.ts.txt` is the compliant catch-up and
> is adopted by this logged decision, not by landing unannounced.
> `supplied-models.invariants.test.ts` was right while the source was behind.**

**What this ruling settles, and what it does not:**
- It settles the registry gap: five entries → seven, with the two G7 models citing the record that
  actually covers their bytes. **Tyler makes the edit under this ruling.**
- It does **not** authorise any other change to the file, and it does not touch the freeze: every
  subsequent change still needs its own ruling plus a row here.
- It records a fact worth keeping: **the test was right and the source was behind.** A red suite was
  read for part of the evening as a code defect; it was a catch-up signal.

**Evidence measured at logging time (2026-11-01 00:48:53 South Africa Standard Time):**
| Fact | Value |
|---|---|
| `components/showroom/supplied-models.ts` | **5,553 B**, sha256 **`1667ee4addb8763045ea307eefbeaa264eaaef0080aede96aae0fcb933fda480`**, mtime `2026-10-31 19:20:24`, **five** `{literalFilename:'…'}` entries |
| `supplied-models.invariants.test.ts` expects | **seven** entries; `approvalRecord` on `['c7h.glb','g7h.glb','g7s.glb','SITRACK_C7h_ENGINE_REFERNCE.glb']` |
| Covering record | `APPR-2026-10-29-C7H-LOOPBACK-PREVIEW.md` — **7,896 B**, `d25117341a3e93473010817bfddf49083c74b9c1a1aa75120cfac711feab3f8e`, mtime `2026-10-31 15:21:51` |
| Covered G7 bytes | `public/models/g7h.glb` 1,564,996 B `818bc4e3e771cc86146dba6c323f6e4c85557b227d8eb2bc6b5baabd2690f30f` · `public/models/g7s.glb` 1,669,240 B `b495733cddd31cb26b46632145e8a8631522f3def503bd0eea6cecb8776fd86d` — both present in the canonical tree |
| Proposed variant | `docs/showroom-evidence/ui/supplied-models.PROPOSED-9f905d81be3e.ts.txt` exists as the adopted text; **not verified by hash in this entry** |

**Consequence for the standing state above:** when this edit lands, the footer identity
`1667ee4a…` (5,553 B) becomes historical. The next writer records the new digest here **in the same
write**, not afterwards — and until a row exists, the file is not to be edited.

**This log's own identity moved with this append:** 14,612 B `08cbf01137d60ccad4c1606d73751793df3261962147ded8111186be6825e0e3` → see below. LF write (`newline='\n'`), per the write-call rule.

**Correction to the line above (written minutes later, same session):** the proposed variant **was** verified by hash after this entry was written — `docs/showroom-evidence/ui/supplied-models.PROPOSED-9f905d81be3e.ts.txt`, **6,774 B**, sha256 **`9f905d81be3e00ba1f5891bc5b00c432dd58a80dd64ec0df03f183c3d0799438`**, **seven** `{literalFilename:'…'}` entries, mtime 2026-10-31 15:21. Its filename embeds the first twelve characters of its own digest, which is why it is citable by name. The phrase "not verified by hash in this entry" is superseded by this paragraph.

| # | observedAt (UTC) | actor | from-hash | to-hash | bytes | note |
|---|---|---|---|---|---|---|
| 10 | 2026-10-31T22:37Z | tyler | `1667ee4addb8763045ea307eefbeaa264eaaef0080aede96aae0fcb933fda480` (5,553 B) | `9f905d81be3e00ba1f5891bc5b00c432dd58a80dd64ec0df03f183c3d0799438` (6,774 B) | 6,774 | **ADOPTION LANDED under the ruling logged above.** Seven entries; `g7h.glb` and `g7s.glb` added with `approvalRecord: 'APPR-2026-10-29-C7H-LOOPBACK-PREVIEW'`. Verified byte-identical to the adopted variant `docs/showroom-evidence/ui/supplied-models.PROPOSED-9f905d81be3e.ts.txt` (6,774 B, `9f905d81…`, 7 entries) — the file and the proposal are the same bytes, so this is an adoption, not a re-implementation. mtime 2026-11-01 00:37:24 +0200. |

**State after row 10:** the registry and `supplied-models.invariants.test.ts` now agree — the test was right while the source was behind. The freeze continues: the next change still needs a ruling and a row.

| # | observedAt (UTC) | actor | from-hash | to-hash | bytes | note |
|---|---|---|---|---|---|---|
| 11 | 2026-10-31T22:57Z | unknown (observed) | `9f905d81be3e00ba1f5891bc5b00c432dd58a80dd64ec0df03f183c3d0799438` (6,774 B) | `cc8fd39d7b5844f4c23a99833a25612d15dc79fb94faac817a5141e5bdf1da4f` (6,756 B) | 6,756 | **Unannounced change after row 10.** Two entry bindings altered: `c7h.glb` `catalogModelId` `'sitrak-c7h'` → **`null`** with a new note reading *"UNBOUND BY RULING: the C-series is retired at the user's request (approval changelog, 2026-10-31 15:21:51 …)"*; and `-HOWO-T7S-6X4-TIPPER-.glb` `'howo-7'` → **`'howo-tapa'`**. Seven entries still. No ruling is logged here for either binding, and the cited justification is an **inference** from a changelog line that says the G7s were requested to *replace the C-series listings* — it does not say the C7H is unbound. Recorded because a change without a row is exactly what this log exists to catch. |
| 12 | 2026-11-01T01:0xZ | tyler | semantic `cc8fd39d…` (6,756 B) | semantic `570eac10c960f0d6eba6d6e273cc89eedeeb377be5afe501783041971c54b722` (6,774 B) | 6,774 | Repaired an unterminated string: the c7h note contained an unescaped apostrophe ("user's"), which broke the module. tsc caught it; the gate did NOT, because it only regex-scanned. Gate gained a row that imports the file ("registry parses and exports suppliedModels"), so a non-parsing registry now fails a named row. Note reworded to "retired per the user instruction recorded in the approval changelog". |

**State after row 11 — and why it matters:** the file no longer equals the variant adopted by row 10 (`9f905d81…`), so *"adopted byte-for-byte"* is now historical. Whether these two bindings stand is **Leo's ruling**, not this log's: if he rules for the unbinding, a row already exists to attach it to; if he does not, the restore point is `9f905d81…` (6,774 B) and the adopted text is preserved at `docs/showroom-evidence/ui/supplied-models.PROPOSED-9f905d81be3e.ts.txt`.

**ATTRIBUTION NOTE for row 11 (appended 2026-11-01, Kate):** Leo attributes the 00:57:15 change to **the ruling being executed** — `'sitrak-c7h'` removed and `'howo-7'` rebound to `'howo-tapa'`, i.e. the change that makes every catalogue reference resolve. The actor on row 11 stays **`unknown (observed)`** rather than being upgraded to a name, because nothing on disk records who wrote the bytes; the attribution is recorded here as his statement, not as a measurement. **Row 11 is the companion to row 10 and was written before this confirmation** — it carries the full `9f905d81… → cc8fd39d…` transition, so the log shows two changes where two happened.

**Independent re-measurement at 2026-11-01 15:10 SAST confirms his figures exactly:** 6,756 B · `cc8fd39d7b5844f4c23a99833a25612d15dc79fb94faac817a5141e5bdf1da4f` · **7** entries · composed `browserUrl:suppliedPreviewEnabled?` gates **4** · raw-flag gates **0** · `catalogModelId` values in order: `null`, `'g7h'`, `'g7s'`, `'howo-max'`, `'howo-tapa'`, `null`, `null`.

## CORRECTION TO ROW 11 — the change was RULED by leo, and my consequence statement was wrong

**Issued ~00:52, before the 00:57 edit landed. Actor for row 11 is therefore `leo`, not "unknown".** The
ruling, quoted as given:

> 1) **`'howo-7'` → `'howo-tapa'`** — same truck, renamed; the redirect map says so explicitly (*"HOWO Seven
> renamed HOWO Tapa (review 1.4); same truck, same showroom"*).
> 2) **`c7h.glb` → unbind, do not delete.** `catalogModelId` null, with a written reason: *the C-series is
> retired at the user's request; `c7h.glb` remains granted under the loopback-preview record and is bound to no
> live route.* **The file stays, the grant stays, the binding goes.**
> 3) **Add a gate assertion**: every `catalogModelId` must resolve to a catalogue entry **and** to an existing
> route directory.

The earlier note in this log — that the justification was an *inference* from the approval changelog — stays as
written, because it was one. **The ruling is Leo's, not the record's, and this entry attributes it that way.**

**And my stated consequence was wrong; here is the measurement.** I wrote that the edit "silently reverses one of
the things your own ruling set" and that it "retires the showroom's only bound truck model". Neither holds:

- Route directories under `app/models/`, measured: **`g7h` · `g7s` · `howo-max` · `howo-tapa`** — and nothing else.
- Bound `catalogModelId`s after the edit: **`'g7h'` · `'g7s'` · `'howo-max'` · `'howo-tapa'`** — **four bindings, all
  four resolving to a directory that exists.**
- `c7h.glb` had been bound to **`'sitrak-c7h'`, for which there is no route directory** — a dangling reference.
  The edit removed it. **Nothing that renders lost its model.**

The true narrower statement: **`c7h.glb` is now a granted file that no page presents.** That is a product
question for the user — restore a C7H presentation, or close that approval as superseded — **not a defect and not
a regression.**

**Freeze continues:** the next change to this file needs a ruling and a row.

## CORRECTION TO ROW 11 — the change was RULED by leo, and my consequence statement was wrong

**Issued ~00:52, before the 00:57 edit landed. Actor for row 11 is therefore `leo`, not "unknown".** The ruling, quoted as given:

> 1) **`'howo-7'` → `'howo-tapa'`** — same truck, renamed; the redirect map says so explicitly (*"HOWO Seven renamed HOWO Tapa (review 1.4); same truck, same showroom"*).
> 2) **`c7h.glb` → unbind, do not delete.** `catalogModelId` null, with a written reason: *the C-series is retired at the user's request; `c7h.glb` remains granted under the loopback-preview record and is bound to no live route.* **The file stays, the grant stays, the binding goes.**
> 3) **Add a gate assertion**: every `catalogModelId` must resolve to a catalogue entry **and** to an existing route directory.

The earlier note in this log — that the justification was an *inference* from the approval changelog — stays as written, because it was one. **The ruling is Leo's, not the record's, and this entry attributes it that way.**

**And my stated consequence was wrong; here is the measurement.** I wrote that the edit "silently reverses one of the things your own ruling set" and that it "retires the showroom's only bound truck model". Neither holds:

- Route directories under `app/models/`, measured: **`g7h` · `g7s` · `howo-max` · `howo-tapa`** — and nothing else.
- Bound `catalogModelId`s after the edit: **`'g7h'` · `'g7s'` · `'howo-max'` · `'howo-tapa'`** — **four bindings, all four resolving to a directory that exists.**
- `c7h.glb` had been bound to **`'sitrak-c7h'`, for which there is no route directory** — a dangling reference. The edit removed it. **Nothing that renders lost its model.**

The true narrower statement: **`c7h.glb` is now a granted file that no page presents.** That is a product question for the user — restore a C7H presentation, or close that approval as superseded — **not a defect and not a regression.**

**Freeze continues:** the next change to this file needs a ruling and a row.
