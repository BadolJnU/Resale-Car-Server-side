const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');



require('dotenv').config();

const port = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.p3bhfgf.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}

async function run(){
    try {
        const userCollection = client.db('ResaleCar').collection('Users');
        const categoriesCollection = client.db('ResaleCar').collection('CarCategory');
        const productCollection = client.db('ResaleCar').collection('Products');
        const bookingCollection = client.db('ResaleCar').collection('BookingProducts');

        //save user in database
        app.post('/user', async(req, res) => {
            const user = req.body;
            //console.log(user)
            const result = await userCollection.insertOne(user);
            res.send(result);
        });

        //verify email with jwt token
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' })
        });

        //get category name
        app.get('/categories', async(req, res) => {
            const query = {};
            const result = await categoriesCollection.find(query).toArray();
            res.send(result);

        })

        //addProduct
        app.post('/addProduct', async(req, res) => {
            const product = req.body;
            const result = await productCollection.insertOne(product);
            res.send(result);
        })

        //get the products based on category

        app.get('/products/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const category = await categoriesCollection.findOne(query);
            const name = category.categoryName;
            const filterQuery = {category: name};
            const result = await productCollection.find(filterQuery).toArray();
            res.send(result);
        })

        //get all the sellers
        app.get('/allSellers', async(req, res) => {
            const role = req.query.role;
            const query = {role: role};
            const result = await userCollection.find(query).toArray();
            res.send(result);
        })
        //get all the buyers
        app.get('/allBuyers', async(req, res) => {
            const role = req.query.role;
            const query = {role: role};
            const result = await userCollection.find(query).toArray();
            res.send(result);
        })

        //delete seller
        app.delete('/user/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await userCollection.deleteOne(query);
            //console.log(result);
            res.send(result);
        })

        //get my products
        app.get('/products', async(req, res) => {
            const email = req.query.email;
            const query = {email: email};
            const result = await productCollection.find(query).toArray();
            res.send(result);
        })

        //delete product by seller
        app.delete('/products/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await productCollection.deleteOne(query);
            //console.log(result);
            res.send(result);
        })

        //advertise product

        app.put('/products/advertise/:id', async(req,res) => {
            const id = req.params.id;
            const filter = {_id: ObjectId(id)};
            const options = {upsert: true};
            const updateDoc = {
                $set: {
                    action: 'advertise'
                }
            }

            const result = await productCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        });
        //remove advertise product

        app.put('/products/removeAdvertise/:id', async(req,res) => {
            const id = req.params.id;
            const filter = {_id: ObjectId(id)};
            const options = {upsert: true};
            const updateDoc = {
                $set: {
                    action: ''
                }
            }

            const result = await productCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        });

        //booking product api
        app.post('/booking', async(req, res) => {
            const bookingProduct = req.body;
            const result = await bookingCollection.insertOne(bookingProduct);
            res.send(result);
        })

        //get booking product api

        app.get('/booking', async(req, res) => {
            const email = req.query.email;
            const query = {
                email: email
            }
            const result = await bookingCollection.find(query).toArray();
            res.send(result);
        })

        //delete booking
        app.delete('/booking/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await bookingCollection.deleteOne(query);
            //console.log(result);
            res.send(result);
        })

        app.get('/users/role', async (req, res) => {
            const email = req.query.email;
            const query = { email:email }
            const user = await userCollection.findOne(query);
            if(user?.role === 'Admin'){
                res.send({ isRole: 'Admin' });
            }
            if(user?.role === 'Seller'){
                res.send({ isRole: 'Seller' });
            }
            if(user?.role === 'Buyer'){
                res.send({ isRole: 'Buyer' });
            }
        })

    }
    finally {

    }
}

run().catch(error => console.log(error));



app.get('/', async(req, res) => {
    res.send("Doctors Portal Server is running");
})

app.listen(port, () => console.log(`Server is running ${port}`));