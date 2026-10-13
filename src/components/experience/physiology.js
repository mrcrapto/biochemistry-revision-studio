// Qualitative steady-state outcomes with substrate, oxygen and ADP available.
// This is a teaching state model, not a biochemical rate simulation.
export function respiratoryState(condition = "Coupled", entry = "NADH") {
  const baseline = {
    flow: 1,
    gradient: 1,
    synthesis: 1,
    heat: 0.12,
    block: null,
  };
  if (condition === "Rotenone")
    return entry === "NADH"
      ? { flow: 0, gradient: 0.08, synthesis: 0, heat: 0, block: "I" }
      : { ...baseline, block: "I" };
  if (condition === "Antimycin A")
    return { flow: 0, gradient: 0.08, synthesis: 0, heat: 0, block: "III" };
  if (condition === "Cyanide")
    return { flow: 0, gradient: 0.08, synthesis: 0, heat: 0, block: "IV" };
  if (condition === "Oligomycin")
    return { flow: 0.12, gradient: 1.3, synthesis: 0, heat: 0.08, block: "V" };
  if (condition === "Uncoupler")
    return {
      flow: 1.55,
      gradient: 0.08,
      synthesis: 0.05,
      heat: 1,
      block: null,
    };
  return baseline;
}
