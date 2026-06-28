import { Activity, getRecentHistory, logGeneration, getAllActivities, db } from './db';
import { getGeminiModel, SYSTEM_PROMPT } from '../config/aiConfig';

export interface FilterParams {
  category?: string;
  duration?: string;
  budgetLevel?: 'Low' | 'Medium' | 'High';
  indoorOutdoor?: string;
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
  count = 3
): Promise<SmartEngineResult> => {
  const allActivities = await getAllActivities();
  const recentHistory = await getRecentHistory(30);
  const recentActivityIds = new Set(recentHistory.map(h => h.activity_id));

  let filtered = allActivities.filter(activity => {
    const needsRemote = filters.remoteCompatible || (organization as Record<string, string>)?.workType === 'Remote';
    if (needsRemote && activity.remote_compatible === 0) return false;
    if (filters.category && activity.category !== filters.category) return false;
    if (filters.duration && activity.duration !== filters.duration) return false;

    if (filters.budgetLevel) {
      const budgetOrder = ['Low', 'Medium', 'High'];
      const filterIndex = budgetOrder.indexOf(filters.budgetLevel);
      const activityIndex = budgetOrder.indexOf(activity.estimated_cost);
      if (activityIndex > filterIndex) return false;
    }

    if (filters.indoorOutdoor) {
      if (activity.indoor_outdoor !== 'Both' && activity.indoor_outdoor !== filters.indoorOutdoor) return false;
    }

    return true;
  });

  const freshActivities = filtered.filter(a => !recentActivityIds.has(a.id!));
  let candidates = freshActivities;
  let fallbackUsed = false;

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

  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  let message = "Here are some great activities for your team!";
  if (fallbackUsed) {
    message = "You've done these recently, but they match your filters best.";
  } else if (filters.category) {
    message = `Perfect ${filters.category} activities to boost engagement.`;
  } else {
    const categoryCounts = recentHistory.reduce((acc, curr) => {
      const act = allActivities.find(a => a.id === curr.activity_id);
      if (act) acc[act.category] = (acc[act.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if (selected.length > 0) {
      const suggestedCategory = selected[0].category;
      if (!categoryCounts[suggestedCategory]) {
        message = `You haven't tried ${suggestedCategory} activities recently — great time to start!`;
      }
    }
  }

  for (const activity of selected) {
    await logGeneration(activity.id!);
  }

  return { activities: selected, message };
};

export const processAIChat = async (
  userInput: string,
  history: { role: string; content: string }[],
  organization: any
): Promise<AIChatResponse> => {
  const input = userInput.toLowerCase();
  const allActivities = await db.activities.toArray();

  const isRemote = input.includes('remote') || input.includes('online') || input.includes('virtual');
  const isBudgetLow = input.includes('cheap') || input.includes('free') || input.includes('low budget');

  const matchesWithScore = allActivities.map(a => {
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

  try {
    const model = getGeminiModel();
    const recentHistory = history.slice(-4);
    const historyStr = recentHistory.length > 0 ? `\nHISTORY:\n${JSON.stringify(recentHistory)}` : "";
    const orgStr = `ORG: ${(organization as Record<string, string>)?.industry || 'Gen'}, ${(organization as Record<string, string>)?.companyName || 'Gen'}`;
    const fullPrompt = `${SYSTEM_PROMPT}\n${orgStr}\nCTX: ${JSON.stringify(contextActivities.map(a => ({ n: a.name, d: a.description })))}${historyStr}\nPROMPT: ${userInput}`;

    const result = await model.generateContent(fullPrompt);
    const responseText = result.response.text();
    const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const aiResponse = JSON.parse(jsonStr);

    const sanitizedActivities = aiResponse.suggestedActivities.map((act: Record<string, unknown>) => {
      let cost = (act.estimated_cost as string) || 'Low';
      if (cost.includes('$') || cost.toLowerCase().includes('0')) cost = 'Low';

      return {
        ...act,
        id: Date.now() + Math.random(),
        category: act.category || 'Team Bonding',
        estimated_cost: cost,
        min_employees: Number(act.min_employees) || 2,
        max_employees: Number(act.max_employees) || 20,
        duration: act.duration || '30 min',
        indoor_outdoor: act.indoor_outdoor || 'Indoor',
        remote_compatible: Number(act.remote_compatible) || 0,
        steps: typeof act.steps === 'string' ? act.steps : JSON.stringify(act.steps || []),
        materials: typeof act.materials === 'string' ? act.materials : JSON.stringify(act.materials || []),
      };
    });

    return {
      message: aiResponse.message,
      suggestedActivities: sanitizedActivities,
      engine: 'gemini'
    };
  } catch (e) {
    console.warn("Real AI failed, falling back to heuristic engine:", e);

    let filteredMatches = matchesWithScore
      .filter(m => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(m => m.activity);

    if (filteredMatches.length === 0) {
      filteredMatches = allActivities.filter(a => !(isRemote && a.remote_compatible === 0)).slice(0, 2);
    }

    const suggested = filteredMatches.slice(0, 2).map(act => {
      const adapted = { ...act };
      if (isRemote && act.remote_compatible === 0) {
        adapted.name = `[Virtual] ${act.name}`;
        adapted.description = `A remote-adapted version of ${act.name}. ${act.description}`;
        adapted.remote_compatible = 1;
      } else if (isBudgetLow && act.estimated_cost !== 'Low') {
        adapted.name = `[Budget-Friendly] ${act.name}`;
        adapted.estimated_cost = 'Low';
      }
      if ((organization as Record<string, string>)?.companyName) {
        adapted.description = `${(organization as Record<string, string>).companyName} Special: ${adapted.description}`;
      }
      return adapted;
    });

    const message = `I've architected these new variants based on the ${(organization as Record<string, string>)?.industry || 'general'} vibes at ${(organization as Record<string, string>)?.companyName || 'the office'}. Check out "${suggested[0]?.name || 'the ideas'}" below.`;

    return {
      message,
      suggestedActivities: suggested,
      engine: 'heuristic'
    };
  }
};
