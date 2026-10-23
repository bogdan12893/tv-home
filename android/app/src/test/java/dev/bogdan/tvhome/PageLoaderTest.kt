package dev.bogdan.tvhome

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class PageLoaderTest {
    private val dev = "http://192.168.0.54:5173/"

    @Test fun noDevStartsBundled() = assertEquals(BUNDLED_URL, PageLoader(null).start())

    @Test fun devTimeoutFallsBack() {
        val p = PageLoader(dev); p.start()
        assertEquals(BUNDLED_URL, p.onTimeout())
    }

    @Test fun devErrorFallsBack() {
        val p = PageLoader(dev); p.start()
        assertEquals(BUNDLED_URL, p.onMainFrameError(dev))
    }

    @Test fun finishAfterErrorIsNotSuccess() {
        val p = PageLoader(dev); p.start()
        p.onMainFrameError(dev)
        assertFalse(p.onMainFrameFinished(dev))
    }

    @Test fun devSuccessCancelsTimeout() {
        val p = PageLoader(dev); p.start()
        assertTrue(p.onMainFrameFinished(dev))
        assertNull(p.onTimeout())
    }

    @Test fun bundledErrorShowsErrorPage() {
        val p = PageLoader(null); p.start()
        assertEquals(ERROR_PAGE, p.onMainFrameError(BUNDLED_URL))
    }

    @Test fun timeoutAfterFallbackIsNoop() {
        val p = PageLoader(dev); p.start()
        p.onTimeout()
        assertNull(p.onTimeout())
    }

    @Test fun devCommitCancelsTimeout() {
        val p = PageLoader(dev); p.start()
        assertTrue(p.onCommitVisible(dev))
        assertNull(p.onTimeout())
    }

    @Test fun commitAfterErrorIgnored() {
        val p = PageLoader(dev); p.start()
        p.onMainFrameError(dev)
        assertFalse(p.onCommitVisible(dev))
    }

    @Test fun timeoutIsShort() = assertTrue(DEV_TIMEOUT_MS <= 2000)
}
