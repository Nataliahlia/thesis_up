const express = require('express');
const router = express.Router();
const connection = require('../db');

router.post('/api/committee/accept-invitation', async (req, res) => {
    const { invitationId, thesisId } = req.body;
    
    if (!invitationId || !thesisId) {
        return res.status(400).json({ 
            success: false, 
            message: 'Missing required fields' 
        });
    }
    
    try {
        await connection.beginTransaction();
        
        // Validate invitation exists and is pending
        const [invitation] = await connection.query(`
            SELECT * FROM thesis_committee 
            WHERE id = ? AND thesis_id = ? AND status = 'pending' AND role = 'member'
        `, [invitationId, thesisId]);
        
        if (invitation.length === 0) {
            await connection.rollback();
            return res.status(404).json({ 
                success: false, 
                message: 'Invalid or expired invitation' 
            });
        }
        
        // Check if committee is already full
        const [countResult] = await connection.query(`
            SELECT COUNT(*) as count 
            FROM thesis_committee 
            WHERE thesis_id = ? AND status = 'accepted' AND role = 'member'
        `, [thesisId]);
        
        if (countResult.count >= 2) {
            await connection.rollback();
            return res.status(400).json({ 
                success: false, 
                message: 'Η επιτροπή είναι ήδη πλήρης' 
            });
        }
        
        // Accept the invitation
        await connection.query(`
            UPDATE thesis_committee 
            SET status = 'accepted', acceptance_date = NOW() 
            WHERE id = ?
        `, [invitationId]);
        
        // Check if committee is now complete
        const [newCount] = await connection.query(`
            SELECT COUNT(*) as count 
            FROM thesis_committee 
            WHERE thesis_id = ? AND status = 'accepted' AND role = 'member'
        `, [thesisId]);
        
        let committeeComplete = false;
        
        if (newCount.count >= 2) {
            // Cancel other pending invitations
            await connection.query(`
                UPDATE thesis_committee 
                SET status = 'declined', denial_date = NOW() 
                WHERE thesis_id = ? AND status = 'pending' AND role = 'member'
            `, [thesisId]);
            
            committeeComplete = true;
        }
        
        await connection.commit();
        
        res.json({ 
            success: true, 
            committeeComplete,
            message: committeeComplete ? 'Επιτροπή ολοκληρώθηκε!' : 'Πρόσκληση αποδέχθηκε'
        });
        
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

module.exports = router;