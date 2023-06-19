const { mongodb, docs } = require('./config.json');
const { ObjectId } = require('mongodb');
const MongoClient = require('mongodb').MongoClient;
const fs = require('fs');

const mongodb_url = mongodb.url;
const client = new MongoClient(mongodb_url, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    connectTimeoutMS: 30000,
    keepAlive: 1,
});

const { google } = require('googleapis');
const fileIdLink = '1KABtVdGgFvPrPthRNlt8gF6iqB_YVmR3bIoZSkEbGxE';


async function setupAuth() {
    // Read the key file contents
    const keyFileContents = fs.readFileSync(docs);

    // Parse the key file contents as JSON
    const keyFileJSON = JSON.parse(keyFileContents);

    // Set up Google Drive API credentials
    const auth = new google.auth.GoogleAuth({
        credentials: keyFileJSON,
        scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const authClient = await auth.getClient();
    const drive = google.drive({ version: 'v3', auth: authClient });

    return drive;
}

async function updateDocs() {
    try {
        await client.connect();

        const collection = await client.db('SA-2').collection('staffs-alltime');
        const staffs = await collection.find( { staff: true } ).toArray();

        const drive = await setupAuth();

        // Add staff members as readers to the Google Sheets file
        const fileId = fileIdLink;
        const role = 'reader';

        // Get the list of existing permissions
        const existingPermissions = await drive.permissions.list({
            fileId: fileId,
        });

        const existingEmails = existingPermissions.data.permissions.map(
            (permission) => permission.emailAddress
        );

        for (const staff of staffs) {
            const { email } = staff;

            if (email) {
                if (existingEmails.includes(email)) {
                    console.log('Skipping member:', email, 'already added');
                } else {
                    const permission = {
                        type: 'user',
                        role: role,
                        emailAddress: email,
                    };

                    await drive.permissions.create({
                        fileId: fileId,
                        requestBody: permission,
                        supportsAllDrives: false,
                        sendNotificationEmail: false,
                    });

                    console.log('Member added to the sheet:', email);
                }
            }
        }

        // Close the MongoDB connection
        await client.close();
    } catch (error) {
        console.error('Error updating sheet members:', error.message);
    }
}

async function removeFromDocs(uuid) {
    try {
        await client.connect();

        const collection = await client.db('SA-2').collection('staffs-alltime');
        const staff = await collection.findOne({ uuid: uuid });

        if (staff) {
            const { email } = staff;

            const drive = await setupAuth();

            // Get the list of permissions for the Google Sheets file
            const fileId = fileIdLink;

            const permissions = await drive.permissions.list({
                fileId: fileId,
                supportsAllDrives: false,
                fields: 'permissions(id, emailAddress)',
            });

            const staffPermission = permissions.data.permissions.find(
                (permission) => permission.emailAddress === email
            );

            if (staffPermission) {
                const permissionId = staffPermission.id;

                // Remove staff member from the Google Sheets file
                await drive.permissions.delete({
                    fileId: fileId,
                    permissionId: permissionId,
                });

                console.log('Member removed from the sheet:', email);
            } else {
                console.log('Staff member does not have permission for the sheet.');
            }
        } else {
            console.log('Staff member not found.');
        }

        // Close the MongoDB connection
        await client.close();
    } catch (error) {
        console.error('Error removing sheet member:', error.message);
    }
}


module.exports = { updateDocs, removeFromDocs };
