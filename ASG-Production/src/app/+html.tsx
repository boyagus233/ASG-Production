import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        
        {/* PWA Manifest */}
        <link rel="manifest" href="/pwa-manifest.json" />
        <meta name="theme-color" content="#F1EBE1" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/favicon.png" />

        <ScrollViewStyleReset />
      </head>
      <body>
        {children}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' }).then(function(registration) {
                console.log('Firebase ServiceWorker registration successful with scope: ', registration.scope);
              }).catch(function(err) {
                console.error('Firebase ServiceWorker registration failed: ', err);
              });
            });
          }
        `}} />
      </body>
    </html>
  );
}
