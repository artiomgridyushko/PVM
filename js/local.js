document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = 'http://127.0.0.1:3000';
    
    loadNetworksAndComputers();
    
    document.getElementById('refresh-btn').addEventListener('click', loadNetworksAndComputers);
    document.getElementById('add-network-form').addEventListener('submit', addNetwork);

    async function loadNetworksAndComputers() {
        try {
            // Загружаем сети и компьютеры параллельно
            const [networksResponse, computersResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/api/networks`),
                fetch(`${API_BASE_URL}/api/computers`)
            ]);
            
            if (!networksResponse.ok || !computersResponse.ok) {
                throw new Error('Ошибка загрузки данных');
            }
            
            const networks = await networksResponse.json();
            const allComputers = await computersResponse.json();
            
            const networksContainer = document.getElementById('networks-container');
            networksContainer.innerHTML = '';
            
            if (networks.length === 0) {
                networksContainer.innerHTML = '<p>Нет созданных сетей</p>';
                return;
            }
            
            networks.forEach(network => {
                const networkBlock = document.createElement('div');
                networkBlock.className = 'network';
                networkBlock.dataset.networkId = network.local_id;
                
                const computersInNetwork = allComputers.filter(c => c.local_network_id == network.local_id);
                const availableComputers = allComputers.filter(c => !c.local_network_id);
                
                networkBlock.innerHTML = `
                    <h2>
                        <span>${network.network_name || 'Сеть без названия'} (ID: ${network.local_id})</span>
                    </h2>
                    <p>${network.description || 'Нет описания'}</p>
                    
                    <h3>Компьютеры в сети:</h3>
                    <div class="computers-list" data-network-id="${network.local_id}">
                        ${computersInNetwork.length > 0 ? 
                            computersInNetwork.map(c => `
                                <div class="computer-item" data-computer-id="${c.computer_id}">
                                    <span>${c.inventory_number} (${c.owner_name})</span>
                                    <div class="actions">
                                        <button class="remove-computer-btn">Удалить из сети</button>
                                    </div>
                                </div>
                            `).join('') : 
                            '<p class="no-computers">Нет компьютеров в этой сети</p>'}
                    </div>
                    
                    <div class="add-computer-to-network">
                        <select class="select-computer" data-network-id="${network.local_id}">
                            <option value="">Выберите компьютер</option>
                            ${availableComputers.map(c => `
                                <option value="${c.computer_id}">${c.inventory_number} (${c.owner_name})</option>
                            `).join('')}
                        </select>
                        <button class="add-computer-btn" data-network-id="${network.local_id}">Добавить в сеть</button>
                    </div>
                `;
                
                networksContainer.appendChild(networkBlock);
            });
            
            document.querySelectorAll('.add-computer-btn').forEach(btn => {
                btn.addEventListener('click', addComputerToNetwork);
            });
            
            document.querySelectorAll('.remove-computer-btn').forEach(btn => {
                btn.addEventListener('click', removeComputerFromNetwork);
            });
            
        } catch (error) {
            console.error('Ошибка загрузки:', error);
            const networksContainer = document.getElementById('networks-container');
            networksContainer.innerHTML = `<p>Ошибка загрузки данных: ${error.message}</p>`;
        }
    }

    async function addNetwork(e) {
        e.preventDefault();
        try {
            const data = {
                network_name: document.getElementById('network-name').value,
                description: document.getElementById('network-description').value || null
            };
            
            const response = await fetch(`${API_BASE_URL}/api/networks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Неизвестная ошибка');
            }
            
            document.getElementById('add-network-form').reset();
            await loadNetworksAndComputers();
            
        } catch (error) {
            console.error('Ошибка добавления сети:', error);
            alert(`Ошибка: ${error.message}`);
        }
    }

async function addComputerToNetwork() {
    const networkId = this.dataset.networkId;
    const select = document.querySelector(`.select-computer[data-network-id="${networkId}"]`);
    const computerId = select.value;
    
    if (!computerId) {
        alert('Выберите компьютер для добавления');
        return;
    }
    
    try {
        // 1. Получаем текущие данные компьютера
        const computerResponse = await fetch(`${API_BASE_URL}/api/computers/${computerId}`);
        if (!computerResponse.ok) {
            throw new Error('Компьютер не найден');
        }
        
        const computer = await computerResponse.json();
        
        // 2. Обновляем только local_network_id
        const updateData = {
            inventory_number: computer.inventory_number,
            owner_name: computer.owner_name,
            specifications: computer.specifications || null,
            local_network_id: networkId
        };

        // 3. Отправляем запрос на обновление
        const updateResponse = await fetch(`${API_BASE_URL}/api/computers/${computerId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        if (!updateResponse.ok) {
            const errorData = await updateResponse.json().catch(() => ({}));
            throw new Error(errorData.error || 'Ошибка сервера при обновлении');
        }

        // 4. Обновляем интерфейс
        await loadNetworksAndComputers();
        select.value = ''; // Сбрасываем выбор
        
    } catch (error) {
        console.error('Ошибка добавления компьютера:', error);
        alert(`Ошибка: ${error.message}`);
    }
}

    async function removeComputerFromNetwork() {
        if (!confirm('Удалить компьютер из сети?')) return;
        
        const computerItem = this.closest('.computer-item');
        const computerId = computerItem.dataset.computerId;
        const computerInfo = computerItem.querySelector('span').textContent;
        const [inventoryNumber, ownerName] = computerInfo.split(' (');
        
        try {
            // Формируем данные для обновления
            const updateData = {
                inventory_number: inventoryNumber.trim(),
                owner_name: ownerName.replace(')', '').trim(),
                local_network_id: null
            };
            
            const response = await fetch(`${API_BASE_URL}/api/computers/${computerId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });
            
            if (!response.ok) {
                throw new Error('Ошибка удаления компьютера из сети');
            }
            
            await loadNetworksAndComputers();
            
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Не удалось удалить компьютер из сети');
        }
    }
});