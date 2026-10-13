package com.emotionbin.app;

import android.os.Bundle;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdListener;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;
import com.google.android.gms.ads.nativead.NativeAd;
import com.google.android.gms.ads.nativead.NativeAdView;

public class MainActivity extends AppCompatActivity {
    private WebView webView;
    private AdView adView;              // 하단 배너
    private AdView adViewModal;          // 글쓰기 모달용 300x250
    private LinearLayout feedAdContainer; // 피드 네이티브 카드
    private InterstitialAd interstitialAd;
    private NativeAd nativeAd;
    private boolean interstitialShownThisSession = false;

    private static final String BANNER_ID = "ca-app-pub-1955893232253258/6745392770";
    private static final String INTERSTITIAL_ID = "ca-app-pub-1955893232253258/4261815186";
    private static final String NATIVE_ID = "ca-app-pub-1955893232253258/2582616018";

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

        // 하단 배너
        adView = findViewById(R.id.adview);
        adView.loadAd(new AdRequest.Builder().build());

        // 모달 사각 광고 (열릴 때 로드·표시)
        adViewModal = findViewById(R.id.adview_modal);
        adViewModal.setAdListener(new AdListener() {
            @Override
            public void onAdFailedToLoad(LoadAdError error) {
                adViewModal.setVisibility(View.GONE);
            }
        });

        feedAdContainer = findViewById(R.id.feed_ad_container);
        loadInterstitial();
    }

    private void loadInterstitial() {
        InterstitialAd.load(this, INTERSTITIAL_ID,
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

    // ===== 피드 네이티브 광고 =====
    private void loadNativeAd() {
        com.google.android.gms.ads.AdLoader loader = new com.google.android.gms.ads.AdLoader.Builder(this, NATIVE_ID)
                .forNativeAd(ad -> {
                    if (isFinishing()) { ad.destroy(); return; }
                    if (nativeAd != null) nativeAd.destroy();
                    nativeAd = ad;
                    populateNativeAd(ad);
                    feedAdContainer.setVisibility(View.VISIBLE);
                })
                .withAdListener(new AdListener() {
                    @Override
                    public void onAdFailedToLoad(LoadAdError error) {
                        feedAdContainer.setVisibility(View.GONE);
                    }
                })
                .build();
        loader.loadAd(new AdRequest.Builder().build());
    }

    private void populateNativeAd(NativeAd ad) {
        NativeAdView adViewNative = (NativeAdView) getLayoutInflater().inflate(R.layout.ad_native_card, feedAdContainer, false);

        TextView headline = adViewNative.findViewById(R.id.ad_headline);
        TextView body = adViewNative.findViewById(R.id.ad_body);
        TextView advertiser = adViewNative.findViewById(R.id.ad_advertiser);
        Button cta = adViewNative.findViewById(R.id.ad_cta);
        com.google.android.gms.ads.nativead.MediaView media = adViewNative.findViewById(R.id.ad_media);

        adViewNative.setHeadlineView(headline);
        adViewNative.setBodyView(body);
        adViewNative.setAdvertiserView(advertiser);
        adViewNative.setCallToActionView(cta);
        adViewNative.setMediaView(media);

        headline.setText(ad.getHeadline() != null ? ad.getHeadline() : "");
        if (ad.getBody() == null) body.setVisibility(View.GONE);
        else { body.setText(ad.getBody()); body.setVisibility(View.VISIBLE); }
        if (ad.getAdvertiser() == null) advertiser.setVisibility(View.GONE);
        else { advertiser.setText(ad.getAdvertiser()); advertiser.setVisibility(View.VISIBLE); }
        if (ad.getCallToAction() == null) cta.setText("자세히 보기");
        else cta.setText(ad.getCallToAction());

        adViewNative.setNativeAd(ad);
        feedAdContainer.removeAllViews();
        feedAdContainer.addView(adViewNative);
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

        // 글쓰기 모달: 하단 배너 숨기고 300x250 사각 광고 표시
        @JavascriptInterface
        public void showModalAd() {
            runOnUiThread(() -> {
                adView.setVisibility(View.GONE);
                adViewModal.setVisibility(View.VISIBLE);
                adViewModal.loadAd(new AdRequest.Builder().build());
            });
        }

        @JavascriptInterface
        public void hideModalAd() {
            runOnUiThread(() -> {
                adViewModal.setVisibility(View.GONE);
                adView.setVisibility(View.VISIBLE);
            });
        }

        // 피드 탐색 중 네이티브 카드 표시/숨김
        @JavascriptInterface
        public void showFeedAd() {
            runOnUiThread(() -> loadNativeAd());
        }

        @JavascriptInterface
        public void hideFeedAd() {
            runOnUiThread(() -> {
                feedAdContainer.setVisibility(View.GONE);
                if (nativeAd != null) { nativeAd.destroy(); nativeAd = null; }
            });
        }
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        if (nativeAd != null) nativeAd.destroy();
        super.onDestroy();
    }
}