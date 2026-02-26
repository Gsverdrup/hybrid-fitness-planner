import { pool } from "../db";
function mapPlanRow(row) {
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
export async function createSavedPlan(params) {
    const client = await pool.connect();
    const serializedProfileSnapshot = JSON.stringify(params.profileSnapshot ?? null);
    const serializedPlanJson = JSON.stringify(params.planJson ?? null);
    try {
        await client.query("BEGIN");
        await client.query(`SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))`, [params.userId, params.goal]);
        await client.query(`
				UPDATE plans
				SET is_active = false
				WHERE user_id = $1 AND goal = $2 AND is_active = true
			`, [params.userId, params.goal]);
        const result = await client.query(`
				INSERT INTO plans (user_id, goal, plan_type, profile_snapshot, plan_json, is_active)
				VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, true)
				RETURNING id, user_id, goal, plan_type, profile_snapshot, plan_json, is_active, created_at
			`, [params.userId, params.goal, params.planType, serializedProfileSnapshot, serializedPlanJson]);
        await client.query("COMMIT");
        return mapPlanRow(result.rows[0]);
    }
    catch (error) {
        await client.query("ROLLBACK");
        throw error;
    }
    finally {
        client.release();
    }
}
export async function getCurrentSavedPlan(userId, goal) {
    const values = [userId];
    const goalWhere = goal ? "AND goal = $2" : "";
    if (goal) {
        values.push(goal);
    }
    const result = await pool.query(`
			SELECT id, user_id, goal, plan_type, profile_snapshot, plan_json, is_active, created_at
			FROM plans
			WHERE user_id = $1 ${goalWhere}
			ORDER BY is_active DESC, created_at DESC
			LIMIT 1
		`, values);
    return result.rows.length ? mapPlanRow(result.rows[0]) : null;
}
export async function getSavedPlanHistory(params) {
    const values = [params.userId];
    let where = "WHERE user_id = $1";
    if (params.goal) {
        values.push(params.goal);
        where += ` AND goal = $${values.length}`;
    }
    const maxLimit = Math.max(1, Math.min(params.limit ?? 20, 100));
    values.push(maxLimit);
    const result = await pool.query(`
			SELECT id, user_id, goal, plan_type, profile_snapshot, plan_json, is_active, created_at
			FROM plans
			${where}
			ORDER BY created_at DESC
			LIMIT $${values.length}
		`, values);
    return result.rows.map(mapPlanRow);
}
