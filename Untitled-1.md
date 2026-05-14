Before starting development, first read and follow:
`server/AI_BACKEND_INSTRUCTIONS.txt`

Follow all architecture, coding, security, scalability, modularity, queue handling, websocket, trading-engine, and backend engineering rules defined there.

====================================================
DATABASE REFERENCE INSTRUCTIONS
====================================================

Before creating or updating any schema:

Check:
`root_dir/refrance_db`

This folder contains existing PostgreSQL SQL schema reference files.

IMPORTANT RULES:
- First analyze existing schema SQL files
- Reuse existing tables/columns whenever possible
- Do NOT create duplicate tables
- Do NOT redesign already-correct schemas
- If schema already exists → use it
- If small changes needed → update safely
- If missing table/column → create properly
- Keep schema naming consistent with existing DB structure

Always maintain:
- backward compatibility
- clean relations
- proper indexes
- UUID ids
- timestamps
- normalized structure

If schema updates are required:
- clearly mention what changed
- explain why update is needed
- generate safe migration changes only

====================================================
TASK
====================================================

We are building APIs for the "Zero-Thinking Trading System".

Generate production-grade backend implementation for the following API/module.

====================================================
API DETAILS
====================================================

Module Name:
Instruments & market data

Feature Name:
1. Download full NSE instruments dump from Kite — used to populate stock_master instrument_keys
2. Fetch full market quote (LTP, OHLC, volume, prev_close) for up to 500 instruments
3. Fetch LTP only for given instruments (lighter call than full quote)
4. Fetch OHLC + LTP for given instruments (used for intraday checks)
5. Fetch historical candles — query params: from, to, interval (day / 15minute). Stores results in historical_daily_data or intraday_candles


API Endpoint:
1. GET /api/broker/kite/instruments
2. GET /api/broker/kite/quote/:instruments
3. GET /api/broker/kite/ltp/:instruments
4. GET  /api/broker/kite/ohlc/:instruments
5. GET  /api/broker/kite/historical/:instrument_token

Example:
GET /api/broker/kite/instruments
GET /api/broker/kite/quote/:instruments
GET /api/broker/kite/ltp/:instruments
GET  /api/broker/kite/ohlc/:instruments
GET  /api/broker/kite/historical/:instrument_token

====================================================
BUSINESS PURPOSE
====================================================

1. Authenticate user — returns JWT access token + refresh token
2. Invalidate refresh token — revoke session from DB
3. Issue new access token using valid refresh token
4. Fetch authenticated user's profile and active settings
5. Update user profile (name, email, preferences)
6. Change password with old-password verification


====================================================
REQUIRED IMPLEMENTATION
====================================================

Generate complete implementation including:

1. Route
2. Controller
3. Service
4. Repository
5. Validation
6. Drizzle schema integration/update (if needed)
7. Middleware integration
8. Error handling
9. Response formatting
10. Logging
11. API testing example

====================================================
IMPORTANT ARCHITECTURE RULES
====================================================

- Use modular architecture
- Use repository pattern
- Keep controllers thin
- Business logic inside service only
- DB logic inside repository only
- Use async/await
- Use centralized error handling
- Use Zod validation
- Use production-grade structure
- Use reusable helpers
- Follow existing project structure strictly

====================================================
PROJECT STRUCTURE
====================================================

Generate files only inside proper module structure:

src/modules/[MODULE_NAME]/

Example:
src/modules/auth/

====================================================
RESPONSE FORMAT
====================================================

Success response:

{
  success: true,
  message: "",
  data: {}
}

Error response:

{
  success: false,
  message: "",
  error: {}
}

====================================================
DATABASE RULES
====================================================

Use:
- PostgreSQL
- Drizzle ORM
- Existing schema references from root_dir/refrance_db
- UUID ids
- timestamps
- proper indexes
- proper relations

====================================================
SECURITY RULES
====================================================

Always include:
- validation
- auth middleware if needed
- secure token handling
- password hashing if needed
- sanitized responses

====================================================
OUTPUT FORMAT
====================================================

Generate:
1. Folder/file structure
2. Full code for every file
3. Required schema updates
4. Route integration
5. Example request/response
6. Postman/cURL examples
7. Notes about scalability or improvements

DO NOT:
- Skip files
- Give pseudo code
- Put logic inside controller
- Create beginner-level structure
- Create duplicate schemas unnecessarily

====================================================
NOW IMPLEMENT THIS API
====================================================


Module Name:
Instruments & market data

Feature Name:
1. Download full NSE instruments dump from Kite — used to populate stock_master instrument_keys
2. Fetch full market quote (LTP, OHLC, volume, prev_close) for up to 500 instruments
3. Fetch LTP only for given instruments (lighter call than full quote)
4. Fetch OHLC + LTP for given instruments (used for intraday checks)
5. Fetch historical candles — query params: from, to, interval (day / 15minute). Stores results in historical_daily_data or intraday_candles


API Endpoint:
1. GET /api/broker/kite/instruments
2. GET /api/broker/kite/quote/:instruments
3. GET /api/broker/kite/ltp/:instruments
4. GET  /api/broker/kite/ohlc/:instruments
5. GET  /api/broker/kite/historical/:instrument_token

Example:
GET /api/broker/kite/instruments
GET /api/broker/kite/quote/:instruments
GET /api/broker/kite/ltp/:instruments
GET  /api/broker/kite/ohlc/:instruments
GET  /api/broker/kite/historical/:instrument_token