const options = { "autoRegister": true, "cacheOptions": { "directoryIndex": "/", "revision": "abeRlUeUWSaX" }, "enabled": true, "preCaching": [], "templatePath": null, "workboxVersion": "6.5.3", "workboxUrl": "https://storage.googleapis.com/workbox-cdn/releases/6.5.3/workbox-sw.js" }

importScripts(options.workboxUrl)

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', () => self.clients.claim())

self.addEventListener('notificationclick', function (event) {
    console.log('notificationclick', event.notification.data);
    if (event.notification.data.link) {
        event.notification.close();
        self.navigator.clearAppBadge();
        event.waitUntil(
            clients.openWindow(event.notification.data.link + '?utm_source=push&utm_medium=push&utm_campaign=push&standalone=true')
        );
    }
});

self.addEventListener('push', async (event) => {
    const data = await event.data?.json()
    console.log('push: ', event, data)
    const title = data.title || "Title";
    const message = data.body || "Body";
    self.navigator.setAppBadge(data?.count || 1)
    self.registration.showNotification(title, {
        body: message,
        image: data.image,
        data: {
            link: data.link
        },
        silent: false,
        icon: 'https://lennetech.app/notification.png'
    })
    const clients = await self.clients.matchAll();
    const client = clients[0];
    if (!client) return;
    client.postMessage({
        type: 'push',
        data,
    });
});