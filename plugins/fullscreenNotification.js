const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withFullScreenNotification(config) {
  return withAndroidManifest(config, async config => {
    const manifest = config.modResults;
    const application = manifest.manifest.application[0];

    // Activity que abre quando toca na notificação
    if (!application.activity) application.activity = [];

    const alreadyExists = application.activity.some(
      a => a.$?.['android:name'] === '.NotificationActivity'
    );

    if (!alreadyExists) {
      application.activity.push({
        $: {
          'android:name': '.NotificationActivity',
          'android:exported': 'true',
          'android:showWhenLocked': 'true',
          'android:turnScreenOn': 'true',
          'android:launchMode': 'singleTask',
        },
      });
    }

    // permissão USE_FULL_SCREEN_INTENT
    if (!manifest.manifest['uses-permission']) {
      manifest.manifest['uses-permission'] = [];
    }

    const hasPermission = manifest.manifest['uses-permission'].some(
      p => p.$?.['android:name'] === 'android.permission.USE_FULL_SCREEN_INTENT'
    );

    if (!hasPermission) {
      manifest.manifest['uses-permission'].push({
        $: { 'android:name': 'android.permission.USE_FULL_SCREEN_INTENT' },
      });
    }

    return config;
  });
};
