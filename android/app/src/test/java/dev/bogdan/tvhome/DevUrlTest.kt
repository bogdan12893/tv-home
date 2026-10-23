package dev.bogdan.tvhome

import org.junit.Assert.assertEquals
import org.junit.Test

class DevUrlTest {
    @Test fun off() = assertEquals(DevUrlCommand.Clear, parseDevUrl("off"))

    @Test fun valid() = assertEquals(DevUrlCommand.Set("http://192.168.0.54:5173/"), parseDevUrl("http://192.168.0.54:5173/"))

    @Test fun junk() {
        assertEquals(DevUrlCommand.Ignore, parseDevUrl(null))
        assertEquals(DevUrlCommand.Ignore, parseDevUrl("javascript:alert(1)"))
        assertEquals(DevUrlCommand.Ignore, parseDevUrl("ftp://x/"))
    }
}
