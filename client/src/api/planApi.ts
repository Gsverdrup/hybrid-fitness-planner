export type Goal = "5k" | "10k" | "half" | "marathon";
export type ServerGoal = "5k" | "10k" | "half-marathon" | "marathon";

export type AuthUser = {
	id: string;
	name: string;
	email: string;
	createdAt: string;
};

export type SavedPlan = {
	id: string;
	userId: string;
	goal: ServerGoal;
	planType: "race" | "weekly";
	profileSnapshot: unknown;
	planJson: unknown;
	isActive: boolean;
	createdAt: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";

const ENDPOINT_MAP: Record<Goal, string> = {
	"5k": "/race-plan/5k",
	"10k": "/race-plan/10k",
	half: "/race-plan/half",
	marathon: "/race-plan/marathon",
};

export const GOAL_TO_SERVER_GOAL: Record<Goal, ServerGoal> = {
	"5k": "5k",
	"10k": "10k",
	half: "half-marathon",
	marathon: "marathon",
};

async function parseResponseSafely(response: Response): Promise<unknown> {
	const text = await response.text();
	if (!text) {
		return null;
	}

	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
}

function extractErrorMessage(parsedBody: unknown, fallback: string): string {
	if (typeof parsedBody === "object" && parsedBody !== null && "error" in parsedBody) {
		const errorValue = (parsedBody as { error?: unknown }).error;
		const detailValue = "details" in parsedBody ? (parsedBody as { details?: unknown }).details : undefined;
		if (typeof errorValue === "string" && errorValue.trim()) {
			if (typeof detailValue === "string" && detailValue.trim()) {
				return `${errorValue} ${detailValue}`;
			}
			return errorValue;
		}
	}

	if (typeof parsedBody === "string" && parsedBody.trim()) {
		return parsedBody;
	}

	return fallback;
}

async function request(path: string, init: RequestInit = {}): Promise<unknown> {
	const response = await fetch(`${API_BASE_URL}${path}`, {
		...init,
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
			...(init.headers ?? {}),
		},
	});

	const parsedBody = await parseResponseSafely(response);

	if (!response.ok) {
		throw new Error(extractErrorMessage(parsedBody, "Request failed."));
	}

	return parsedBody;
}

export async function signup(input: { name: string; email: string; password: string }): Promise<AuthUser> {
	const parsed = (await request("/auth/signup", {
		method: "POST",
		body: JSON.stringify(input),
	})) as { user: AuthUser };

	return parsed.user;
}

export async function login(input: { email: string; password: string }): Promise<AuthUser> {
	const parsed = (await request("/auth/login", {
		method: "POST",
		body: JSON.stringify(input),
	})) as { user: AuthUser };

	return parsed.user;
}

export async function logout(): Promise<void> {
	await request("/auth/logout", { method: "POST" });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
	const parsed = (await request("/auth/me", { method: "GET" })) as { user: AuthUser | null };
	return parsed.user;
}

export async function generateRacePlan(goal: Goal, payload: unknown): Promise<unknown> {
	return request(ENDPOINT_MAP[goal], {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

export async function savePlan(input: {
	goal: ServerGoal;
	profileSnapshot: unknown;
	plan: unknown;
	planType?: "race" | "weekly";
}): Promise<SavedPlan> {
	const parsed = (await request("/plans", {
		method: "POST",
		body: JSON.stringify({
			goal: input.goal,
			planType: input.planType ?? "race",
			profileSnapshot: input.profileSnapshot,
			plan: input.plan,
		}),
	})) as { plan: SavedPlan };

	return parsed.plan;
}

export async function getCurrentPlan(goal?: ServerGoal): Promise<SavedPlan | null> {
	const query = goal ? `?goal=${encodeURIComponent(goal)}` : "";

	try {
		const parsed = (await request(`/plans/current${query}`, {
			method: "GET",
		})) as { plan: SavedPlan | null };

		return parsed.plan;
	} catch (error) {
		if (error instanceof Error && error.message === "No saved plan found.") {
			return null;
		}

		throw error;
	}
}
