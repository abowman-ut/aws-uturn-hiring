/**
 * Fetches dashboard data from the API
 * @returns {Promise<{positions: Array, candidates: Array}>}
 */
export async function fetchDashboardData() {
    try {
        const [positionsRes, candidatesRes] = await Promise.all([
            fetch('/api/positions'),
            fetch('/api/candidates')
        ]);
        
        if (!positionsRes.ok || !candidatesRes.ok) {
            throw new Error('Failed to load dashboard data');
        }
        
        const positions = await positionsRes.json();
        const candidates = await candidatesRes.json();
        
        return { positions, candidates };
    } catch (err) {
        throw new Error('Failed to load dashboard data. Please try again later.');
    }
} 