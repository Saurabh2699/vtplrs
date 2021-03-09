const app = require('express')()
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
// const multer = require('multer')
// const upload = multer({dest: 'uploads/'})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

// mongodb://localhost:27017/vtplrs-login-system

mongoose.connect('mongodb+srv://saurabhkhaparey:vtplrs@cluster0.pjprl.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
})

let PORT = process.env.PORT || 3000

app.listen(PORT, () => console.log('Server running at port 3000'))

const locationSchema = new mongoose.Schema({
    latitude: String,
    longitude: String,
}, {
    timestamps: true
})

const Location = new mongoose.model('location', locationSchema)

const vehicleSchema = new mongoose.Schema({
    deviceId: {
        type: Number,
        required: true
    },
    location: [locationSchema]
})

const Vehicle = new mongoose.model('vehicle', vehicleSchema);

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        maxlength: 20
    },
    name: {
        type: String,
        required: true
    },
    phnNo: {
        type: Number,
        required: true,
        maxlength: 10
    },
    dob: {
        type: String,
        required: true
    },
    deviceId: {
        type: Number,
        required: true
    },
    photo: {

    }
})

userSchema.pre('save', async function (next) {
    const user = this
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 10)
    }
    next()
})


userSchema.statics.comparePassword = async (email, password) => {
    const user = await User.findOne({ email })
    if (!user) {
        throw new Error('Unable to login email not found...')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        throw new Error('Password does not match try again...')
    }

    return user
}

const User = new mongoose.model('user', userSchema)

//register new user

app.post('/user-register', async (req, res) => {
    const email = req.body.email
    const password = req.body.password
    const name = req.body.name
    const phnNo = req.body.phnNo
    const dob = req.body.dob
    const deviceId = req.body.deviceId

    try {
        if (!email || !password || !name || !phnNo || !dob || !deviceId) {
            return res.status(400).json({ messages: 'Missing fields....' })
        } else {
            const newuser = new User({
                email,
                password,
                name,
                phnNo,
                dob,
                deviceId
            })

            const newVehicle = new Vehicle({
                deviceId: deviceId,
            })
            await newuser.save()
            await newVehicle.save()

            return res.status(201).json({ message: 'Data saved successfully..' })
        }
    } catch (err) {
        console.log(err)
        return res.status(400).json({ error: err })
    }
})

// user login
app.post('/user-login', async (req, res) => {
    const email = req.body.email
    const password = req.body.password
    try {
        const user = await User.comparePassword(email, password)
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials check your email and password once again..." })
        }

        //const token = user.getAuthToken()

        return res.status(201).json({ message: "Logged in successfully..." })
    } catch (err) {
        console.log(err)
        res.status(400).send(err)
    }
})

// user deletion

app.delete('/delete-user/:id', async (req, res) => {
    const ID = req.params.id
    try {
        const user = await User.findByIdAndRemove({ _id: ID })
        if (!user) {
            return res.status(400).json({ message: 'Invalid ID user not found!!!' })
        }

        return res.status(201).json({
            message: "Successfully deleted the user....",
            user: user
        })
    }
    catch (err) {
        console.log(err)
        res.status(400).send(err)
    }
})

// fetch details

app.get('/fetch-data/:email', async (req, res) => {
    const email = req.params.email
    try {
        const user = await User.find({ email })
        if (!user) {
            return res.status(400).json({ message: "User not find with the given email id" })
        }

        return res.status(201).json({ user })
    }
    catch (err) {
        console.log(err)
        res.status(400).send(err)
    }
})

// update user
app.post('/update-user', (req, res) => {
    const { email, name, phnNo, dob, password } = req.body
    User.findByIdAndUpdate({ deviceId: req.body.devideId }, {
        email, name, phnNo, dob, password
    }).then(data => {
        return res.status(201).send(data)
    }).catch(err => {
        console.log(err)
        return res.status(400).json({ message: "Data cannot be updated..." })
    })
})

// save-location
app.post('/save-location', async (req, res) => {
    const id = req.body.deviceId;
    const locationObj = {
        latitude: req.body.latitude,
        longitude: req.body.longitude,
    }

    try {

        const newLocation = await Vehicle.findOneAndUpdate(
            { deviceId: id },
            {
                $push: {
                    location: locationObj
                }
            }
        )

        return res.status(201).send(newLocation)

    } catch (err) {
        console.log(err);
        return res.status(401).json({ message: "device id not found..." })
    }

})

// get recent locations
app.get('/get-recent-locations', async (req, res) => {
    const id = req.body.deviceId;

    try {
        const locations = await Vehicle.find({ deviceId: id })
        if (!locations) {
            return res.status(401).json({ message: "Invalid device id..." })
        }


        return res.status(201).send(locations[0].location)

    } catch (err) {
        console.log(err);
        res.status(401).json({ messge: "locaiton not found..." })
    }

})

// upload user photo

// app.post('/upload-user-pic',upload.single('userImage'),(req,res) => {
//     console.log(req.file)
// })