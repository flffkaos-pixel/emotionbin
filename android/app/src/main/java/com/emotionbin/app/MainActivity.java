package com.emotionbin.app;

import android.os.Bundle;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;

public class MainActivity extends AppCompatActivity {
    private WebView webView;
    private AdView adView;
    private InterstitialAd interstitialAd;
    private boolean interstitialShownThisSession = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_main);

        // 시스템 바(상태·내비) 인셋 처리 — Android 15+ 넓은 화면에서 콘텐츠가 바에 가리지 않게
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.root), (v, windowInsets) -> {
            Insets bars = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(0, bars.top, 0, bars.bottom);
            return windowInsets;
        });

        webView = findViewById(R.id.webview);
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        webView.addJavascriptInterface(new AndroidBridge(), "AndroidBridge");
        webView.setWebViewClient(new WebViewClient());
        webView.loadUrl("https://emotionbin.pages.dev");

        MobileAds.initialize(this);
        adView = findViewById(R.id.adview);
        adView.loadAd(new AdRequest.Builder().build());
        loadInterstitial();
    }

    private void loadInterstitial() {
        InterstitialAd.load(this, "ca-app-pub-1955893232253258/4261815186",
                new AdRequest.Builder().build(),
                new InterstitialAdLoadCallback() {
                    @Override
                    public void onAdLoaded(InterstitialAd ad) {
                        interstitialAd = ad;
                    }

                    @Override
                    public void onAdFailedToLoad(LoadAdError error) {
                        interstitialAd = null;
                    }
                });
    }

    class AndroidBridge {
        @JavascriptInterface
        public void showInterstitial() {
            runOnUiThread(() -> {
                // ponytail: 세션당 1회 제한 — 삭제/태우기 때마다 광고면 피로도·리뷰 지름
                if (interstitialShownThisSession) return;
                if (interstitialAd != null) {
                    interstitialShownThisSession = true;
                    interstitialAd.setFullScreenContentCallback(new FullScreenContentCallback() {
                        @Override
                        public void onAdDismissedFullScreenContent() {
                            interstitialAd = null;
                            loadInterstitial();
                        }

                        @Override
                        public void onAdFailedToShowFullScreenContent(AdError adError) {
                            loadInterstitial();
                        }
                    });
                    interstitialAd.show(MainActivity.this);
                } else {
                    loadInterstitial();
                }
            });
        }

        @JavascriptInterface
        public void hideBanner() {
            runOnUiThread(() -> adView.setVisibility(android.view.View.GONE));
        }

        @JavascriptInterface
        public void showBanner() {
            runOnUiThread(() -> adView.setVisibility(android.view.View.VISIBLE));
        }
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }
}
