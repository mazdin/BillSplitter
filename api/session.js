import { db } from './lib/db.js';
import { nanoid } from 'nanoid';

export default async function handler(req, res) {
  const { method } = req;

  try {
    if (method === 'POST') {
      const { name, date } = req.body;
      const id = nanoid(10); // Using 10-char nanoid for better link sharing, unique enough
      
      await db.execute({
        sql: 'INSERT INTO sessions (id, name, date) VALUES (?, ?, ?)',
        args: [id, name || 'New Session', date || new Date().toISOString().split('T')[0]]
      });

      return res.status(200).json({ id });
    }

    if (method === 'GET') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'ID required' });

      const rs = await db.execute({
        sql: 'SELECT * FROM sessions WHERE id = ?',
        args: [id]
      });

      if (rs.rows.length === 0) return res.status(404).json({ error: 'Session not found' });

      return res.status(200).json(rs.rows[0]);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${method} Not Allowed`);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
