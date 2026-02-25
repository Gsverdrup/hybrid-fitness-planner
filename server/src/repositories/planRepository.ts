import { pool } from "../db";

export type PlanGoal = "5k" | "10k" | "half-marathon" | "marathon";
export type PlanType = "race" | "weekly";

type PlanRow = {
	id: string;
	user_id: string;
	goal: PlanGoal;
	plan_type: PlanType;
	profile_snapshot: unknown;
	plan_json: unknown;
	is_active: boolean;
	created_at: string;
};

export type SavedPlan = {
	id: string;
	userId: string;
	goal: PlanGoal;
	planType: PlanType;
	profileSnapshot: unknown;
	planJson: unknown;
	isActive: boolean;
	createdAt: string;
};

function mapPlanRow(row: PlanRow): SavedPlan {
	return {
		id: row.id,
		userId: row.user_id,
		goal: row.goal,
		planType: row.plan_type,
		profileSnapshot: row.profile_snapshot,
		planJson: row.plan_json,
		isActive: row.is_active,
		createdAt: row.created_at,
	};
}

export async function createSavedPlan(params: {
	userId: string;
	goal: PlanGoal;
	planType: PlanType;
	profileSnapshot: unknown;
	planJson: unknown;
}): Promise<SavedPlan> {
	const client = await pool.connect();
	const serializedProfileSnapshot = JSON.stringify(params.profileSnapshot ?? null);
	const serializedPlanJson = JSON.stringify(params.planJson ?? null);

	try {
		await client.query("BEGIN");
		await client.query(
			`SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))`,
			[params.userId, params.goal]
		);
		await client.query(
			`
				UPDATE plans
				SET is_active = false
				WHERE user_id = $1 AND goal = $2 AND is_active = true
			`,
			[params.userId, params.goal]
		);

		const result = await client.query<PlanRow>(
			`
				INSERT INTO plans (user_id, goal, plan_type, profile_snapshot, plan_json, is_active)
				VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, true)
				RETURNING id, user_id, goal, plan_type, profile_snapshot, plan_json, is_active, created_at
			`,
			[params.userId, params.goal, params.planType, serializedProfileSnapshot, serializedPlanJson]
		);

		await client.query("COMMIT");
		return mapPlanRow(result.rows[0]);
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
}

export async function getCurrentSavedPlan(userId: string, goal?: PlanGoal): Promise<SavedPlan | null> {
	const values: unknown[] = [userId];
	const goalWhere = goal ? "AND goal = $2" : "";

	if (goal) {
		values.push(goal);
	}

	const result = await pool.query<PlanRow>(
		`
			SELECT id, user_id, goal, plan_type, profile_snapshot, plan_json, is_active, created_at
			FROM plans
			WHERE user_id = $1 ${goalWhere}
			ORDER BY is_active DESC, created_at DESC
			LIMIT 1
		`,
		values
	);

	return result.rows.length ? mapPlanRow(result.rows[0]) : null;
}

export async function getSavedPlanHistory(params: {
	userId: string;
	goal?: PlanGoal;
	limit?: number;
}): Promise<SavedPlan[]> {
	const values: unknown[] = [params.userId];
	let where = "WHERE user_id = $1";

	if (params.goal) {
		values.push(params.goal);
		where += ` AND goal = $${values.length}`;
	}

	const maxLimit = Math.max(1, Math.min(params.limit ?? 20, 100));
	values.push(maxLimit);

	const result = await pool.query<PlanRow>(
		`
			SELECT id, user_id, goal, plan_type, profile_snapshot, plan_json, is_active, created_at
			FROM plans
			${where}
			ORDER BY created_at DESC
			LIMIT $${values.length}
		`,
		values
	);

	return result.rows.map(mapPlanRow);
}
