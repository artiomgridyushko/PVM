const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Конфигурация подключения к MySQL
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'Artiom62004_',
    database: 'pvm',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Создаем пул соединений вместо одиночного подключения
const pool = mysql.createPool(dbConfig);

// Проверка подключения
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Ошибка подключения к MySQL:', err);
        process.exit(1);
    }
    console.log('Успешно подключено к MySQL (база pvm)');
    connection.release();
});

// API для компьютеров

// Получить все компьютеры
app.get('/api/computers', async (req, res) => {
    try {
        const [computers] = await pool.promise().query(`
            SELECT c.*, l.network_name as network_name
            FROM computers c
            LEFT JOIN local_networks l ON c.local_network_id = l.local_id
            ORDER BY c.computer_id DESC
        `);
        
        // Получаем периферию для каждого компьютера
        for (const computer of computers) {
            const [peripherals] = await pool.promise().query(
                'SELECT * FROM peripherals WHERE computer_id = ?',
                [computer.computer_id]
            );
            computer.peripherals = peripherals;
        }

        res.json(computers);
    } catch (err) {
        console.error('Ошибка при получении компьютеров:', err);
        res.status(500).json({
            error: 'Ошибка сервера',
            details: err.message
        });
    }
});

// Добавить новый компьютер
app.post('/api/computers', async (req, res) => {
    const { inventory_number, owner_name, specifications, local_network_id } = req.body;
    
    if (!inventory_number || !owner_name) {
        return res.status(400).json({
            error: 'Не заполнены обязательные поля',
            required: ['inventory_number', 'owner_name']
        });
    }

    try {
        const [result] = await pool.promise().query(
            `INSERT INTO computers 
            (inventory_number, owner_name, specifications, local_network_id)
            VALUES (?, ?, ?, ?)`,
            [inventory_number, owner_name, specifications || null, local_network_id || null]
        );

        res.status(201).json({
            id: result.insertId,
            message: 'Компьютер успешно добавлен',
            inventory_number
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                error: 'Инвентарный номер уже существует'
            });
        }
        console.error('Ошибка при добавлении компьютера:', err);
        res.status(500).json({
            error: 'Ошибка при добавлении компьютера',
            details: err.message
        });
    }
});

// Обновить компьютер
app.put('/api/computers/:id', async (req, res) => {
    const { id } = req.params;
    const { inventory_number, owner_name, specifications, local_network_id } = req.body;
    
    if (!inventory_number || !owner_name) {
        return res.status(400).json({
            error: 'Не заполнены обязательные поля',
            required: ['inventory_number', 'owner_name']
        });
    }

    try {
        await pool.promise().query(
            `UPDATE computers SET 
            inventory_number = ?, 
            owner_name = ?, 
            specifications = ?,
            local_network_id = ?
            WHERE computer_id = ?`,
            [inventory_number, owner_name, specifications || null, local_network_id || null, id]
        );

        res.json({
            success: true,
            message: 'Данные компьютера обновлены'
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                error: 'Инвентарный номер уже существует'
            });
        }
        console.error('Ошибка при обновлении компьютера:', err);
        res.status(500).json({
            error: 'Ошибка при обновлении компьютера',
            details: err.message
        });
    }
});

// Удалить компьютер
app.delete('/api/computers/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await pool.promise().query(
            'DELETE FROM computers WHERE computer_id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Компьютер удален'
        });
    } catch (err) {
        console.error('Ошибка при удалении компьютера:', err);
        res.status(500).json({
            error: 'Ошибка при удалении компьютера',
            details: err.message
        });
    }
});

// API для локальных сетей

// Получить все сети
app.get('/api/networks', async (req, res) => {
    try {
        const [networks] = await pool.promise().query(
            'SELECT * FROM local_networks ORDER BY local_id DESC'
        );
        res.json(networks);
    } catch (err) {
        console.error('Ошибка при получении сетей:', err);
        res.status(500).json({
            error: 'Ошибка сервера',
            details: err.message
        });
    }
});

// Добавить новую сеть
app.post('/api/networks', async (req, res) => {
    const { network_name, description } = req.body;
    
    if (!network_name) {
        return res.status(400).json({
            error: 'Не заполнены обязательные поля',
            required: ['network_name']
        });
    }

    try {
        const [result] = await pool.promise().query(
            `INSERT INTO local_networks 
            (network_name, description)
            VALUES (?, ?)`,
            [network_name, description || null]
        );

        res.status(201).json({
            id: result.insertId,
            message: 'Сеть успешно добавлена',
            network_name
        });
    } catch (err) {
        console.error('Ошибка при добавлении сети:', err);
        res.status(500).json({
            error: 'Ошибка при добавлении сети',
            details: err.message
        });
    }
});

// API для периферии

// Добавить периферию
app.post('/api/peripherals', async (req, res) => {
    const { computer_id, type, model, serial_number } = req.body;
    
    if (!computer_id || !type || !model) {
        return res.status(400).json({
            error: 'Не заполнены обязательные поля',
            required: ['computer_id', 'type', 'model']
        });
    }

    try {
        const [result] = await pool.promise().query(
            `INSERT INTO peripherals 
            (computer_id, type, model, serial_number)
            VALUES (?, ?, ?, ?)`,
            [computer_id, type, model, serial_number || null]
        );

        res.status(201).json({
            id: result.insertId,
            message: 'Периферия успешно добавлена',
            computer_id
        });
    } catch (err) {
        console.error('Ошибка при добавлении периферии:', err);
        res.status(500).json({
            error: 'Ошибка при добавлении периферии',
            details: err.message
        });
    }
});

// Удалить периферию
app.delete('/api/peripherals/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await pool.promise().query(
            'DELETE FROM peripherals WHERE peripheral_id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Периферия удалена'
        });
    } catch (err) {
        console.error('Ошибка при удалении периферии:', err);
        res.status(500).json({
            error: 'Ошибка при удалении периферии',
            details: err.message
        });
    }
});

// Получить компьютеры без сети
app.get('/api/computers/unassigned', async (req, res) => {
    try {
        const [computers] = await pool.promise().query(
            'SELECT * FROM computers WHERE local_network_id IS NULL ORDER BY computer_id DESC'
        );
        res.json(computers);
    } catch (err) {
        console.error('Ошибка при получении компьютеров без сети:', err);
        res.status(500).json({
            error: 'Ошибка сервера',
            details: err.message
        });
    }
});

// Получить одну сеть по ID
app.get('/api/networks/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [networks] = await pool.promise().query(
            'SELECT * FROM local_networks WHERE local_id = ?',
            [id]
        );
        
        if (networks.length === 0) {
            return res.status(404).json({ error: 'Сеть не найдена' });
        }
        
        res.json(networks[0]);
    } catch (err) {
        console.error('Ошибка при получении сети:', err);
        res.status(500).json({
            error: 'Ошибка сервера',
            details: err.message
        });
    }
});

// Получить один компьютер по ID
app.get('/api/computers/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [computers] = await pool.promise().query(
            'SELECT * FROM computers WHERE computer_id = ?',
            [id]
        );
        
        if (computers.length === 0) {
            return res.status(404).json({ error: 'Компьютер не найден' });
        }
        
        res.json(computers[0]);
    } catch (err) {
        console.error('Ошибка при получении компьютера:', err);
        res.status(500).json({
            error: 'Ошибка сервера',
            details: err.message
        });
    }
});


// Получить все компьютеры с их периферией
app.get('/api/computers-with-peripherals', async (req, res) => {
    try {
        // Получаем все компьютеры
        const [computers] = await pool.promise().query(`
            SELECT c.*, l.network_name 
            FROM computers c
            LEFT JOIN local_networks l ON c.local_network_id = l.local_id
            ORDER BY c.computer_id DESC
        `);
        
        // Для каждого компьютера получаем периферию
        for (const computer of computers) {
            const [peripherals] = await pool.promise().query(
                'SELECT * FROM peripherals WHERE computer_id = ? ORDER BY peripheral_id DESC',
                [computer.computer_id]
            );
            computer.peripherals = peripherals;
        }
        
        res.json(computers);
    } catch (err) {
        console.error('Ошибка при получении компьютеров с периферией:', err);
        res.status(500).json({
            error: 'Ошибка сервера',
            details: err.message
        });
    }
});

// Обработка несуществующих маршрутов
app.use((req, res) => {
    res.status(404).json({ error: 'Маршрут не найден' });
});

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error('Необработанная ошибка:', err);
    res.status(500).json({ 
        error: 'Внутренняя ошибка сервера',
        details: err.message 
    });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер API для АИС ПЭВМ запущен на порту ${PORT}`);
    console.log(`Используется база данных: ${dbConfig.database}`);
});

// Экспорт для тестирования
module.exports = app;