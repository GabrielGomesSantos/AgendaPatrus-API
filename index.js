const express = require("express")
const axios = require("axios")
const api = express()

api.listen(4000, async () => {
    console.log("🟢 | API ligada com sucesso!")
})

// -------------------------------------------------------------

api.get("/", async (req, res) => {
    return res.status(200).json({ result: "Sucess" })
})

api.post("/createTask", async (req, res) => {
    console.log(req)

    return res.status(200).json({ query: req.query, params: req.params })
})

api.get("/pegar", async (req, res) => {
    return res.status(200).json({ result: "Sucess" })
})