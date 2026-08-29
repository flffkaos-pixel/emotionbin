# WebView + AdMob 앱
-keep class com.emotionbin.app.** { *; }
-keep class androidx.appcompat.** { *; }

# AdMob / play-services-ads (minify 시 필수)
-keep class com.google.android.gms.ads.** { *; }
-keep class com.google.android.gms.ads.mediation.** { *; }
-keep class com.google.ads.mediation.** { *; }