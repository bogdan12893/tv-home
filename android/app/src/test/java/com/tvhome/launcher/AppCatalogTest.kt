package com.tvhome.launcher

import org.junit.Assert.assertEquals
import org.junit.Test

class AppCatalogTest {
    @Test fun mergeDedupesAndDropsSelf() = assertEquals(
        listOf(AppEntry("Netflix", "n"), AppEntry("VLC", "v")),
        mergeLaunchables(
            listOf(AppEntry("Netflix", "n"), AppEntry("Home", "com.tvhome.launcher")),
            listOf(AppEntry("Netflix (phone)", "n"), AppEntry("VLC", "v")),
            "com.tvhome.launcher",
        ),
    )
}
