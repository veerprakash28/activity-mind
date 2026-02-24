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

export interface AIChatResponse {
    message: string;
    suggestedActivities: Activity[];
    contextUpdate?: Partial<FilterParams>;
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

export const processAIChat = async (
    userInput: string,
    history: { role: string; content: string }[],
    organization: any
): Promise<AIChatResponse> => {
    const input = userInput.toLowerCase();
    const db = await getDb();

    // 1. Keyword Extraction (Simulating NLP)
    const isRemote = input.includes('remote') || input.includes('online') || input.includes('virtual');
    const isBudgetLow = input.includes('cheap') || input.includes('free') || input.includes('low budget');
    const isShort = input.includes('short') || input.includes('quick') || input.includes('15 min');
    const isActive = input.includes('active') || input.includes('physical') || input.includes('sport') || input.includes('energy');
    const isProductive = input.includes('productive') || input.includes('learn') || input.includes('training') || input.includes('work');
    const isQuiet = input.includes('quiet') || input.includes('calm') || input.includes('wellness') || input.includes('focus');

    // 2. Load DB for matching (simulated brainstorming)
    const allActivities = await db.getAllAsync<Activity>(`SELECT * FROM activities`);

    // 3. Heuristic Filtering & Keyword Scoring
    let matchesWithScore = allActivities.map(a => {
        let score = 0;

        // Literal keyword matches (High Weight)
        const keywords = input.split(/\s+/).filter(w => w.length >= 2);
        keywords.forEach(word => {
            if (a.name.toLowerCase().includes(word)) score += 10;
            if (a.description.toLowerCase().includes(word)) score += 5;
            if (a.category.toLowerCase().includes(word)) score += 3;
        });

        // Intent-based matches (Medium Weight)
        if (isRemote && a.remote_compatible === 1) score += 5;
        if (isBudgetLow && a.estimated_cost === 'Low') score += 5;
        if (isShort && (a.duration === '15 min' || a.duration === '30 min')) score += 5;
        if (isActive && (a.category.toLowerCase().includes('well-being') || a.name.toLowerCase().includes('physical') || a.category === 'Team Bonding')) score += 5;
        if (isProductive && (a.category === 'Training' || a.category === 'Recognition')) score += 5;
        if (isQuiet && (a.category === 'Wellness' || a.category === 'Recognition')) score += 5;

        // Penalty for incompatibility
        if (isRemote && a.remote_compatible === 0) score -= 100; // Still filter strictly for remote

        return { activity: a, score };
    });

    // Sort by score and filter out non-matches (unless we have very few results)
    let filteredMatches = matchesWithScore
        .filter(m => m.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(m => m.activity);

    // Fallback if no specific keyword matches (broad matching)
    if (filteredMatches.length === 0) {
        filteredMatches = allActivities.filter(a => {
            if (isRemote && a.remote_compatible === 0) return false;
            return true;
        }).slice(0, 3);
    }

    let matches = filteredMatches;

    // 4. Adapt/Transform to feel "Generative"
    const suggested = matches.sort(() => Math.random() - 0.5).slice(0, 2).map(act => {
        let adapted = { ...act };

        // Transform based on keywords
        if (isRemote && act.remote_compatible === 0) {
            adapted.name = `[Virtual] ${act.name}`;
            adapted.description = `A remote-adapted version of ${act.name}. ${act.description}`;
            adapted.remote_compatible = 1;
            try {
                const steps = JSON.parse(act.steps);
                adapted.steps = JSON.stringify([
                    "Hop on a video call (Zoom/Teams/Meet).",
                    ...steps.map((s: string) => `(Virtual Adaption) ${s}`),
                    "Share screenshots of the results in your team chat."
                ]);
            } catch (e) { }
        } else if (isBudgetLow && act.estimated_cost !== 'Low') {
            adapted.name = `[Budget-Friendly] ${act.name}`;
            adapted.description = `A cost-optimized variation of ${act.name}. ${act.description}`;
            adapted.estimated_cost = 'Low';
        } else if (isActive && !act.name.toLowerCase().includes('energetic')) {
            adapted.name = `[High Energy] ${act.name}`;
            adapted.description = `An amped-up, physical version of ${act.name}. ${act.description}`;
        } else if (isProductive) {
            adapted.name = `[Upskill] ${act.name}`;
            adapted.description = `Focusing on team growth: ${adapted.description}`;
        }

        // Add Industry Polish
        const industry = organization?.industry?.toLowerCase() || 'office';
        if (industry.includes('tech') || industry.includes('engineer')) {
            adapted.name = `[Engineering Corner] ${adapted.name}`;
        } else if (industry.includes('creative') || industry.includes('design')) {
            adapted.name = `[The Studio] ${adapted.name}`;
        } else if (industry.includes('sale') || industry.includes('marketing')) {
            adapted.name = `[Growth Hack] ${adapted.name}`;
        }

        // Add company context
        if (organization?.companyName) {
            adapted.description = `${organization.companyName} Special: ${adapted.description}`;
        }

        return adapted;
    });

    // 5. Build AI Response Message
    let message = "";
    if (isProductive) {
        message = "I've architected these drafts to focus specifically on team growth and professional development. ";
    } else if (isQuiet) {
        message = "I've curated these quiet, focused drafts to help the team recharge after a busy week. ";
    } else if (isRemote) {
        message = "Since your team is working remotely, I've drafted some virtual adaptations of classic team activities! ";
    } else if (isBudgetLow) {
        message = "I've optimized these brainstorm drafts to keep the impact high but the costs low. ";
    } else if (isActive) {
        message = "Let's get the team moving! I've amped up the physical energy in these drafts. ";
    } else {
        message = `Based on your request and the ${organization?.industry || 'general'} vibes at ${organization?.companyName || 'the office'}, I've architected these new variants. `;
    }

    if (suggested.length > 0) {
        message += `Check out the "${suggested[0].name}" draft below. I've modified the steps to fit your specific request. What do you think?`;
    } else {
        message = "That's an interesting challenge! Could you tell me a bit more about the goal? I want to make sure I architect the perfect variant for you.";
    }

    return {
        message,
        suggestedActivities: suggested
    };
};
