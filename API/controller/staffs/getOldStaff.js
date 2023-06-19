// getOldStaff.js

const { client } = require('../../utils/mongodb');

async function getOldStaff(req, res) {
    try {
        await client.connect();

        const collection = client.db("SA-2").collection("staffs");
        const cursor = collection.find({});
        const documents = await cursor.toArray();

        await client.close();
        res.json(documents);
    } catch (err) {
        return res.json({ message: 'Internal Server Error', err });
    }
}

module.exports = {
    getOldStaff,
};
