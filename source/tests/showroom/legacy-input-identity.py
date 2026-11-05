"""Record exact expanded-grant test inputs separately from runtime source maps."""
from pathlib import Path
import datetime,hashlib,json,sys
ROOT=Path(__file__).resolve().parents[2]
paths=['tests/real-cockpit.test.tsx','tests/truck-reference-viewer.test.tsx','tests/truck-tour-integration.test.tsx','tests/setup.ts']
files={name:hashlib.sha256((ROOT/name).read_bytes()).hexdigest() for name in paths}
label=sys.argv[1]
result={'utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':files,'test_input_sha256':hashlib.sha256(json.dumps(files,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'scope':'three explicitly granted test files plus actual shared setup; runtime manifest separate'}
out=ROOT/'docs/showroom-evidence/qa'/('legacy-inputs-'+label+'.json')
out.write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps({'path':str(out),'utc':result['utc'],'test_input_sha256':result['test_input_sha256'],'files':files}))
