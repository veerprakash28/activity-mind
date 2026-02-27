import { getDb, Activity, getRecentHistory, logGeneration } from './database';
import { getGeminiModel, SYSTEM_PROMPT } from '../config/aiConfig';

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
    engine?: 'gemini' | 'heuristic';
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

    // 1. Keyword Extraction (Simulating NLP - needed for fallback & context retrieval)
    const isRemote = input.includes('remote') || input.includes('online') || input.includes('virtual');
    const isBudgetLow = input.includes('cheap') || input.includes('free') || input.includes('low budget');
    const isShort = input.includes('short') || input.includes('quick') || input.includes('15 min');
    const isActive = input.includes('active') || input.includes('physical') || input.includes('sport') || input.includes('energy');
    const isProductive = input.includes('productive') || input.includes('learn') || input.includes('training') || input.includes('work');
    const isQuiet = input.includes('quiet') || input.includes('calm') || input.includes('wellness') || input.includes('focus');

    // 2. Load DB for Context Retrieval
    const allActivities = await db.getAllAsync<Activity>(`SELECT * FROM activities`);

    // 3. Heuristic Filtering & Keyword Scoring (To find relevant "Base Activities")
    let matchesWithScore = allActivities.map(a => {
        let score = 0;
        const keywords = input.split(/\s+/).filter(w => w.length >= 2);
        keywords.forEach(word => {
            if (a.name.toLowerCase().includes(word)) score += 10;
            if (a.description.toLowerCase().includes(word)) score += 5;
        });
        if (isRemote && a.remote_compatible === 1) score += 5;
        if (isBudgetLow && a.estimated_cost === 'Low') score += 5;
        return { activity: a, score };
    });

    const contextActivities = matchesWithScore
        .filter(m => m.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 2)
        .map(m => m.activity);

    // --- REAL AI INTEGRATION (GEMINI) ---
    try {
        const model = getGeminiModel();

        // Limit history to last 4 messages to save tokens
        const recentHistory = history.slice(-4);
        const historyStr = recentHistory.length > 0
            ? `\nHISTORY:\n${JSON.stringify(recentHistory)}`
            : "";

        const orgStr = `ORG: ${organization?.industry || 'Gen'}, ${organization?.companyName || 'Gen'}`;
        const fullPrompt = `${SYSTEM_PROMPT}\n${orgStr}\nCTX: ${JSON.stringify(contextActivities.map(a => ({ n: a.name, d: a.description })))}${historyStr}\nPROMPT: ${userInput}`;

        const result = await model.generateContent(fullPrompt);
        const responseText = result.response.text();

        // Parse JSON from Gemini (cleaning up potential markdown markers)
        const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const aiResponse = JSON.parse(jsonStr);

        // Sanitize response to ensure matching types and sensible defaults
        const sanitizedActivities = aiResponse.suggestedActivities.map((act: any) => {
            // Fix cost if AI returns "$0" or weird strings
            let cost = act.estimated_cost || 'Low';
            if (cost.includes('$') || cost.toLowerCase().includes('0')) {
                cost = 'Low';
            }

            return {
                ...act,
                id: Date.now() + Math.random(), // Dynamic ID for draft recognition
                category: act.category || 'Team Bonding',
                estimated_cost: cost,
                min_employees: Number(act.min_employees) || 2,
                max_employees: Number(act.max_employees) || 20,
                duration: act.duration || '30 min',
                indoor_outdoor: act.indoor_outdoor || 'Indoor',
                remote_compatible: Number(act.remote_compatible) || 0,
                steps: typeof act.steps === 'string' ? act.steps : JSON.stringify(act.steps || []),
                materials: typeof act.materials === 'string' ? act.materials : JSON.stringify(act.materials || [])
            };
        });


        return {
            message: aiResponse.message,
            suggestedActivities: sanitizedActivities,
            engine: 'gemini'
        };

    } catch (e) {
        console.warn("Real AI failed, falling back to heuristic engine:", e);

        // 4. FALLBACK: Simulated "Generative" Engine (Previous implementation)
        let filteredMatches = matchesWithScore
            .filter(m => m.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(m => m.activity);

        if (filteredMatches.length === 0) {
            filteredMatches = allActivities.filter(a => !(isRemote && a.remote_compatible === 0)).slice(0, 2);
        }

        const suggested = filteredMatches.slice(0, 2).map(act => {
            let adapted = { ...act };
            if (isRemote && act.remote_compatible === 0) {
                adapted.name = `[Virtual] ${act.name}`;
                adapted.description = `A remote-adapted version of ${act.name}. ${act.description}`;
                adapted.remote_compatible = 1;
            } else if (isBudgetLow && act.estimated_cost !== 'Low') {
                adapted.name = `[Budget-Friendly] ${act.name}`;
                adapted.estimated_cost = 'Low';
            }
            if (organization?.companyName) {
                adapted.description = `${organization.companyName} Special: ${adapted.description}`;
            }
            return adapted;
        });

        let message = `I've architected these new variants based on the ${organization?.industry || 'general'} vibes at ${organization?.companyName || 'the office'}. Check out "${suggested[0]?.name || 'the ideas'}" below.`;

        return {
            message,
            suggestedActivities: suggested,
            engine: 'heuristic'
        };
    }
};
