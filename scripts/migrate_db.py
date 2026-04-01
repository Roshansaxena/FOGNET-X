import sqlite3

DB = '/app/fognetx.db'
conn = sqlite3.connect(DB)
cols = [r[1] for r in conn.execute('PRAGMA table_info(events)').fetchall()]
print('Current columns:', cols)

new_cols = [
    ('timestamp', 'TEXT'),
    ('extra_data', 'TEXT'),
    ('humidity', 'REAL'),
    ('pressure', 'REAL'),
    ('light_lux', 'REAL'),
    ('motion', 'INTEGER'),
    ('sound_db', 'REAL'),
    ('vibration', 'REAL'),
    ('air_quality_index', 'REAL'),
    ('tank_level', 'REAL'),
    ('flow_rate', 'REAL'),
    ('power_consumption', 'REAL'),
    ('voltage', 'REAL'),
    ('current_amp', 'REAL'),
    ('device_battery', 'REAL'),
    ('signal_strength', 'REAL'),
    ('device_cpu', 'REAL'),
    ('device_memory', 'REAL'),
    ('network_latency', 'REAL'),
    ('packet_loss', 'REAL'),
]

for col, typ in new_cols:
    if col not in cols:
        conn.execute(f'ALTER TABLE events ADD COLUMN {col} {typ}')
        print(f'  Added: {col}')
    else:
        print(f'  Exists: {col}')

# Backfill timestamp from created_at (unix epoch)
conn.execute("UPDATE events SET timestamp = datetime(created_at, 'unixepoch') WHERE timestamp IS NULL AND created_at IS NOT NULL")
count = conn.execute("SELECT COUNT(*) FROM events WHERE timestamp IS NOT NULL").fetchone()[0]
print(f'Timestamps filled: {count}')

# Also add severity column alias via trigger or just add column
if 'severity' not in cols:
    conn.execute('ALTER TABLE events ADD COLUMN severity TEXT')
    # Backfill severity from risk_score
    conn.execute("UPDATE events SET severity = CASE WHEN risk_score > 0.7 THEN 'CRITICAL' WHEN risk_score > 0.4 THEN 'WARNING' ELSE 'NORMAL' END WHERE severity IS NULL")
    print('  Added and backfilled: severity')

conn.commit()
conn.close()
print('Migration complete!')
