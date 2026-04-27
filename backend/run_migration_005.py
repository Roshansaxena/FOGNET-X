import sqlite3
import os

DB_NAME = "fognetx.db"
MIGRATION_FILE = "migrations/005_create_device_thresholds.sql"

def run_migration():
    """Run the device thresholds migration"""
    print("🔧 Running migration 005: Device Thresholds & Actuator Control...")
    
    if not os.path.exists(MIGRATION_FILE):
        print(f"❌ Migration file not found: {MIGRATION_FILE}")
        return False
    
    try:
        # Read migration file
        with open(MIGRATION_FILE, 'r') as f:
            sql = f.read()
        
        # Connect to database
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        
        # Execute migration
        cursor.executescript(sql)
        conn.commit()
        
        # Verify tables created
        tables = cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name IN ('device_thresholds', 'actuator_states')
        """).fetchall()
        
        if len(tables) == 2:
            print("✅ Migration successful!")
            print("   - device_thresholds table created")
            print("   - actuator_states table created")
            
            # Count existing devices (if table exists)
            try:
                devices = cursor.execute("SELECT COUNT(*) FROM devices").fetchone()
                if devices and devices[0] > 0:
                    thresholds = cursor.execute("SELECT COUNT(*) FROM device_thresholds").fetchone()
                    actuators = cursor.execute("SELECT COUNT(*) FROM actuator_states").fetchone()
                    print(f"   - {thresholds[0]} device thresholds created")
                    print(f"   - {actuators[0]} actuator states created")
            except:
                print("   - No devices table yet (will populate when devices register)")
            
            return True
        else:
            print("❌ Migration failed - tables not created")
            return False
            
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    success = run_migration()
    if success:
        print("\n✅ Database migration completed successfully!")
    else:
        print("\n❌ Database migration failed!")
        exit(1)
