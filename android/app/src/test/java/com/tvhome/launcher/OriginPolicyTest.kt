package com.tvhome.launcher

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class OriginPolicyTest {
    private val dev = "http://192.168.0.54:5173/"

    @Test fun bundledAllowed() = assertTrue(isAllowed("$BUNDLED_ORIGIN/assets/web/x.js", null))

    @Test fun devAllowedOnlyWhenSet() {
        assertTrue(isAllowed("http://192.168.0.54:5173/src/App.vue", dev))
        assertFalse(isAllowed("http://192.168.0.54:5173/", null))
    }

    @Test fun otherPortRejected() = assertFalse(isAllowed("http://192.168.0.54:8080/", dev))

    @Test fun externalRejected() = assertFalse(isAllowed("https://www.google.com/", dev))
}
