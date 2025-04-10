/**
 * Calculate the average number of days it takes to hire a candidate
 * @param {Array} candidates - List of candidate objects
 * @returns {number} - Average days to hire, rounded to nearest integer
 */
export function calculateAvgDaysToHire(candidates) {
    const hiredCandidates = candidates.filter(c => c.status === 'hired');
    if (hiredCandidates.length === 0) return 0;

    const totalDays = hiredCandidates.reduce((sum, c) => {
        const firstStage = c.stages?.[0];
        const lastStage = c.stages?.[c.stages.length - 1];
        if (!firstStage?.startDate || !lastStage?.endDate) return sum;

        const days = Math.ceil(
            (new Date(lastStage.endDate) - new Date(firstStage.startDate)) / 
            (1000 * 60 * 60 * 24)
        );
        return sum + days;
    }, 0);

    return Math.round(totalDays / hiredCandidates.length);
}

/**
 * Get the count of candidates in a specific stage
 * @param {Array} candidates - List of candidate objects
 * @param {string} stageId - The ID of the stage to count
 * @returns {number} - Count of candidates in the specified stage
 */
export function getCandidatesInStage(candidates, stageId) {
    return candidates.filter(c => {
        const currentStage = c.stages?.[c.stages.length - 1];
        return currentStage?.id === stageId && currentStage?.status === 'current';
    }).length;
}

/**
 * Get the count of candidates in interview stages
 * @param {Array} candidates - List of candidate objects
 * @returns {number} - Count of candidates in interview stages
 */
export function getActiveInterviews(candidates) {
    return candidates.filter(c => {
        const currentStage = c.stages?.[c.stages.length - 1];
        return currentStage?.status === 'current' && 
               ['culture_fit', 'interview'].includes(currentStage.id);
    }).length;
} 