const express = require('express');
const app = express();
const port = 5000;
const cors = require('cors');
require('dotenv').config()


const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.afifr.mongodb.net/${process.env.DB_SERVER}?retryWrites=true&w=majority`;
const ObjectId = require('mongodb').ObjectID;
const admin = require('firebase-admin');


app.use(cors());
app.use(express.json());

const serviceAccount = require("./configs/phonomania-e5c3e-firebase-adminsdk-b4abc-b703f3f804.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const productCollection = client.db("phonoMania").collection("products");
  const ordersCollection = client.db("phonoMania").collection("orders");
  console.log('DB Connected');

  app.get('/products', (req, res) => {
      productCollection.find({})
      .toArray((err, documents)=>{
          res.send(documents);
      })
  })
  
  app.post('/addProduct', (req, res) => {
      const newProduct = req.body;
      console.log('adding Product', newProduct);
      productCollection.insertOne(newProduct)
      .then(result => {
          console.log('Inserted Count', result.insertedCount)
          res.send(result.insertedCount > 0)
      })
      
  })

  app.get('/productById/:id', (req, res)=>{
      const id = req.params.id;
      console.log(id);
      productCollection.find({_id:ObjectId(id)})
      .toArray((err, document) => {
          console.log(document);
          res.send(document[0]);
      })  
  })

  app.post('/addOrder', (req, res)=>{
      const orders = req.body;
      ordersCollection.insertOne(orders)
      .then(result => {
          res.send(result.insertedCount > 0);
      })
  })

  app.get('/orders', (req, res) => {
    //   console.log(req.query.email);
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith('Bearer ')) {
      const idToken = bearer.split(' ')[1];
      // console.log({ idToken });
      // idToken comes from the client app
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          let tokenEmail = decodedToken.email;
        //   console.log(tokenEmail);
          console.log(req.query);
          if (tokenEmail === req.query.email) {
            ordersCollection.find({ email: req.query.email })
              .toArray((err, documents) => {
                res.status(200).send(documents);
                console.log(documents);
              })
          }
          else{
            res.status(401).send('Un Authorized Access');
          }
          // ...
          // console.log({ uid: decodedToken });
        })
        .catch((error) => {
          // Handle error
          res.status(401).send('Un Authorized Access');
        });

    }
    else{
      res.status(401).send('Un Authorized Access');
    }

    // bookings.find({email: req.query.email})
    // .toArray((err, documents)=> {
    //     res.send(documents);
    // })
  })

  app.delete('/delete/:id', (req, res) => {
    productCollection.deleteOne({_id:ObjectId(req.params.id)})
    .then(result => {
      console.log(result);
      res.send(res.deletedCount>0);
    })
  })



});


app.get('/', (req, res) => {
    res.send('Hello World!')
})


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
})

