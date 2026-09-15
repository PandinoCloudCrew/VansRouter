# PCC fork maintenance

For feature descriptions, examples and controls, see the
[writing plugins user guide](WRITING-PLUGINS.md).

This guide covers the changes on `codex/writing-plugins`, originally based on upstream
VansRouter v0.91.21 (`cbbeccc8cf5989210459de007721428975710c3d`).
The original implementation commits are `9f689cc` (writing plugins and npm lockfile) and
`302a6c3` (Docker runtime security updates). It does not describe features on
the fork's default branch until these commits are merged there.

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

`Dockerfile` pins the Node base digest, upgrades Alpine packages and installs
global npm 11.19.1 in the host builder and shared target base. It bundles both
Tailscale binaries at 1.102.4 with per-architecture archive SHA-256 checks.

Keep `package-lock.json` committed: the Docker build uses `npm ci`. The upstream
ignore rules ignore lockfiles, so creating a replacement may require
`git add -f package-lock.json`. Review lock changes with `package.json` changes.

For a runtime update:

1. Update the Node digest/npm version as needed. When changing Tailscale, update
   every supported architecture's checksum together with `TAILSCALE_VERSION`.
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

Builds are not byte-for-byte reproducible: `apk upgrade` uses the current Alpine
repositories and the Tailscale download stage uses an Alpine tag. Record and
deploy the tested image digest; do not overwrite an already published tag.

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
