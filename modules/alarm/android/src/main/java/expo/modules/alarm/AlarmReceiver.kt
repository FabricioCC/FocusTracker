package expo.modules.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.media.Ringtone
import android.media.RingtoneManager
import android.os.Build
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

class AlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    // evita double trigger
    if (isOrderedBroadcast) {
      abortBroadcast()
    }

    val pm = context.getSystemService(Context.POWER_SERVICE) as PowerManager
    val wl = pm.newWakeLock(
      PowerManager.FULL_WAKE_LOCK or
      PowerManager.ACQUIRE_CAUSES_WAKEUP or
      PowerManager.ON_AFTER_RELEASE,
      "FocusTracker::AlarmWakeLock"
    )
    wl.acquire(10 * 60 * 1000L)

    // toca som apenas se não estiver em silencioso
    val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    if (audioManager.ringerMode != AudioManager.RINGER_MODE_SILENT) {
      try {
        val alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
          ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
        val ringtone = RingtoneManager.getRingtone(context, alarmUri)
        ringtone.play()
        AlarmSoundManager.ringtone = ringtone

        // para depois de 60 segundos se não interagir
        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
          AlarmSoundManager.stop()
        }, 60000)
      } catch (e: Exception) {
        e.printStackTrace()
      }
    }

    // vibra
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        val vm = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
        vm.defaultVibrator.vibrate(
          VibrationEffect.createWaveform(longArrayOf(0, 500, 200, 500), -1)
        )
      } else {
        @Suppress("DEPRECATION")
        val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          vibrator.vibrate(
            VibrationEffect.createWaveform(longArrayOf(0, 500, 200, 500), -1)
          )
        } else {
          @Suppress("DEPRECATION")
          vibrator.vibrate(longArrayOf(0, 500, 200, 500), -1)
        }
      }
    } catch (e: Exception) {
      e.printStackTrace()
    }

    // abre a tela
    val alarmIntent = Intent(context, AlarmActivity::class.java).apply {
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or
              Intent.FLAG_ACTIVITY_CLEAR_TOP or
              Intent.FLAG_ACTIVITY_SINGLE_TOP
      putExtra("alarmId", intent.getStringExtra("alarmId"))
      putExtra("itemId", intent.getStringExtra("itemId"))
      putExtra("itemTitle", intent.getStringExtra("itemTitle"))
      putExtra("itemProgress", intent.getIntExtra("itemProgress", 0))
      putExtra("itemCurrent", intent.getIntExtra("itemCurrent", 0))
      putExtra("itemTotal", intent.getIntExtra("itemTotal", 0))
      putExtra("itemUnit", intent.getStringExtra("itemUnit"))
    }
    context.startActivity(alarmIntent)
  }
}