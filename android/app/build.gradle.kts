plugins {
    id("com.android.application")
}

android {
    namespace = "com.tvhome.launcher"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.tvhome.launcher"
        minSdk = 28
        targetSdk = 35
        versionCode = 1
        versionName = "0.1"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    implementation("androidx.activity:activity-ktx:1.13.0")
    implementation("androidx.webkit:webkit:1.18.0")
    testImplementation("junit:junit:4.13.2")
}
