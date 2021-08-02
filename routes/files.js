const router = require("express").Router()
const multer = require("multer")
const path = require("path")
const File = require("../models/file")

const { v4: uuidv4 } = require("uuid")
//store file with unique name
let storage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, "uploads/"),
  filename: (req, file, callback) => {
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${path.extname(file.originalname)}`
    callback(null, uniqueName)
  },
})

let upload = multer({
  storage: storage,
  limit: { fileSize: 1000000 * 100 }, //100mb
}).single("myfile")

router.post("/", (req, res) => {
  //Store file
  upload(req, res, async (err) => {
    //Validate request
    if (!req.file) {
      return res.json({ error: "All fields are required." })
    }
    if (err) {
      return res.status(500).send({ error: err.message })
    }
    //Store into Database
    const file = new File({
      filename: req.file.filename,
      uuid: uuidv4(),
      path: req.file.path,
      size: req.file.size,
    })

    const response = await file.save()
    return res.json({
      file: `${process.env.APP_BASE_URL}/files/${response.uuid}`,
    })
    //http://localhost:3000/files/23463hjsdgfgj-234bhjbhbjhb
  })

  //Response -> Link
})

router.post("/send", async (req, res) => {
  //validate request
  const { uuid, emailTo, emailFrom } = req.body
  if (!uuid || !emailTo || !emailFrom) {
    return res.status(422).send({ error: "All fields are required." })
  }
  //Get data from database
  const file = await File.findOne({ uuid: uuid })
  if (file.sender) {
    //email ek bar hi jana chahiye
    return res.status(422).send({ error: "Email already sent." })
  }

  file.sender = emailFrom
  file.receiver = emailTo
  //save file with new data
  const response = await file.save()
  //send email
  const sendMail = require("../services/email")
  sendMail({
    from: emailFrom,
    to: emailTo,
    subject: "FileWare file sharing",
    text: `${emailFrom} shared a file with you`,
    html: require("../services/template")({
      emailFrom: emailFrom,
      downloadLink: `${process.env.APP_BASE_URL}/files/${file.uuid}`,
      size: parseInt(file.size / 1000) + "KB",
      expires: "24 hours",
    }), //function call
  })
  return res.send({ success: true })
})

module.exports = router
