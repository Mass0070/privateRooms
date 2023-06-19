// removeStaff.js

const { removeFromPartner } = require('../../utils/SAFunctions');
const { removeFromDocs } = require('../../utils/updateDocs');
const { client } = require('../../utils/mongodb');

async function removeStaff(req, res) {
    const uuid = req.params.uuid;
    if (!validateUUID(uuid)) {
        return res.json({ message: 'Invalid uuid' });
    }
    try {
        await client.connect();
        await client.db("SA-2").collection('staffs').deleteOne({ uuid: { $eq: uuid } });
    
        const currentDate = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        await client.db("SA-2").collection('staffs-alltime').updateOne(
        { uuid: { $eq: uuid }, staff: true },
        { $set: { staff: false, "date.quitted": currentDate } }
        );

        await client.close();
        await removeFromPartner(uuid)
        await removeFromDocs(uuid);
        res.json({ message: "Success" })
    } catch (err) {
        return res.json({ message: 'Internal Server Error', err });
    }
}

module.exports = {
    removeStaff,
};
