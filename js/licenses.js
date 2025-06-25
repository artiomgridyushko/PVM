document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = 'http://127.0.0.1:3000';
    
    loadLicenses();
    
    document.getElementById('refresh-btn').addEventListener('click', loadLicenses);
    document.getElementById('add-license-form').addEventListener('submit', addLicense);

    async function loadLicenses() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/licenses`);
            
            if (!response.ok) {
                throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
            }
            
            const data = await response.json();
            const tbody = document.querySelector('#licenses-table tbody');
            tbody.innerHTML = '';
            
            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6">Нет данных</td></tr>';
                return;
            }
            
            data.forEach(license => {
                const row = document.createElement('tr');
                row.dataset.id = license.license_id;
                row.innerHTML = `
                    <td>${license.license_id}</td>
                    <td contenteditable="true" data-field="name">${license.name}</td>
                    <td contenteditable="true" data-field="description">${license.description || ''}</td>
                    <td contenteditable="true" data-field="start_date">${license.start_date}</td>
                    <td contenteditable="true" data-field="end_date">${license.end_date}</td>
                    <td class="actions">
                        <button class="save-btn">Сохранить</button>
                        <button class="delete-btn">Удалить</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
            
            document.querySelectorAll('.save-btn').forEach(btn => {
                btn.addEventListener('click', saveLicense);
            });
            
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', deleteLicense);
            });
            
        } catch (error) {
            console.error('Ошибка загрузки лицензий:', error);
            const tbody = document.querySelector('#licenses-table tbody');
            tbody.innerHTML = `<tr><td colspan="6">Ошибка загрузки: ${error.message}</td></tr>`;
        }
    }

    async function addLicense(e) {
        e.preventDefault();
        try {
            const data = {
                name: document.getElementById('license-name').value,
                description: document.getElementById('license-description').value,
                start_date: document.getElementById('start-date').value,
                end_date: document.getElementById('end-date').value
            };
            
            const response = await fetch(`${API_BASE_URL}/api/licenses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Неизвестная ошибка');
            }
            
            document.getElementById('add-license-form').reset();
            await loadLicenses();
            
        } catch (error) {
            console.error('Ошибка добавления:', error);
            alert(`Ошибка: ${error.message}`);
        }
    }

    async function saveLicense() {
        try {
            const row = this.closest('tr');
            const id = row.dataset.id;
            const data = {
                name: row.querySelector('[data-field="name"]').textContent,
                description: row.querySelector('[data-field="description"]').textContent,
                start_date: row.querySelector('[data-field="start_date"]').textContent,
                end_date: row.querySelector('[data-field="end_date"]').textContent
            };
            
            const response = await fetch(`${API_BASE_URL}/api/licenses/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error('Ошибка сохранения');
            }
            
            alert('Изменения сохранены');
            await loadLicenses();
            
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            alert('Не удалось сохранить изменения');
        }
    }

    async function deleteLicense() {
        if (!confirm('Вы уверены, что хотите удалить эту лицензию?')) return;
        
        try {
            const id = this.closest('tr').dataset.id;
            const response = await fetch(`${API_BASE_URL}/api/licenses/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Ошибка удаления');
            }
            
            await loadLicenses();
            
        } catch (error) {
            console.error('Ошибка удаления:', error);
            alert('Не удалось удалить лицензию');
        }
    }
});