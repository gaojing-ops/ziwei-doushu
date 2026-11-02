param([string]$SdkRoot = $env:ANDROID_SDK_ROOT, [string]$JavaRoot = $env:JAVA_HOME)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
if (-not $SdkRoot) { $SdkRoot = Join-Path $projectRoot '.android-tools\sdk' }
if (-not $JavaRoot) {
    $portableJdk = Get-ChildItem -LiteralPath (Join-Path $projectRoot '.android-tools\jdk21') -Directory -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($portableJdk) { $JavaRoot = $portableJdk.FullName }
}
if (-not $JavaRoot -or -not (Test-Path -LiteralPath (Join-Path $JavaRoot 'bin\java.exe'))) { throw 'JDK 21 is required. Set JAVA_HOME or provide -JavaRoot.' }
if (-not (Test-Path -LiteralPath (Join-Path $SdkRoot 'platforms\android-36\android.jar'))) { throw 'Android SDK platform 36 is required. Install it after accepting the Google SDK license, then set ANDROID_SDK_ROOT or provide -SdkRoot.' }
$env:JAVA_HOME = $JavaRoot
$env:ANDROID_HOME = $SdkRoot
$env:ANDROID_SDK_ROOT = $SdkRoot
$env:GRADLE_USER_HOME = Join-Path $projectRoot '.android-tools\gradle-cache'
$env:PATH = (Join-Path $JavaRoot 'bin') + [IO.Path]::PathSeparator + $env:PATH
$sdkProperty = 'sdk.dir=' + $SdkRoot.Replace('\', '/')
$sdkProperty = -join ($sdkProperty.ToCharArray() | ForEach-Object {
    if ([int]$_ -gt 127) { '\u{0:x4}' -f [int]$_ } else { [string]$_ }
})
[IO.File]::WriteAllText((Join-Path $projectRoot 'android\local.properties'), $sdkProperty + "`n", [Text.UTF8Encoding]::new($false))
# Remove only these generated resource directories, after checking workspace bounds
# and reparse points. Stale hashed bundles must not be carried into a new APK.
foreach ($generatedRelative in @('mobile\dist', 'android\app\src\main\assets\public')) {
    $generatedPath = [IO.Path]::GetFullPath((Join-Path $projectRoot $generatedRelative))
    $projectPrefix = [IO.Path]::GetFullPath($projectRoot).TrimEnd('\') + '\'
    if (-not $generatedPath.StartsWith($projectPrefix, [StringComparison]::OrdinalIgnoreCase)) { throw 'Generated asset path is outside this project.' }
    if (Test-Path -LiteralPath $generatedPath) {
        $generatedItems = @((Get-Item -LiteralPath $generatedPath)) + @(Get-ChildItem -LiteralPath $generatedPath -Recurse -Force)
        if ($generatedItems | Where-Object { $_.Attributes -band [IO.FileAttributes]::ReparsePoint }) { throw 'Refusing to clean generated assets through a reparse point.' }
        Remove-Item -LiteralPath $generatedPath -Recurse -Force
    }
}
Push-Location $projectRoot
try {
    & npm.cmd run mobile:sync
    if ($LASTEXITCODE -ne 0) { throw 'Mobile asset build failed.' }
    Push-Location (Join-Path $projectRoot 'android')
    try {
        & .\gradlew.bat --no-daemon :app:compileDebugUnitTestJavaWithJavac :app:assembleDebug
        if ($LASTEXITCODE -ne 0) { throw 'Android Gradle build failed.' }
    } finally { Pop-Location }
    # Invoke JUnit directly: Gradle's Windows test-worker argument file corrupts Unicode cache paths.
    $junit = (Get-ChildItem -LiteralPath (Join-Path $env:GRADLE_USER_HOME 'caches\modules-2\files-2.1\junit\junit\4.13.2') -Recurse -Filter '*.jar' | Select-Object -First 1).FullName
    $hamcrest = (Get-ChildItem -LiteralPath (Join-Path $env:GRADLE_USER_HOME 'caches\modules-2\files-2.1\org.hamcrest\hamcrest-core\1.3') -Recurse -Filter '*.jar' | Select-Object -First 1).FullName
    $testClasses = Join-Path $projectRoot 'android\app\build\intermediates\javac\debugUnitTest\compileDebugUnitTestJavaWithJavac\classes'
    $appClasses = Join-Path $projectRoot 'android\app\build\intermediates\javac\debug\compileDebugJavaWithJavac\classes'
    $testClasspath = @($junit, $hamcrest, $testClasses, $appClasses) -join [IO.Path]::PathSeparator
    & (Join-Path $JavaRoot 'bin\java.exe') '-Dfile.encoding=UTF-8' '-cp' $testClasspath org.junit.runner.JUnitCore cn.local.ziweichart.SseReaderTest
    if ($LASTEXITCODE -ne 0) { throw 'Native SSE regression tests failed.' }
    $outputDir = Join-Path $projectRoot 'outputs'
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    $apk = Join-Path $outputDir 'Ziwei-DeepSeek-1.2.apk'
    Copy-Item -LiteralPath (Join-Path $projectRoot 'android\app\build\outputs\apk\debug\app-debug.apk') -Destination $apk -Force
    $stream = [IO.File]::OpenRead($apk)
    $hasher = [Security.Cryptography.SHA256]::Create()
    try { $sha256 = [BitConverter]::ToString($hasher.ComputeHash($stream)).Replace('-', '').ToLowerInvariant() }
    finally { $hasher.Dispose(); $stream.Dispose() }
    [IO.File]::WriteAllText(($apk + '.sha256'), $sha256 + '  Ziwei-DeepSeek-1.2.apk' + "`n", [Text.UTF8Encoding]::new($false))
    Write-Output ('APK ready: ' + $apk)
} finally { Pop-Location }
