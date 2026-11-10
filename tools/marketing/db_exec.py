import os
import sys
from urllib.parse import unquote

import psycopg

root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
url = open(os.path.join(root, "supabase", ".temp", "pooler-url"), encoding="utf-8").read().strip()

# 비밀번호에 특수문자가 있어도 안전하게 직접 파싱
_, rest = url.split("://", 1)
userinfo, hostpart = rest.rsplit("@", 1)
user, pwd = userinfo.split(":", 1)
host, _, dbname = hostpart.partition("/")
hostname, _, port = host.partition(":")

sql = sys.argv[1] if len(sys.argv) > 1 else "select current_user;"

conn = psycopg.connect(
    host=hostname,
    port=int(port or 5432),
    user=unquote(user),
    password=unquote(pwd),
    dbname=dbname or "postgres",
    sslmode="require",
    connect_timeout=20,
)
conn.autocommit = True
with conn.cursor() as cur:
    cur.execute(sql)
    if cur.description:
        for row in cur.fetchall():
            print(row)
    else:
        print("OK rowcount:", cur.rowcount)
conn.close()
