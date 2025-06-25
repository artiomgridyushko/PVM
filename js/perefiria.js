document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = 'http://127.0.0.1:3000';
    
    // Загружаем компьютеры с периферией
    loadComputersWithPeripherals();
    
    // Обработчик кнопки обновления
    document.getElementById('refresh-btn').addEventListener('click', loadComputersWithPeripherals);

    // Функция загрузки компьютеров с периферией
    async function loadComputersWithPeripherals() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/computers-with-peripherals`);
            
            if (!response.ok) {
                throw new Error('Ошибка загрузки данных');
            }
            
            const computers = await response.json();
            renderComputersWithPeripherals(computers);
            
        } catch (error) {
            console.error('Ошибка загрузки:', error);
            const container = document.getElementById('computers-container');
            container.innerHTML = `<p>Ошибка загрузки данных: ${error.message}</p>`;
        }
    }

    // Функция отображения компьютеров с периферией
    function renderComputersWithPeripherals(computers) {
        const container = document.getElementById('computers-container');
        
        if (computers.length === 0) {
            container.innerHTML = '<p>Нет компьютеров с периферией</p>';
            return;
        }
        
        container.innerHTML = '';
        
        computers.forEach(computer => {
            const computerCard = document.createElement('div');
            computerCard.className = 'computer-card';
            computerCard.dataset.computerId = computer.computer_id;
            
            computerCard.innerHTML = `
                <div class="computer-info">
                    <div>
                        <h3>${computer.inventory_number || 'Без инвентарного номера'}</h3>
                        <p>Владелец: ${computer.owner_name || 'Не указан'}</p>
                        <p>Характеристики: ${computer.specifications || 'Не указаны'}</p>
                    </div>
                    <div>
                        <p>ID: ${computer.computer_id}</p>
                        <p>Сеть: ${computer.network_name || 'Не в сети'}</p>
                    </div>
                </div>
                
                <div class="peripherals-list">
                    <h4>Периферия:</h4>
                    ${computer.peripherals && computer.peripherals.length > 0 ? 
                        computer.peripherals.map(p => `
                            <div class="peripheral-item" data-peripheral-id="${p.peripheral_id}">
                                <div>
                                    <strong>${p.type}</strong> - ${p.model}
                                    ${p.serial_number ? `(Серийный: ${p.serial_number})` : ''}
                                </div>
                                <button class="delete-btn delete-peripheral">Удалить</button>
                            </div>
                        `).join('') : 
                        '<p class="no-peripherals">Нет подключенной периферии</p>'}
                </div>
                
                <div class="add-peripheral-form">
                    <h4>Добавить периферию</h4>
                    <form class="peripheral-form" data-computer-id="${computer.computer_id}">
                        <div class="form-group">
                            <label for="type-${computer.computer_id}">Тип:</label>
                            <select id="type-${computer.computer_id}" name="type" required>
                                <option value="">Выберите тип</option>
                                <option value="Монитор">Монитор</option>
                                <option value="Принтер">Принтер</option>
                                <option value="Сканер">Сканер</option>
                                <option value="Клавиатура">Клавиатура</option>
                                <option value="Мышь">Мышь</option>
                                <option value="ИБП">ИБП</option>
                                <option value="Наушники">Наушники</option>
                                <option value="Другое">Другое</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="model-${computer.computer_id}">Модель:</label>
                            <input type="text" id="model-${computer.computer_id}" name="model" required>
                        </div>
                        <div class="form-group">
                            <label for="serial-${computer.computer_id}">Серийный номер (необязательно):</label>
                            <input type="text" id="serial-${computer.computer_id}" name="serial_number">
                        </div>
                        <button type="submit">Добавить</button>
                    </form>
                </div>
            `;
            
            container.appendChild(computerCard);
        });
        
        // Добавляем обработчики для форм добавления периферии
        document.querySelectorAll('.peripheral-form').forEach(form => {
            form.addEventListener('submit', addPeripheral);
        });
        
        // Добавляем обработчики для кнопок удаления периферии
        document.querySelectorAll('.delete-peripheral').forEach(btn => {
            btn.addEventListener('click', deletePeripheral);
        });
    }

    // Функция добавления периферии
    async function addPeripheral(e) {
        e.preventDefault();
        
        const form = e.target;
        const computerId = form.dataset.computerId;
        const formData = new FormData(form);
        
        const data = {
            computer_id: computerId,
            type: formData.get('type'),
            model: formData.get('model'),
            serial_number: formData.get('serial_number') || null
        };
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/peripherals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ошибка при добавлении');
            }
            
            // Обновляем список
            await loadComputersWithPeripherals();
            
        } catch (error) {
            console.error('Ошибка добавления периферии:', error);
            alert(`Ошибка: ${error.message}`);
        }
    }

    // Функция удаления периферии
    async function deletePeripheral() {
        if (!confirm('Удалить эту периферию?')) return;
        
        const peripheralItem = this.closest('.peripheral-item');
        const peripheralId = peripheralItem.dataset.peripheralId;
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/peripherals/${peripheralId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Ошибка при удалении');
            }
            
            // Обновляем список
            await loadComputersWithPeripherals();
            
        } catch (error) {
            console.error('Ошибка удаления периферии:', error);
            alert(`Ошибка: ${error.message}`);
        }
    }
});