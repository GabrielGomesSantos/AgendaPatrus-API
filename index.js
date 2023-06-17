const express = require("express")
const axios = require("axios")
const api = express()
const bodyParser = require("body-parser")

api.use(bodyParser.json());

api.listen(4000, async () => {
    console.log("🟢 | API ligada com sucesso!")
})


// -------------------------------------------------------------

api.get("/", async (req, res) => {
    return res.status(200).json({ result: "Sucess" })
})

api.post("/createTask", async (req, res) => {
    return res.status(200).json(req.body)
})

api.get("/pegar", async (req, res) => {
    return res.status(200).json({ result: "Sucess NEWWW" })
})