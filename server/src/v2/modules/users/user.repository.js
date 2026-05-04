const { query } = require('../../../db/query');

function toSafeUser(row) {
    if (!row) return null;
    // Never expose secrets.
    const { password_hash: _password_hash, two_factor_secret: _two_factor_secret, ...safe } = row;
    return safe;
}

async function findByEmail(email, client) {
    const { rows } = await query(
        `
    SELECT
      id,
      full_name,
      email,
      phone,
      password_hash,
      role,
      status,
      is_email_verified,
      is_phone_verified,
      two_factor_enabled,
      two_factor_secret,
      login_attempts,
      locked_until,
      last_login_at,
      created_at,
      updated_at,
      deleted_at
    FROM users
    WHERE email = $1
    LIMIT 1;
  `,
        [email],
        client
    );
    return rows[0] ?? null;
}

async function findByPhone(phone, client) {
    const { rows } = await query(
        `
    SELECT
      id,
      full_name,
      email,
      phone,
      role,
      status,
      is_email_verified,
      is_phone_verified,
      two_factor_enabled,
      login_attempts,
      locked_until,
      last_login_at,
      created_at,
      updated_at,
      deleted_at
    FROM users
    WHERE phone = $1
    LIMIT 1;
  `,
        [phone],
        client
    );
    return rows[0] ?? null;
}

async function findById(id, client) {
    const { rows } = await query(
        `
    SELECT
      id,
      full_name,
      email,
      phone,
      role,
      status,
      is_email_verified,
      is_phone_verified,
      two_factor_enabled,
      login_attempts,
      locked_until,
      last_login_at,
      created_at,
      updated_at,
      deleted_at
    FROM users
    WHERE id = $1
    LIMIT 1;
  `,
        [id],
        client
    );
    return rows[0] ?? null;
}

async function insertUser({ full_name, email, phone, password_hash }, client) {
    const { rows } = await query(
        `
    INSERT INTO users (full_name, email, phone, password_hash)
    VALUES ($1, $2, $3, $4)
    RETURNING
      id,
      full_name,
      email,
      phone,
      role,
      status,
      is_email_verified,
      is_phone_verified,
      two_factor_enabled,
      login_attempts,
      locked_until,
      last_login_at,
      created_at,
      updated_at,
      deleted_at;
  `,
        [full_name, email, phone ?? null, password_hash],
        client
    );
    return rows[0];
}

async function updateProfile(userId, { full_name, phone, fullNameProvided, phoneProvided }, client) {
    const { rows } = await query(
        `
    UPDATE users
    SET
      full_name = CASE WHEN $4 THEN $2 ELSE full_name END,
      phone = CASE WHEN $5 THEN $3 ELSE phone END,
      updated_at = NOW()
    WHERE id = $1
    RETURNING
      id,
      full_name,
      email,
      phone,
      role,
      status,
      is_email_verified,
      is_phone_verified,
      two_factor_enabled,
      login_attempts,
      locked_until,
      last_login_at,
      created_at,
      updated_at,
      deleted_at;
  `,
        [userId, full_name ?? null, phone ?? null, !!fullNameProvided, !!phoneProvided],
        client
    );
    return rows[0] ?? null;
}

async function updatePassword(userId, passwordHash, client) {
    const { rows } = await query(
        `
    UPDATE users
    SET password_hash = $2, updated_at = NOW()
    WHERE id = $1
    RETURNING id;
  `,
        [userId, passwordHash],
        client
    );
    return rows[0] ?? null;
}

async function markLoginSuccess(userId, client) {
    await query(
        `
    UPDATE users
    SET
      login_attempts = 0,
      locked_until = NULL,
      last_login_at = NOW(),
      updated_at = NOW()
    WHERE id = $1;
  `,
        [userId],
        client
    );
}

async function markLoginFailure(userId, { maxAttempts, lockMinutes }, client) {
    const { rows } = await query(
        `
    UPDATE users
    SET
      login_attempts = login_attempts + 1,
      locked_until = CASE
        WHEN (login_attempts + 1) > $2 THEN NOW() + make_interval(mins => $3)
        ELSE locked_until
      END,
      updated_at = NOW()
    WHERE id = $1
    RETURNING login_attempts, locked_until;
  `,
        [userId, maxAttempts, lockMinutes],
        client
    );
    return rows[0] ?? null;
}

async function listUsers({ limit, offset, status, role }, client) {
    const params = [];
    const where = ['deleted_at IS NULL'];

    if (status) {
        params.push(status);
        where.push(`status = $${params.length}`);
    }
    if (role) {
        params.push(role);
        where.push(`role = $${params.length}`);
    }

    params.push(limit);
    const limitIdx = params.length;
    params.push(offset);
    const offsetIdx = params.length;

    const { rows } = await query(
        `
    SELECT
      id,
      full_name,
      email,
      phone,
      role,
      status,
      is_email_verified,
      is_phone_verified,
      two_factor_enabled,
      login_attempts,
      locked_until,
      last_login_at,
      created_at,
      updated_at,
      deleted_at
    FROM users
    WHERE ${where.join(' AND ')}
    ORDER BY created_at DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx};
  `,
        params,
        client
    );

    const countParams = params.slice(0, params.length - 2);
    const { rows: countRows } = await query(
        `
    SELECT COUNT(*)::int AS total
    FROM users
    WHERE ${where.join(' AND ')};
  `,
        countParams,
        client
    );

    return { items: rows, total: countRows[0]?.total ?? 0 };
}

async function updateUserStatus(userId, status, client) {
    const { rows } = await query(
        `
    UPDATE users
    SET status = $2, updated_at = NOW()
    WHERE id = $1
    RETURNING
      id,
      full_name,
      email,
      phone,
      role,
      status,
      is_email_verified,
      is_phone_verified,
      two_factor_enabled,
      login_attempts,
      locked_until,
      last_login_at,
      created_at,
      updated_at,
      deleted_at;
  `,
        [userId, status],
        client
    );
    return rows[0] ?? null;
}

module.exports = {
    toSafeUser,
    findByEmail,
    findByPhone,
    findById,
    insertUser,
    updateProfile,
    updatePassword,
    markLoginSuccess,
    markLoginFailure,
    listUsers,
    updateUserStatus
};
