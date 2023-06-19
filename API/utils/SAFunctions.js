// SAFunctions.js

const { labymod } = require('../config.json');
const { client } = require('./mongodb');
const { runQuery } = require('./mariadb');

async function addToPartner(uuid) {
    //return;
    console.log("Adding %s as member to LabyMod", uuid);
    try {
        // Make a POST request with form-data
        await axios({
            timeout: 2000,
            method: "post",
            maxBodyLength: Infinity,
            url: `${labymod.url}/${uuid}`,
            data: `{ "permission": 1 }`,
            headers: {
                "X-AUTH-TOKEN": labymod.token,
                "Content-Type": "application/json",
            },
        });
    } catch (err) {
        console.log("Failed to add user %s", uuid)
    }
}
    
async function removeFromPartner(uuid) {
    //return;
    console.log("Removing %s as member from LabyMod", uuid);
    try {
        // Make a POST request with form-data
        await axios({
            timeout: 2000,
            method: "delete",
            maxBodyLength: Infinity,
            url: `${labymod.url}/${uuid}`,
            headers: {
                "X-AUTH-TOKEN": labymod.token,
                "Content-Type": "application/json",
            },
        });
    } catch (err) {
        console.log("Failed to remove user %s", uuid)
    }
}
    
async function updateStaff(staff) {
    if (staff == null) return;

    await client.connect();
    const collection = client.db("SA-2").collection("staffs");
    // All time
    const alltime = client.db("SA-2").collection("staffs-alltime");

    // Loop through each staff object in the array
    for (let i = 0; i < staff.length; i++) {
        const { username, uuid, role } = staff[i];

        // Check if a document with the given `uuid` exists
        const existingStaff = await collection.findOne({ uuid });
        const alltimeexistingStaff = await alltime.findOne({ uuid, staff: true });

        if (existingStaff) {
            // Update the existing document
            await collection.updateOne(
            { _id: existingStaff._id },
            { $set: { username, role } }
            );
        } else {
            // Insert a new document
            await collection.insertOne({ username, uuid, role });
            if (staff.length <= 25) {
                await addToPartner(uuid);
            } else {
                console.log("%s kunne ikke tilføjes som medlem.\nMere end 25 staffs.", uuid);
            }      
        }


        const currentDate = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        if (alltimeexistingStaff) {
            // Update the existing document
            await alltime.updateOne(
            { _id: alltimeexistingStaff._id },
            { $set: { username, uuid, role } }
            );
        } else {
            // Insert a new document
            await alltime.insertOne({ username, uuid, role, staff: true, date: { started: currentDate, } });
        }
    }
    
    await client.close();
}
    
async function checkVIP() {
    try {
        console.log("Checking VIP!");
        await runQuery(
            "UPDATE players p " +
            "JOIN roles r ON r.name = p.role " +
            "SET p.vipDays = p.vipDays + 14 " +
            "WHERE p.role != 'player' AND p.id != -1 AND p.vipDays < 3"
        );
    } catch (err) {
        console.log("Failed to check VIP", err)
    }
}

module.exports = {
    addToPartner,
    removeFromPartner,
    updateStaff,
    checkVIP
};