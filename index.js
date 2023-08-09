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

            const sendNotification = async (diasRestantesSelecionado) => {
                const milliseconds = Date.now()
                const days = milliseconds / (24 * 60 * 60 * 1000)
                let day = Math.floor(days)

                let dbName = "pushTasksToday"
                if (diasRestantesSelecionado > 0) dbName = `pushTasks${diasRestantesSelecionado}Days`

                let pastAlertVerify = await modelLogAlerts.findOne({ name: dbName })
                if (pastAlertVerify?.value === day) return

                let settingsFind = `settings.pushTasks${diasRestantesSelecionado}Days`
                let profiles = []
                if (diasRestantesSelecionado == 0) profiles = await modelUsers.find({ "settings.pushTasksToday": true })
                if (diasRestantesSelecionado > 0) profiles = await modelUsers.find({ [settingsFind]: true })

                let tasksAll = await modelTask.find()
                let listTasksDiasRest = tasksAll.map((task) => {
                    let diasCalculados = Math.ceil((task.date - Date.now()) / (24 * 60 * 60 * 1000))
                    return { ...task, diasRest: diasCalculados }
                });

                let tasksComDoc = listTasksDiasRest.filter(task => task.diasRest == diasRestantesSelecionado)
                let tasks = tasksComDoc.map(task => task._doc)

                for (const profile of profiles) {
                    let tasksTurma = tasks.filter(task => task.turma === profile.turma)
                    let device = await modelDevices.findOne({ email: profile.email })
                    let playerId = device?.userId

                    let text = ""
                    let score = 0
                    let tasksCount = 0

                    tasksTurma.map((item, index) => {
                        score++
                        tasksCount++
                        if (score < 4) {
                            let icon = ""
                            if(item.type == "Atividade") icon = "🔵 "
                            if(item.type == "Trabalho") icon = "🟡 "
                            if(item.type == "Prova") icon = "🔴 "
                            if(item.type == "Outro") icon = "⚪ "
                            text = text + `${score}. ${icon}${item.title};`
                            if (index < tasksTurma.length - 1) {
                                text = text + "\n" // Adiciona quebra de linha apenas se houver mais itens
                            }
                        }
                    })

                    if (tasksCount > 3) {
                        let newCount = tasksCount - 3
                        text = text + `E ${newCount > 1 ? "outras" : "outra"} ${newCount} ${newCount > 1 ? "tarefas" : "tarefa"}...`
                    }

                    let headText = "⏰ Tarefas para hoje"
                    if (diasRestantesSelecionado != 0) {
                        headText = `🗓️ Tarefas para daqui ${diasRestantesSelecionado} ${diasRestantesSelecionado <= 1 ? "dia" : "dias"}`
                    }

                    const headers = {
                        'Content-Type': 'application/json; charset=utf-8',
                        'Authorization': `Basic ${appData.onesginal.authorization}`,
                    };

                    const data = {
                        app_id: appData.onesginal.appId,
                        include_player_ids: [playerId],
                        headings: { "en": headText },
                        contents: { "en": text },
                    }

                    axios.post('https://onesignal.com/api/v1/notifications', data, { headers })
                        .then((respon) => console.log("Notificação enviada com sucesso! - "+diasRestantesSelecionado))
                        .catch((error) => console.error(diasRestantesSelecionado+' - Erro ao enviar notificação:', error.message))

                    const milliseconds = Date.now()
                    const days = milliseconds / (24 * 60 * 60 * 1000)
                    let day = Math.floor(days)

                    if (pastAlertVerify) {
                        await modelLogAlerts.findOneAndUpdate({ name: dbName }, { $set: { value: day } })
                    } else {
                        new modelLogAlerts({
                            name: dbName,
                            type: "perDay",
                            value: day
                        }).save()
                    }
                }

            }



            setInterval(async () => {
                let dateNow = new Date()
                let horas = dateNow.getHours()
                let minutos = dateNow.getMinutes()
                //console.log(`HORAS: ${horas}:${minutos}`)

                sendNotification(3)

                if (horas === 7 && minutos < 3) sendNotification(0) // 04h

                if (horas === 16 && minutos < 3) sendNotification(1) // 13h
                if (horas === 17 && minutos < 3) sendNotification(2) // 14h
                if (horas === 18 && minutos < 3) sendNotification(3) // 15h
                if (horas === 19 && minutos < 3) sendNotification(4) // 16hs
                if (horas === 20 && minutos < 3) sendNotification(5) // 17h
                if (horas === 21 && minutos < 3) sendNotification(6) // 18h
                if (horas === 22 && minutos < 3) sendNotification(7) // 10h
                if (horas === 23 && minutos < 3) sendNotification(10) // 20h

            }, 20000)

            //  A CADA VERIFICAÇÃO DOS 50 SEGUNDOS ELE ENVIA A NOTIGICÃO MESMO SE JA ENVIOU
            //  SEMPRE QUE HOUVER MAIS DE 1 TAREFA PARA CITAR ELE ENVIA COM A NOTIFICAÇÃO COM A MENSAGEM
            //  MAIS DE UMA VEZ (NO CASO NA QUANTIDADE DA TAREFAS CITADAS)
        })

    })
    .catch((err) => {
        console.log(err)
        console.log("❌ | MongoDB não foi conectado!")
        console.log("❌ | API não foi ligada devido a não conexão com banco de dados!")
    })


// -------------------------------------------------------------

var schemaTasks = new mongoose.Schema({
    title: String,
    description: String,
    type: String,
    date: Number,
    turma: String,
    id: {
        type: Number,
        default: 0
    }
})

var schemaLogAlerts = new mongoose.Schema({
    name: String,
    value: Number,
    type: String,
    id: {
        type: Number,
        default: 0
    }
})

var schemaUsers = new mongoose.Schema({
    fullname: String,
    email: String,
    password: String,
    turma: String,
    settings: {
        pushTasksToday: {
            type: Boolean,
            default: true
        },
        pushTasks1Days: {
            type: Boolean,
            default: false
        },
        pushTasks2Days: {
            type: Boolean,
            default: false
        },
        pushTasks3Days: {
            type: Boolean,
            default: true
        },
        pushTasks4Days: {
            type: Boolean,
            default: false
        },
        pushTasks5Days: {
            type: Boolean,
            default: false
        },
        pushTasks6Days: {
            type: Boolean,
            default: false
        },
        pushTasks7Days: {
            type: Boolean,
            default: false
        },
        pushTasks10Days: {
            type: Boolean,
            default: false
        },
    },
    id: {
        type: Number,
        default: 0
    }
})

var schemaMarkedTasks = new mongoose.Schema({
    id_task: Number,
    id_user: Number,
    timestamp: Number,
    id: {
        type: Number,
        default: 0
    }
})

var schemaDevices = new mongoose.Schema({
    userId: String,
    email: String,
    profileId: mongoose.Schema.Types.ObjectId,
    id: {
        type: Number,
        default: 0
    }
})

async function increment(next) {
    const doc = this;
    if (!doc.isNew) {
        return next();
    }

    try {
        const lastUser = await this.constructor.findOne({}, {}, { sort: { id: -1 } });
        const lastId = lastUser ? lastUser.id : 0;

        doc.id = lastId + 1;
        return next();
    } catch (error) {
        return next(error);
    }
}

schemaTasks.pre('save', increment)
schemaLogAlerts.pre('save', increment)
schemaUsers.pre('save', increment)
schemaMarkedTasks.pre('save', increment);
schemaDevices.pre('save', increment)

const modelTask = mongoose.model("Task", schemaTasks)
const modelLogAlerts = mongoose.model("LogAlert", schemaLogAlerts)
const modelMarkedTasks = mongoose.model('MarkedTask', schemaMarkedTasks);
const modelUsers = mongoose.model("User", schemaUsers)
const modelDevices = mongoose.model("Device", schemaDevices)

// -------------------------------------------------------------

api.get("/", async (req, res) => {
    return res.status(200).json({ result: "Sucess" })
})

// |||||====||||| tarefas |||||====|||||

api.get("/tasks", async (req, res) => {
    let items = await modelTask.find()

    return res.status(200).json(items)
})

api.get("/tasks/one", async (req, res) => {
    var contentFind = req.body
    if (Object.keys(contentFind).length === 0) {
        contentFind = req.query
    }

    if (contentFind.title) {
        let taskSearch = await modelTask.findOne({ title: contentFind.title })
        return res.status(200).json(taskSearch)
    } else if (contentFind.description) {
        let taskSearch = await modelTask.findOne({ description: contentFind.description })
        return res.status(200).json(taskSearch)
    } else if (contentFind.type) {
        let taskSearch = await modelTask.findOne({ type: contentFind.type })
        return res.status(200).json(taskSearch)
    } else if (contentFind.date) {
        let taskSearch = await modelTask.findOne({ date: contentFind.date })
        return res.status(200).json(taskSearch)
    } else if (contentFind.turma) {
        let taskSearch = await modelTask.findOne({ turma: contentFind.turma })
        return res.status(200).json(taskSearch)
    } else {
        return res.status(400).json(null)
    }
})

api.get("/tasks/several", async (req, res) => {
    var contentFind = req.body
    if (Object.keys(contentFind).length === 0) {
        contentFind = req.query
    }

    if (contentFind.title) {
        let taskSearch = await modelTask.find({ title: contentFind.title })
        return res.status(200).json(taskSearch)
    } else if (contentFind.description) {
        let taskSearch = await modelTask.find({ description: contentFind.description })
        return res.status(200).json(taskSearch)
    } else if (contentFind.type) {
        let taskSearch = await modelTask.find({ type: contentFind.type })
        return res.status(200).json(taskSearch)
    } else if (contentFind.date) {
        let taskSearch = await modelTask.find({ date: contentFind.date })
        return res.status(200).json(taskSearch)
    } else if (contentFind.turma) {
        let taskSearch = await modelTask.find({ turma: contentFind.turma })
        return res.status(200).json(taskSearch)
    } else {
        return res.status(400).json(null)
    }
})

api.post("/tasks", async (req, res) => {
    let taskData = req.body

    let estruturaExemplo = {
        title: "",
        description: "",
        type: "",
        date: 0,
        turma: "",
    }

    let taskSend = {
        title: taskData.title,
        description: taskData.description,
        type: taskData.type,
        date: taskData.date,
        turma: taskData.turma
    }

    new modelTask(taskSend).save()
        .then((data) => { return res.status(200).json(data) })
        .catch((err) => { return res.status(400).json(err) })
})

api.delete("/tasks", async (req, res) => {
    var contentFind = req.body
    if (Object.keys(contentFind).length === 0) {
        contentFind = req.query
    }

    var taskSearch = await modelTask.findOne(contentFind)
    if (!taskSearch) {
        return res.status(200).json(null)
    }

    let idDelete = taskSearch?.id
    if (!idDelete) return res.status(200).json(null)

    modelTask.deleteOne({ id: idDelete })
        .then((data) => { return res.status(200).json(data) })
        .catch((err) => { return res.status(200).json(err) })
})

api.put("/tasks", async (req, res) => {
    var contentFind = req.body
    if (Object.keys(contentFind).length === 0) {
        contentFind = req.query
    }
    if (contentFind?.params) {
        contentFind = contentFind.params
    }

    await modelTask.findOneAndUpdate({ _id: contentFind._id }, { $set: contentFind })
        .then((data) => { res.status(200).json(data) })
        .catch((err) => { res.status(400).json(err) })
})

// |||||====||||| ------- |||||====|||||

// |||||====||||| usuarios |||||====|||||
api.get("/users/verify", async (req, res) => {
    let userData = req.body

    if (!userData) {
        return res.status(400).json({ message: "Nenhum dado para busca foi passado." })
    }

    let usersFind = await modelUsers.find({
        $or: [
            { fullname: userData.fullname },
            { email: userData.email }
        ]
    });
    let userFind = usersFind[0] || null

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

    if (userData.fullname) {
        let userSearch = await modelUsers.findOne({ fullname: userData.fullname })
        return res.status(200).json(userSearch)
    } else if (userData.email) {
        let userSearch = await modelUsers.findOne({ email: userData.email })
        return res.status(200).json(userSearch)
    } else {
        return res.status(200).json(null)
    }

})

api.post("/users", async (req, res) => {
    let userData = req.body?.params

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
        .then((data) => { return res.status(200).json(data) })
        .catch((err) => { return res.status(400).json(err) })

})
// |||||====||||| -------- |||||====|||||

// |||||====||||| tarefas concluídas |||||====|||||

api.get("/markedtasks/one", async (req, res) => {
    var contentFind = req.body
    if (Object.keys(contentFind).length === 0) {
        contentFind = req.query
    }

    if (contentFind.id_task) {
        let taskSearch = await modelMarkedTasks.findOne({ id_task: contentFind.id_task })
        return res.status(200).json(taskSearch)
    } else if (contentFind.id_user) {
        let taskSearch = await modelMarkedTasks.findOne({ id_user: contentFind.id_user })
        return res.status(200).json(taskSearch)
    } else if (contentFind.timestamp) {
        let taskSearch = await modelMarkedTasks.findOne({ timestamp: contentFind.timestamp })
        return res.status(200).json(taskSearch)
    } else if (contentFind.id) {
        let taskSearch = await modelMarkedTasks.findOne({ id: contentFind.id })
        return res.status(200).json(taskSearch)
    } else {
        return res.status(400).json(null)
    }
})

api.get("/markedtasks/several", async (req, res) => {
    var contentFind = req.body
    if (Object.keys(contentFind).length === 0) {
        contentFind = req.query
    }

    if (contentFind.id_task) {
        let taskSearch = await modelMarkedTasks.find({ id_task: contentFind.id_task })
        return res.status(200).json(taskSearch)
    } else if (contentFind.id_user) {
        let taskSearch = await modelMarkedTasks.find({ id_user: contentFind.id_user })
        return res.status(200).json(taskSearch)
    } else if (contentFind.timestamp) {
        let taskSearch = await modelMarkedTasks.find({ timestamp: contentFind.timestamp })
        return res.status(200).json(taskSearch)
    } else if (contentFind.id) {
        let taskSearch = await modelMarkedTasks.find({ id: contentFind.id })
        return res.status(200).json(taskSearch)
    } else {
        return res.status(400).json(null)
    }
})

api.post("/markedtasks", async (req, res) => {
    let taskData = req.body

    let taskMarkedExemplo = {
        id_task: 0, // id da tarefa
        id_user: 0, // id do usuario que marcou
        timestamp: 0, // data atual em milissegundos
        id: 0 // id do item que esta sendo criado...
    }

    let objectSend = {
        id_task: taskData.id_task,
        id_user: taskData.id_user,
        timestamp: Date.now()
    }

    new modelMarkedTasks(objectSend).save()
        .then((data) => { return res.status(200).json(data) })
        .catch((err) => { return res.status(400).json(err) })

})

api.delete("/markedtasks", async (req, res) => {
    var contentFind = req.body
    if (Object.keys(contentFind).length === 0) {
        contentFind = req.query
    }

    var taskSearch = {}

    if (contentFind.id_task) {
        taskSearch = await modelMarkedTasks.findOne({ id_task: contentFind.id_task })
    } else if (contentFind.id_user) {
        taskSearch = await modelMarkedTasks.findOne({ id_user: contentFind.id_user })
    } else if (contentFind.timestamp) {
        taskSearch = await modelMarkedTasks.findOne({ timestamp: contentFind.timestamp })
    } else if (contentFind.id) {
        taskSearch = await modelMarkedTasks.findOne({ id: contentFind.id })
    } else {
        return res.status(400).json(null)
    }

    let idDelete = taskSearch?.id
    if (!idDelete) return res.status(400).json(null)

    modelMarkedTasks.deleteOne({ id: idDelete })
        .then((data) => { return res.status(200).json(data) })
        .catch((err) => { return res.status(400).json(err) })
})

// |||||====||||| ------------------ |||||====|||||

// |||||====||||| tarefas concluídas |||||====|||||

api.get("/devices", async (req, res) => {
    let resp = await modelDevices.find()

    return res.status(200).json(resp)
})

api.post("/devices", async (req, res) => {
    let deviceData = req.body

    let modelSendDevice = {
        userId: deviceData.userId,
        email: deviceData.email || "",
    }

    new modelDevices(modelSendDevice).save()
        .then((data) => { return res.status(200).json(data) })
        .catch((err) => { return res.status(400).json(err) })

})

api.put("/devices", async (req, res) => {
    var contentFind = req.body
    if (Object.keys(contentFind).length === 0) {
        contentFind = req.query
    }
    if (contentFind?.params) {
        contentFind = contentFind.params
    }

    await modelDevices.findOneAndUpdate({ userId: contentFind.deviceId }, { $set: contentFind })
        .then((data) => { res.status(200).json(data) })
        .catch((err) => { res.status(400).json(err) })
})

// |||||====||||| ------------------ |||||====|||||

/*

    let usersFind = await modelUsers.find({
        $or: [
            { fullname: userData.fullname },
            { email: userData.email }
        ]
    });

api.put("/markedtasks", async (req, res) => {
    let allTasks = await modelTask.find()
    let contagem = 0
    allTasks.map(async (task) => {
        console.log(task._id)
        contagem++
        await modelTask.findOneAndUpdate({ _id: task._id }, { $set: { id: contagem }})
            .then((data) => { res.status(200).json({ result: "Sucess", item: task.title, newId: contagem }) })
            .catch((err) => { res.status(400).json(err) })
    })

})

*/