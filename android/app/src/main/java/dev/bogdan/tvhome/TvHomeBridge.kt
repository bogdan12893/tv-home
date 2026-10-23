package dev.bogdan.tvhome

import android.content.Context
import android.content.Intent
import android.content.pm.ResolveInfo
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.Drawable
import android.provider.Settings
import android.util.Base64
import android.webkit.JavascriptInterface
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayOutputStream

/** window.TvHome in the page. Called on a WebView background thread. */
class TvHomeBridge(private val context: Context) {
    private val pm = context.packageManager
    // Encoding icons is the slow part, so keep them until the app is updated.
    private val icons = HashMap<String, String>()

    @JavascriptInterface
    @Synchronized
    fun listApps(): String {
        val leanback = query(Intent.CATEGORY_LEANBACK_LAUNCHER)
        val launcher = query(Intent.CATEGORY_LAUNCHER)
        val infos = (leanback + launcher).associateBy { it.activityInfo.packageName }
        val apps = mergeLaunchables(leanback.map(::entry), launcher.map(::entry), context.packageName)
        val out = JSONArray()
        for (app in apps) {
            out.put(JSONObject().put("name", app.name).put("pkg", app.pkg).put("icon", iconFor(infos.getValue(app.pkg))))
        }
        return out.toString()
    }

    @JavascriptInterface
    fun launch(pkg: String): Boolean {
        val intent = pm.getLeanbackLaunchIntentForPackage(pkg) ?: pm.getLaunchIntentForPackage(pkg) ?: return false
        return try {
            context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
            true
        } catch (_: Exception) {
            false
        }
    }

    @JavascriptInterface
    fun openSettings() {
        context.startActivity(Intent(Settings.ACTION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }

    private fun query(category: String): List<ResolveInfo> =
        pm.queryIntentActivities(Intent(Intent.ACTION_MAIN).addCategory(category), 0)

    private fun entry(ri: ResolveInfo) = AppEntry(ri.loadLabel(pm).toString(), ri.activityInfo.packageName)

    private fun iconFor(ri: ResolveInfo): String {
        val pkg = ri.activityInfo.packageName
        val updated = try { pm.getPackageInfo(pkg, 0).lastUpdateTime } catch (_: Exception) { 0L }
        return icons.getOrPut("$pkg:$updated") {
            val drawable = ri.activityInfo.loadBanner(pm) ?: ri.activityInfo.applicationInfo.loadBanner(pm) ?: ri.loadIcon(pm)
            drawable?.let(::toDataUrl) ?: ""
        }
    }

    private fun toDataUrl(d: Drawable): String {
        val (bw, bh) = fitIcon(d.intrinsicWidth, d.intrinsicHeight)
        val bitmap = Bitmap.createBitmap(bw, bh, Bitmap.Config.ARGB_8888)
        d.setBounds(0, 0, bw, bh)
        d.draw(Canvas(bitmap))
        val bytes = ByteArrayOutputStream().also { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }.toByteArray()
        bitmap.recycle()
        return "data:image/png;base64," + Base64.encodeToString(bytes, Base64.NO_WRAP)
    }
}
