# Read existing PNGs only: bake opaque furniture contours into renderer-independent data.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$repoRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../../../..'))
$layout = Get-Content -LiteralPath (Join-Path $repoRoot 'apps/web/public/art/front-of-house-layout-v2/layout.json') -Raw | ConvertFrom-Json
$solidIds = @($layout.instances | Where-Object { $_.layer -in 2, 3, 5, 6 } | Select-Object -ExpandProperty asset -Unique)
function Write-CollisionShapes($assets, $ids, $outputName) {
    $shapes = [ordered]@{}
    foreach ($asset in $assets | Where-Object { $_.id -in $ids } | Sort-Object id) {
        $imagePath = Join-Path $repoRoot $asset.repositoryImage
        $bitmap = [System.Drawing.Bitmap]::new($imagePath)
        try {
            $rects = [Collections.Generic.List[object]]::new()
            $active = @{}
            for ($y = 0; $y -lt $bitmap.Height; $y++) {
                $next = @{}
                $x = 0
                while ($x -lt $bitmap.Width) {
                    if ($bitmap.GetPixel($x, $y).A -eq 0) { $x++; continue }
                    $start = $x
                    while ($x -lt $bitmap.Width -and $bitmap.GetPixel($x, $y).A -gt 0) { $x++ }
                    $width = $x - $start
                    $key = "$start,$width"
                    if ($active.ContainsKey($key)) {
                        $rect = $active[$key]
                        $rect.height++
                    } else {
                        $rect = [pscustomobject][ordered]@{ x = $start; y = $y; width = $width; height = 1 }
                        $rects.Add($rect)
                    }
                    $next[$key] = $rect
                }
                $active = $next
            }
            $shapes[$asset.id] = [ordered]@{
                sha256 = (Get-FileHash -LiteralPath $imagePath -Algorithm SHA256).Hash.ToLowerInvariant()
                rects = @($rects.ToArray())
            }
        } finally {
            $bitmap.Dispose()
        }
    }
    $json = [ordered]@{ schemaVersion = 1; assets = $shapes } | ConvertTo-Json -Depth 8
    [IO.File]::WriteAllText((Join-Path $PSScriptRoot $outputName), $json + "`n")
    Write-Output "Baked $($shapes.Count) furniture contours. No artwork was modified."

}
Write-CollisionShapes $layout.assets $solidIds 'collision-shapes.json'
$kitchen = Get-Content -LiteralPath (Join-Path $repoRoot 'apps/web/public/art/kitchen-layout-v6/layout.json') -Raw | ConvertFrom-Json
$kitchenIds = @($kitchen.instances | Where-Object { $_.layer -in 3, 4, 5, 6 } | Select-Object -ExpandProperty texture -Unique)
$kitchenAssets = @($kitchen.assets | ForEach-Object { [pscustomobject]@{ id = $_.id; repositoryImage = "apps/web/public/art/kitchen-layout-v6/$($_.image)" } })
Write-CollisionShapes $kitchenAssets $kitchenIds 'kitchen-collision-shapes.json'
