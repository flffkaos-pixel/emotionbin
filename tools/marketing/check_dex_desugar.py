import zipfile

z = zipfile.ZipFile(r"dist\v18\bundle\release\app-release.aab")
pats = [b"j$/time/", b"Lj$/time", b"java/time/", b"desugar_jdk_libs", b"j$/util/"]
for n in [x for x in z.namelist() if x.endswith(".dex")]:
    data = z.read(n)
    print(n, len(data) // 1024, "KB")
    for p in pats:
        print("   ", p.decode(), "->", data.count(p))
    print()
