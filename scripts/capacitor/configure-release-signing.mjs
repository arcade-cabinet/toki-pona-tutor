#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const gradlePath = resolve(process.cwd(), 'android/app/build.gradle');
const marker = 'poki-release-signing';

if (!existsSync(gradlePath)) {
  console.error('[android-signing] android/app/build.gradle not found. Run `pnpm exec cap add android` first.');
  process.exit(1);
}

let source = readFileSync(gradlePath, 'utf8');
if (source.includes(marker)) {
  console.log('[android-signing] release signing config already present');
  process.exit(0);
}

const envBlock = `apply plugin: 'com.android.application'

// ${marker}: release signing is injected after Capacitor generates android/.
def pokiReleaseKeystorePath = System.getenv('ANDROID_KEYSTORE_PATH')
def pokiReleaseKeystorePassword = System.getenv('ANDROID_KEYSTORE_PASSWORD')
def pokiReleaseKeyAlias = System.getenv('ANDROID_KEY_ALIAS')
def pokiReleaseKeyPassword = System.getenv('ANDROID_KEY_PASSWORD')
def pokiReleaseSigningConfigured = [
    pokiReleaseKeystorePath,
    pokiReleaseKeystorePassword,
    pokiReleaseKeyAlias,
    pokiReleaseKeyPassword
].every { value -> value != null && value.trim() }
def pokiAndroidVersionCode = (System.getenv('ANDROID_VERSION_CODE') ?: '1') as Integer
def pokiAndroidVersionName = System.getenv('ANDROID_VERSION_NAME') ?: '1.0'
`;

const signingConfigBlock = `    signingConfigs {
        release {
            if (pokiReleaseSigningConfigured) {
                storeFile file(pokiReleaseKeystorePath)
                storePassword pokiReleaseKeystorePassword
                keyAlias pokiReleaseKeyAlias
                keyPassword pokiReleaseKeyPassword
            }
        }
    }
`;

const taskGuardBlock = `gradle.taskGraph.whenReady { graph ->
    def releaseTasks = graph.allTasks.findAll { task ->
        task.path == ':app:assembleRelease' ||
            task.path == ':app:bundleRelease' ||
            task.name == 'assembleRelease' ||
            task.name == 'bundleRelease'
    }
    if (!releaseTasks.isEmpty() && !pokiReleaseSigningConfigured) {
        throw new GradleException('Android release signing requires ANDROID_KEYSTORE_PATH, ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS, and ANDROID_KEY_PASSWORD')
    }
}

`;

function replaceOrFail(input, needle, replacement, label) {
  if (!input.includes(needle)) {
    console.error(`[android-signing] could not locate ${label} in android/app/build.gradle`);
    process.exit(1);
  }
  return input.replace(needle, replacement);
}

source = replaceOrFail(
  source,
  "apply plugin: 'com.android.application'\n",
  envBlock,
  'application plugin line',
);

source = replaceOrFail(
  source,
  '    compileSdk = rootProject.ext.compileSdkVersion\n',
  `    compileSdk = rootProject.ext.compileSdkVersion\n${signingConfigBlock}`,
  'compileSdk line',
);

source = replaceOrFail(
  source,
  '        versionCode 1\n        versionName "1.0"\n',
  '        versionCode pokiAndroidVersionCode\n        versionName pokiAndroidVersionName\n',
  'default version fields',
);

source = replaceOrFail(
  source,
  '        release {\n            minifyEnabled false\n',
  '        release {\n            if (pokiReleaseSigningConfigured) {\n                signingConfig signingConfigs.release\n            }\n            minifyEnabled false\n',
  'release build type',
);

source = replaceOrFail(
  source,
  '}\n\nrepositories {\n',
  `}\n\n${taskGuardBlock}repositories {\n`,
  'repositories block',
);

writeFileSync(gradlePath, source);
console.log('[android-signing] configured release signing in android/app/build.gradle');
