document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = 'http://127.0.0.1:3000';
    
    // Загрузка статистики
    loadStatistics();
    
    // Функция загрузки статистики
    async function loadStatistics() {
        try {
            // Получаем количество компьютеров
            const computersRes = await fetch(`${API_BASE_URL}/api/computers`);
            const computers = await computersRes.json();
            document.getElementById('computers-count').textContent = computers.length;
            
            // Получаем количество периферийных устройств
            const peripheralsRes = await fetch(`${API_BASE_URL}/api/peripherals/count`);
            const peripheralsData = await peripheralsRes.json();
            document.getElementById('peripherals-count').textContent = peripheralsData.count;
            
            // Получаем количество сетей
            const networksRes = await fetch(`${API_BASE_URL}/api/networks`);
            const networks = await networksRes.json();
            document.getElementById('networks-count').textContent = networks.length;
            
            // Получаем количество лицензий
            const licensesRes = await fetch(`${API_BASE_URL}/api/licenses`);
            const licenses = await licensesRes.json();
            document.getElementById('licenses-count').textContent = licenses.length;
            
        } catch (error) {
            console.error('Ошибка загрузки статистики:', error);
            // Можно добавить отображение ошибки, если нужно
        }
    }
});