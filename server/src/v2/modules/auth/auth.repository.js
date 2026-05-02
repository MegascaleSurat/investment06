const { query } = require("../../../db/query");

const findUserByEmail = async (email) => {
    const res = await query(
        `SELECT * FROM users WHERE email = $1 LIMIT 1`,
        [email]
    );
    return res.rows[0];
};

const updateFailedAttempts = async (userId, maxAttempts) => {
    await query(
        `UPDATE users 
     SET login_attempts = login_attempts + 1,
         locked_until = CASE 
           WHEN login_attempts + 1 >= $2 
           THEN NOW() + INTERVAL '15 minutes'
           ELSE locked_until
         END
     WHERE id = $1`,
        [userId, maxAttempts]
    );
};

const resetLoginAttempts = async (userId) => {
    await query(
        `UPDATE users 
     SET login_attempts = 0,
         locked_until = NULL,
         last_login_at = NOW()
     WHERE id = $1`,
        [userId]
    );
};

module.exports = {
    findUserByEmail,
    updateFailedAttempts,
    resetLoginAttempts,
};