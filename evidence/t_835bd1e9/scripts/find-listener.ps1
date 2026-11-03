$conns = Get-NetTCPConnection -LocalPort 3320 -State Listen -ErrorAction SilentlyContinue
foreach ($c in $conns) {
  $p = Get-CimInstance Win32_Process -Filter "ProcessId = $($c.OwningProcess)"
  Write-Output ("PID={0} CMD={1}" -f $c.OwningProcess, $p.CommandLine)
}
