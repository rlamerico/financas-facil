#!/usr/bin/env bash
# Roda `next dev` com o CA bundle do proxy TLS corporativo, se existir
# localmente (ver CLAUDE.md "Environment setup"). Sem isso, chamadas do
# Node para a API do Supabase falham com SELF_SIGNED_CERT_IN_CHAIN.
# Não usado em build/start — esse script é só para desenvolvimento local.
set -e

CA_BUNDLE="$HOME/.local/share/certs/macos-ca-bundle.pem"
if [ -f "$CA_BUNDLE" ]; then
  export NODE_EXTRA_CA_CERTS="$CA_BUNDLE"
fi

exec next dev
