import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useThemeStore } from '../../src/store/themeStore';

const ELEVENLABS_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>AI Companion</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: transparent;
    }
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    elevenlabs-convai {
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  <elevenlabs-convai
    agent-id="agent_6601kg3cnhs1et88cer2tcsgq753"
    dynamic-variables='{"name": "Mahmood"}'
  ></elevenlabs-convai>
  <script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async type="text/javascript"></script>
</body>
</html>
`;

export default function AICompanionScreen() {
  const { theme, isDark } = useThemeStore();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
    
    // Set a timeout to prevent infinite loading
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    loadTimeoutRef.current = setTimeout(() => {
      setIsLoading(false);
    }, 10000); // 10 second max loading time
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    webViewRef.current?.reload();
  };

  // Inject CSS to match app theme
  const injectedCSS = `
    document.body.style.backgroundColor = '${theme.background}';
  `;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.headerContent}>
          <View style={[styles.headerIcon, { backgroundColor: theme.primary + '20' }]}>
            <Ionicons name="chatbubbles" size={24} color={theme.primary} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>AI Companion</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: hasError ? theme.error : '#4CAF50' }]} />
              <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
                {hasError ? 'Offline' : 'Powered by ElevenLabs'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* WebView Container */}
      <View style={styles.webViewContainer}>
        {/* Loading Overlay */}
        {isLoading && (
          <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Loading AI Companion...
            </Text>
            <Text style={[styles.loadingHint, { color: theme.textMuted }]}>
              This may take a few seconds
            </Text>
          </View>
        )}

        {/* Error State */}
        {hasError && !isLoading && (
          <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
            <View style={[styles.errorIcon, { backgroundColor: theme.error + '20' }]}>
              <Ionicons name="cloud-offline" size={48} color={theme.error} />
            </View>
            <Text style={[styles.errorTitle, { color: theme.text }]}>
              Connection Failed
            </Text>
            <Text style={[styles.errorText, { color: theme.textSecondary }]}>
              Unable to load AI companion. Please check your internet connection.
            </Text>
            <View 
              style={[styles.retryButton, { backgroundColor: theme.primary }]}
              onTouchEnd={handleRetry}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </View>
          </View>
        )}

        {/* WebView */}
        {Platform.OS === 'web' ? (
          // For web, use iframe
          <View style={styles.webViewWrapper}>
            <iframe
              srcDoc={ELEVENLABS_HTML}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                backgroundColor: theme.background,
              }}
              onLoad={() => handleLoadEnd()}
              onError={() => handleError()}
            />
          </View>
        ) : (
          // For native, use WebView
          <WebView
            ref={webViewRef}
            source={{ html: ELEVENLABS_HTML }}
            style={[styles.webView, { backgroundColor: theme.background }]}
            onLoadStart={handleLoadStart}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
            injectedJavaScript={injectedCSS}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback={true}
            startInLoadingState={false}
            originWhitelist={['*']}
            mixedContentMode="always"
            allowsFullscreenVideo={true}
            allowFileAccess={true}
            scalesPageToFit={true}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerSubtitle: {
    fontSize: 13,
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webViewWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingHint: {
    marginTop: 8,
    fontSize: 13,
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    zIndex: 10,
  },
  errorIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
