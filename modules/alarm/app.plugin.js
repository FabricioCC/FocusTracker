const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withAlarm(config) {
  return withAndroidManifest(config, async config => {
    const manifest = config.modResults;

    if (!manifest.manifest['uses-permission']) {
      manifest.manifest['uses-permission'] = [];
    }

    const permissions = [
      'android.permission.WAKE_LOCK',
      'android.permission.SCHEDULE_EXACT_ALARM',
      'android.permission.USE_EXACT_ALARM',
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.USE_FULL_SCREEN_INTENT',
    ];

    for (const perm of permissions) {
      const exists = manifest.manifest['uses-permission'].some(
        p => p.$?.['android:name'] === perm
      );
      if (!exists) {
        manifest.manifest['uses-permission'].push({
          $: { 'android:name': perm },
        });
      }
    }

    return config;
  });
};