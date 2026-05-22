const express = require("express");
const sql = require("mssql");
const bodyParser = require("body-parser");
const os = require("os");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

const config = {
    user: "azureuser",
    password: "Pa##w0rd1234",
    server: "sqlmyecommserver001.database.windows.net",
    database: "myecommdb",

    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

app.get("/", async (req, res) => {

    try {

        await sql.connect(config);

        const result = await sql.query`SELECT * FROM Products`;

        let html = `
        <html>
        <body style="font-family:Arial;padding:40px;background:#f5f5f5;">

        <h1>MyEcomm Store</h1>

        <h2>Server: ${os.hostname()}</h2>

        <form method="POST" action="/add-product">

            <input type="text" name="name" placeholder="Product Name" required />
            <br><br>

            <input type="number" name="price" placeholder="Price" required />
            <br><br>

            <input type="number" name="quantity" placeholder="Quantity" required />
            <br><br>

            <button type="submit">
                Add Product
            </button>

        </form>

        <hr>
        `;

        result.recordset.forEach(product => {

            html += `
                <div style="background:white;padding:20px;margin-top:20px;border-radius:10px;">
                    <h3>${product.ProductName}</h3>
                    <p>Price: ₹${product.Price}</p>
                    <p>Quantity: ${product.Quantity}</p>
                </div>
            `;
        });

        html += `
        </body>
        </html>
        `;

        res.send(html);

    } catch (err) {

        res.send(err.message);
    }
});

app.post("/add-product", async (req, res) => {

    try {

        await sql.connect(config);

        await sql.query`
            INSERT INTO Products
            (ProductName, Price, Quantity)

            VALUES (
                ${req.body.name},
                ${req.body.price},
                ${req.body.quantity}
            )
        `;

        res.redirect("/");

    } catch (err) {

        res.send(err.message);
    }
});

app.listen(80, () => {
    console.log("Application running");
});