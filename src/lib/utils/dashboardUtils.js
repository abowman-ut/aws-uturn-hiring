import { calculateAvgDaysToHire, getActiveInterviews } from './candidateUtils';

/**
 * Calculate dashboard statistics from positions and candidates data
 * @param {Array} positions - List of position objects
 * @param {Array} candidates - List of candidate objects
 * @returns {Object} - Dashboard statistics
 */
export function calculateDashboardStats(positions, candidates) {
    return {
        openPositions: positions.filter(p => p.state === 'open').length,
        activeInterviews: getActiveInterviews(candidates),
        hired: candidates.filter(c => c.status === 'hired').length,
        avgDaysToHire: calculateAvgDaysToHire(candidates),
        openPositionsCount: positions.filter(p => p.state === 'open').length,
        onholdPositionsCount: positions.filter(p => p.state === 'onhold').length,
        cancelledPositionsCount: positions.filter(p => p.state === 'cancelled').length,
        filledPositionsCount: positions.filter(p => p.state === 'filled').length,
        allCandidatesCount: candidates.length,
        rejectedCandidatesCount: candidates.filter(c => c.status === 'rejected').length,
        allPositionsCount: positions.length
    };
}

/**
 * Generate stat card configurations based on stats
 * @param {Object} stats - Dashboard statistics
 * @param {Object} COLORS - Color constants
 * @returns {Array} - Stat card configurations
 */
export function generateStatCardConfigs(stats, COLORS) {
    return [
        {
            icon: 'bi-list-ul',
            iconColor: COLORS.info,
            iconBgColor: COLORS.infoLight,
            label: 'All Positions',
            value: stats.allPositionsCount
        },
        {
            icon: 'bi-circle-fill',
            iconColor: COLORS.primary,
            iconBgColor: COLORS.primaryLight,
            iconSize: '1rem',
            label: 'Open Positions',
            value: stats.openPositionsCount
        },
        {
            icon: 'bi-circle-fill',
            iconColor: COLORS.warning,
            iconBgColor: COLORS.warningLight,
            iconSize: '1rem',
            label: 'On Hold',
            value: stats.onholdPositionsCount
        },
        {
            icon: 'bi-circle-fill',
            iconColor: COLORS.success,
            iconBgColor: COLORS.successLight,
            iconSize: '1rem',
            label: 'Filled',
            value: stats.filledPositionsCount
        },
        {
            icon: 'bi-circle-fill',
            iconColor: COLORS.danger,
            iconBgColor: COLORS.dangerLight,
            iconSize: '1rem',
            label: 'Cancelled',
            value: stats.cancelledPositionsCount
        },
        {
            icon: 'bi-people',
            iconColor: COLORS.info,
            iconBgColor: COLORS.infoLight,
            label: 'All Candidates',
            value: stats.allCandidatesCount
        },
        {
            icon: 'bi-clock',
            iconColor: COLORS.info,
            iconBgColor: COLORS.infoLight,
            label: 'Avg to Hire',
            value: stats.avgDaysToHire,
            suffix: 'days'
        },
        {
            icon: 'bi-person-badge',
            iconColor: COLORS.info,
            iconBgColor: COLORS.infoLight,
            label: 'Interviewing',
            value: stats.activeInterviews
        },
        {
            icon: 'bi-person-badge',
            iconColor: COLORS.success,
            iconBgColor: COLORS.successLight,
            label: 'Hired',
            value: stats.hired
        },
        {
            icon: 'bi-person-badge',
            iconColor: COLORS.danger,
            iconBgColor: COLORS.dangerLight,
            label: 'Rejected',
            value: stats.rejectedCandidatesCount
        }
    ];
} 