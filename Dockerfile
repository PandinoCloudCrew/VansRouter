# syntax=docker/dockerfile:1.7@sha256:a57df69d0ea827fb7266491f2813635de6f17269be881f696fbfdf2d83dda33e
ARG APP_VERSION=unknown
ARG VCS_REF=unknown

# Step 1: Build the Next.js app on the native host CPU (BUILDPLATFORM).
# Running Webpack and bundling under native architecture is ~20x faster than QEMU emulation.
FROM --platform=$BUILDPLATFORM node:22-alpine@sha256:b6f26b36c8ff49624cfdac716b8ea1138d606df02586a77d364bb5536a634f85 AS builder
WORKDIR /app

ARG NPM_VERSION=11.20.0
RUN apk upgrade --no-cache && \
  npm install --global "npm@${NPM_VERSION}" --ignore-scripts --no-audit --no-fund && \
  npm cache clean --force

RUN apk add --no-cache python3 make g++ linux-headers

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    PNPM_HOME=/pnpm \
    npm_config_build_from_source=true \
    npm_config_nodedir=/usr/local
ENV PATH="${PNPM_HOME}:${PATH}"
RUN corepack enable && corepack prepare "pnpm@9.15.9" --activate

# Use the repository's lockfile and package-manager policy for the image build.
COPY package.json package-lock.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY scripts/patch-monaco-sanitizer.cjs ./scripts/patch-monaco-sanitizer.cjs
RUN --mount=type=cache,target=/pnpm/store \
  pnpm install --frozen-lockfile --store-dir=/pnpm/store

COPY . ./
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build && \
  node scripts/package-closure.cjs open /app/node_modules /app/runtime-deps

# Step 2: Stage target-native runtime modules (better-sqlite3) for the TARGETPLATFORM.
# The target binary is checksum-pinned and avoids running heavy Next.js build or extracting 500+ unrelated packages under QEMU.
FROM node:22-alpine@sha256:b6f26b36c8ff49624cfdac716b8ea1138d606df02586a77d364bb5536a634f85 AS native-deps
ARG TARGETARCH
WORKDIR /app

RUN apk add --no-cache curl ca-certificates

# Keep the native dependency graph locked independently of the application install.
# The prebuilt native binary is downloaded separately and checksum-verified; the
# package install script is disabled so it cannot fetch an unpinned artifact.
COPY docker/native-deps/package.json docker/native-deps/package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund && \
  bs_version=12.10.0 && \
  bs_abi=127 && \
  test "$(node -p 'process.versions.modules')" = "$bs_abi" && \
  bs_sha_x64=9b14618f3d9aa9b70daade965bca892f324b063e1cc7532b030d7138a8f9d070 && \
  bs_sha_arm64=b5e92ec2637bb578cc12b8b9b94877a82c3ef5e862ccc72d420706aab978bb9a && \
  case "${TARGETARCH:-amd64}" in \
    amd64) bs_arch=x64; bs_sha="$bs_sha_x64" ;; \
    arm64) bs_arch=arm64; bs_sha="$bs_sha_arm64" ;; \
    *) echo "Unsupported arch: ${TARGETARCH:-amd64}"; exit 1 ;; \
  esac && \
  archive=/tmp/better-sqlite3-linux-musl.tgz && \
  curl -fsSL "https://github.com/WiseLibs/better-sqlite3/releases/download/v${bs_version}/better-sqlite3-v${bs_version}-node-v${bs_abi}-linuxmusl-${bs_arch}.tar.gz" -o "$archive" && \
  echo "${bs_sha}  ${archive}" | sha256sum -c - && \
  tar -xzf "$archive" -C node_modules/better-sqlite3 && \
  test -f node_modules/better-sqlite3/build/Release/better_sqlite3.node
RUN node -e "const Database = require('better-sqlite3'); const db = new Database(':memory:'); db.prepare('SELECT 1').get(); db.close(); console.log('native dependency stage: better-sqlite3')"

# ponytail: rebuild the stable release until upstream binaries include these security fixes.
FROM --platform=$BUILDPLATFORM golang:1.26.8-alpine@sha256:ce864e7223ac17b1775e6fd0b4c0db580c2eb50e7953a427916379e4b92a1628 AS tailscale
ARG TAILSCALE_VERSION=1.102.4
ARG TARGETARCH
WORKDIR /src
RUN apk add --no-cache curl ca-certificates && \
  curl -fsSL "https://codeload.github.com/tailscale/tailscale/tar.gz/refs/tags/v${TAILSCALE_VERSION}" -o /tmp/tailscale.tgz && \
  echo "784b023e825e1cca7b146ac6a7aff08b179d60d10839b51019f315dab426c871  /tmp/tailscale.tgz" | sha256sum -c - && \
  tar -xzf /tmp/tailscale.tgz --strip-components=1 -C /src
RUN --mount=type=cache,target=/go/pkg/mod \
  --mount=type=cache,target=/root/.cache/go-build \
  go get golang.org/x/crypto@v0.56.0 golang.org/x/image@v0.45.0 \
    github.com/insomniacslk/dhcp@v0.0.0-20260719225207-c76316d4aa82 && \
  CGO_ENABLED=0 GOOS=linux GOARCH=${TARGETARCH:-amd64} \
  go build -trimpath -ldflags="-s -w -X tailscale.com/version.longStamp=${TAILSCALE_VERSION}-vansrouter-security.1 -X tailscale.com/version.shortStamp=${TAILSCALE_VERSION}" \
    -o /out/ ./cmd/tailscale ./cmd/tailscaled

FROM node:22-alpine@sha256:b6f26b36c8ff49624cfdac716b8ea1138d606df02586a77d364bb5536a634f85 AS runner
ARG APP_VERSION
ARG VCS_REF
WORKDIR /app

ARG NPM_VERSION=11.20.0
RUN apk upgrade --no-cache && \
  npm install --global "npm@${NPM_VERSION}" --ignore-scripts --no-audit --no-fund && \
  npm cache clean --force

LABEL org.opencontainers.image.title="VansRouter" \
      org.opencontainers.image.source="https://github.com/PandinoCloudCrew/VansRouter" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.licenses="MIT"

ENV NODE_ENV=production
ENV PORT=20128
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATA_DIR=/app/data
# API_KEY_SECRET is optional; src/shared/utils/apiKey.js persists a random secret
# under DATA_DIR when no runtime secret is provided.

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/.next/standalone ./
RUN rm -rf /app/node_modules/open
COPY --from=builder /app/runtime-deps/ ./node_modules/
COPY --from=builder /app/custom-server.js ./custom-server.js
COPY runtime-secrets.cjs ./runtime-secrets.cjs
COPY --from=builder /app/open-sse ./open-sse
# Next file tracing can omit sibling files; MITM runs server.js as a separate process.
COPY --from=builder /app/src/mitm ./src/mitm
# Standalone tracing may omit packages loaded through dynamic imports.
COPY --from=builder /app/node_modules/node-forge ./node_modules/node-forge
# SQLite is loaded dynamically by src/lib/db/driver.js; keep the target-architecture
# native driver staged in native-deps.
COPY --from=native-deps /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=native-deps /app/node_modules/bindings ./node_modules/bindings
COPY --from=native-deps /app/node_modules/file-uri-to-path ./node_modules/file-uri-to-path
# Ensure `next` is available at runtime in case tracing did not include it.
COPY --from=builder /app/node_modules/next ./node_modules/next
COPY --from=builder /app/node_modules/sql.js ./node_modules/sql.js
RUN node -e "const Database = require('better-sqlite3'); const db = new Database(':memory:'); db.prepare('SELECT 1').get(); db.close(); console.log('SQLite native driver: better-sqlite3')"
# Bundle Tailscale binaries into /usr/local/bin so they survive the /app/data volume mount.
COPY --from=tailscale /out/tailscale /usr/local/bin/tailscale
COPY --from=tailscale /out/tailscaled /usr/local/bin/tailscaled

RUN mkdir -p /app/data /app/data-home && \
  chown -R node:node /app/data /app/data-home /app/.next && \
  ln -sf /app/data-home /root/.9router 2>/dev/null || true

# Tailscale Funnel requires CAP_NET_ADMIN for TUN mode; keep su-exec for dropping privileges.
# When using host socket mode (TAILSCALE_USE_HOST_SOCKET=true), no extra capability is needed.
RUN apk --no-cache add su-exec ip6tables iptables
COPY docker/migrate-legacy-volume.cjs /usr/local/bin/migrate-legacy-volume.cjs
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 20128

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "custom-server.js"]
