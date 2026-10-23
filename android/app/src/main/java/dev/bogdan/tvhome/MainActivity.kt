package dev.bogdan.tvhome

import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.addCallback
import androidx.webkit.WebViewAssetLoader

private const val ERROR_HTML = """<!doctype html><html><body style="margin:0;height:100vh;display:grid;place-items:center;
background:#0f1417;color:#f4f6f7;font:20px system-ui,sans-serif;text-align:center">
<div><p>Home screen didn't load.</p><button autofocus onclick="TvHome.openSettings()"
style="font:inherit;padding:10px 24px;border-radius:12px;border:0">Open Settings</button></div></body></html>"""

/** The home screen: one full-screen WebView showing the Vue page. */
class MainActivity : ComponentActivity() {
    private lateinit var web: WebView
    private lateinit var loader: PageLoader
    private val handler = Handler(Looper.getMainLooper())
    private val prefs by lazy { getSharedPreferences("tvhome", MODE_PRIVATE) }
    private val devUrl: String? get() = prefs.getString("devUrl", null)
    private val timeout = Runnable { loader.onTimeout()?.let(::load) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WebView.setWebContentsDebuggingEnabled(true)
        web = WebView(this).apply {
            setBackgroundColor(Color.BLACK)
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            addJavascriptInterface(TvHomeBridge(applicationContext), "TvHome")
            webViewClient = Client()
        }
        setContentView(web)
        // Back never leaves the home screen; the page decides what it means (e.g. close All apps).
        onBackPressedDispatcher.addCallback(this) { dispatch("tvhome:back") }
        reload()
    }

    override fun onResume() {
        super.onResume()
        dispatch("tvhome:resume")
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        dispatch("tvhome:resume")
    }

    override fun onDestroy() {
        handler.removeCallbacks(timeout)
        web.destroy()
        super.onDestroy()
    }

    private fun reload() {
        handler.removeCallbacks(timeout)
        loader = PageLoader(devUrl)
        load(loader.start())
        if (devUrl != null) handler.postDelayed(timeout, DEV_TIMEOUT_MS)
    }

    private fun load(url: String) {
        if (url == ERROR_PAGE) web.loadDataWithBaseURL(BUNDLED_ORIGIN, ERROR_HTML, "text/html", "utf-8", null)
        else web.loadUrl(url)
    }

    private fun dispatch(event: String) {
        if (::web.isInitialized) web.evaluateJavascript("window.dispatchEvent(new Event('$event'))", null)
    }

    private inner class Client : WebViewClient() {
        private val assets = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this@MainActivity))
            .build()

        override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
            assets.shouldInterceptRequest(request.url)

        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean =
            !isAllowed(request.url.toString(), devUrl)

        override fun onPageFinished(view: WebView, url: String) {
            if (loader.onMainFrameFinished(url)) handler.removeCallbacks(timeout)
        }

        override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
            if (!request.isForMainFrame) return
            loader.onMainFrameError(request.url.toString())?.let {
                handler.removeCallbacks(timeout)
                load(it)
            }
        }
    }
}
