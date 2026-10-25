package com.tvhome.launcher

data class AppEntry(val name: String, val pkg: String)

/** TV (leanback) entries first, then phone-style ones; one entry per package, never ourselves. */
fun mergeLaunchables(leanback: List<AppEntry>, launcher: List<AppEntry>, selfPkg: String): List<AppEntry> =
    (leanback + launcher).distinctBy { it.pkg }.filter { it.pkg != selfPkg }

// AppIcon.vue shows icons at 64×36 CSS px = 128×72 device px; encoding bigger only costs time.
const val ICON_MAX_W = 128
const val ICON_MAX_H = 72

/** Size to draw an icon at: fits inside ICON_MAX_W×ICON_MAX_H, keeps its shape, never grows. */
fun fitIcon(w: Int, h: Int): Pair<Int, Int> {
    if (w <= 0 || h <= 0) return ICON_MAX_W to ICON_MAX_H
    val scale = minOf(1f, ICON_MAX_W.toFloat() / w, ICON_MAX_H.toFloat() / h)
    return (w * scale).toInt().coerceAtLeast(1) to (h * scale).toInt().coerceAtLeast(1)
}
