package dev.bogdan.tvhome

import java.net.URI

sealed interface DevUrlCommand {
    data class Set(val url: String) : DevUrlCommand
    data object Clear : DevUrlCommand
    data object Ignore : DevUrlCommand
}

const val DEV_PORT = 5173

/**
 * Reads the `devUrl` extra that scripts/dev.sh passes: a dev server URL, or "off".
 * The activity is exported (it has to be, as the home screen), so any app could send
 * this. Only a Vite server on the local network is accepted.
 */
fun parseDevUrl(extra: String?): DevUrlCommand {
    if (extra == null) return DevUrlCommand.Ignore
    if (extra == "off") return DevUrlCommand.Clear
    val u = try { URI(extra) } catch (_: Exception) { return DevUrlCommand.Ignore }
    val ok = u.scheme == "http" && u.port == DEV_PORT && isPrivateIpv4(u.host)
    return if (ok) DevUrlCommand.Set(extra) else DevUrlCommand.Ignore
}

private fun isPrivateIpv4(host: String?): Boolean {
    val parts = host?.split('.')?.map { it.toIntOrNull() ?: return false } ?: return false
    if (parts.size != 4 || parts.any { it !in 0..255 }) return false
    val (a, b) = parts
    return a == 10 || (a == 172 && b in 16..31) || (a == 192 && b == 168)
}
