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
    let response = req.body

    console.log("Simulando contato com banco de dados...")
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