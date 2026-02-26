import { pool } from "../db";
function mapUserRow(row) {
    return {
        id: row.id,
        name: row.name,
        email: row.email,
        passwordHash: row.password_hash,
        createdAt: row.created_at,
    };
}
function toPublicUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
    };
}
export async function createUser(params) {
    const result = await pool.query(`
			INSERT INTO users (name, email, password_hash)
			VALUES ($1, $2, $3)
			RETURNING id, name, email, password_hash, created_at
		`, [params.name, params.email.toLowerCase(), params.passwordHash]);
    return toPublicUser(mapUserRow(result.rows[0]));
}
export async function findUserByEmail(email) {
    const result = await pool.query(`
			SELECT id, name, email, password_hash, created_at
			FROM users
			WHERE email = $1
			LIMIT 1
		`, [email.toLowerCase()]);
    return result.rows.length ? mapUserRow(result.rows[0]) : null;
}
export async function findUserById(id) {
    const result = await pool.query(`
			SELECT id, name, email, created_at
			FROM users
			WHERE id = $1
			LIMIT 1
		`, [id]);
    if (!result.rows.length) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row.id,
        name: row.name,
        email: row.email,
        createdAt: row.created_at,
    };
}
