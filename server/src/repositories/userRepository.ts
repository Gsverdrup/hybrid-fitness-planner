import { pool } from "../db";

export type UserRecord = {
	id: string;
	name: string;
	email: string;
	passwordHash: string;
	createdAt: string;
};

export type PublicUser = {
	id: string;
	name: string;
	email: string;
	createdAt: string;
};

type UserRow = {
	id: string;
	name: string;
	email: string;
	password_hash: string;
	created_at: string;
};

function mapUserRow(row: UserRow): UserRecord {
	return {
		id: row.id,
		name: row.name,
		email: row.email,
		passwordHash: row.password_hash,
		createdAt: row.created_at,
	};
}

function toPublicUser(user: UserRecord): PublicUser {
	return {
		id: user.id,
		name: user.name,
		email: user.email,
		createdAt: user.createdAt,
	};
}

export async function createUser(params: {
	name: string;
	email: string;
	passwordHash: string;
}): Promise<PublicUser> {
	const result = await pool.query<UserRow>(
		`
			INSERT INTO users (name, email, password_hash)
			VALUES ($1, $2, $3)
			RETURNING id, name, email, password_hash, created_at
		`,
		[params.name, params.email.toLowerCase(), params.passwordHash]
	);

	return toPublicUser(mapUserRow(result.rows[0]));
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
	const result = await pool.query<UserRow>(
		`
			SELECT id, name, email, password_hash, created_at
			FROM users
			WHERE email = $1
			LIMIT 1
		`,
		[email.toLowerCase()]
	);

	return result.rows.length ? mapUserRow(result.rows[0]) : null;
}

export async function findUserById(id: string): Promise<PublicUser | null> {
	const result = await pool.query<Pick<UserRow, "id" | "name" | "email" | "created_at">>(
		`
			SELECT id, name, email, created_at
			FROM users
			WHERE id = $1
			LIMIT 1
		`,
		[id]
	);

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
