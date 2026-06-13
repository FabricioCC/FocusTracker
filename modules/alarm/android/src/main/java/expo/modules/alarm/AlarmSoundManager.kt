package expo.modules.alarm

import android.media.Ringtone

object AlarmSoundManager {
  var ringtone: Ringtone? = null

  fun stop() {
    ringtone?.let {
      if (it.isPlaying) it.stop()
    }
    ringtone = null
  }
}