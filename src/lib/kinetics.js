export function parameters(km, vmax, mode = "None", dose = 0) {
  const alpha = 1 + dose;
  // Mixed model assumes Ki for ES is Ki(E)/0.6, so both factors become 1 at zero inhibitor.
  const beta = 1 + 0.6 * dose;
  if (mode === "Competitive") return { km: km * alpha, vmax };
  if (mode === "Noncompetitive") return { km, vmax: vmax / alpha };
  if (mode === "Uncompetitive") return { km: km / alpha, vmax: vmax / alpha };
  if (mode === "Mixed") return { km: (km * alpha) / beta, vmax: vmax / beta };
  return { km, vmax };
}
export function velocity(substrate, km, vmax, hill = 1) {
  return (vmax * substrate ** hill) / (km ** hill + substrate ** hill);
}
