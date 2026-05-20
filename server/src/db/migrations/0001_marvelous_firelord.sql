CREATE TABLE IF NOT EXISTS "daily_performance_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"total_trades" integer NOT NULL,
	"winning_trades" integer NOT NULL,
	"losing_trades" integer NOT NULL,
	"win_rate" numeric(5, 2) NOT NULL,
	"total_pnl" numeric(16, 2) NOT NULL,
	"avg_pnl_pct" numeric(7, 2) NOT NULL,
	"capital_deployed" numeric(16, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_performance_snapshots_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_daily_performance_snapshots_date" ON "daily_performance_snapshots" ("date");