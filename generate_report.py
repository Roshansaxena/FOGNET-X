import sqlite3
import pandas as pd
import matplotlib.pyplot as plt

DB = "fognetx.db"

conn = sqlite3.connect(DB)
df = pd.read_sql_query("SELECT * FROM events", conn)
conn.close()

if df.empty:
    print("No data available.")
    exit()

# Separate fog vs cloud allocations
fog_df = df[df["allocation"] == "FOG_EXECUTION"]
cloud_df = df[df["allocation"] == "CLOUD_EXECUTION"]
hybrid_df = df[df["allocation"] == "FOG_AND_CLOUD"]

print("\n===== FOGNET-X PERFORMANCE REPORT =====")

# Average latencies
avg_fog_latency = fog_df["fog_latency"].mean()
avg_cloud_latency = cloud_df["cloud_latency"].mean()

print(f"Average Fog Latency: {avg_fog_latency:.2f} ms")
print(f"Average Cloud Latency: {avg_cloud_latency:.2f} ms")

# SLA Violations
sla_violations = df["sla_violation"].sum()
total_events = len(df)

print(f"SLA Violations: {sla_violations} / {total_events}")

# Allocation distribution
allocation_counts = df["allocation"].value_counts()
print("\nTask Allocation Distribution:")
print(allocation_counts)

# Save CSV for report
df.to_csv("fognetx_results.csv", index=False)
print("\nResults exported to fognetx_results.csv")

# Create latency comparison graph
plt.figure()
plt.bar(["Fog", "Cloud"],
        [avg_fog_latency if not pd.isna(avg_fog_latency) else 0,
         avg_cloud_latency if not pd.isna(avg_cloud_latency) else 0])

plt.ylabel("Average Latency (ms)")
plt.title("Fog vs Cloud Latency Comparison")
plt.savefig("latency_comparison.png")
plt.show()
