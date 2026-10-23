package dev.bogdan.tvhome

import org.junit.Assert.assertEquals
import org.junit.Test

class AppCatalogTest {
    @Test fun mergeDedupesAndDropsSelf() = assertEquals(
        listOf(AppEntry("Netflix", "n"), AppEntry("VLC", "v")),
        mergeLaunchables(
            listOf(AppEntry("Netflix", "n"), AppEntry("Home", "dev.bogdan.tvhome")),
            listOf(AppEntry("Netflix (phone)", "n"), AppEntry("VLC", "v")),
            "dev.bogdan.tvhome",
        ),
    )
}
