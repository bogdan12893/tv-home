package dev.bogdan.tvhome

import java.net.URI

// The bundled page is served from this virtual origin by WebViewAssetLoader.
const val BUNDLED_ORIGIN = "https://appassets.androidplatform.net"
const val BUNDLED_URL = "$BUNDLED_ORIGIN/assets/web/index.html"

/** The WebView may only show our own page: the bundled copy, or the dev server when live mode is on. */
fun isAllowed(url: String, devUrl: String?): Boolean {
    val target = originOf(url) ?: return false
    return target == originOf(BUNDLED_ORIGIN) || (devUrl != null && target == originOf(devUrl))
}

internal fun originOf(url: String): String? = try {
    val u = URI(url)
    val scheme = u.scheme?.lowercase() ?: return null
    val host = u.host?.lowercase() ?: return null
    val port = if (u.port != -1) u.port else if (scheme == "https") 443 else 80
    "$scheme://$host:$port"
} catch (_: Exception) {
    null
}
