self.addEventListener('push', event => {
    let data = {};
    try {
        // Kiểm tra nếu có dữ liệu gửi từ server
        data = event.data ? event.data.json() : { title: 'Loopin', body: 'Time for your habits!' };
    } catch (e) {
        data = { title: 'Loopin', body: event.data.text() };
    }

    const options = {
        body: data.body,
        icon: data.icon || '/images/logo.png',
        badge: '/images/logo.png',
        data: data // Lưu lại để dùng khi click
    };

    // Hiển thị thông báo
    const notificationPromise = self.registration.showNotification(data.title, options);

    // Gửi message về frontend để reset streak nếu có habitId
    let messagePromise = Promise.resolve();
    if (data.habitId) {
        messagePromise = self.clients.matchAll({ includeUncontrolled: true, type: 'window' })
            .then(clients => {
                clients.forEach(client => {
                    client.postMessage({ type: 'RESET_STREAK', habitId: data.habitId });
                });
            });
    }

    event.waitUntil(Promise.all([notificationPromise, messagePromise]));
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/home.html')
    );
});

