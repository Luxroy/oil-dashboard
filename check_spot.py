import urllib.request
import json
import os

api_key = os.environ.get("VITE_EIA_KEY")
url = f"https://api.eia.gov/v2/petroleum/pri/spt/facet/series?api_key={api_key}"

req = urllib.request.Request(url)
with urllib.request.urlopen(req) as response:
    data = json.loads(response.read().decode())
    print(json.dumps(data["response"]["facets"], indent=2))
