package dev.bogdan.tvhome

import java.net.URI

sealed interface DevUrlCommand {
    data class Set(val url: String) : DevUrlCommand
    data object Clear : DevUrlCommand
    data object Ignore : DevUrlCommand
}

/** Reads the `devUrl` extra that scripts/dev.sh passes: a dev server URL, or "off". */
fun parseDevUrl(extra: String?): DevUrlCommand {
    if (extra == null) return DevUrlCommand.Ignore
    if (extra == "off") return DevUrlCommand.Clear
    val u = try { URI(extra) } catch (_: Exception) { return DevUrlCommand.Ignore }
    val ok = u.scheme in setOf("http", "https") && !u.host.isNullOrEmpty() && u.port != -1
    return if (ok) DevUrlCommand.Set(extra) else DevUrlCommand.Ignore
}
