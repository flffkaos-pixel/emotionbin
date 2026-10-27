import zipfile

z = zipfile.ZipFile(r"dist\v18\bundle\release\app-release.aab")
pats = [
    b"WorkDatabase_Impl",
    b"WorkDatabase",
    b"WorkManagerInitializer",
    b"androidx/work/impl/WorkDatabase",
    b"sqliteJni",
    b"androidx/sqlite/db/framework/FrameworkSQLiteOpenHelperFactory",
    b"androidx/room/RoomDatabase",
]
for n in [x for x in z.namelist() if x.endswith(".dex")]:
    data = z.read(n)
    print(n, len(data) // 1024, "KB")
    for p in pats:
        print("   ", p.decode()[:60], "->", data.count(p))
    print()
natives = [x for x in z.namelist() if x.endswith(".so")]
print("native libs:", natives[:15])
print("total entry count:", len(z.namelist()))
