package expo.modules.alarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.Calendar

class AlarmModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("Alarm")

    AsyncFunction("setAlarm") { options: AlarmOptions ->
      val context = appContext.reactContext ?: throw Exception("No context")
      val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

      // cancela alarmes anteriores
      cancelAlarmById(context, am, options.id)

      for (day in options.days) {
        val cal = Calendar.getInstance().apply {
          set(Calendar.HOUR_OF_DAY, options.hour)
          set(Calendar.MINUTE, options.minute)
          set(Calendar.SECOND, 0)
          set(Calendar.MILLISECOND, 0)
          set(Calendar.DAY_OF_WEEK, day)
          if (before(Calendar.getInstance())) {
            add(Calendar.WEEK_OF_YEAR, 1)
          }
        }

        val intent = Intent(context, AlarmReceiver::class.java).apply {
          action = "expo.modules.alarm.ALARM"
          putExtra("alarmId", options.id)
          putExtra("itemId", options.itemId)
          putExtra("itemTitle", options.itemTitle)
          putExtra("itemProgress", options.itemProgress)
          putExtra("itemCurrent", options.itemCurrent)
          putExtra("itemTotal", options.itemTotal)
          putExtra("itemUnit", options.itemUnit)
        }

        val requestCode = (options.id.hashCode() * 10 + day)
        val pi = PendingIntent.getBroadcast(
          context,
          requestCode,
          intent,
          PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
          am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, cal.timeInMillis, pi)
        } else {
          am.setExact(AlarmManager.RTC_WAKEUP, cal.timeInMillis, pi)
        }
      }
    }

    AsyncFunction("cancelAlarm") { id: String ->
      val context = appContext.reactContext ?: throw Exception("No context")
      val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
      cancelAlarmById(context, am, id)
    }
  }

  private fun cancelAlarmById(context: Context, am: AlarmManager, id: String) {
    for (day in 1..7) {
      val intent = Intent(context, AlarmReceiver::class.java).apply {
        action = "expo.modules.alarm.ALARM"
      }
      val requestCode = (id.hashCode() * 10 + day)
      val pi = PendingIntent.getBroadcast(
        context,
        requestCode,
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      )
      am.cancel(pi)
    }
  }
}