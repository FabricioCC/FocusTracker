package expo.modules.alarm

import android.app.Activity
import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.os.Build
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.*
import java.text.SimpleDateFormat
import java.util.*

class AlarmActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    // abre por cima de tudo
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
    }
    window.addFlags(
      WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
      WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
      WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
      WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
    )

    val itemId = intent.getStringExtra("itemId") ?: ""
    val itemTitle = intent.getStringExtra("itemTitle") ?: "Your Quest"
    val itemProgress = intent.getIntExtra("itemProgress", 0)
    val itemCurrent = intent.getIntExtra("itemCurrent", 0)
    val itemTotal = intent.getIntExtra("itemTotal", 0)
    val itemUnit = intent.getStringExtra("itemUnit") ?: ""
    val alarmId = intent.getStringExtra("alarmId") ?: ""

    // cores Parchment
    val bgColor       = Color.parseColor("#F7F0E2")
    val cardColor     = Color.parseColor("#FDF8EE")
    val borderColor   = Color.parseColor("#DDD0B0")
    val accentColor   = Color.parseColor("#8B4513")
    val textPrimary   = Color.parseColor("#2A1A0A")
    val textMuted     = Color.parseColor("#9A8060")
    val textLight     = Color.parseColor("#F7F0E2")
    val snoozeColor   = Color.parseColor("#EAD8BC")

    val dp = resources.displayMetrics.density
    fun Int.dp() = (this * dp).toInt()

    // root
    val root = ScrollView(this)
    root.setBackgroundColor(bgColor)

    val inner = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER_HORIZONTAL
      setPadding(24.dp(), 48.dp(), 24.dp(), 32.dp())
    }
    root.addView(inner)

    // app label
    inner.addView(TextView(this).apply {
      text = "FOCUS TRACKER"
      textSize = 10f
      setTextColor(textMuted)
      gravity = Gravity.CENTER
      letterSpacing = 0.2f
    }, LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT,
      LinearLayout.LayoutParams.WRAP_CONTENT
    ).apply { bottomMargin = 24.dp() })

    // horário atual
    val timeNow = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date())
    inner.addView(TextView(this).apply {
      text = timeNow
      textSize = 56f
      setTextColor(textPrimary)
      setTypeface(Typeface.SERIF, Typeface.BOLD)
      gravity = Gravity.CENTER
    }, LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT,
      LinearLayout.LayoutParams.WRAP_CONTENT
    ).apply { bottomMargin = 4.dp() })

    // subtítulo
    inner.addView(TextView(this).apply {
      text = "your quest awaits"
      textSize = 13f
      setTextColor(textMuted)
      setTypeface(null, Typeface.ITALIC)
      gravity = Gravity.CENTER
    }, LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT,
      LinearLayout.LayoutParams.WRAP_CONTENT
    ).apply { bottomMargin = 32.dp() })

    // divider
    inner.addView(View(this).apply {
      setBackgroundColor(borderColor)
    }, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 1).apply {
      bottomMargin = 24.dp()
    })

    // card com borda esquerda
    val cardRow = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
    val accentBar = View(this).apply { setBackgroundColor(accentColor) }
    cardRow.addView(accentBar, LinearLayout.LayoutParams(4.dp(), LinearLayout.LayoutParams.MATCH_PARENT))

    val card = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      setBackgroundColor(cardColor)
      setPadding(16.dp(), 14.dp(), 16.dp(), 14.dp())
    }
    cardRow.addView(card, LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
    ))

    card.addView(TextView(this).apply {
      text = itemUnit.uppercase()
      textSize = 10f
      setTextColor(accentColor)
      setTypeface(Typeface.SERIF, Typeface.BOLD)
      letterSpacing = 0.15f
    }, LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT
    ).apply { bottomMargin = 8.dp() })

    card.addView(TextView(this).apply {
      text = itemTitle
      textSize = 16f
      setTextColor(textPrimary)
      setTypeface(Typeface.SERIF, Typeface.BOLD)
    }, LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
    ).apply { bottomMargin = 6.dp() })

    card.addView(TextView(this).apply {
      text = "$itemCurrent of $itemTotal $itemUnit · $itemProgress%"
      textSize = 12f
      setTextColor(textMuted)
      setTypeface(null, Typeface.ITALIC)
    }, LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
    ).apply { bottomMargin = 10.dp() })

    // barra de progresso
    val barBg = FrameLayout(this).apply { setBackgroundColor(borderColor) }
    val barFill = View(this).apply { setBackgroundColor(accentColor) }
    barBg.addView(barFill, FrameLayout.LayoutParams(0, 6.dp()))
    card.addView(barBg, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 6.dp()))

    // atualiza largura da barra depois do layout
    barBg.post {
      val width = (barBg.width * itemProgress / 100f).toInt()
      barFill.layoutParams = FrameLayout.LayoutParams(width, 6.dp())
    }

    inner.addView(cardRow, LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
    ).apply { bottomMargin = 32.dp() })

    // botão Log Progress
    inner.addView(Button(this).apply {
      text = "Log Progress"
      textSize = 13f
      setTextColor(textLight)
      setBackgroundColor(accentColor)
      setTypeface(Typeface.SERIF, Typeface.BOLD)
      letterSpacing = 0.1f
      setPadding(0, 12.dp(), 0, 12.dp())
      setOnClickListener {
        AlarmSoundManager.stop()
        val mainIntent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
            putExtra("navigateTo", "ItemDetail")
            putExtra("itemId", itemId)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        startActivity(mainIntent)
        finish()
      }
    }, LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
    ).apply { bottomMargin = 12.dp() })

    // botão Snooze
    inner.addView(Button(this).apply {
      text = "remind me in 10 minutes"
      textSize = 12f
      setTextColor(textMuted)
      setBackgroundColor(snoozeColor)
      setTypeface(null, Typeface.ITALIC)
      setPadding(0, 10.dp(), 0, 10.dp())
      setOnClickListener {
        AlarmSoundManager.stop()
        val cal = Calendar.getInstance().apply { add(Calendar.MINUTE, 10) }
        val snoozeIntent = Intent(this@AlarmActivity, AlarmReceiver::class.java).apply {
          action = "expo.modules.alarm.ALARM"
          putExtra("alarmId", alarmId)
          putExtra("itemId", itemId)
          putExtra("itemTitle", itemTitle)
          putExtra("itemProgress", itemProgress)
          putExtra("itemCurrent", itemCurrent)
          putExtra("itemTotal", itemTotal)
          putExtra("itemUnit", itemUnit)
        }
        val pi = PendingIntent.getBroadcast(
          this@AlarmActivity,
          alarmId.hashCode() + 9999,
          snoozeIntent,
          PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val am = getSystemService(Context.ALARM_SERVICE) as AlarmManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
          am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, cal.timeInMillis, pi)
        } else {
          am.setExact(AlarmManager.RTC_WAKEUP, cal.timeInMillis, pi)
        }
        finish()
      }
    }, LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
    ))

    setContentView(root)
  }

  override fun onDestroy() {
    super.onDestroy()
    AlarmSoundManager.stop()
  }
}