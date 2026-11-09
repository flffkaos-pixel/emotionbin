import os
import sqlite3

src = os.path.join(os.environ["LOCALAPPDATA"], "Google", "Chrome", "User Data", "Default", "Network", "Cookies")
print("source:", src, "size KB:", round(os.path.getsize(src) / 1024))

con = sqlite3.connect(f"file:{src}?mode=ro&immutable=1", uri=True)
print("total cookies:", con.execute("SELECT COUNT(*) FROM cookies").fetchone()[0])
rows = con.execute(
    "SELECT host_key, name FROM cookies WHERE host_key LIKE '%google.com%' AND name LIKE '%SID%' LIMIT 12"
).fetchall()
print("google SID cookies:", rows)
rows2 = con.execute(
    "SELECT host_key, name FROM cookies WHERE name IN ('SID','HSID','SSID','SAPISID') LIMIT 12"
).fetchall()
print("auth cookies:", rows2)
hosts = con.execute("SELECT host_key, COUNT(*) FROM cookies GROUP BY host_key ORDER BY 2 DESC LIMIT 10").fetchall()
print("top hosts:", hosts)
