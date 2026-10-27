# WebView + AdMob 앱
-keep class com.emotionbin.app.** { *; }
-keep class androidx.appcompat.** { *; }

# AdMob / play-services-ads (minify 시 필수)
-keep class com.google.android.gms.ads.** { *; }
-keep class com.google.android.gms.ads.mediation.** { *; }
-keep class com.google.ads.mediation.** { *; }

# Room / WorkManager / SQLite / Startup — 리플렉션 초기화가 R8에서 깨지면
# 앱 시작 시 "Failed to create an instance of WorkDatabase" 크래시 발생
-keep class androidx.work.** { *; }
-keep class androidx.room.** { *; }
-keep class androidx.sqlite.** { *; }
-keep class androidx.startup.** { *; }
-keep class * extends androidx.room.RoomDatabase { *; }
-dontwarn androidx.work.**
-dontwarn androidx.room.**
-dontwarn androidx.sqlite.**