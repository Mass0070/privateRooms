// getStaff.js

const { runQuery } = require('../../utils/mariadb');
const { updateDocs } = require('../../utils/updateDocs');
const { updateStaff, checkVIP } = require('../../utils/SAFunctions');

async function getStaff(req, res) {
    try {
        const results = await runQuery(
            "SELECT * FROM ( " +
                "SELECT " +
                "p.username, " +
                "CASE " +
                "WHEN p.uuid = '264aed13-8842-40b9-86bd-1225c1f962bd' THEN 'seniormod' " +
                "WHEN p.role = 'bygger' THEN 'Bygger' " +
                "WHEN p.role = 'developer' THEN 'Udvikler' " +
                "    ELSE p.role " +
                "    END AS role, " +
                "p.uuid " +
                "FROM players p " +
                "WHERE p.role != 'player' AND p.id != -1 " +
            ") t " +
            "WHERE role IN ('bygger', 'support', 'mod', 'seniormod', 'udvikler', 'admin') " +
            "ORDER BY role ASC, username ASC"
        );

        if (req.body.checkVIP == 1) {
            await updateDocs();
            await updateStaff(results);
            await checkVIP();
        }

        res.json(results);

    } catch (err) {
        return res.json({ message: 'Internal Server Error', err });
    }
}

module.exports = {
    getStaff,
};
