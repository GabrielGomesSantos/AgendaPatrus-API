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

            console.log("PAROU 1")

            setInterval(async () => {
                console.log("PAROU 2")
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
                console.log("PAROU 3")
                if (dateNow.getHours() === 7) { // 7 | UTC+3
                    console.log("PAROU 4")
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
                                score++
                                tasksCount++
                                if (score < 4) {
                                    text = text + `${score}. ${item.title};\n`
                                }

                            }
                        })

                        if (tasksCount > 3) {
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

                /*
                items.map((item) => {
                    let dias = Math.ceil((item.date - Date.now()) / (24 * 60 * 60 * 1000))
                    
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
                    
                })
*/
            }, 50000)


        })

    })
    .catch((err) => {
        console.log(err)
        console.log("❌ | MongoDB não foi conectado!")
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

var modelUsers = mongoose.model("User", mongoose.Schema({
    fullname: String,
    email: String,
    password: String,
    turma: String,
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

// |||||====||||| usuarios |||||====|||||
api.get("/users/verify", async (req, res) => {
    let userData = req.body
    console.log(userData)

    if(!userData) {
        return res.status(400).json({message: "Nenhum dado para busca foi passado."})
    }

    let usersFind = await modelUsers.find({
        $or: [
            { fullname: userData.fullname },
            { email: userData.email }
        ]
    });
    let userFind = usersFind[0] || null
    //console.log(userFind)

    if (userFind) {
        return res.status(200).json({
            permission: false,
            userExisting: userFind
        })
    } else {
        return res.status(200).json({
            permission: true
        })
    }
    
})

api.get("/users", async (req, res) => {
    let userData = req.query

    if(userData.fullname) {
        let userSearch = await modelUsers.findOne({ fullname: userData.fullname })
        return res.status(200).json(userSearch)
    } else if(userData.email) {
        let userSearch = await modelUsers.findOne({ email: userData.email })
        return res.status(200).json(userSearch)
    } else {
        return res.status(200).json(null)
    }

})

api.post("/users", async (req, res) => {
    let userData = req.body?.params
    console.log(userData)

    let modeloUserData = {
        fullname: "",
        email: "",
        password: "",
        turma: "" // 1MA 1MB 1MC | 2MA 2MB 2MC | 3MA 3MB 3MC
    }

    let modelSendUser = {
        fullname: userData.fullname || "",
        email: userData.email || "",
        password: userData.password || "",
        turma: userData.turma || null,
    }

    new modelUsers(modelSendUser).save()
        .then((data) => {return res.status(200).json(data)})
        .catch((err) => {return res.status(400).json(err )})

})

/*
    let usersFind = await modelUsers.find({
        $or: [
            { fullname: userData.fullname },
            { email: userData.email }
        ]
    });
*/