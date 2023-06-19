const { requiredAuthenticated  } = require('./auth.js');
const { mongodb, mariadb, labymod, sa } = require('./config.json');
const { updateDocs } = require('./updateDocs.js');

const axios = require('axios');
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");

const { ObjectId } = require('mongodb');
const MongoClient = require('mongodb').MongoClient;

const mongodb_url = mongodb.url;
const client = new MongoClient(mongodb_url, { useUnifiedTopology: true}, { useNewUrlParser: true }, { connectTimeoutMS: 30000 }, { keepAlive: 1});

// MariaDB
const mysql = require('mysql');
const connection = mysql.createConnection({
  host: mariadb.host,
  user: mariadb.user,
  password: mariadb.pass,
  database: mariadb.db
});
const USERNAME_PATTERN = /^(?=.{1,20}$)[A-Za-z0-9+_]+$/;
function validateUsername(username) {
  return USERNAME_PATTERN.test(username);
}

const UUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
function validateUUID(uuid) {
  return UUID_PATTERN.test(uuid);
}

const EMAIL_PATTERN = /^[a-zA-Z0-9_\-.]+@[a-zA-Z]+\.[a-zA-Z]{2,}$/;
function validateEmail(email) {
  return EMAIL_PATTERN.test(email);
}

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
  console.log("Checking VIP!");
  connection.query("UPDATE players p " +
    "JOIN roles r ON r.name = p.role " +
    "SET p.vipDays = p.vipDays + 14 " +
    "WHERE p.role != 'player' AND p.id != -1 AND p.vipDays < 3", (error, results, fields) => {
      if (error) throw error;
    });
}

const app = express();

// CORS setup
var allowCrossDomain = (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Content-Length, X-Requested-Width, Accept, Access-Control-Allow-Credentials, websiteapi');

    // intercept OPTIONS method
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
}
app.use(allowCrossDomain);

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

app.listen(5000, () => {
  console.log(`Server is running on port 5000.`);
});

app.get("/", (req, res) => {
  //console.log(req)
  res.sendFile(path.join(__dirname,'index.html'))
});

app.get("/api/*", requiredAuthenticated, async (req, res, next) => {
  console.log("get")
  next()
});

app.post("/api/*", requiredAuthenticated, async (req, res, next) => {
  console.log("post")
  next()
});


app.post('/api/staffs/', requiredAuthenticated, async (req, res, next) => {
  //console.log(req.body)
  const { userID, email } = req.body;
  if (!userID || !email || !validateUsername(userID) || !validateEmail(email)) {
    return res.json({ message: 'Invalid user or email' });
  }

  connection.query(
    "SELECT players.uuid FROM players " +
    "JOIN discordAccounts ON players.id = discordAccounts.playerID " +
    "WHERE discordAccounts.discordID = ?",
    [userID],
    async (error, results, fields) => {
      if (error) throw error;

      if (results.length === 0) {
        return res.json({ message: 'Invalid uuid' });
      }

      const uuid = results[0]['uuid'];
      if (!validateUUID(uuid)) {
        return res.json({ message: 'Invalid uuid' });
      }

      try {
        await client.connect();
        const collection = client.db("SA-2").collection("staffs-alltime");
        const existingStaff = await collection.findOne({ uuid, staff: true });

        if (existingStaff) {
          if (existingStaff.email) {
            await client.close();
            return res.json({ message: 'You can\'t change the email again' });
          } else {
            await collection.updateOne({ uuid, staff: true }, { $set: { email: email } });
            await client.close();
            await updateDocs()
            return res.json({ message: "Success" });
          }
        } else {
          await client.close();
          return res.json({ message: 'Staff member not found' });
        }
      } catch (error) {
        await client.close();
        return res.json({ message: 'Internal Server Error', error });
      }
    }
  );
});


const defaultPermissions = {
  ownerID: null,
  active: 1,
  permissions: {
    users: [
      {
        userID: null,
        permissions: {
          allow: ['VIEW_CHANNEL', 'CONNECT', 'MOVE_MEMBERS']
        }
      }
    ],
    roles: {
      mainRoom: [
        {
          roleID: '662831492229103626',
          permissions: {
            deny: ['VIEW_CHANNEL', 'CONNECT']
          }
        },
        {
          roleID: '739186031412379738',
          permissions: {
            deny: ['VIEW_CHANNEL', 'CONNECT']
          }
        },
        {
          roleID: '1102307581030055936',
          permissions: {
            allow: ['VIEW_CHANNEL']
          }
        },
        {
          roleID: '1083887455855460432',
          permissions: {
            allow: ['VIEW_CHANNEL']
          }
        }
      ],
      waitingRoom: [
        {
          roleID: '662831492229103626',
          permissions: {
            deny: ['VIEW_CHANNEL', 'SPEAK']
          }
        },
        {
          roleID: '739186031412379738',
          permissions: {
            deny: ['VIEW_CHANNEL', 'SPEAK']
          }
        },
        {
          roleID: '1102307581030055936',
          permissions: {
            allow: ['VIEW_CHANNEL']
          }
        },
        {
          roleID: '1083887455855460432',
          permissions: {
            allow: ['VIEW_CHANNEL']
          }
        }
      ]
    }
  }
};

// Get the user permissions
app.get('/api/permission/:userID', requiredAuthenticated, async (req, res) => {
  // Retrieve the user ID from the request parameters
  const userID = req.params.userID;
  if (!validateUsername(userID)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }
    await client.connect();

    var userPermissions = await client.db("SA-2").collection('roomPermissions').findOne({ ownerID: { $eq: userID }, active: { $eq: 1 } })

    if (!userPermissions) {
      defaultPermissions.ownerID = userID;
      defaultPermissions.permissions.users[0].userID = userID;
      defaultPermissions._id = new ObjectId(); // generate a new ObjectId
      // No need to post to DB when they only check permissions
      //console.log("Post new perms to DB")
      //await client.db("SA-2").collection('roomPermissions').insertOne(defaultPermissions)
      return res.json(defaultPermissions.permissions);
    }
    await client.close();

  // If user is found, return their permissions
  return res.json(userPermissions.permissions);
});

// Clear the users permissions
app.post('/api/permission/:userID', requiredAuthenticated, async (req, res) => {
  const userID = req.params.userID;
  if (!validateUsername(userID)) {
    return res.json({ message: 'Invalid user ID' });
  }
  try {
    // Remove the user's permissions from the database
    await client.connect();
    await client.db("SA-2").collection('roomPermissions').deleteOne({ ownerID: { $eq: userID }, active: { $eq: 1 } });
    await client.close();
    res.json({ message: "Success" })
  } catch (err) {
    return res.json({ message: 'Internal Server Error', err });
  }
});

// Add / Remove permissions
app.post('/api/permission', requiredAuthenticated, async (req, res, next) => {
  //console.log(req.body)
  const { userID, premium, userToAdd, type, typePerm, permission } = req.body;
  if (!userID || !userToAdd || !permission || !type || !typePerm || !validateUsername(userID) || !validateUsername(userToAdd) || !validateUsername(permission) || !validateUsername(type) || !validateUsername(typePerm) || !validateUsername(premium)) {
    return res.json({ message: 'Invalid user or permission' });
  }

  if (type != "add" && type !=  "remove") {
    return res.json({ message: 'Invalid type' });
  }

  if (premium != "VIP" && premium !=  "Booster" && premium !=  "BoV" && premium != null) {
    return res.json({ message: 'Invalid premium type' });
  }

  if (userID == userToAdd) {
    return res.json({ message: 'userToAdd is the same as userID' });
  }

  // Find the user's permissions in the database
  await client.connect();
  const userPermissions = await client.db("SA-2").collection('roomPermissions').findOne({ ownerID:  { $eq: userID }, active: 1 });

  // If the user's permissions are not found, use default permissions
  const permissionsToUse = userPermissions ? userPermissions.permissions : defaultPermissions.permissions;
  permissionsToUse.users[0].userID = userID;

  // Check if userToAdd is already in the list of users, if not add them
  let userToAddIndex = permissionsToUse.users.findIndex(user => user.userID === userToAdd);
  if (userToAddIndex === -1) {
    permissionsToUse.users.push({
      userID: userToAdd,
      permissions: {
        allow: [],
        deny: []
      }
    });
    userToAddIndex = permissionsToUse.users.length - 1;
  }

  if (type == "add") {
    // Check if the maximum number of users is reached
    if (premium == null && userPermissions && userPermissions.permissions.users.length >= 5) {
      // Return an error message or do something else as appropriate
      return res.json({ message: 'Max 3 users as a normal user' });
    }
    // Boster
    if (premium != null && premium == "Booster" && userPermissions && userPermissions.permissions.users.length >= 12) {
      // Return an error message or do something else as appropriate
      return res.json({ message: 'Max 10 users with Booster' });
    }
    // VIP
    if (premium != null && premium == "VIP" && userPermissions && userPermissions.permissions.users.length >= 12) {
      // Return an error message or do something else as appropriate
      return res.json({ message: 'Max 10 users with VIP' });
    }
    // Booster og VIP
    if (premium != null && premium == "BoV" && userPermissions && userPermissions.permissions.users.length >= 22) {
      // Return an error message or do something else as appropriate
      return res.json({ message: 'Max 20 users with Booster and VIP' });
    }

    // Check if the permission already exists in the user's permissions
    const userPermissionsToAdd = permissionsToUse.users[userToAddIndex].permissions[typePerm];
    if (userPermissionsToAdd.includes(permission)) {
      return res.json({ message: 'Permission already exists for the user' });
    }

    // Add the permission to the user's permissions
    if (typePerm === 'allow') {
      if (permissionsToUse.users[userToAddIndex].permissions.deny.includes(permission)) {
        return res.json({ message: 'Permission already exists in the deny array' });
      }
      if (permission === 'OWNER') {
        permissionsToUse.users[userToAddIndex].permissions.allow.push("VIEW_CHANNEL", "CONNECT", "MOVE_MEMBERS");
      } else {
        permissionsToUse.users[userToAddIndex].permissions.allow.push(permission);
      }
    } else if (typePerm === 'deny') {
      if (permissionsToUse.users[userToAddIndex].permissions.allow.includes(permission)) {
        return res.json({ message: 'Permission already exists in the allow array' });
      }
      permissionsToUse.users[userToAddIndex].permissions.deny.push(permission);
    } else {
      return res.json({ message: 'Invalid permission type' });
    }

    // Save the updated permissions to the database
    await client.db("SA-2").collection('roomPermissions').updateOne(
      { ownerID: { $eq: userID }, active: { $eq: 1 } },
      { $set: { permissions: permissionsToUse } },
      { upsert: true }
    );
    
    return res.json({ message: "Success" });
  }

  if (type == "remove") {
    // Check if the permission doesn't exist in the user's permissions
    const userPermissionsToRemove = permissionsToUse.users[userToAddIndex].permissions[typePerm];
    if (!userPermissionsToRemove.includes(permission)) {
      return res.json({ message: 'Permission doesnt exist for the user' });
    }

    // Remove the permission from the user's permissions
    if (typePerm === 'allow') {
      permissionsToUse.users[userToAddIndex].permissions.allow = permissionsToUse.users[userToAddIndex].permissions.allow.filter(p => p !== permission);
    } else if (typePerm === 'deny') {
      permissionsToUse.users[userToAddIndex].permissions.deny = permissionsToUse.users[userToAddIndex].permissions.deny.filter(p => p !== permission);
    } else {
      return res.json({ message: 'Invalid permission type' });
    }

    if (permissionsToUse.users[userToAddIndex].permissions.allow.length === 0 &&
      permissionsToUse.users[userToAddIndex].permissions.deny.length === 0) {
      // Remove the user object from the array
      permissionsToUse.users.splice(userToAddIndex, 1);
    }

    // Save the updated permissions to the database
    await client.db("SA-2").collection('roomPermissions').updateOne(
      { ownerID: { $eq: userID }, active: { $eq: 1 } },
      { $set: { permissions: permissionsToUse } },
      { upsert: true }
    );
    
    await client.close();
    return res.json({ message: "Success" });
  }
});

// Send offline servers to storage
app.get("/api/storage", requiredAuthenticated, async (req, res, next) => {
  try {
    const promises = [];
    connection.query("SELECT id, name FROM servers WHERE status = 'offline' LIMIT 5", (error, results, fields) => {
      if (error) {
        // Handle the error
        console.error(error);
        return;
      }
    
      // Iterate over the results
      results.forEach((row) => {
        const id = row.id;
        const name = row.name;
        const playerName = '3'; // Replace with the actual player ID
        console.log(`Forsøger at storage serveren: ${id} ${name}`);
    
        // Send the Axios request
        const config = {
          method: 'get',
          maxBodyLength: Infinity,
          url: `${sa.url}${id}/control/storage?playerid=${playerName}`,
          headers: {
            'Authorization': sa.token,
            'Content-Type': 'application/json',
          },
        };

        const promise = axios(config)
        .catch((error) => {
          console.error(`Kunne ikke storage serveren: ${id} ${name} ` + error);
        });

        promises.push(promise);
    });
    Promise.all(promises)
    .then(() => {
      console.log("All requests completed");
      res.json({ message: "Success" })
    })
    .catch((error) => {
      console.error(error);
    });
  });
  } catch (err) {
    return res.json({ message: 'Internal Server Error', err });
  }
})

// Get staff members for #staff-team
app.get("/api/staffs", requiredAuthenticated, async (req, res, next) => {
  try {
    await connection.query(`SELECT * FROM ( ` +
        `SELECT ` +
          `p.username, ` +
            `CASE ` +
            `WHEN p.uuid = '264aed13-8842-40b9-86bd-1225c1f962bd' THEN 'seniormod' ` +
            `WHEN p.role = 'bygger' THEN 'Bygger' ` +
            `WHEN p.role = 'developer' THEN 'Udvikler' ` +
              `ELSE p.role ` +
              `END AS role, ` +
            `p.uuid ` +
            `FROM players p ` +
          `WHERE p.role != 'player' AND p.id != -1 ` +
          `) t ` +
          `WHERE role IN ('bygger', 'support', 'mod', 'seniormod', 'udvikler', 'admin') ` +
          `ORDER BY role ASC, username ASC`, async (error, results, fields) => {
      if (error) throw error;
      if (req.body.checkVIP == 1) {
        await updateDocs();
        await updateStaff(results);
        await checkVIP();
      }
      res.json(results);
    });
  } catch (err) {
    return res.json({ message: 'Internal Server Error', err });
  }

});

// Get staff members for #staff-team
app.get("/api/oldstaffs", requiredAuthenticated, async (req, res, next) => {
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
});

// Update username on Discord
app.get("/api/discord/update", requiredAuthenticated, async (req, res, next) => {
  //console.log(req.query)
  //console.log("Username " + req.query.username)
  //console.log("ID " + req.query.discordID)
  //console.log("---")
  if (validateUsername(req.query.username)) {
    console.log(`Username ${req.query.username}`)
    console.log(`ID ${req.query.discordID}`)
    connection.query("SELECT players.username, discordAccounts.discordID "+
    "FROM players "+
    "JOIN discordAccounts ON players.id = discordAccounts.playerID "+
    "WHERE players.username = ? AND discordAccounts.discordID = ?", [req.query.username, req.query.discordID], (error, results, fields) => {
      if (error) throw error;

      res.json(results);
    });
  } else {
    res.json("ERROR");
  }
});

// Update username on Discord
app.get("/api/discordmembers", requiredAuthenticated, async (req, res, next) => {
    connection.query("SELECT players.username, discordAccounts.discordID "+
    "FROM players "+
    "JOIN discordAccounts ON players.id = discordAccounts.playerID", (error, results, fields) => {
      if (error) throw error;

      res.json(results);
    });
});

app.put("/api/*", requiredAuthenticated, async (req, res, next) => {
  console.log("put")
  next()
});

app.delete("/api/*", requiredAuthenticated, async (req, res, next) => {
  console.log("delete")
  next()
});

// delete staff members for DB
app.delete("/api/oldstaffs/:uuid", requiredAuthenticated, async (req, res, next) => {
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
});