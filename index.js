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


            setInterval(async () => {

                async function sendNotification(dataPush) {
                    let headers = {
                        'Content-Type': 'application/json',
                        'Authorization': 'Basic OWQwNzJmNDMtZmU1NC00MjIwLWE4M2EtMWY1ZWMxMDE4NWUw',
                    }

                    await axios.post("https://onesignal.com/api/v1/notifications", dataPush, { headers })
                        .then(response => {
                            console.log('Notificação enviada com sucesso:', response.data)
                        })
                        .catch(error => {
                            console.error('Erro ao enviar a notificação:', error)
                        })
                }

                let items = await modelTask.find()
                let dateNow = new Date()

                if (dateNow.getHours() === 22) { // 7 | UTC+3
                    const milliseconds = Date.now()
                    const days = milliseconds / (24 * 60 * 60 * 1000)
                    let day = Math.floor(days)

                    let dayInDatabase = await modelLogAlerts.findOne()
                    if (!dayInDatabase) dayInDatabase = { day: day - 1 }

                    if (day > dayInDatabase.day) {
                        console.log("Avisando sobre as tarefas de hoje---")
                        let text = ""
                        let score = 0
                        let tasksCount = 0

                        items.map((item) => {
                            let dias = Math.ceil((item.date - Date.now()) / (24 * 60 * 60 * 1000))

                            if (dias === 0) {
                                console.log(tasksCount, item)
                                score++
                                tasksCount++
                                if (score < 4) {
                                    text = text + `${score}. ${item.title};\n`
                                }

                            }
                        })

                        if(tasksCount > 3) {
                        let newCount = tasksCount - 3
                        text = text + `E ${newCount > 1 ? "outras" : "outra"} ${newCount} ${newCount > 1 ? "tarefas" : "tarefa"}...`
                    }

                        const dataPush = {
                            app_id: appData.onesginal.appId,
                            included_segments: ['All'],
                            headings: { 'en': `🗓️ Tarefas para hoje` },
                            contents: { 'en': text },
                        }

                        sendNotification(dataPush)
                        let dataUpdateDay = { day }

                        dayInDatabase.day = day
                        dayInDatabase.save()
                            .then(() => {
                                let dataResp = {
                                    day,
                                    status: 200
                                }

                                console.log(dataResp)
                            })
                            .catch(err => {
                                let dataResp = {
                                    day,
                                    status: 400,
                                    erro: err
                                }

                                return console.log(dataResp)
                            })


                    } else {
                        console.log("Já foi avisado hoje!")
                    }
                }

                items.map((item) => {
                    let dias = Math.ceil((item.date - Date.now()) / (24 * 60 * 60 * 1000))
                    /*
                                        if (dias === 3) {
                                            const dataPush = {
                                                app_id: appData.onesginal.appId,
                                                included_segments: ['All'],
                                                headings: { 'en': `${item.type} para ${item.type === "Prova" ? "estudar" : "fazer"}!` },
                                                contents: { 'en': `${item.title} - Em ${dias} dias` },
                                                buttons: [{
                                                    id: "feito",
                                                    text: "Feito!"
                                                }]
                                            }
                    
                                            sendNotification(dataPush)
                    
                                        }
                    
                                        if (dias === 7) {
                                            const dataPush = {
                                                app_id: appData.onesginal.appId,
                                                included_segments: ['All'],
                                                headings: { 'en': `${item.type} para ${item.type === "Prova" ? "estudar" : "fazer"}!` },
                                                contents: { 'en': `${item.title} - Em ${dias} dias` },
                                                buttons: [{
                                                    id: "feito",
                                                    text: "Feito!"
                                                }]
                                            }
                    
                                            sendNotification(dataPush)
                    
                                        }
                    */
                })

            }, 30000)


        })

    })
    .catch((err) => {
        console.log(err)
        console.log("❌ | MongoDB não foi conectadaaa!")
        console.log("❌ | API não foi ligada devido a não conexão com banco de dados!")
    })


// -------------------------------------------------------------

var modelTask = mongoose.model("Task", mongoose.Schema({
    title: String,
    description: String,
    type: String,
    date: Number,
}))

var modelLogAlerts = mongoose.model("LogAlert", mongoose.Schema({
    day: Number
}))

// -------------------------------------------------------------

api.get("/", async (req, res) => {
    return res.status(200).json({ result: "Sucess" })
})

api.post("/createTask", async (req, res) => {
    let response = req.body

    let newTask = {
        title: response.title,
        description: response.description,
        type: response.type,
        date: response.date
    }

    new modelTask(newTask).save()
        .then(() => {
            let dataResp = {
                form: newTask,
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

api.get("/all", async (req, res) => {
    let items = await modelTask.find()

    return res.status(200).json(items)
})

api.get("/pegar", async (req, res) => {
    return res.status(200).json({ result: "Sucess NEWWW" })
})