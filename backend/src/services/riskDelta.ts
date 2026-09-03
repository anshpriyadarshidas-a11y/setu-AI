export const computeRiskDelta = (departureScore: number, currentScore: number) => {
    const delta = currentScore - departureScore;
    const alert = Math.abs(delta) > 0.25; // Define threshold
    return {
        delta,
        alert,
        message: alert ? "Risk score changed significantly since departure." : null
    };
};
