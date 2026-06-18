const script = document.currentScript;
const color = script?.dataset.color || "var(--accent, #02527E)";
const reactVersion = script?.dataset.react || "18.3.1";
const deps = `react@${reactVersion},react-dom@${reactVersion}`;
const base = "https://esm.sh";
const qs = new URLSearchParams({ deps });
const apiOrigin = "https://faster-fixes.kibibit.io";
const apiKey = "ff_f1853a56123b18aa2d19eef68ff185f0cd1d96fafc5e8fee4f18e3fc835f44ac";

try {
  const [{ default: React }, { createRoot }, { FasterFixesClient, resolveReviewerToken }, { FeedbackProviderCore }] =
    await Promise.all([
      import(`${base}/react@${reactVersion}?${qs}`),
      import(`${base}/react-dom@${reactVersion}/client?${qs}`),
      import(`${base}/@fasterfixes/core@0.0.7?${qs}`),
      import(`${base}/@fasterfixes/react@0.0.9/internal?${qs}`),
    ]);

  const reviewerToken = resolveReviewerToken();
  if (reviewerToken) {
    const client = new FasterFixesClient({ apiKey, apiOrigin });

    try {
      const config = await client.getConfig();
      if (!config.enabled) {
        console.warn("[Faster Fixes] Widget is turned off in Project Settings.");
      } else {
        const mount = document.createElement("div");
        mount.id = "faster-fixes-root";
        document.body.appendChild(mount);

        createRoot(mount).render(
          React.createElement(FeedbackProviderCore, {
            client,
            reviewerToken,
            config,
            apiOrigin,
            color,
            position: "bottom-right",
          }),
        );
      }
    } catch (err) {
      console.error("[Faster Fixes] Could not reach your dashboard — check the project ID and that the widget is enabled.", err);
    }
  }
} catch (err) {
  console.error("[Faster Fixes] Widget failed to load.", err);
}
