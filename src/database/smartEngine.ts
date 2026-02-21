import { getDb, Activity, getRecentHistory, logGeneration } from './database';

export interface FilterParams {
    category?: string;
    duration?: string;
    budgetLevel?: 'Low' | 'Medium' | 'High';
    indoorOutdoor?: string; // 'Indoor' | 'Outdoor' | 'Both'
    remoteCompatible?: boolean;
}

export interface SmartEngineResult {
    activities: Activity[];
    message: string;
}

export const generateActivities = async (
    organization: any,
    filters: FilterParams,
    count: number = 3
): Promise<SmartEngineResult> => {

    const db = await getDb();

    // 1. Get all activities from DB
    let allActivities = await db.getAllAsync<Activity>(`SELECT * FROM activities`);

    // 2. Load recent history to prevent 30-day repeats
    const recentHistory = await getRecentHistory(30);
    const recentActivityIds = new Set(recentHistory.map(h => h.activity_id));

    // 3. Apply Filters (relaxed approach — employee count is soft filter)
    let filtered = allActivities.filter(activity => {

        // Remote compatibility (org level or explicit filter)
        const needsRemote = filters.remoteCompatible || organization?.workType === 'Remote';
        if (needsRemote && activity.remote_compatible === 0) {
            return false;
        }

        // Category filter
        if (filters.category && activity.category !== filters.category) {
            return false;
        }

        // Duration filter
        if (filters.duration && activity.duration !== filters.duration) {
            return false;
        }

        // Budget filter (relaxed: allow cheaper options)
        if (filters.budgetLevel) {
            const budgetOrder = ['Low', 'Medium', 'High'];
            const filterIndex = budgetOrder.indexOf(filters.budgetLevel);
            const activityIndex = budgetOrder.indexOf(activity.estimated_cost);
            if (activityIndex > filterIndex) {
                return false; // Activity is more expensive than filter allows
            }
        }

        // Indoor/Outdoor
        if (filters.indoorOutdoor) {
            if (activity.indoor_outdoor !== 'Both' && activity.indoor_outdoor !== filters.indoorOutdoor) {
                return false;
            }
        }

        return true;
    });

    // 4. Split into "Fresh" vs "Recently Used"
    const freshActivities = filtered.filter(a => !recentActivityIds.has(a.id));

    let candidates = freshActivities;
    let fallbackUsed = false;

    // If we ran out of fresh activities that match the filters, fallback
    if (candidates.length === 0) {
        if (filtered.length > 0) {
            candidates = filtered;
            fallbackUsed = true;
        } else {
            return {
                activities: [],
                message: "No activities match these exact filters. Try broadening your criteria."
            };
        }
    }

    // 5. Shuffle and pick `count` activities
    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));

    // 6. Generate Contextual Message
    let message = "Here are some great activities for your team!";
    if (fallbackUsed) {
        message = "You've done these recently, but they match your filters best.";
    } else if (filters.category) {
        message = `Perfect ${filters.category} activities to boost engagement.`;
    } else {
        // Analyze history to provide smart suggestion
        const categoryCounts = recentHistory.reduce((acc, curr) => {
            const act = allActivities.find(a => a.id === curr.activity_id);
            if (act) {
                acc[act.category] = (acc[act.category] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        if (selected.length > 0) {
            const suggestedCategory = selected[0].category;
            if (!categoryCounts[suggestedCategory]) {
                message = `You haven't tried ${suggestedCategory} activities recently — great time to start!`;
            }
        }
    }

    // Log each generation
    for (const activity of selected) {
        await logGeneration(activity.id);
    }

    return {
        activities: selected,
        message
    };
};
