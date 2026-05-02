const bcrypt = require("bcrypt")

const { withTransaction, closeDb } = require("./index")
const { query } = require("./query")

function getArg(name) {
  const idx = process.argv.findIndex((a) => a === `--${name}`)
  if (idx === -1) return undefined
  return process.argv[idx + 1]
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`)
}

async function upsertAdmin({ email, password, full_name, resetPassword }) {
  const password_hash = await bcrypt.hash(password, 12)

  return withTransaction(async (client) => {
    const existing = await query(
      `
      SELECT id, email, role, status, deleted_at
      FROM users
      WHERE email = $1
      LIMIT 1;
    `,
      [email],
      client
    )

    if (existing.rows[0]) {
      const userId = existing.rows[0].id

      if (resetPassword) {
        await query(
          `
          UPDATE users
          SET
            password_hash = $2,
            role = 'ADMIN',
            status = 'ACTIVE',
            deleted_at = NULL,
            updated_at = NOW()
          WHERE id = $1;
        `,
          [userId, password_hash],
          client
        )
      } else {
        await query(
          `
          UPDATE users
          SET
            role = 'ADMIN',
            status = 'ACTIVE',
            deleted_at = NULL,
            updated_at = NOW()
          WHERE id = $1;
        `,
          [userId],
          client
        )
      }

      const { rows } = await query(
        `
        SELECT id, full_name, email, phone, role, status, created_at, updated_at, deleted_at
        FROM users
        WHERE id = $1
        LIMIT 1;
      `,
        [userId],
        client
      )
      return rows[0]
    }

    const { rows } = await query(
      `
      INSERT INTO users (full_name, email, phone, password_hash, role, status)
      VALUES ($1, $2, NULL, $3, 'ADMIN', 'ACTIVE')
      RETURNING id, full_name, email, phone, role, status, created_at, updated_at, deleted_at;
    `,
      [full_name, email, password_hash],
      client
    )
    return rows[0]
  })
}

async function main() {
  const email = getArg("email") || "admin@invest06.com"
  const password = getArg("password") || "Admin@12345678"
  const full_name = getArg("name") || "Admin"
  const resetPassword = hasFlag("reset-password")

  const user = await upsertAdmin({ email, password, full_name, resetPassword })
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        success: true,
        message: resetPassword ? "Admin user upserted (password reset)" : "Admin user upserted",
        data: { id: user.id, email: user.email, role: user.role, status: user.status },
      },
      null,
      2
    )
  )
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    await closeDb()
  })

