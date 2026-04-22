import { db } from './lib/db.js';
import { nanoid } from 'nanoid';

export default async function handler(req, res) {
  const { method } = req;
  const { sessionId } = req.query;

  if (!sessionId) return res.status(400).json({ error: 'Session ID required' });

  try {
    if (method === 'GET') {
      const queries = [
        db.execute({ sql: 'SELECT * FROM members WHERE session_id = ?', args: [sessionId] }),
        db.execute({ sql: 'SELECT * FROM items WHERE session_id = ?', args: [sessionId] }),
        db.execute({ 
          sql: `SELECT ia.* FROM item_assignments ia 
                JOIN items i ON ia.item_id = i.id 
                WHERE i.session_id = ?`, 
          args: [sessionId] 
        }),
        db.execute({ sql: 'SELECT * FROM sessions WHERE id = ?', args: [sessionId] })
      ];

      const [members, items, assignments, session] = await Promise.all(queries);

      return res.status(200).json({
        members: members.rows,
        items: items.rows,
        assignments: assignments.rows,
        config: session.rows[0]
      });
    }

    if (method === 'POST') {
      const { action, data } = req.body;

      switch (action) {
        case 'ADD_MEMBER':
          await db.execute({
            sql: 'INSERT INTO members (id, session_id, name) VALUES (?, ?, ?)',
            args: [nanoid(6), sessionId, data.name]
          });
          break;

        case 'DELETE_MEMBER':
          await db.execute({
            sql: 'DELETE FROM members WHERE id = ? AND session_id = ?',
            args: [data.id, sessionId]
          });
          break;

        case 'ADD_ITEM':
          const itemId = nanoid(6);
          await db.transaction(async (tx) => {
            await tx.execute({
              sql: 'INSERT INTO items (id, session_id, name, price) VALUES (?, ?, ?, ?)',
              args: [itemId, sessionId, data.name, data.price]
            });
            if (data.assignees && data.assignees.length > 0) {
              const placeholders = data.assignees.map(() => '(?, ?)').join(',');
              const args = [];
              data.assignees.forEach(mId => {
                args.push(itemId, mId);
              });
              await tx.execute({
                sql: `INSERT INTO item_assignments (item_id, member_id) VALUES ${placeholders}`,
                args
              });
            }
          });
          break;

        case 'DELETE_ITEM':
          await db.execute({
            sql: 'DELETE FROM items WHERE id = ? AND session_id = ?',
            args: [data.id, sessionId]
          });
          break;

        case 'UPDATE_ASSIGNMENT':
          await db.transaction(async (tx) => {
            await tx.execute({
              sql: 'DELETE FROM item_assignments WHERE item_id = ?',
              args: [data.itemId]
            });
            if (data.memberIds && data.memberIds.length > 0) {
              const placeholders = data.memberIds.map(() => '(?, ?)').join(',');
              const args = [];
              data.memberIds.forEach(mId => {
                args.push(data.itemId, mId);
              });
              await tx.execute({
                sql: `INSERT INTO item_assignments (item_id, member_id) VALUES ${placeholders}`,
                args
              });
            }
          });
          break;

        case 'UPDATE_CONFIG':
          await db.execute({
            sql: `UPDATE sessions SET 
                  tax_type = ?, tax_value = ?, 
                  service_charge = ?, 
                  rounding_type = ?, rounding_value = ? 
                  WHERE id = ?`,
            args: [
              data.tax_type, data.tax_value, 
              data.service_charge, 
              data.rounding_type, data.rounding_value, 
              sessionId
            ]
          });
          break;

        default:
          return res.status(400).json({ error: 'Unknown action' });
      }

      return res.status(200).json({ success: true });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${method} Not Allowed`);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
