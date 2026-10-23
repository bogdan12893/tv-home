package dev.bogdan.tvhome

data class AppEntry(val name: String, val pkg: String)

/** TV (leanback) entries first, then phone-style ones; one entry per package, never ourselves. */
fun mergeLaunchables(leanback: List<AppEntry>, launcher: List<AppEntry>, selfPkg: String): List<AppEntry> =
    (leanback + launcher).distinctBy { it.pkg }.filter { it.pkg != selfPkg }
