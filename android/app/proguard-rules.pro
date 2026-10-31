# WebView + AdMob 앱
-keep class com.emotionbin.app.** { *; }
-keep class androidx.appcompat.** { *; }

# AdMob / play-services-ads
-keep public class com.google.android.gms.ads.** { public *; }
-keep class com.google.android.gms.ads.** { *; }
-keep class com.google.android.gms.ads.mediation.** { *; }
-keep class com.google.ads.mediation.** { *; }
-dontwarn com.google.android.gms.**

# ★ 크래시 원인이었던 부분: AdMob SDK가 내부적으로 쓰는 Room/WorkManager/SQLite/Startup
#   R8이 스트리핑하면 "Failed to create an instance of WorkDatabase" 크래시 발생
-keep class androidx.work.** { *; }
-keep class androidx.room.** { *; }
-keep class androidx.sqlite.** { *; }
-keep class androidx.startup.** { *; }
-keep class * extends androidx.work.Worker { *; }
-keep class * extends androidx.work.ListenableWorker { *; }
-keep class * extends androidx.room.RoomDatabase { *; }
-keep class * implements androidx.work.InputMergerFactory { *; }
-dontwarn androidx.work.**
-dontwarn androidx.room.**
-dontwarn androidx.sqlite.**
-dontwarn androidx.startup.**