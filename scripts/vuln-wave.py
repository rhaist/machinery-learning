#!/usr/bin/env python3
"""Monthly vulnerability counts for the "patch gap" chapter.

Counts, per month: published CVEs, critical ones (CVSS 9.0+), critical ones reachable over
the network without login, and additions to CISA's Known Exploited Vulnerabilities (KEV)
catalogue. Writes src/data/vulnwave.json. Standard library only.

Sources (public, on GitHub, so CI and the monthly task can reach them):
  NVD yearly feeds, mirrored by Fraunhofer FKIE: github.com/fkie-cad/nvd-json-data-feeds
  CISA KEV:                                      github.com/cisagov/kev-data

Usage (from the repo root):  python3 scripts/vuln-wave.py [--cache DIR]
  --cache DIR  keep downloaded feeds in DIR and reuse them (CVE-YYYY.json.xz, kev.json)

Method, kept simple so anyone can re-run it:
  - month = NVD "published" date; rejected CVEs are dropped
  - CVSS = the NVD (Primary) score if there is one, else the first CNA score; v3.1, then
    v3.0, then v4.0. Since April 2026 NVD scores only a minority of CVEs, so most scores now
    come from the organisation (CNA) that published the CVE.
  - only complete months are written (the current month is left out)
"""
import datetime as dt, json, lzma, os, sys, tempfile, urllib.request

FROM = 2024          # first year shown in the chart
FEEDS_FROM = 2015    # older CVE ids are still published today, so read their feeds too
args = sys.argv[1:]
cache = args[args.index('--cache') + 1] if '--cache' in args else tempfile.mkdtemp(prefix='vulnwave-')
os.makedirs(cache, exist_ok=True)
now = dt.datetime.now(dt.timezone.utc)
cutoff = f'{now.year}-{now.month:02d}'


def get(url, name):
    p = os.path.join(cache, name)
    if not (os.path.exists(p) and os.path.getsize(p) > 0):
        with urllib.request.urlopen(url, timeout=300) as r, open(p, 'wb') as f:
            f.write(r.read())
    return p


months = {}
def row(m):
    return months.setdefault(m, {'m': m, 'all': 0, 'crit': 0, 'critnet': 0, 'kev': 0})
def keep(m):
    return f'{FROM}-01' <= m < cutoff


feed_stamp = ''
for y in range(FEEDS_FROM, now.year + 1):
    p = get(f'https://github.com/fkie-cad/nvd-json-data-feeds/releases/latest/download/CVE-{y}.json.xz', f'CVE-{y}.json.xz')
    with lzma.open(p) as f:
        feed = json.load(f)
    if y == now.year:
        feed_stamp = feed.get('timestamp', '')
    for it in feed.get('cve_items', []):
        c = it.get('cve', it)
        if c.get('vulnStatus') == 'Rejected':
            continue
        m = c.get('published', '')[:7]
        if not keep(m):
            continue
        r = row(m)
        r['all'] += 1
        score = None
        for k in ('cvssMetricV31', 'cvssMetricV30', 'cvssMetricV40'):
            arr = c.get('metrics', {}).get(k) or []
            pick = next((x for x in arr if x.get('type') == 'Primary'), arr[0] if arr else None)
            if pick:
                score = pick['cvssData']
                break
        if score and score.get('baseScore', 0) >= 9:
            r['crit'] += 1
            if score.get('attackVector') == 'NETWORK' and score.get('privilegesRequired') == 'NONE':
                r['critnet'] += 1
    del feed

with open(get('https://raw.githubusercontent.com/cisagov/kev-data/main/known_exploited_vulnerabilities.json', 'kev.json')) as f:
    kev = json.load(f)
for v in kev.get('vulnerabilities', []):
    m = v.get('dateAdded', '')[:7]
    if keep(m):
        row(m)['kev'] += 1

out = {
    'generated': now.date().isoformat(),
    'nvd_feed': feed_stamp[:10],
    'kev_catalog': kev.get('catalogVersion', ''),
    'method': 'NVD published month; rejected CVEs dropped; CVSS from NVD where scored, else the CNA; complete months only.',
    'months': sorted(months.values(), key=lambda r: r['m']),
}
with open('src/data/vulnwave.json', 'w') as f:
    json.dump(out, f, indent=1)
    f.write('\n')
ms = out['months']
print(f"vulnwave: {len(ms)} months, {ms[0]['m']} to {ms[-1]['m']}; NVD feed {out['nvd_feed']}, KEV {out['kev_catalog']}")
