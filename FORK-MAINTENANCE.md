# PCC fork maintenance

For feature descriptions, examples and controls, see the
[writing plugins user guide](WRITING-PLUGINS.md).

This guide covers the changes on `codex/writing-plugins`, originally based on upstream
VansRouter v0.91.21 (`cbbeccc8cf5989210459de007721428975710c3d`).
The original implementation commits are `9f689cc` (writing plugins and npm lockfile) and
`302a6c3` (Docker runtime security updates). It does not describe features on
the fork's default branch until these commits are merged there.

## Upstream synchronization and staging image, 2026-09-23

Merge commit `8b147bfa3aa8e2253b5d186c8bdc6422c36f388b` includes all
history through upstream v0.91.30 (`a4b18802`) on `codex/writing-plugins`.
Both package versions are 0.91.30. The fork image version is
`0.91.30-writing.1`; no upstream release tag or npm package was published.

The chat-handler conflict preserves the independent writing settings and adds
upstream's `clientBodyBytes` parameter. The Docker conflict retains the fork's
lockfile-based native dependency installation and security-updated base instead
of upstream's separate, unlocked SQLite install. Writing prompts, Monaco's local
sanitizer patch, rebuilt Tailscale binaries and persistent volume names remain.

Dependency refresh: Next.js and its related packages 16.3.6, React/React DOM
19.3.0 in both packages, DOMPurify 3.4.16, marked 18.0.14, open 11.0.4,
compatible transitive updates, Node 22.23.2 and npm 11.20.0. Both npm lockfiles
and the pnpm lockfile were refreshed. Tailscale stable remains 1.102.4.
Updates outside existing compatibility ranges were reviewed but deferred:
better-sqlite3, confbox, ESLint, js-yaml, material-symbols, Monaco, undici,
uuid, Vitest, and the CLI's esbuild/open. No claim of a clean vulnerability scan
is made from dependency freshness.

Published and verified by normal Docker pull:

`registry.pcc.fyi/pcc-staging/vansrouter:0.91.30-writing.1@sha256:714672966583c07b42aa4f479027fc13c5b30cb82ca05e4216c4318bd0324f5f`

The Linux amd64 image labels identify source commit `8b147bfa` and the fork
repository. Production promotion is pending: AK's scan request returned HTTP
403 on 2026-09-23, correlation ID `c35df8934875982e0d8083e12a296d84`.
The repository scan listing contained no scans for this version. An authorized
operator must complete the image scans before promotion. No production container,
deployment configuration, database or volume was changed.

Verification:

- Linux amd64 full suite: 304 files passed, 3,530 tests passed, 82 skipped,
  zero failures. The Next.js production build and native SQLite query passed.
- macOS before synchronization: 3,164 passed, five failed, 82 skipped. After
  synchronization and updates: 3,524 passed, six failed, 82 skipped. Pristine
  upstream with the same updated dependencies: 3,504 passed, the same six
  failures, 82 skipped. Failure names were compared directly. They cover two
  Linux header snapshots, three `/var` versus `/private/var` assertions and
  the new SQLite fixture's rejected macOS temporary path. All pass on Linux.
- An intermediate macOS run also hit a MiMo live bootstrap connection timeout;
  the final run passed that test. Opt-in provider tests remain skipped.
- Fork-focused suite: 106 tests passed in seven files. Undefined-variable lint
  and Git whitespace checks passed; the Linux suite includes the hooks lint gate.
- Disposable-container health/version, password login, independent writing
  toggles, invalid boolean rejection, API-key models access, migrations and
  SQLite integrity passed. Health/auth/settings checks were repeated on the
  final labeled image. npm install/ci/npx as the node user and Tailscale userspace
  startup (`NeedsLogin`) passed before the metadata-only labeling build.
- Bundled application CycloneDX 1.5 SBOM contains 189 dependency records.
  Syft generated final-image CycloneDX 1.5 and native JSON inventories with
  1,005 components and 479 package records respectively. Inventory generation
  is not vulnerability scanning. Evidence is in
  `/tmp/vansrouter-sync-20260923/` on the build workstation.

ARM64 runtime, browser UI, full external-provider integration and production
deployment were not verified for this image.

## Upstream synchronization, 2026-09-15

`codex/writing-plugins` now includes upstream v0.91.22, commit
`a4bc6a11d58be1da342204dba3908b8556835ea4`, through a merge that preserves
the published fork history. The writing plugins, independent settings,
dashboard controls, attribution, npm lockfile and runtime security pins remain.

Upstream's Kiro injector now appends guidance directly to conversation content
without creating `systemPrompt` metadata. Use this implementation together with
the fork's Responses string-input handling. The Docker builder runs on
`BUILDPLATFORM`; a separate stage compiles SQLite for the target architecture.
Both dependency stages use the committed npm lockfile. Keep Alpine/npm updates
in the builder and target base, plus the pinned Tailscale checksums.

For future synchronization, fetch the upstream branch explicitly. Older clones
may have only a release-tag fetch refspec. Disable tag pruning when fetching
multiple remotes, because the fork may not contain upstream's tags:

```sh
git -c fetch.pruneTags=false fetch --no-prune --no-tags origin \
  refs/heads/main:refs/remotes/origin/main
git -c fetch.pruneTags=false fetch --no-prune --no-tags pcc
```

Start with a clean checkout and record the unit/translator baseline before
merging. Merge `origin/main` into the fork branch, reconcile shared injection
and Docker changes, and refresh `package-lock.json` with
`npm install --package-lock-only --ignore-scripts --no-audit --no-fund`.
Run the same tests again, the focused suite below, and the Docker build/runtime
checks before committing and pushing the fork branch. Do not reapply the old
deployment patches to this branch. This source synchronization does not update
the separate deployment checkout or publish a release.

Push a source synchronization with `git push --no-follow-tags pcc HEAD`.
The 2026-09-15 push inherited global `push.followTags=true` and also copied
upstream's annotated tags to the fork. No release workflow appeared in the
subsequent GitHub Actions checks. The tags were not deleted or moved.
This checkout now sets `push.followTags=false` locally; use the explicit flag
in other clones to avoid repeating this side effect.

Validation for this synchronization:

- Focused suite: 106 passed in seven suites.
- Linux amd64: 295 passed in nine suites (the focused suite plus
  `golden-url-header.test.js` and `deploy-atomic.test.js`). The full Linux run
  was stopped because of emulation overhead; full-suite comparison used macOS.
- macOS unit/translator baseline: 3,086 passed, 3 failed, 82 skipped.
  After merging: 3,164 passed, 5 failed, 82 skipped. Pristine v0.91.22:
  3,144 passed, the same 5 failures, 82 skipped. The failures are two
  Linux-specific header snapshots and three deployment tests comparing
  `/var` with macOS's canonical `/private/var` paths. Upstream resolved the
  earlier CLI SQLite packaging test failure.
- Linux amd64 Docker/Next build and native SQLite query passed. The local image
  is `vansrouter:0.91.22-writing-sync-final`, image manifest
  `sha256:dc6eb5493a24b9335a155daa139dd5e9eb3a9f44b36484de013fa41f80fc85ce`.
- Disposable-container checks passed: version/health, login, SQLite file,
  default settings, boolean validation, independent toggles, save/reload,
  API-key requests, request bypass, streaming tool calls and 429 account
  fallback. Each enabled writing prompt occurred once per outbound request.
  These used a local mock provider, not a live external AI provider.
- As the node user, npm install/ci and npx execution of a local fixture passed.
  Tailscale 1.102.4 started in userspace mode; its socket reported `NeedsLogin`.
- Upstream's new line-ending attributes normalized seven files during the
  merge. Trailing whitespace was removed in two of those files; no additional
  behavior changes were made there. Both staged and unstaged diff checks passed.

No production deployment, registry publication, vulnerability rescan, arm64
runtime validation or browser UI validation was performed for this sync.
The previously recorded security findings below are not resolved by this sync.

## Writing behavior and settings

Dashboard → Token Saver exposes five independent plugins. Caveman and Ponytail
keep their existing toggles and levels. The three additions are:

| Plugin | Boolean setting | Prompt source |
| --- | --- | --- |
| Plain English | `plainEnglishEnabled` | `open-sse/rtk/plainEnglishPrompts.js` |
| STE-inspired | `steEnabled` | `open-sse/rtk/stePrompts.js` |
| Action-first (i-have-adhd) | `actionFirstEnabled` | `open-sse/rtk/actionFirstPrompts.js` |

Each new setting defaults to true when absent; an explicit false persists.
The existing authenticated `GET /api/settings` and `PATCH /api/settings` expose
them. PATCH accepts actual booleans, not strings, numbers or null. For example,
`{"steEnabled":false}` disables only STE-inspired. No schema migration is needed.

These are bundled router prompts, not downloaded skills or client plugins.
They guide newly generated replies and instructions without an extra model
call or rewriting incoming task text. They add input tokens. Laconic is excluded.
STE-inspired is guidance, not an ASD-STE100 dictionary or compliance checker;
model adherence is not guaranteed.

The existing request header `x-9router-token-saver: off` bypasses all these
injectors for that request. Disabling the three additions leaves the original
Caveman/Ponytail behavior. Do not combine their settings or couple their toggles.

## Where to make changes

| Responsibility | Files |
| --- | --- |
| Wording and individual injection | `open-sse/rtk/{plainEnglish,ste,actionFirst}{,Prompts}.js` |
| Rules when enabled styles overlap | `open-sse/rtk/writingCompatibility.js` |
| Provider dispatch after translation | `open-sse/handlers/chatCore.js` |
| Forward effective settings to dispatch | `src/sse/handlers/chat.js` |
| Defaults and persistence | `src/lib/db/repos/settingsRepo.js` |
| Boolean API validation | `src/app/api/settings/route.js` |
| Dashboard controls and save/error state | `src/app/(dashboard)/dashboard/token-saver/TokenSaverClient.js`, `TokenSaverSettings.js` in the same directory |
| Shared provider-aware injection | `open-sse/rtk/systemInject.js`, `open-sse/rtk/formatInjectors.js` |
| Source revisions and MIT attribution | `open-sse/rtk/writing-plugin-NOTICES.txt` |

The compatibility prompt is conditional on the enabled plugins. It preserves
grammar, meaningful uncertainty, exact technical artifacts, required detail and
requested formats when they conflict with compression. It does not merge the
plugins. Keep their individual prompts and toggles independent.

Preserve these injection details when editing shared code:

- Prompts use a single paragraph (`join(" ")`). String deduplication splits on
  double newlines; adding paragraph breaks requires revisiting deduplication.
- Responses string input without `instructions` must still receive guidance.
- Kiro uses conversation content on the wire. Its injector must not create
  `systemPrompt`; it must not appear as a top-level JSON field.
- Repeated injection on the same body must not duplicate guidance. Test actual
  translators and JSON serialization, not just an intermediate object.
- Preserve original task text, tool definitions, schemas and requested formats.
  Arbitrary external cloning/reuse of mutable request bodies is not guaranteed.

When adapting newer source skills, review their instruction changes and license,
then update the pinned revisions and notices. Do not fetch skills at runtime.

## Verification for future changes

With dependencies installed, run the focused suite from the repository root:

```sh
npx --no-install vitest run -c tests/vitest.config.js \
  tests/unit/writing-plugins.test.js \
  tests/unit/system-inject.test.js \
  tests/unit/system-inject-responses-chat.test.js \
  tests/unit/caveman-ponytail.test.js \
  tests/unit/settings-revision.test.js \
  tests/unit/headroom-chat-core.test.js \
  tests/unit/minimax-transport-target-format.test.js
git diff --check
```

Cover absent defaults, persisted false, rejected invalid API values, each toggle
in isolation, request bypass, overlapping styles, Responses string input and
Kiro serialization. For UI edits, check successful save/reload and failed-save
state at desktop and mobile widths. For dispatch edits, exercise streaming,
tool calls and retries/fallback against a disposable staging provider; verify
that each enabled prompt occurs once in each outbound request.

Historical validation on 2026-09-13: the focused suite passed 106 tests in seven
suites. The broader unit/translator run reported 3,086 passed, 3 failed and 82
skipped. All three failures reproduced on pristine upstream: two Linux-oriented
golden URL/header snapshots on macOS and one CLI SQLite packaging fixture that
requires bundled runtime directories. These results are a baseline, not a
substitute for checking a future change. Linux amd64 Docker/Next builds and
staging request/dashboard checks also passed.

An observed upstream limitation remains: non-streaming Responses requests sent
through a chat provider can return a `chat.completion` envelope. The native
Responses path passed; this fork does not fix that envelope conversion.

## Runtime dependencies and image updates

### Project-generated SBOMs

Use native npm for the application lockfile and upstream Syft for the final
Docker image. No custom generator, vulnerability scan or DTrack upload is involved.
Install Syft through its official installation instructions (macOS: `brew install syft`).

`npm run build` (and direct `node scripts/build.js` builds) automatically writes
`<distDir>/standalone/sbom/application.cdx.json`. Generation errors fail the build.
The standalone artifact and Docker image include this file; Core CI also uploads
it as a build artifact. The Docker release workflow installs pinned Syft, catalogs
the newly built image by digest for both amd64 and arm64, and uploads CycloneDX
and native Syft JSON artifacts. Image SBOM generation errors fail that build job.
This post-image step runs in the release workflow, not inside a bare local
`docker build` invocation.

For ad-hoc generation outside the build:

```sh
mkdir -p sbom
npm run --silent sbom > sbom/application.cdx.json.tmp && \
  mv sbom/application.cdx.json.tmp sbom/application.cdx.json
npm run --silent sbom:image -- docker:vansrouter:0.91.22 \
  --source-name vansrouter-image --source-version 0.91.22 \
  --output syft-json=sbom/image.syft.json \
  > sbom/image.cdx.json.tmp && mv sbom/image.cdx.json.tmp sbom/image.cdx.json
```

Replace the image reference and version with the exact release. Use an immutable
image reference where available. Both commands emit CycloneDX 1.5 JSON; `--silent`
keeps npm's banner out of the output. The additional native Syft JSON preserves
image-source metadata that the CycloneDX conversion can omit. Generated `sbom/`
files are excluded from Git and the Docker build context.

The application SBOM uses `package-lock.json` with development dependencies
omitted and production optional dependencies retained. It describes the npm
lockfile, not the installed pnpm tree or traced Next.js bundle. The image SBOM
catalogs the selected image's OS packages, npm packages and embedded Go modules.
Generate separate image inventories for each released architecture. Keep
application and image projects/versions separate in any later DTrack imports.
License metadata does not establish policy compliance or release approval.

Local verification on 2026-09-15: npm emitted 189 production dependency records,
all with license metadata and package URLs. Syft 1.51.1 cataloged 479 package
records from the Linux arm64 `vansrouter:0.91.22-sbom-review` image, including
Alpine packages, Next.js and embedded Go modules. Its CycloneDX output contains
1,004 components including file records; 340 components have license metadata.
Both CycloneDX outputs parsed as 1.5 with unique references and valid dependency
links. These are inventory checks, not vulnerability or policy validation.

`Dockerfile` pins the Node base digest, upgrades Alpine packages and installs
global npm 11.19.1 in the host builder and shared target base. It rebuilds both
Tailscale 1.102.4 binaries from a SHA-256-verified source archive using a pinned
Go 1.26.8 image. The build upgrades `golang.org/x/crypto` to v0.56.0,
`golang.org/x/image` to v0.45.0 and `github.com/insomniacslk/dhcp` to
v0.0.0-20260719225207-c76316d4aa82. These fixes are not in the upstream 1.102.4
binary archives. Return to upstream binaries when their module inventory covers
these fixes. The custom long version identifies this downstream build.

Monaco's private DOMPurify copy is replaced during `postinstall` with the
installed DOMPurify 3.4.15 ESM source. Both npm and pnpm override its nested
dependency. `TranslatorEditor.js` loads the local editor and local JSON/editor
workers; the loader's default CDN would bypass the patched source. Keep the
private sanitizer instance separate because Monaco modifies its hooks.

Keep `package-lock.json` committed: the Docker build uses `npm ci`. The upstream
ignore rules ignore lockfiles, so creating a replacement may require
`git add -f package-lock.json`. Review lock changes with `package.json` changes.

For a runtime update:

1. Update the Node digest/npm version as needed. When changing Tailscale, update
   the source archive checksum with `TAILSCALE_VERSION`, review the Go dependency
   upgrades and toolchain digest, and verify every supported architecture.
   Overriding only the version will fail checksum verification.
2. Keep npm/npx: PXPIPE installation and updater paths use them at runtime.
   Keep both Tailscale binaries and existing paths. Check for persistent
   `/app/data/bin` overrides, which may supersede bundled binaries.
3. Build under a new image tag. Verify native SQLite, npm install/ci/npx as the
   node user, and Tailscale userspace daemon/socket startup. Repeat relevant
   router staging checks. Only Linux amd64 was exercised for this release.
4. Upload to staging and use Artifact Keeper for vulnerability scanning. Record
   the completed scan ID, image digest and remaining findings. Do not install
   or run a separate local/host scanner for this workflow.
5. Promote the verified image through the deployment workflow. Preserve the
   existing data volume, back it up, and check health and authenticated traffic.

Builds are not byte-for-byte reproducible: `apk add` and `apk upgrade` use the
current Alpine repositories. Record and
deploy the tested image digest; do not overwrite an already published tag.

### Staging remediation, 2026-09-16

Built Linux amd64 from base commit `7466e144` plus the dependency/security changes
above. Published `pcc-staging/vansrouter:0.91.22-7466e144-security.2`, digest
`sha256:a8c81a6abd113685de7aab6696a6aeb906204be7b57212cbd9fb9f929c6eb540`.
This image was scanned in staging, then deployed unchanged on 2026-09-16 as
recorded below. Deployment does not resolve the remaining findings.
The publisher cannot request scans (AK returns 403). The administrator-triggered
verification scans completed, starting at 2026-09-16 15:34:10 UTC:

| Source | Verification scan ID | Result |
| --- | --- | --- |
| Trivy | `8c34fe8e-3ec8-4392-8ac5-f1a029e5b051` | Completed: 2 high, both GO-2026-5932; down from 31 findings |
| Grype | `8cf1845d-e4c4-4575-b87c-ca2cf237b687` | Completed: 3 medium, all CVE-2025-60876; down from 6 findings |
| Dependency | `649c308a-2751-445d-aa5e-2c01694dfeb9` | Completed: 0 findings; does not replace image scanning |

No new component/advisory pairs appeared in either image scanner. The reported
DOMPurify, x/image and fixable x/crypto findings are absent. The separate
`not_applicable` result is not clean-scan evidence. Registry metadata still
matches the published candidate digest. Remaining findings were not suppressed.

The baseline `0.91.22-7466e144-security.1` results were:

| Source | Scan ID | Result |
| --- | --- | --- |
| Trivy | `61ce0017-ea34-4052-a6cb-731b33075dfc` | Completed: 0 critical, 6 high, 21 medium, 4 low |
| Grype | `572d1387-9021-444d-9d15-7e468bea0996` | Completed: 0 critical, 3 high, 3 medium |
| Dependency | `16efdabc-342f-4dcd-87f7-7f56e391c273` | Completed: 0 findings; does not replace image scanning |

These scans started at 2026-09-16 14:27:27 UTC. Counts overlap and are not a
unique vulnerability total. Original findings were not acknowledged/suppressed.
The image source inventory and version-specific DTrack mapping are recorded in
`security-inventory.yaml`.

Validation: Docker build, native SQLite query, health/version, login, migrations,
npm install/ci/npx as the node user, and Tailscale userspace daemon/socket startup
passed. `go version -m` on both image binaries confirms the upgraded modules.
The GHSA-55q2-fjhq-7xh7 browser reproducer executed with DOMPurify 3.2.7 and did
not execute with 3.4.15; ordinary headings/links survived sanitization. Monaco's
private sanitizer matches the official patched ESM bytes. Before and after
`npm test`: 3164 passed, 5 failed, 82 skipped, with identical failure names. The
five failures are macOS/Linux header snapshots and `/var` versus `/private/var`
deployment assertions. Opt-in provider integration tests were not enabled.
Chrome checks passed for local editor/worker loading, JSON formatting and
diagnostics, plaintext editing and theme switching, with jsDelivr blocked and
no page exceptions. The missing `vllm.webp` (404) and model-less translation
request (500, `startsWith` on undefined) reproduced identically on both baseline
and candidate images; those unrelated defects remain. Desktop and mobile
screenshots were captured; mobile layout polish was not part of this patch.

Remaining findings and coverage limits:

- BusyBox CVE-2025-60876 has no fixed Alpine package in the Grype result; it is
  unresolved. Alpine v3.24's current security database also lists no fix for this
  CVE. Updating the Go/npm dependencies does not fix it.
- GO-2026-5932 covers the unmaintained `golang.org/x/crypto/openpgp` packages.
  Linux amd64 dependency traversal for both rebuilt commands contains none of
  those imports. Repeating `go list -deps` in the cached Docker Tailscale stage,
  using the pinned Go 1.26.8 toolchain with `CGO_ENABLED=0 GOOS=linux GOARCH=amd64`,
  checked 828 package imports and confirmed their absence. Trivy's two high
  module-level findings therefore do not identify linked OpenPGP code in these
  binaries. The findings remain visible in AK.
- DTrack's candidate findings endpoint returned 43 rows while its current metrics
  recorded 23 findings (14 high, 5 medium, 4 unassigned). All 43 rows were checked
  against upstream OSV ranges: 41 are outside the affected ranges; the other two
  are the OpenPGP advisory above. The baseline had 60 endpoint rows and 32 metric
  findings. These reporting discrepancies were not suppressed or counted as
  vulnerabilities fixed by this patch. The DHCP advisory is absent from the
  candidate findings.
- DTrack's candidate BOM import timestamp is 15:34:44.252 UTC and its recorded
  vulnerability analysis timestamp is 15:34:46.338 UTC on 2026-09-16. It reports
  219 license-policy rows (117 allowlist checks, 102 empty/custom license-expression
  checks) and two security-policy rows, versus 221 license and three security
  rows for the baseline. These remain open; package upgrades do not establish
  license compliance. No policy was relaxed.
- Persisted `/app/data/bin/tailscaled` can override the bundled daemon. Existing
  volumes require separate binary inspection before rollout. The srv0 rollout
  confirmed that no persisted override exists. Only Linux amd64 was built/tested; live
  Funnel authentication/traffic and other architectures were not exercised.

### Production deployment, 2026-09-16

Source commit `7685b034` was pushed to `pcc/codex/writing-plugins`. A separate
committed-tree Docker build completed successfully; deployment retained the
exact previously scanned image rather than substituting the rebuilt artifact.
The production Compose image is pinned to
`registry.pcc.fyi/pcc/vansrouter:0.91.22-7466e144-security.2@sha256:a8c81a6abd113685de7aab6696a6aeb906204be7b57212cbd9fb9f929c6eb540`.

Administrator promotion created production artifact
`c725a27b-aab9-4422-9b17-7f3062eefab1`. The Docker API initially lacked the
manifest after promotion. Pushing the identical image through Docker retained
its digest, and a normal Docker pull on srv0 succeeded before activation.
This verifies this image's availability, not historical promoted images.

Production container `9router` became healthy. Public version returned
`0.91.22`, health returned `{"ok":true}`, and `/dashboard` returned 307 to
`/masuk`. SQLite integrity returned `ok`; authenticated `/v1/models` returned
200 with 33 models. OIDC initiation returned 307 to `https://sso.pandino.co`.
API-key requirements, OIDC settings, and Caveman/Ponytail ultra settings matched
the predeployment baseline. The original `9router_9router-data` volume remains
attached. Full human OIDC sign-in was not tested.

Before activation, a full volume backup and a verified SQLite online backup
were uploaded to `r2:pcc-9router/backups/pcc-soho-srv0/` as
`9router_9router-data_13.tar.gz` and
`predeploy-0.91.22-security.2-20260916.sqlite.gz` respectively.
Remote baseline, verification output, database backup, and previous Compose
configuration are retained in
`/home/pcc/builds/vansrouter-0.91.22-deploy.Yv5s3m`.
Rollback uses `compose.previous.yaml` and the cached
`registry.pcc.fyi/pcc/vansrouter:0.91.21-writing.2`, preserving the same volume.

The fresh macOS suite reported 3164 passed, 5 failed, 82 skipped, matching the
recorded baseline failures. The two affected suites passed in Linux Docker:
189 tests passed. No scan findings or policy violations were suppressed.

### Recorded security result, 2026-09-13

Artifact Keeper scan `c8e269d8-ae12-4a6e-9e5c-07b448650361` for writing.2
reported 6 findings (0 critical, 3 high, 3 medium), down from 128 in writing.1.
This is a historical result, not a claim about today's advisory database.

- Three high findings affected Tailscale's bundled `golang.org/x/crypto v0.54.0`:
  CVE-2026-56855, CVE-2026-56854 and CVE-2026-78662. The scan listed v0.56.0 as
  resolving all three. Updating application npm dependencies cannot fix these
  compiled Go modules; use binaries built with the fixed module.
- Three medium rows were CVE-2025-60876 in `busybox`, `busybox-binsh` and
  `ssl_client` 1.37.0-r31. No fixed Alpine package was listed at validation time.
  The raw-control-character wget issue was reproduced. It remains unresolved.

## Relationship to deployment configuration

The source commits above match the patches used for image
`0.91.21-writing.2`, digest
`sha256:cf476efe166b3f07395ce31851cc8330441d352e597f281cf5abb128843dcee9`.

The separate `pcc-docker-srv0` deployment checkout, under `apps/9router`, still
builds from pinned upstream plus `patches/writing-plugins.patch` followed by
`patches/runtime-security.patch`. Pushing this fork branch does **not** update
that build source. For a future release, either regenerate and validate those
patches or explicitly change the deployment builder to a pinned fork commit.
Do not apply these patches again to this already-patched branch.

That deployment directory contains `WRITING-PLUGINS-VALIDATION.md` (historical
writing.1 evidence) and `IMAGE-SECURITY-REMEDIATION.md` (writing.2 scan and rollout
record). Its rollout record also documents an unresolved registry Docker API
`MANIFEST_UNKNOWN` after promotion. Verify normal pulls before relying on that
registry copy for recovery; a cached image is not proof of registry availability.

Rollback changes the deployed image while retaining the existing `9router-data`
volume. The older version ignores the new settings. Follow the deployment
repository's backup/rollback procedures and `.agent/cicd.md` for upstream release
work; an ordinary fork branch push does not publish a release.
