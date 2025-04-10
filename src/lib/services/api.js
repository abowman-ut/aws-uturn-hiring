/**
 * API service for fetching data from the backend
 */

/**
 * Fetches positions data from the API
 * @returns {Promise<Array>} Array of positions
 */
export async function fetchPositions() {
    const response = await fetch('/api/positions');
    
    if (!response.ok) {
        throw new Error(`Failed to fetch positions: ${response.status}`);
    }
    
    return response.json();
}

/**
 * Fetches candidates data from the API
 * @returns {Promise<Array>} Array of candidates
 */
export async function fetchCandidates() {
    const response = await fetch('/api/candidates');
    
    if (!response.ok) {
        throw new Error(`Failed to fetch candidates: ${response.status}`);
    }
    
    return response.json();
}

/**
 * Fetches both positions and candidates data in parallel
 * @returns {Promise<{positions: Array, candidates: Array}>} Object containing positions and candidates
 */
export async function fetchDashboardData() {
    try {
        const [positions, candidates] = await Promise.all([
            fetchPositions(),
            fetchCandidates()
        ]);
        
        return { positions, candidates };
    } catch (error) {
        throw new Error('Failed to load dashboard data: ' + error.message);
    }
} 