MIORA V5 - MOBILE PWA

This build is mobile-responsive and PWA-ready.

PHONE INSTALL:
1. Host the miora_app folder on HTTPS (localhost also works for testing).
2. Open index.html through the hosted URL in Chrome/Edge on Android.
3. Use the Install App button when it appears, or browser menu > Install app / Add to Home screen.
4. The app opens standalone with the Miora icon.

IMPORTANT:
- Opening the HTML directly as file:// may not enable PWA installation/service worker.
- Real WhatsApp automation requires Meta WhatsApp Business Platform credentials, approved templates, customer opt-in, and the included backend connector configured on a secure server.


V6 update: PWA icons are compatible with root-level GitHub uploads. Backend also includes /api/whatsapp/run-daily and /api/whatsapp/webhook-status. GitHub Pages runs only the frontend; the Node backend must be deployed separately for real WhatsApp sending.
