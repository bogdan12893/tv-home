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

    @Test fun privateLanHostsOnPort5173() {
        assertEquals(DevUrlCommand.Set("http://10.0.0.2:5173/"), parseDevUrl("http://10.0.0.2:5173/"))
        assertEquals(DevUrlCommand.Set("http://172.20.1.1:5173/"), parseDevUrl("http://172.20.1.1:5173/"))
    }

    @Test fun rejectsAnythingButAPrivateViteUrl() {
        for (url in listOf("http://evil.example:80/", "http://evil.example:5173/", "http://8.8.8.8:5173/",
                "http://172.32.0.1:5173/", "http://192.168.0.54:8080/", "https://192.168.0.54:5173/")) {
            assertEquals(url, DevUrlCommand.Ignore, parseDevUrl(url))
        }
    }
}
