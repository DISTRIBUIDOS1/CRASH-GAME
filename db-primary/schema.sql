CREATE TABLE rounds (
  id SERIAL PRIMARY KEY,
  round_id INTEGER,
  crash_at FLOAT,
  results JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE bets (
    id SERIAL PRIMARY KEY,
    round_id INT REFERENCES rounds(id),
    player_id VARCHAR(100) NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    cashed_out_at NUMERIC(6,2),
    payout NUMERIC(10,2),
    created_at TIMESTAMP DEFAULT NOW()
);
