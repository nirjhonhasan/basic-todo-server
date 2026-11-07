import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import 'dotenv/config';

const app = express();

app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.BETTER_DB_URI);

let dbPromise;

async function connectDB() {
    if (!dbPromise) {
        dbPromise = client.connect().then(() => {
            console.log("MongoDB Connected!");

            return client
                .db("todo-app")
                .collection("todos-data");
        }).catch(error => {
            dbPromise = null;
            throw error;
        });
    }

    return dbPromise;
}

// Database middleware
app.use(async (req, res, next) => {
    try {
        req.todosCollection = await connectDB();
        next();
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Database connection failed" });
    }
});

// GET
app.get('/my-todos', async (req, res) => {
    try {
        const email = req.query.email;

        const query = email
            ? { userEmail: email }
            : {};

        const result = await req.todosCollection
            .find(query)
            .toArray();

        res.send(result);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// POST
app.post('/my-todos', async (req, res) => {
    try {
        const result = await req.todosCollection.insertOne(req.body);
        res.send(result);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// DELETE
app.delete('/my-todos/:id', async (req, res) => {
    try {
        const result = await req.todosCollection.deleteOne({
            _id: new ObjectId(req.params.id)
        });

        res.send(result);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

export default app;