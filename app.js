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

        <head>
            <title>MyEcomm Store</title>
        </head>

        <body style="font-family:Arial;padding:40px;background:#f5f5f5;">

        <h1>MyEcomm Store</h1>

        <h3>Server: ${os.hostname()}</h3>

        <h2>Add Product</h2>

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

        <h2>Products</h2>
        `;

        result.recordset.forEach(product => {

            html += `
                <div style="
                    background:white;
                    padding:20px;
                    margin-top:20px;
                    border-radius:10px;
                    box-shadow:0px 0px 10px rgba(0,0,0,0.1);
                ">

                    <form method="POST" action="/update-product">

                        <input type="hidden" name="id" value="${product.ProductID}" />

                        <label>Product Name</label>
                        <br><br>

                        <input 
                            type="text" 
                            name="name" 
                            value="${product.ProductName}" 
                            required
                        />

                        <br><br>

                        <label>Price</label>
                        <br><br>

                        <input 
                            type="number" 
                            name="price" 
                            value="${product.Price}" 
                            required
                        />

                        <br><br>

                        <label>Quantity</label>
                        <br><br>

                        <input 
                            type="number" 
                            name="quantity" 
                            value="${product.Quantity}" 
                            required
                        />

                        <br><br>

                        <button type="submit">
                            Update
                        </button>

                    </form>

                    <br>

                    <form method="POST" action="/delete-product">

                        <input type="hidden" name="id" value="${product.ProductID}" />

                        <button 
                            type="submit"
                            style="
                                background:red;
                                color:white;
                                border:none;
                                padding:10px;
                                cursor:pointer;
                            "
                        >
                            Delete
                        </button>

                    </form>

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

app.post("/update-product", async (req, res) => {

    try {

        await sql.connect(config);

        await sql.query`
            UPDATE Products

            SET
                ProductName = ${req.body.name},
                Price = ${req.body.price},
                Quantity = ${req.body.quantity}

            WHERE ProductID = ${req.body.id}
        `;

        res.redirect("/");

    } catch (err) {

        res.send(err.message);
    }
});

app.post("/delete-product", async (req, res) => {

    try {

        await sql.connect(config);

        await sql.query`
            DELETE FROM Products
            WHERE ProductID = ${req.body.id}
        `;

        res.redirect("/");

    } catch (err) {

        res.send(err.message);
    }
});

app.listen(80, () => {
    console.log("Application running");
});
