# VansRouter existing security findings review

Read at 2026-09-15T19:53:15+00:00. AK CLI 1.2.0. Existing evidence only; no scans, BOM uploads, triage changes, policy changes or deployment.

## Findings and priorities

1. **High: three Grype findings remain in bundled `golang.org/x/crypto v0.54.0`.** CVE-2026-56854 concerns SSH source-address restrictions; CVE-2026-56855 and CVE-2026-78662 concern connection deadlocks. Grype lists fixes at 0.55.0, 0.56.0 and 0.56.0 respectively. The existing remediation record locates this module in bundled Tailscale 1.102.4. Review a Tailscale build containing at least x/crypto 0.56.0, preserving both binaries and architecture checksums. Application npm dependency changes cannot replace a compiled Go module. These findings are acknowledged in AK; acknowledgement does not establish remediation or exploitability.

2. **High: DTrack also flags `undici 6.28.0` for CVE-2026-19534.** The stored NVD description identifies an uncaught WebSocket handshake exception when a server supplies an unrequested subprotocol. It lists fixed versions 6.28.1, 7.29.1 and 8.10.2. The same component has medium CVE-2026-85024 (WebSocket decompression crash) and low CVE-2026-18540 (ranged-retry framing). Locate the exact 6.28.0 copy in the scanned image before choosing a remediation; the SBOM component does not prove which application/runtime path uses it. No exploit or reachability test was performed.

3. **Medium: BusyBox CVE-2025-60876 remains reported in three Alpine package records.** `busybox`, `busybox-binsh` and `ssl_client` are all 1.37.0-r31. Grype returns no fixed version. The historical remediation document records a local reproduction of wget request-header injection through raw control characters. This review did not repeat that reproduction or check current Alpine advisories.

4. **DTrack findings require version-match and count reconciliation.** Detailed findings for writing.2 return 65 source-specific records: 25 high, 8 medium, 1 low and 31 unassigned. The metrics endpoint reports 37 findings, including 23 high, 8 medium and 1 low. Its unassigned field is 0, so those severity fields do not sum to 37; the project listing instead reports 5 unassigned. These are separate API views, not additive counts. Old advisories such as CVE-2018-17142 on x/net v0.56.0 and CVE-2022-29526 on x/sys v0.47.0 are candidates for version-range validation, not proven current vulnerabilities or confirmed false positives. DTrack additionally lists five high NVD x/image findings on v0.41.0 (CVE-2026-33813, CVE-2026-46601, CVE-2026-46602, CVE-2026-46603, CVE-2026-46604); the first description specifically requires a 32-bit platform. The findings response returns no structured fixed versions for these Go records.

5. **License policy reports 221 FAIL records across 120 components.** Of those components, 96 have no license, resolvedLicense or licenseExpression in the returned violation component. Missing metadata is not proof of a prohibited license. Other rows include Alpine GPL/LGPL components, npm Artistic-2.0, and unresolved expressions such as DOMPurify `MPL-2.0 OR Apache-2.0`. Validate license expressions, chosen options, exceptions and shipped notices before triage. DTrack also reports four SECURITY FAIL records. Policy rows are not a legal opinion or proof that registry enforcement is enabled.

## Identity and coverage

Current source is version 0.91.22 at commit f16880c31f33b8456847c75537dded7ba28d231e. No matching 0.91.22 AK artifact or DTrack project appeared in the accessible inventory. The local image from the preceding sync was not uploaded or scanned. Older evidence does not approve that source or image.

`security-inventory.yaml` records only verified names, versions, repository paths, digests and DTrack UUIDs. AK CLI artifact list/info/search outputs did not expose artifact UUIDs; these remain unknown and are omitted, rather than substituting scan IDs. DTrack project names, versions and repository descriptions match the staging subjects; DTrack did not return an image digest, so the DTrack-to-image relationship is a version/name association rather than an independently verified digest binding.

| Subject | AK repository/path | Digest | AK artifact UUID | DTrack project UUID |
| --- | --- | --- | --- | --- |
| writing.2 staging | pcc-staging / v2/vansrouter/manifests/0.91.21-writing.2 | sha256:cf476efe166b3f07395ce31851cc8330441d352e597f281cf5abb128843dcee9 | not exposed by CLI | 60936def-9b50-422e-9e0a-f504fd629e97 |
| writing.2 hosted | pcc / v2/vansrouter/manifests/0.91.21-writing.2 | sha256:cf476efe166b3f07395ce31851cc8330441d352e597f281cf5abb128843dcee9 | not exposed by CLI | no separate verified project |
| writing.1 historical | no version-tag artifact returned | not reverified in AK | unknown | a74b0da0-3d38-4cd3-9adf-db8e5d46c024 |

AK management metadata reports the same writing.2 index digest in staging and hosted repositories. This does not verify a Docker pull. The operations record dated 2026-09-13 describes a hosted MANIFEST_UNKNOWN availability gap; no pull was attempted here. No independent application-only DTrack inventory was found. The DTrack projects are classified APPLICATION by the server, but their component inventories include the container OS and bundled tooling; they must not be treated as application-only inventories.

## AK scan evidence

For the exact writing.2 staging subject, the latest visible repository-list records all have creation time 2026-09-13T20:25:08Z. The CLI did not expose completion timestamps. Scanner status and creation time must not be confused with a new scan today.

| Scan ID | Scanner/type | Status | Reported findings |
| --- | --- | --- | --- |
| c8e269d8-ae12-4a6e-9e5c-07b448650361 | grype | completed | 6 |
| 08c23b63-1102-4994-886e-4a09b3cd0037 | not_applicable | not_applicable | 0 |
| ac0772d1-4f72-4e3c-93fc-9d348625526f | image | failed | 0 |
| 293b84b0-4aae-4663-8e16-f15173d8993f | dependency | completed | 0 |

Grype scan c8e269d8-ae12-4a6e-9e5c-07b448650361 is completed: 0 critical, 3 high, 3 medium, 0 low. No completed Trivy scan was exposed in the scoped AK scan listings. The failed image result and not_applicable result are not clean scans. The empty dependency result does not supersede Grype or DTrack. DTrack finding attribution sometimes says trivy; that is not evidence of a completed AK Trivy scan. No writing.2 scan was returned for the hosted repository.

Pagination caveat: the staging scan-list CLI announced 5 total but emitted 4 rows; hosted announced 25 but emitted 14 rows. Page 2 was empty for both. All visible rows were read, but the CLI output does not reconcile those totals. Artifact/repository discovery also reached empty second pages.

| Source | Component | Affected version | CVE | Severity | Listed fix | Acknowledged |
| --- | --- | --- | --- | --- | --- | --- |
| grype | golang.org/x/crypto | v0.54.0 | CVE-2026-56855 | high | 0.56.0 | True |
| grype | golang.org/x/crypto | v0.54.0 | CVE-2026-56854 | high | 0.55.0 | True |
| grype | golang.org/x/crypto | v0.54.0 | CVE-2026-78662 | high | 0.56.0 | True |
| grype | busybox | 1.37.0-r31 | CVE-2025-60876 | medium | not returned | True |
| grype | ssl_client | 1.37.0-r31 | CVE-2025-60876 | medium | not returned | True |
| grype | busybox-binsh | 1.37.0-r31 | CVE-2025-60876 | medium | not returned | True |

`ak scan show` returned valid JSON with exit 1 and "Critical or high severity findings detected." This is a severity exit, not an access failure. Findings are normalized stored AK records, not original scanner reports.

## Dependency-Track evidence

All requested project, findings, violations, components and metrics endpoints returned HTTP 200. The project listing returned all 23 accessible projects. Collection reads followed X-Total-Count and pagination: writing.2 has 65 finding rows, 225 violation rows and 300 components; writing.1 has 294, 223 and 333 respectively. Supplemental vulnerability-detail lookups returned 404, so no fixed-version or affected-range evidence was obtained from that route. No credentials were changed.

### 0.91.21-writing.2

Project: `vansrouter:0.91.21-writing.2` / `60936def-9b50-422e-9e0a-f504fd629e97`. BOM import: 2026-09-13T20:25:36+00:00. Last vulnerability analysis: 2026-09-15T06:00:08+00:00. Metrics last occurrence: 2026-09-15T06:00:13+00:00. Import time is not analysis completion.

Detailed source-specific rows: 65; severities: HIGH=25, LOW=1, MEDIUM=8, UNASSIGNED=31. Sources: GITHUB=21, NVD=13, OSV=30, UNKNOWN=1.

Metrics report 37 findings, 7 vulnerable components, 0 critical, 23 high, 8 medium, 1 low, 0 unassigned. These metric severity fields do not sum to the reported total. Detailed records include source aliases; no cross-source unique-vulnerability total is claimed.

Policy: 221 LICENSE and 4 SECURITY records, all FAIL, no operational violations. Metrics report 0 suppressed findings and 0 audited findings. All 65 returned analysis objects contain isSuppressed=false, without an explicit triage state. No suppression or acknowledgement was applied by this review.

### 0.91.21-writing.1

Project: `vansrouter:0.91.21-writing.1` / `a74b0da0-3d38-4cd3-9adf-db8e5d46c024`. BOM import: 2026-09-13T19:58:05+00:00. Last vulnerability analysis: 2026-09-15T06:00:12+00:00. Metrics last occurrence: 2026-09-15T06:00:16+00:00. Import time is not analysis completion.

Detailed source-specific rows: 294; severities: CRITICAL=20, HIGH=79, LOW=5, MEDIUM=76, UNASSIGNED=114. Sources: GITHUB=63, NVD=117, OSV=113, UNKNOWN=1.

Metrics report 142 findings, 22 vulnerable components, 12 critical, 63 high, 58 medium, 3 low, 0 unassigned. These metric severity fields do not sum to the reported total. Detailed records include source aliases; no cross-source unique-vulnerability total is claimed.

Policy: 203 LICENSE and 20 SECURITY records, all FAIL, no operational violations. Metrics report 0 suppressed findings and 0 audited findings. All 294 returned analysis objects contain isSuppressed=false, without an explicit triage state. No suppression or acknowledgement was applied by this review.

## Policy interpretation and limitations

The current local operations documentation (implementation-status.md, updated 2026-09-13) records an intentional pause of AK push, pull and promotion enforcement. DTrack reporting remains enabled. This review did not inspect or change live enforcement configuration. FAIL rows therefore describe DTrack policy evaluation, not a verified active deployment block.

The 24 writing.2 license-flagged components with returned license metadata are listed below; another 96 have no returned license metadata. Multiple policy conditions can produce rows for one component.

| Component | Version | Returned license |
| --- | --- | --- |
| @img/sharp-libvips-linuxmusl-x64 | 1.3.3 | LGPL-3.0-or-later |
| @vercel/og | 0.11.1 | MPL-2.0 |
| alpine-baselayout | 3.7.2-r1 | GPL-2.0-only |
| alpine-baselayout-data | 3.7.2-r1 | GPL-2.0-only |
| apk-tools | 3.0.8-r0 | GPL-2.0-only |
| busybox | 1.37.0-r31 | GPL-2.0-only |
| busybox-binsh | 1.37.0-r31 | GPL-2.0-only |
| ca-certificates-bundle | 20260611-r0 | MPL-2.0 AND MIT |
| caniuse-lite | 1.0.30001810 | CC-BY-4.0 |
| dompurify | 3.4.15 | MPL-2.0 OR Apache-2.0 |
| iptables | 1.8.13-r0 | GPL-2.0-or-later |
| libapk | 3.0.8-r0 | GPL-2.0-only |
| libgcc | 15.2.0-r5 | GPL-2.0-or-later AND LGPL-2.1-or-later |
| libmnl | 1.0.5-r2 | LGPL-2.1-or-later |
| libnftnl | 1.3.1-r0 | GPL-2.0-or-later |
| libstdc++ | 15.2.0-r5 | GPL-2.0-or-later AND LGPL-2.1-or-later |
| libxtables | 1.8.13-r0 | GPL-2.0-or-later |
| musl-utils | 1.2.6-r2 | MIT AND BSD-2-Clause AND GPL-2.0-or-later |
| node-forge | 1.4.0 | BSD-3-Clause OR GPL-2.0 |
| npm | 11.19.1 | Artistic-2.0 |
| qrcode-terminal | 0.12.0 | Apache 2.0 |
| scanelf | 1.3.9-r1 | GPL-2.0-only |
| spdx-exceptions | 2.5.0 | CC-BY-3.0 |
| ssl_client | 1.37.0-r31 | GPL-2.0-only |

## Detailed finding inventory

Rows preserve source, component identity/version, advisory ID and returned CVE aliases. They are not added to Grype counts. "Not returned" means no fixed version was supplied by the retrieved finding; it does not mean no fix exists. Undici fix information below comes from the stored NVD descriptions. Go crypto fixes come from the matching Grype component/version/CVE records.

### 0.91.21-writing.2: 65 source-specific records

| Source | Advisory | CVE IDs | Severity | Component identity | Affected version | Listed fix |
| --- | --- | --- | --- | --- | --- | --- |
| NVD | CVE-2026-33813 | CVE-2026-33813 | HIGH | pkg:golang/golang.org/x/image@v0.41.0 | v0.41.0 | not returned |
| NVD | CVE-2026-46601 | CVE-2026-46601 | HIGH | pkg:golang/golang.org/x/image@v0.41.0 | v0.41.0 | not returned |
| NVD | CVE-2026-46602 | CVE-2026-46602 | HIGH | pkg:golang/golang.org/x/image@v0.41.0 | v0.41.0 | not returned |
| NVD | CVE-2026-46604 | CVE-2026-46604 | HIGH | pkg:golang/golang.org/x/image@v0.41.0 | v0.41.0 | not returned |
| NVD | CVE-2026-46603 | CVE-2026-46603 | HIGH | pkg:golang/golang.org/x/image@v0.41.0 | v0.41.0 | not returned |
| OSV | GO-2026-4961 | CVE-2026-33813 | UNASSIGNED | pkg:golang/golang.org/x/image@v0.41.0 | v0.41.0 | not returned |
| OSV | GO-2026-5061 | CVE-2026-46601 | UNASSIGNED | pkg:golang/golang.org/x/image@v0.41.0 | v0.41.0 | not returned |
| OSV | GO-2026-5062 | CVE-2026-46602 | UNASSIGNED | pkg:golang/golang.org/x/image@v0.41.0 | v0.41.0 | not returned |
| OSV | GO-2026-5066 | CVE-2026-46604 | UNASSIGNED | pkg:golang/golang.org/x/image@v0.41.0 | v0.41.0 | not returned |
| OSV | GO-2026-6222 | CVE-2026-46603 | UNASSIGNED | pkg:golang/golang.org/x/image@v0.41.0 | v0.41.0 | not returned |
| OSV | GO-2026-6237 | - | UNASSIGNED | pkg:golang/github.com/insomniacslk/dhcp@v0.0.0-20240129002554-15c9b8791914 | v0.0.0-20240129002554-15c9b8791914 | not returned |
| GITHUB | GHSA-2wp2-chmh-r934 | CVE-2018-17142 | HIGH | pkg:golang/golang.org/x/net@v0.56.0 | v0.56.0 | not returned |
| GITHUB | GHSA-39qc-96h7-956f | CVE-2019-9514, CVE-2019-9512 | HIGH | pkg:golang/golang.org/x/net@v0.56.0 | v0.56.0 | not returned |
| GITHUB | GHSA-4r78-hx75-jjj2 | CVE-2018-17848, CVE-2018-17847 | HIGH | pkg:golang/golang.org/x/net@v0.56.0 | v0.56.0 | not returned |
| GITHUB | GHSA-5p4h-3377-7w67 | CVE-2018-17075 | HIGH | pkg:golang/golang.org/x/net@v0.56.0 | v0.56.0 | not returned |
| GITHUB | GHSA-69cg-p879-7622 | CVE-2022-27664 | HIGH | pkg:golang/golang.org/x/net@v0.56.0 | v0.56.0 | not returned |
| GITHUB | GHSA-83g2-8m93-v3w7 | CVE-2021-33194 | HIGH | pkg:golang/golang.org/x/net@v0.56.0 | v0.56.0 | not returned |
| GITHUB | GHSA-fcf9-6fv2-fc5v | CVE-2018-17143 | HIGH | pkg:golang/golang.org/x/net@v0.56.0 | v0.56.0 | not returned |
| GITHUB | GHSA-h86h-8ppg-mxmh | CVE-2021-31525 | MEDIUM | pkg:golang/golang.org/x/net@v0.56.0 | v0.56.0 | not returned |
| GITHUB | GHSA-hgr8-6h9x-f7q9 | CVE-2019-9514, CVE-2019-9512 | HIGH | pkg:golang/golang.org/x/net@v0.56.0 | v0.56.0 | not returned |
| GITHUB | GHSA-mv93-wvcp-7m7r | CVE-2018-17848, CVE-2018-17847 | HIGH | pkg:golang/golang.org/x/net@v0.56.0 | v0.56.0 | not returned |
| GITHUB | GHSA-vfw5-hrgq-h5wf | CVE-2018-17846 | HIGH | pkg:golang/golang.org/x/net@v0.56.0 | v0.56.0 | not returned |
| OSV | GO-2020-0014 | CVE-2018-17846 | UNASSIGNED | pkg:golang/golang.org/x/net@v0.56.0 | v0.56.0 | not returned |
| OSV | GO-2021-0078 | CVE-2018-17075 | UNASSIGNED | pkg:golang/golang.org/x/net@v0.56.0 | v0.56.0 | not returned |
| OSV | GO-2021-0238 | CVE-2021-33194 | UNASSIGNED | pkg:golang/golang.org/x/net@v0.56.0 | v0.56.0 | not returned |
| OSV | GO-2022-0192 | CVE-2018-17142 | UNASSIGNED | pkg:golang/golang.org/x/net@v0.56.0 | v0.56.0 | not returned |
| OSV | GO-2022-0193 | CVE-2018-17143 | UNASSIGNED | pkg:golang/golang.org/x/net@v0.56.0 | v0.56.0 | not returned |
| OSV | GO-2022-0197 | CVE-2018-17848, CVE-2018-17847 | UNASSIGNED | pkg:golang/golang.org/x/net@v0.56.0 | v0.56.0 | not returned |
| OSV | GO-2022-0236 | CVE-2021-31525 | UNASSIGNED | pkg:golang/golang.org/x/net@v0.56.0 | v0.56.0 | not returned |
| OSV | GO-2022-0288 | CVE-2021-44716 | UNASSIGNED | pkg:golang/golang.org/x/net@v0.56.0 | v0.56.0 | not returned |
| OSV | GO-2022-0536 | CVE-2019-9514, CVE-2019-9512 | UNASSIGNED | pkg:golang/golang.org/x/net@v0.56.0 | v0.56.0 | not returned |
| OSV | GO-2022-0969 | CVE-2022-27664 | UNASSIGNED | pkg:golang/golang.org/x/net@v0.56.0 | v0.56.0 | not returned |
| NVD | CVE-2026-85024 | CVE-2026-85024 | MEDIUM | pkg:npm/undici@6.28.0 | 6.28.0 | 6.28.1 (same major; stored description) |
| NVD | CVE-2026-18540 | CVE-2026-18540 | LOW | pkg:npm/undici@6.28.0 | 6.28.0 | 6.28.1 (same major; stored description) |
| NVD | CVE-2026-19534 | CVE-2026-19534 | HIGH | pkg:npm/undici@6.28.0 | 6.28.0 | 6.28.1 (same major; stored description) |
| NVD | CVE-2025-8262 | CVE-2025-8262 | MEDIUM | pkg:npm/yarn@1.22.22 | 1.22.22 | not returned |
| NVD | CVE-2025-9308 | CVE-2025-9308 | MEDIUM | pkg:npm/yarn@1.22.22 | 1.22.22 | not returned |
| GITHUB | GHSA-p782-xgp4-8hr8 | CVE-2022-29526 | MEDIUM | pkg:golang/golang.org/x/sys@v0.47.0 | v0.47.0 | not returned |
| OSV | GO-2022-0493 | CVE-2022-29526 | UNASSIGNED | pkg:golang/golang.org/x/sys@v0.47.0 | v0.47.0 | not returned |
| NVD | CVE-2026-56854 | CVE-2026-56854 | HIGH | pkg:golang/golang.org/x/crypto@v0.54.0 | v0.54.0 | 0.55.0 |
| NVD | CVE-2026-56855 | CVE-2026-56855 | HIGH | pkg:golang/golang.org/x/crypto@v0.54.0 | v0.54.0 | 0.56.0 |
| NVD | CVE-2026-78662 | CVE-2026-78662 | HIGH | pkg:golang/golang.org/x/crypto@v0.54.0 | v0.54.0 | 0.56.0 |
| GITHUB | GHSA-3vm4-22fp-5rfm | CVE-2020-29652 | HIGH | pkg:golang/golang.org/x/crypto@v0.54.0 | v0.54.0 | not returned |
| GITHUB | GHSA-45x7-px36-x8w8 | CVE-2023-48795 | MEDIUM | pkg:golang/golang.org/x/crypto@v0.54.0 | v0.54.0 | not returned |
| GITHUB | GHSA-8c26-wmh5-6g9v | CVE-2022-27191 | HIGH | pkg:golang/golang.org/x/crypto@v0.54.0 | v0.54.0 | not returned |
| GITHUB | GHSA-cjjc-xp8v-855w | CVE-2020-7919 | HIGH | pkg:golang/golang.org/x/crypto@v0.54.0 | v0.54.0 | not returned |
| GITHUB | GHSA-ffhg-7mh4-33c4 | CVE-2020-9283 | HIGH | pkg:golang/golang.org/x/crypto@v0.54.0 | v0.54.0 | not returned |
| GITHUB | GHSA-gwc9-m7rh-j2ww | CVE-2021-43565 | HIGH | pkg:golang/golang.org/x/crypto@v0.54.0 | v0.54.0 | not returned |
| GITHUB | GHSA-r5c5-pr8j-pfp7 | CVE-2019-11840 | MEDIUM | pkg:golang/golang.org/x/crypto@v0.54.0 | v0.54.0 | not returned |
| GITHUB | GHSA-x3jr-pf6g-c48f | CVE-2019-11841 | MEDIUM | pkg:golang/golang.org/x/crypto@v0.54.0 | v0.54.0 | not returned |
| GITHUB | GHSA-xhjq-w7xm-p8qj | CVE-2017-3204 | HIGH | pkg:golang/golang.org/x/crypto@v0.54.0 | v0.54.0 | not returned |
| OSV | GO-2020-0012 | CVE-2020-9283 | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.54.0 | v0.54.0 | not returned |
| OSV | GO-2020-0013 | CVE-2017-3204 | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.54.0 | v0.54.0 | not returned |
| OSV | GO-2021-0227 | CVE-2020-29652 | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.54.0 | v0.54.0 | not returned |
| OSV | GO-2021-0356 | CVE-2022-27191 | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.54.0 | v0.54.0 | not returned |
| OSV | GO-2022-0209 | CVE-2019-11840 | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.54.0 | v0.54.0 | not returned |
| OSV | GO-2022-0229 | CVE-2020-7919 | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.54.0 | v0.54.0 | not returned |
| OSV | GO-2022-0968 | CVE-2021-43565 | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.54.0 | v0.54.0 | not returned |
| OSV | GO-2023-1992 | CVE-2019-11841 | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.54.0 | v0.54.0 | not returned |
| OSV | GO-2024-2961 | CVE-2022-30636 | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.54.0 | v0.54.0 | not returned |
| OSV | GO-2026-5932 | - | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.54.0 | v0.54.0 | not returned |
| OSV | GO-2026-6303 | CVE-2026-56854 | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.54.0 | v0.54.0 | 0.55.0 |
| OSV | GO-2026-6354 | CVE-2026-78662 | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.54.0 | v0.54.0 | 0.56.0 |
| OSV | GO-2026-6355 | CVE-2026-56855 | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.54.0 | v0.54.0 | 0.56.0 |
| UNKNOWN | GO-2026-5932 | - | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.54.0 | v0.54.0 | not returned |

### 0.91.21-writing.1: 294 source-specific records

| Source | Advisory | CVE IDs | Severity | Component identity | Affected version | Listed fix |
| --- | --- | --- | --- | --- | --- | --- |
| NVD | CVE-2026-39824 | CVE-2026-39824 | LOW | pkg:golang/golang.org/x/sys@v0.30.0 | v0.30.0 | not returned |
| GITHUB | GHSA-p782-xgp4-8hr8 | CVE-2022-29526 | MEDIUM | pkg:golang/golang.org/x/sys@v0.30.0 | v0.30.0 | not returned |
| OSV | GO-2022-0493 | CVE-2022-29526 | UNASSIGNED | pkg:golang/golang.org/x/sys@v0.30.0 | v0.30.0 | not returned |
| OSV | GO-2026-5024 | CVE-2026-39824 | UNASSIGNED | pkg:golang/golang.org/x/sys@v0.30.0 | v0.30.0 | not returned |
| OSV | GO-2026-5841 | - | UNASSIGNED | pkg:golang/github.com/klauspost/compress@v1.17.11 | v1.17.11 | not returned |
| NVD | CVE-2026-63209 | CVE-2026-63209 | HIGH | pkg:golang/github.com/klauspost/compress@v1.17.11 | v1.17.11 | not returned |
| NVD | CVE-2026-56855 | CVE-2026-56855 | HIGH | pkg:golang/github.com/tailscale/golang-x-crypto@v0.0.0-20240604161659-3fde5e568aa4 | v0.0.0-20240604161659-3fde5e568aa4 | not returned |
| NVD | CVE-2025-64756 | CVE-2025-64756 | HIGH | pkg:npm/glob@10.5.0 | 10.5.0 | not returned |
| NVD | CVE-2026-9496 | CVE-2026-9496 | HIGH | pkg:npm/pacote@20.0.1 | 20.0.1 | not returned |
| GITHUB | GHSA-w4pp-8pjf-rmxw | CVE-2026-9496 | HIGH | pkg:npm/pacote@20.0.1 | 20.0.1 | not returned |
| NVD | CVE-2026-33671 | CVE-2026-33671 | HIGH | pkg:npm/picomatch@4.0.3 | 4.0.3 | not returned |
| NVD | CVE-2026-33672 | CVE-2026-33672 | MEDIUM | pkg:npm/picomatch@4.0.3 | 4.0.3 | not returned |
| GITHUB | GHSA-3v7f-55p6-f55p | CVE-2026-33672 | MEDIUM | pkg:npm/picomatch@4.0.3 | 4.0.3 | not returned |
| GITHUB | GHSA-c2c7-rcm5-vvqj | CVE-2026-33671 | HIGH | pkg:npm/picomatch@4.0.3 | 4.0.3 | not returned |
| NVD | CVE-2026-33750 | CVE-2026-33750 | HIGH | pkg:npm/brace-expansion@2.0.2 | 2.0.2 | not returned |
| NVD | CVE-2026-13149 | CVE-2026-13149 | HIGH | pkg:npm/brace-expansion@2.0.2 | 2.0.2 | not returned |
| NVD | CVE-2026-14257 | CVE-2026-14257 | HIGH | pkg:npm/brace-expansion@2.0.2 | 2.0.2 | not returned |
| NVD | CVE-2026-69152 | CVE-2026-69152 | HIGH | pkg:npm/brace-expansion@2.0.2 | 2.0.2 | not returned |
| GITHUB | GHSA-3jxr-9vmj-r5cp | CVE-2026-13149 | HIGH | pkg:npm/brace-expansion@2.0.2 | 2.0.2 | not returned |
| GITHUB | GHSA-f886-m6hf-6m8v | CVE-2026-33750 | MEDIUM | pkg:npm/brace-expansion@2.0.2 | 2.0.2 | not returned |
| GITHUB | GHSA-mh99-v99m-4gvg | CVE-2026-14257 | HIGH | pkg:npm/brace-expansion@2.0.2 | 2.0.2 | not returned |
| GITHUB | GHSA-rgw5-rvv9-x895 | CVE-2026-69152 | HIGH | pkg:npm/brace-expansion@2.0.2 | 2.0.2 | not returned |
| OSV | GO-2026-6237 | - | UNASSIGNED | pkg:golang/github.com/insomniacslk/dhcp@v0.0.0-20240129002554-15c9b8791914 | v0.0.0-20240129002554-15c9b8791914 | not returned |
| NVD | CVE-2026-53655 | CVE-2026-53655 | MEDIUM | pkg:npm/tar@7.5.11 | 7.5.11 | not returned |
| NVD | CVE-2026-59871 | CVE-2026-59871 | HIGH | pkg:npm/tar@7.5.11 | 7.5.11 | not returned |
| NVD | CVE-2026-59873 | CVE-2026-59873 | CRITICAL | pkg:npm/tar@7.5.11 | 7.5.11 | not returned |
| NVD | CVE-2026-59874 | CVE-2026-59874 | HIGH | pkg:npm/tar@7.5.11 | 7.5.11 | not returned |
| NVD | CVE-2026-59875 | CVE-2026-59875 | MEDIUM | pkg:npm/tar@7.5.11 | 7.5.11 | not returned |
| NVD | CVE-2026-73566 | CVE-2026-73566 | HIGH | pkg:npm/tar@7.5.11 | 7.5.11 | not returned |
| GITHUB | GHSA-23hp-3jrh-7fpw | CVE-2026-59873 | CRITICAL | pkg:npm/tar@7.5.11 | 7.5.11 | not returned |
| GITHUB | GHSA-8x88-c5mf-7j5w | CVE-2026-59874 | HIGH | pkg:npm/tar@7.5.11 | 7.5.11 | not returned |
| GITHUB | GHSA-gvwx-54wh-qm9j | CVE-2026-59875 | MEDIUM | pkg:npm/tar@7.5.11 | 7.5.11 | not returned |
| GITHUB | GHSA-r292-9mhp-454m | CVE-2026-73566 | HIGH | pkg:npm/tar@7.5.11 | 7.5.11 | not returned |
| GITHUB | GHSA-vmf3-w455-68vh | CVE-2026-53655 | MEDIUM | pkg:npm/tar@7.5.11 | 7.5.11 | not returned |
| GITHUB | GHSA-w8wr-v893-vjvp | CVE-2026-59871 | MEDIUM | pkg:npm/tar@7.5.11 | 7.5.11 | not returned |
| NVD | CVE-2026-25679 | CVE-2026-25679 | HIGH | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2026-27139 | CVE-2026-27139 | LOW | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2026-27142 | CVE-2026-27142 | MEDIUM | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2026-32280 | CVE-2026-32280 | HIGH | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2026-32281 | CVE-2026-32281 | HIGH | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2026-32282 | CVE-2026-32282 | MEDIUM | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2026-32283 | CVE-2026-32283 | HIGH | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2026-32288 | CVE-2026-32288 | MEDIUM | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2026-32289 | CVE-2026-32289 | MEDIUM | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2026-33811 | CVE-2026-33811 | HIGH | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2026-33814 | CVE-2026-33814 | HIGH | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2026-39820 | CVE-2026-39820 | HIGH | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2026-39823 | CVE-2026-39823 | MEDIUM | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2026-39825 | CVE-2026-39825 | MEDIUM | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2026-39826 | CVE-2026-39826 | MEDIUM | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2026-39836 | CVE-2026-39836 | HIGH | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2026-42499 | CVE-2026-42499 | HIGH | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2026-39821 | CVE-2026-39821 | CRITICAL | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2026-27145 | CVE-2026-27145 | MEDIUM | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2026-42504 | CVE-2026-42504 | HIGH | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2026-42507 | CVE-2026-42507 | MEDIUM | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2026-39822 | CVE-2026-39822 | HIGH | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2026-42505 | CVE-2026-42505 | MEDIUM | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2025-22866 | CVE-2025-22866 | MEDIUM | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2025-22870 | CVE-2025-22870 | MEDIUM | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2025-22871 | CVE-2025-22871 | CRITICAL | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2025-4673 | CVE-2025-4673 | MEDIUM | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2025-0913 | CVE-2025-0913 | MEDIUM | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2025-47907 | CVE-2025-47907 | HIGH | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2025-47906 | CVE-2025-47906 | MEDIUM | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2025-47912 | CVE-2025-47912 | MEDIUM | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2025-58183 | CVE-2025-58183 | MEDIUM | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2025-58185 | CVE-2025-58185 | MEDIUM | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2025-58186 | CVE-2025-58186 | MEDIUM | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2025-58187 | CVE-2025-58187 | HIGH | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2025-58188 | CVE-2025-58188 | HIGH | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2025-58189 | CVE-2025-58189 | MEDIUM | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2025-61723 | CVE-2025-61723 | HIGH | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2025-61724 | CVE-2025-61724 | MEDIUM | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2025-61725 | CVE-2025-61725 | HIGH | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2025-61729 | CVE-2025-61729 | HIGH | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2025-61727 | CVE-2025-61727 | MEDIUM | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2025-61726 | CVE-2025-61726 | HIGH | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2025-61728 | CVE-2025-61728 | MEDIUM | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2025-61730 | CVE-2025-61730 | MEDIUM | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2025-22873 | CVE-2025-22873 | LOW | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2025-68121 | CVE-2025-68121 | CRITICAL | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2026-33818 | CVE-2026-33818 | HIGH | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2026-56853 | CVE-2026-56853 | HIGH | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2026-56858 | CVE-2026-56858 | MEDIUM | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2026-56859 | CVE-2026-56859 | HIGH | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2026-56860 | CVE-2026-56860 | MEDIUM | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2026-56862 | CVE-2026-56862 | HIGH | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2025-3447 | CVE-2025-22866 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2025-3503 | CVE-2025-22870 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2025-3563 | CVE-2025-22871 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2025-3750 | CVE-2025-0913 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2025-3751 | CVE-2025-4673 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2025-3849 | CVE-2025-47907 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2025-3956 | CVE-2025-47906 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2025-4006 | CVE-2025-61725 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2025-4007 | CVE-2025-58187 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2025-4008 | CVE-2025-58189 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2025-4009 | CVE-2025-61723 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2025-4010 | CVE-2025-47912 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2025-4011 | CVE-2025-58185 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2025-4012 | CVE-2025-58186 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2025-4013 | CVE-2025-58188 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2025-4014 | CVE-2025-58183 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2025-4015 | CVE-2025-61724 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2025-4155 | CVE-2025-61729 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2025-4175 | CVE-2025-61727 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2026-4337 | CVE-2025-68121 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2026-4340 | CVE-2025-61730 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2026-4341 | CVE-2025-61726 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2026-4342 | CVE-2025-61728 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2026-4403 | CVE-2025-22873 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2026-4601 | CVE-2026-25679 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2026-4602 | CVE-2026-27139 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2026-4603 | CVE-2026-27142 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2026-4864 | CVE-2026-32282 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2026-4865 | CVE-2026-32289 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2026-4869 | CVE-2026-32288 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2026-4870 | CVE-2026-32283 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2026-4918 | CVE-2026-33814 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2026-4946 | CVE-2026-32281 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2026-4947 | CVE-2026-32280 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2026-4970 | CVE-2026-39822 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2026-4971 | CVE-2026-39836 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2026-4976 | CVE-2026-39825 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2026-4977 | CVE-2026-42499 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2026-4980 | CVE-2026-39826 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2026-4981 | CVE-2026-33811 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2026-4982 | CVE-2026-39823 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2026-4986 | CVE-2026-39820 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2026-5026 | CVE-2026-39821 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2026-5037 | CVE-2026-27145 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2026-5038 | CVE-2026-42504 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2026-5039 | CVE-2026-42507 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2026-5856 | CVE-2026-42505 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2026-5972 | CVE-2026-33818 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2026-6088 | CVE-2026-56859 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2026-6089 | CVE-2026-56853 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2026-6090 | CVE-2026-56862 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2026-6091 | CVE-2026-56858 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| OSV | GO-2026-6218 | CVE-2026-56860 | UNASSIGNED | pkg:golang/stdlib@1.23.5 | go1.23.5 | not returned |
| NVD | CVE-2026-33814 | CVE-2026-33814 | HIGH | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| NVD | CVE-2026-25680 | CVE-2026-25680 | MEDIUM | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| NVD | CVE-2026-25681 | CVE-2026-25681 | MEDIUM | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| NVD | CVE-2026-27136 | CVE-2026-27136 | MEDIUM | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| NVD | CVE-2026-39821 | CVE-2026-39821 | CRITICAL | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| NVD | CVE-2026-42502 | CVE-2026-42502 | MEDIUM | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| NVD | CVE-2026-42506 | CVE-2026-42506 | MEDIUM | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| NVD | CVE-2026-46600 | CVE-2026-46600 | HIGH | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| NVD | CVE-2025-22870 | CVE-2025-22870 | MEDIUM | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| NVD | CVE-2025-22872 | CVE-2025-22872 | MEDIUM | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| NVD | CVE-2025-47911 | CVE-2025-47911 | MEDIUM | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| NVD | CVE-2025-58190 | CVE-2025-58190 | MEDIUM | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| GITHUB | GHSA-2wp2-chmh-r934 | CVE-2018-17142 | HIGH | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| GITHUB | GHSA-39qc-96h7-956f | CVE-2019-9514, CVE-2019-9512 | HIGH | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| GITHUB | GHSA-4r78-hx75-jjj2 | CVE-2018-17848, CVE-2018-17847 | HIGH | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| GITHUB | GHSA-5cv4-jp36-h3mw | CVE-2026-25680 | MEDIUM | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| GITHUB | GHSA-5p4h-3377-7w67 | CVE-2018-17075 | HIGH | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| GITHUB | GHSA-69cg-p879-7622 | CVE-2022-27664 | HIGH | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| GITHUB | GHSA-83g2-8m93-v3w7 | CVE-2021-33194 | HIGH | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| GITHUB | GHSA-fcf9-6fv2-fc5v | CVE-2018-17143 | HIGH | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| GITHUB | GHSA-h86h-8ppg-mxmh | CVE-2021-31525 | MEDIUM | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| GITHUB | GHSA-hgr8-6h9x-f7q9 | CVE-2019-9514, CVE-2019-9512 | HIGH | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| GITHUB | GHSA-mv93-wvcp-7m7r | CVE-2018-17848, CVE-2018-17847 | HIGH | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| GITHUB | GHSA-qxp5-gwg8-xv66 | CVE-2025-22870 | MEDIUM | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| GITHUB | GHSA-vfw5-hrgq-h5wf | CVE-2018-17846 | HIGH | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| GITHUB | GHSA-vvgc-356p-c3xw | CVE-2025-22872 | MEDIUM | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| OSV | GO-2020-0014 | CVE-2018-17846 | UNASSIGNED | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| OSV | GO-2021-0078 | CVE-2018-17075 | UNASSIGNED | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| OSV | GO-2021-0238 | CVE-2021-33194 | UNASSIGNED | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| OSV | GO-2022-0192 | CVE-2018-17142 | UNASSIGNED | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| OSV | GO-2022-0193 | CVE-2018-17143 | UNASSIGNED | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| OSV | GO-2022-0197 | CVE-2018-17848, CVE-2018-17847 | UNASSIGNED | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| OSV | GO-2022-0236 | CVE-2021-31525 | UNASSIGNED | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| OSV | GO-2022-0288 | CVE-2021-44716 | UNASSIGNED | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| OSV | GO-2022-0536 | CVE-2019-9514, CVE-2019-9512 | UNASSIGNED | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| OSV | GO-2022-0969 | CVE-2022-27664 | UNASSIGNED | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| OSV | GO-2025-3503 | CVE-2025-22870 | UNASSIGNED | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| OSV | GO-2025-3595 | CVE-2025-22872 | UNASSIGNED | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| OSV | GO-2026-4440 | CVE-2025-47911 | UNASSIGNED | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| OSV | GO-2026-4441 | CVE-2025-58190 | UNASSIGNED | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| OSV | GO-2026-4918 | CVE-2026-33814 | UNASSIGNED | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| OSV | GO-2026-5025 | CVE-2026-42506 | UNASSIGNED | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| OSV | GO-2026-5026 | CVE-2026-39821 | UNASSIGNED | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| OSV | GO-2026-5027 | CVE-2026-42502 | UNASSIGNED | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| OSV | GO-2026-5028 | CVE-2026-25680 | UNASSIGNED | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| OSV | GO-2026-5029 | CVE-2026-25681 | UNASSIGNED | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| OSV | GO-2026-5030 | CVE-2026-27136 | UNASSIGNED | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| OSV | GO-2026-5942 | CVE-2026-46600 | UNASSIGNED | pkg:golang/golang.org/x/net@v0.35.0 | v0.35.0 | not returned |
| NVD | CVE-2025-8262 | CVE-2025-8262 | MEDIUM | pkg:npm/yarn@1.22.22 | 1.22.22 | not returned |
| NVD | CVE-2025-9308 | CVE-2025-9308 | MEDIUM | pkg:npm/yarn@1.22.22 | 1.22.22 | not returned |
| NVD | CVE-2025-24358 | CVE-2025-24358 | MEDIUM | pkg:golang/github.com/gorilla/csrf@v1.7.3-0.20250123201450-9dd6af1f6d30 | v1.7.3-0.20250123201450-9dd6af1f6d30 | not returned |
| NVD | CVE-2025-47909 | CVE-2025-47909 | HIGH | pkg:golang/github.com/gorilla/csrf@v1.7.3-0.20250123201450-9dd6af1f6d30 | v1.7.3-0.20250123201450-9dd6af1f6d30 | not returned |
| GITHUB | GHSA-82ff-hg59-8x73 | CVE-2025-47909 | MEDIUM | pkg:golang/github.com/gorilla/csrf@v1.7.3-0.20250123201450-9dd6af1f6d30 | v1.7.3-0.20250123201450-9dd6af1f6d30 | not returned |
| GITHUB | GHSA-rq77-p4h8-4crw | CVE-2025-24358 | MEDIUM | pkg:golang/github.com/gorilla/csrf@v1.7.3-0.20250123201450-9dd6af1f6d30 | v1.7.3-0.20250123201450-9dd6af1f6d30 | not returned |
| OSV | GO-2025-3607 | CVE-2025-24358 | UNASSIGNED | pkg:golang/github.com/gorilla/csrf@v1.7.3-0.20250123201450-9dd6af1f6d30 | v1.7.3-0.20250123201450-9dd6af1f6d30 | not returned |
| NVD | CVE-2026-26958 | CVE-2026-26958 | LOW | pkg:golang/filippo.io/edwards25519@v1.1.0 | v1.1.0 | not returned |
| GITHUB | GHSA-fw7p-63qq-7hpr | CVE-2026-26958 | MEDIUM | pkg:golang/filippo.io/edwards25519@v1.1.0 | v1.1.0 | not returned |
| OSV | GO-2026-4503 | CVE-2026-26958 | UNASSIGNED | pkg:golang/filippo.io/edwards25519@v1.1.0 | v1.1.0 | not returned |
| NVD | CVE-2025-22868 | CVE-2025-22868 | HIGH | pkg:golang/golang.org/x/oauth2@v0.25.0 | v0.25.0 | not returned |
| GITHUB | GHSA-6v2p-p543-phr9 | CVE-2025-22868 | HIGH | pkg:golang/golang.org/x/oauth2@v0.25.0 | v0.25.0 | not returned |
| OSV | GO-2025-3488 | CVE-2025-22868 | UNASSIGNED | pkg:golang/golang.org/x/oauth2@v0.25.0 | v0.25.0 | not returned |
| NVD | CVE-2026-48758 | CVE-2026-48758 | MEDIUM | pkg:npm/%40sigstore/core@2.0.0 | 2.0.0 | not returned |
| GITHUB | GHSA-jfc7-64v2-mr8c | CVE-2026-48758 | MEDIUM | pkg:npm/%40sigstore/core@2.0.0 | 2.0.0 | not returned |
| NVD | CVE-2026-39827 | CVE-2026-39827 | MEDIUM | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| NVD | CVE-2026-39828 | CVE-2026-39828 | MEDIUM | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| NVD | CVE-2026-39829 | CVE-2026-39829 | HIGH | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| NVD | CVE-2026-39830 | CVE-2026-39830 | CRITICAL | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| NVD | CVE-2026-39831 | CVE-2026-39831 | CRITICAL | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| NVD | CVE-2026-39832 | CVE-2026-39832 | CRITICAL | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| NVD | CVE-2026-39833 | CVE-2026-39833 | CRITICAL | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| NVD | CVE-2026-39834 | CVE-2026-39834 | CRITICAL | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| NVD | CVE-2026-39835 | CVE-2026-39835 | MEDIUM | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| NVD | CVE-2026-42508 | CVE-2026-42508 | CRITICAL | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| NVD | CVE-2026-46595 | CVE-2026-46595 | CRITICAL | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| NVD | CVE-2026-46597 | CVE-2026-46597 | HIGH | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| NVD | CVE-2026-46598 | CVE-2026-46598 | MEDIUM | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| NVD | CVE-2025-22869 | CVE-2025-22869 | HIGH | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| NVD | CVE-2025-47913 | CVE-2025-47913 | HIGH | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| NVD | CVE-2025-47914 | CVE-2025-47914 | MEDIUM | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| NVD | CVE-2025-58181 | CVE-2025-58181 | MEDIUM | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| NVD | CVE-2026-56854 | CVE-2026-56854 | HIGH | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| NVD | CVE-2026-56855 | CVE-2026-56855 | HIGH | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| NVD | CVE-2026-78662 | CVE-2026-78662 | HIGH | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| GITHUB | GHSA-3vm4-22fp-5rfm | CVE-2020-29652 | HIGH | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| GITHUB | GHSA-45gg-vh54-h5m9 | CVE-2026-39828 | MEDIUM | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| GITHUB | GHSA-45x7-px36-x8w8 | CVE-2023-48795 | MEDIUM | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| GITHUB | GHSA-5cgq-3rg8-m6cv | CVE-2026-42508 | CRITICAL | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| GITHUB | GHSA-78mq-xcr3-xm33 | CVE-2026-39835 | MEDIUM | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| GITHUB | GHSA-89gr-r52h-f8rx | CVE-2026-39831 | CRITICAL | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| GITHUB | GHSA-8c26-wmh5-6g9v | CVE-2022-27191 | HIGH | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| GITHUB | GHSA-9m57-25v3-79x9 | CVE-2026-46598 | MEDIUM | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| GITHUB | GHSA-cjjc-xp8v-855w | CVE-2020-7919 | HIGH | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| GITHUB | GHSA-f5wc-c3c7-36mc | CVE-2026-39832 | CRITICAL | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| GITHUB | GHSA-f6x5-jh6r-wrfv | CVE-2025-47914 | MEDIUM | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| GITHUB | GHSA-ffhg-7mh4-33c4 | CVE-2020-9283 | HIGH | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| GITHUB | GHSA-gwc9-m7rh-j2ww | CVE-2021-43565 | HIGH | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| GITHUB | GHSA-hcg3-q754-cr77 | CVE-2025-22869 | HIGH | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| GITHUB | GHSA-j5w8-q4qc-rx2x | CVE-2025-58181 | MEDIUM | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| GITHUB | GHSA-jppx-rxg9-jmrx | CVE-2026-39833 | CRITICAL | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| GITHUB | GHSA-q4h4-gmj2-qvw2 | CVE-2026-46597 | HIGH | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| GITHUB | GHSA-qpw4-5x99-6vjp | CVE-2026-39827 | MEDIUM | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| GITHUB | GHSA-r5c5-pr8j-pfp7 | CVE-2019-11840 | MEDIUM | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| GITHUB | GHSA-rm3j-f69w-wqmq | CVE-2026-39834 | CRITICAL | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| GITHUB | GHSA-vgwf-h737-ff37 | CVE-2026-39830 | CRITICAL | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| GITHUB | GHSA-w879-237q-wc7r | CVE-2026-39829 | HIGH | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| GITHUB | GHSA-x3jr-pf6g-c48f | CVE-2019-11841 | MEDIUM | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| GITHUB | GHSA-x527-x647-q7gg | CVE-2026-46595 | CRITICAL | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| GITHUB | GHSA-xhjq-w7xm-p8qj | CVE-2017-3204 | HIGH | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| OSV | GO-2020-0012 | CVE-2020-9283 | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| OSV | GO-2020-0013 | CVE-2017-3204 | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| OSV | GO-2021-0227 | CVE-2020-29652 | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| OSV | GO-2021-0356 | CVE-2022-27191 | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| OSV | GO-2022-0209 | CVE-2019-11840 | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| OSV | GO-2022-0229 | CVE-2020-7919 | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| OSV | GO-2022-0968 | CVE-2021-43565 | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| OSV | GO-2023-1992 | CVE-2019-11841 | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| OSV | GO-2024-2961 | CVE-2022-30636 | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| OSV | GO-2025-3487 | CVE-2025-22869 | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| OSV | GO-2025-4116 | CVE-2025-47913 | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| OSV | GO-2025-4134 | CVE-2025-58181 | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| OSV | GO-2025-4135 | CVE-2025-47914 | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| OSV | GO-2026-5005 | CVE-2026-39833 | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| OSV | GO-2026-5006 | CVE-2026-39832 | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| OSV | GO-2026-5013 | CVE-2026-46597 | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| OSV | GO-2026-5014 | CVE-2026-39828 | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| OSV | GO-2026-5015 | CVE-2026-39835 | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| OSV | GO-2026-5016 | CVE-2026-39827 | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| OSV | GO-2026-5017 | CVE-2026-39830 | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| OSV | GO-2026-5018 | CVE-2026-39829 | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| OSV | GO-2026-5019 | CVE-2026-39831 | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| OSV | GO-2026-5020 | CVE-2026-39834 | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| OSV | GO-2026-5021 | CVE-2026-42508 | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| OSV | GO-2026-5023 | CVE-2026-46595 | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| OSV | GO-2026-5033 | CVE-2026-46598 | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| OSV | GO-2026-5932 | - | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| OSV | GO-2026-6303 | CVE-2026-56854 | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| OSV | GO-2026-6354 | CVE-2026-78662 | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| OSV | GO-2026-6355 | CVE-2026-56855 | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| UNKNOWN | GO-2026-5932 | - | UNASSIGNED | pkg:golang/golang.org/x/crypto@v0.33.0 | v0.33.0 | not returned |
| NVD | CVE-2026-56852 | CVE-2026-56852 | HIGH | pkg:golang/golang.org/x/text@v0.22.0 | v0.22.0 | not returned |
| OSV | GO-2026-5970 | CVE-2026-56852 | UNASSIGNED | pkg:golang/golang.org/x/text@v0.22.0 | v0.22.0 | not returned |
| NVD | CVE-2026-9496 | CVE-2026-9496 | HIGH | pkg:npm/pacote@19.0.2 | 19.0.2 | not returned |
| GITHUB | GHSA-w4pp-8pjf-rmxw | CVE-2026-9496 | HIGH | pkg:npm/pacote@19.0.2 | 19.0.2 | not returned |
| NVD | CVE-2026-9358 | CVE-2026-9358 | LOW | pkg:npm/postcss-selector-parser@7.1.1 | 7.1.1 | not returned |
| GITHUB | GHSA-w9m9-85wc-3x92 | CVE-2026-9358 | MEDIUM | pkg:npm/postcss-selector-parser@7.1.1 | 7.1.1 | not returned |
| NVD | CVE-2026-42338 | CVE-2026-42338 | MEDIUM | pkg:npm/ip-address@10.1.0 | 10.1.0 | not returned |
| NVD | CVE-2026-54272 | CVE-2026-54272 | MEDIUM | pkg:npm/ip-address@10.1.0 | 10.1.0 | not returned |
| NVD | CVE-2026-69192 | CVE-2026-69192 | HIGH | pkg:npm/ip-address@10.1.0 | 10.1.0 | not returned |
| NVD | CVE-2026-69198 | CVE-2026-69198 | MEDIUM | pkg:npm/ip-address@10.1.0 | 10.1.0 | not returned |
| GITHUB | GHSA-mwp4-54f8-5fhr | CVE-2026-69192 | HIGH | pkg:npm/ip-address@10.1.0 | 10.1.0 | not returned |
| GITHUB | GHSA-v2v4-37r5-5v8g | CVE-2026-42338 | MEDIUM | pkg:npm/ip-address@10.1.0 | 10.1.0 | not returned |
| NVD | CVE-2026-48815 | CVE-2026-48815 | HIGH | pkg:npm/sigstore@3.1.0 | 3.1.0 | not returned |
| GITHUB | GHSA-52v5-jr5w-gjxr | CVE-2026-48815 | HIGH | pkg:npm/sigstore@3.1.0 | 3.1.0 | not returned |

## Read-only sources

- AK instance pcc: https://registry.pcc.fyi; repo/artifact/scan list and scan show commands.
- Direct Dependency-Track: configured HTTPS origin; project discovery and per-project read endpoints. Keys were read from the environment and sent only as X-Api-Key; redirects were rejected.
- FORK-MAINTENANCE.md: source-sync scope and earlier security evidence.
- /Users/joseybv/datacenter/pcc-docker-srv0/apps/9router/IMAGE-SECURITY-REMEDIATION.md: historical package locations, BusyBox reproduction and deployment.
- /Users/joseybv/datacenter/pcc-ops-local-stack/cicd/artifact-keeper/docs/implementation-status.md: enforcement pause and availability record.
- /Users/joseybv/datacenter/pcc-ops-local-stack/cicd/dependency-track/native-governance.md: license-policy definitions and expression handling.
