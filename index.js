const express = require("express")
const axios = require("axios")
const api = express()
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const appData = require("./appData.json")

api.use(bodyParser.json());

mongoose.connect(appData.api.databaseURL)
    .then(() => {

        console.log("🟢 | MongoDB conectada com sucesso!")
        api.listen(4000, async () => {
            console.log("🟢 | API ligada com sucesso!")
        })

    })
    .catch((err) => {
        console.log("❌ | MongoDB não foi conectada!")
        console.log("❌ | API não foi ligada devido a não conexão com banco de dados!")
    })


// -------------------------------------------------------------

api.get("/", async (req, res) => {
    return res.status(200).json({ result: "Sucess" })
})

api.post("/createTask", async (req, res) => {
    let response = req.body



    function simulationDB() {
        console.log("Simulando contato com banco de dados...")
        return
    }

    simulationDB()
        .then(() => {
            let dataResp = {
                form: response,
                status: 200
            }

            return res.status(200).json(dataResp)
        })
        .catch(err => {
            let dataResp = {
                form: response,
                status: 400,
                erro: err
            }

            return res.status(400).json(dataResp)
        })

})

api.get("/pegar", async (req, res) => {
    return res.status(200).json({ result: "Sucess NEWWW" })
})