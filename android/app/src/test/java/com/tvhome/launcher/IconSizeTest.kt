package com.tvhome.launcher

import org.junit.Assert.assertEquals
import org.junit.Test

class IconSizeTest {
    @Test fun bannerShrinksToDisplaySize() = assertEquals(128 to 72, fitIcon(320, 180))
    @Test fun squareIconFitsHeight() = assertEquals(72 to 72, fitIcon(192, 192))
    @Test fun smallIconNotUpscaled() = assertEquals(50 to 20, fitIcon(50, 20))
    @Test fun unknownSizeUsesBox() = assertEquals(128 to 72, fitIcon(-1, -1))
}
