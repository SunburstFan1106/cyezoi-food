import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

const AddMenu = () => {
    const [date, setDate] = useState('');
    const [breakfast, setBreakfast] = useState('');
    const [lunch, setLunch] = useState('');
    const [dinner, setDinner] = useState('');
    const [message, setMessage] = useState('');
    const history = useHistory();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const meals = {
            breakfast: breakfast.split(',').map(item => item.trim()).filter(item => item),
            lunch: lunch.split(',').map(item => item.trim()).filter(item => item),
            dinner: dinner.split(',').map(item => item.trim()).filter(item => item)
        };

        try {
            const res = await fetch('/api/menu/admin/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ date, meals })
            });
            const data = await res.json();
            if (data.success) {
                setMessage('食堂菜单添加成功！');
                // 可选择跳转到其它页面：
                // history.push('/menu');
            } else {
                setMessage(data.message || '添加失败');
            }
        } catch (error) {
            console.error(error);
            setMessage('添加失败，请重试');
        }
    };

    return (
        <div>
            <h2>添加食堂菜单</h2>
            {message && <p>{message}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>日期:</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
                <div>
                    <label>早餐 (用英文逗号分隔):</label>
                    <input type="text" value={breakfast} onChange={(e) => setBreakfast(e.target.value)} placeholder="例如: 豆浆, 鸡蛋, 面包" />
                </div>
                <div>
                    <label>午餐 (用英文逗号分隔):</label>
                    <input type="text" value={lunch} onChange={(e) => setLunch(e.target.value)} placeholder="例如: 米饭, 红烧肉, 青菜" />
                </div>
                <div>
                    <label>晚餐 (用英文逗号分隔):</label>
                    <input type="text" value={dinner} onChange={(e) => setDinner(e.target.value)} placeholder="例如: 汤面, 小炒, 饺子" />
                </div>
                <button type="submit">添加菜单</button>
            </form>
        </div>
    );
};

export default AddMenu;