document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = 'http://127.0.0.1:3000';
    
    loadComputers();
    loadNetworks();
    
    document.getElementById('refresh-btn').addEventListener('click', loadComputers);
    document.getElementById('add-computer-form').addEventListener('submit', addComputer);

    async function loadComputers() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/computers`);
            
            if (!response.ok) {
                throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
            }
            
            const data = await response.json();
            const tbody = document.querySelector('#computers-table tbody');
            tbody.innerHTML = '';
            
            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5">Нет данных</td></tr>';
                return;
            }
            
            data.forEach(computer => {
                const row = document.createElement('tr');
                row.dataset.id = computer.computer_id;
                row.innerHTML = `
                    <td>${computer.computer_id}</td>
                    <td contenteditable="true" data-field="inventory_number">${computer.inventory_number}</td>
                    <td contenteditable="true" data-field="owner_name">${computer.owner_name}</td>
                    <td data-field="local_network_id">${computer.network_name || '-'}</td>
                    <td class="actions">
                        <button class="save-btn">Сохранить</button>
                        <button class="delete-btn">Удалить</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
            
            document.querySelectorAll('.save-btn').forEach(btn => {
                btn.addEventListener('click', saveComputer);
            });
            
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', deleteComputer);
            });
            
        } catch (error) {
            console.error('Ошибка загрузки компьютеров:', error);
            const tbody = document.querySelector('#computers-table tbody');
            tbody.innerHTML = `<tr><td colspan="5">Ошибка загрузки: ${error.message}</td></tr>`;
        }
    }

    async function loadNetworks() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/networks`);
            
            if (!response.ok) {
                throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
            }
            
            const data = await response.json();
            const select = document.getElementById('network');
            
            // Очистка существующих опций (кроме первой)
            while (select.options.length > 1) {
                select.remove(1);
            }
            
            data.forEach(network => {
                const option = document.createElement('option');
                option.value = network.local_id;
                option.textContent = network.network_name || 'Без названия';
                select.appendChild(option);
            });
            
        } catch (error) {
            console.error('Ошибка загрузки сетей:', error);
            alert('Не удалось загрузить список сетей');
        }
    }

    async function addComputer(e) {
        e.preventDefault();
        try {
            const data = {
                inventory_number: document.getElementById('inventory-number').value,
                owner_name: document.getElementById('owner').value,
                local_network_id: document.getElementById('network').value || null
            };
            
            const response = await fetch(`${API_BASE_URL}/api/computers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Неизвестная ошибка');
            }
            
            document.getElementById('add-computer-form').reset();
            await loadComputers();
            
        } catch (error) {
            console.error('Ошибка добавления:', error);
            alert(`Ошибка: ${error.message}`);
        }
    }

    async function saveComputer() {
        try {
            const row = this.closest('tr');
            const id = row.dataset.id;
            const data = {
                inventory_number: row.querySelector('[data-field="inventory_number"]').textContent,
                owner_name: row.querySelector('[data-field="owner_name"]').textContent,
                local_network_id: row.querySelector('[data-field="local_network_id"]').textContent || null
            };
            
            const response = await fetch(`${API_BASE_URL}/api/computers/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error('Ошибка сохранения');
            }
            
            alert('Изменения сохранены');
            await loadComputers();
            
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            alert('Не удалось сохранить изменения');
        }
    }

    async function deleteComputer() {
        if (!confirm('Вы уверены, что хотите удалить этот компьютер?')) return;
        
        try {
            const id = this.closest('tr').dataset.id;
            const response = await fetch(`${API_BASE_URL}/api/computers/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Ошибка удаления');
            }
            
            await loadComputers();
            
        } catch (error) {
            console.error('Ошибка удаления:', error);
            alert('Не удалось удалить компьютер');
        }
    }
});