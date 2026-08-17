const CACHE_NAME = "track-time-shell-v2";
const SHELL = ["/", "/login", "/dashboard", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET" || new URL(request.url).pathname.startsWith("/api/")) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("/dashboard")))
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const action = event.action || "open";
  const taskId = event.notification.data?.taskId;
  const targetUrl = event.notification.data?.url || "/dashboard?view=daily";

  event.waitUntil(
    (async () => {
      const clientsList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      let client = clientsList.find((item) => item.url.includes("/dashboard")) || clientsList[0];

      if (client) {
        await client.focus();
        client.postMessage({
          type: "TRACK_TIME_REMINDER_ACTION",
          action,
          taskId,
        });
        return;
      }

      await self.clients.openWindow(targetUrl);
    })()
  );
});
