import Card from "@/shared/components/Card";
import Badge from "@/shared/components/Badge";

// Human labels for the cadence enum; null renders as an explicit unknown ("—").
const REFRESH_LABELS = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  "one-time": "One-time",
  rolling: "Rolling",
};

// Only cadences without an exact shared Badge variant need a colour override.
const REFRESH_BADGE = {
  daily: { variant: "success" },
  weekly: { variant: "info" },
  "one-time": { variant: "warning" },
  monthly: { variant: "default", className: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  rolling: { variant: "default", className: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" },
};

export default function FreeTierList({ tiers = [] }) {
  return (
    <Card
      padding="lg"
      title="Available free tiers"
      subtitle="Catalogue of providers and models with a free allowance, derived from the provider registry."
    >
      {tiers.length === 0 ? (
        <p className="py-6 text-center text-sm text-text-muted">No free tiers found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-[11px] uppercase tracking-wide text-text-muted dark:border-white/10">
                <th scope="col" className="py-2 pr-3 font-medium">Provider</th>
                <th scope="col" className="py-2 pr-3 font-medium">Model</th>
                <th scope="col" className="py-2 pr-3 font-medium">Refresh</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((tier) => {
                const badge = REFRESH_BADGE[tier.freeRefresh];
                const showAlias = tier.providerAlias && tier.providerAlias !== tier.providerName;
                return (
                  <tr
                    key={`${tier.providerId}-${tier.modelId ?? "__provider__"}`}
                    className="border-b border-black/5 hover:bg-black/[0.02] dark:border-white/5 dark:hover:bg-white/[0.02]"
                  >
                    <td className="py-2 pr-3">
                      <div className="font-medium text-text-primary">{tier.providerName}</div>
                      {showAlias && (
                        <div className="text-[10px] text-text-muted">{tier.providerAlias}</div>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-text-primary">
                      {tier.modelName ?? (
                        <span className="italic text-text-muted">free tier available</span>
                      )}
                      {tier.modelId && tier.modelId !== tier.modelName && (
                        <div className="truncate font-mono text-[10px] text-text-muted">{tier.modelId}</div>
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      {tier.freeRefresh ? (
                        <Badge size="sm" variant={badge.variant} className={badge.className}>
                          {REFRESH_LABELS[tier.freeRefresh] || tier.freeRefresh}
                        </Badge>
                      ) : (
                        <span
                          className="text-xs italic text-text-muted"
                          title="Reset cadence not documented"
                          aria-label="Reset cadence not documented"
                        >
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
