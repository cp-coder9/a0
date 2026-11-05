$ErrorActionPreference='Stop'
[Console]::OutputEncoding=[Text.Encoding]::UTF8
$env:GIT_TERMINAL_PROMPT='0'
$env:GCM_INTERACTIVE='never'
$git='C:\Program Files\Git\cmd\git.exe'
$repo='E:\kerry\trukafrik_private\github-backup'
& $git -C $repo init -b main
if($LASTEXITCODE){throw 'Git init failed'}
& $git -C $repo remote add origin https://github.com/cp-coder9/a0.git
& $git -C $repo fetch origin main
if($LASTEXITCODE){throw 'Git fetch failed'}
& $git -C $repo checkout -B main origin/main
if($LASTEXITCODE){throw 'Git checkout failed'}
& $git -C $repo push --dry-run origin HEAD:main
if($LASTEXITCODE){throw 'GitHub push authentication unavailable'}
& $git -C $repo add --all
if($LASTEXITCODE){throw 'Git staging failed'}
& $git -C $repo -c user.name='Codex' -c user.email='codex@users.noreply.github.com' commit -m 'Back up verified Truk Afrik deployment and website source'
if($LASTEXITCODE){throw 'Git commit failed'}
& $git -C $repo -c pack.threads=2 -c core.compression=3 push origin main
if($LASTEXITCODE){throw 'Git push failed'}
& $git -C $repo rev-parse HEAD
& $git -C $repo ls-remote origin refs/heads/main
