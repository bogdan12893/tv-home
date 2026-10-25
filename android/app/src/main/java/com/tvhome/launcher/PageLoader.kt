package com.tvhome.launcher

// The dev server is on the LAN and answers in milliseconds; this only covers a Mac that's asleep or gone.
const val DEV_TIMEOUT_MS = 2000L
const val ERROR_PAGE = "tvhome:error"

/**
 * Decides what the WebView loads. In live mode it tries the dev server first and
 * falls back to the bundled page on an error or when nothing has drawn within
 * DEV_TIMEOUT_MS, so the
 * home screen is never blank. If even the bundled page fails, it shows ERROR_PAGE.
 */
class PageLoader(private val devUrl: String?) {
    private var target: String? = null
    private var failed = false
    private var loaded = false

    fun start(): String = go(devUrl ?: BUNDLED_URL)

    fun onMainFrameFinished(url: String): Boolean {
        if (!isCurrent(url) || failed) return false
        loaded = true
        return true
    }

    /** The page has drawn its first frame: the dev server is alive, so stop the timeout. */
    fun onCommitVisible(url: String): Boolean = onMainFrameFinished(url)

    fun onMainFrameError(url: String): String? {
        if (!isCurrent(url)) return null
        failed = true
        return if (target == devUrl && devUrl != null) go(BUNDLED_URL) else ERROR_PAGE
    }

    fun onTimeout(): String? =
        if (devUrl != null && target == devUrl && !loaded) go(BUNDLED_URL) else null

    private fun go(url: String): String {
        target = url
        failed = false
        loaded = false
        return url
    }

    private fun isCurrent(url: String): Boolean {
        val t = target ?: return false
        return originOf(url) == originOf(t)
    }
}
