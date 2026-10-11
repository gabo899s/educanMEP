/* No caching of student or family data. */
self.addEventListener("push", (event) => {
  let data = {
    title: "Luma Campus",
    body: "Tienes una novedad del colegio.",
    url: "/",
  };
  try {
    Object.assign(data, event.data.json());
  } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      tag: "luma-campus",
      data: { url: data.url },
    }),
  );
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  let url = new URL("/", self.location.origin);
  try {
    const target = new URL(event.notification.data.url, self.location.origin);
    if (target.origin === self.location.origin) url = target;
  } catch {}
  event.waitUntil(clients.openWindow(url.href));
});
