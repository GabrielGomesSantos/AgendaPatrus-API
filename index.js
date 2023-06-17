const express = require("express")
const axios = require("axios")
const api = express()

api.use(bodyParser.json());

api.listen(4000, async () => {
    console.log("🟢 | API ligada com sucesso!")
})


// -------------------------------------------------------------

api.get("/", async (req, res) => {
    return res.status(200).json({ result: "Sucess" })
})

api.post("/createTask", async (req, res) => {
    let infos = req
    console.log(infos)

    return res.status(200).json({ body: req.body, resultado: "OKAAY" })
})

api.get("/pegar", async (req, res) => {
    return res.status(200).json({ result: "Sucess NEWWW" })
})